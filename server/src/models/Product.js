import mongoose from 'mongoose';

const specificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  category: { type: String, required: true } // e.g., 'display', 'performance', 'connectivity'
});

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'Color', 'Storage', 'Size'
  options: [{
    value: { type: String, required: true }, // e.g., 'Red', '256GB', 'Large'
    priceModifier: { type: Number, default: 0 }, // Additional cost for this option
    stock: { type: Number, default: 0 }
  }]
});

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  verified: {
    type: Boolean,
    default: false
  },
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reported: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    reportedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    required: [true, 'Product brand is required']
  },
  images: [{
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false },
    publicId: String // For Cloudinary
  }],
  stock: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackQuantity: {
      type: Boolean,
      default: true
    }
  },
  variants: [variantSchema],
  specifications: [specificationSchema],
  features: [String],
  tags: [String],
  weight: {
    value: Number,
    unit: { type: String, enum: ['g', 'kg', 'lb'], default: 'kg' }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
  },
  shipping: {
    free: { type: Boolean, default: false },
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'out_of_stock'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'hidden'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false
  },
  sections: [{
    type: String,
    enum: ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'],
    index: true
  }],
  reviews: [reviewSchema],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  sales: {
    totalSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  crossSells: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  upsells: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
  if (!this.stock.trackQuantity) return 'in_stock';
  if (this.stock.quantity === 0) return 'out_of_stock';
  if (this.stock.quantity <= this.stock.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function () {
  if (!this.images || this.images.length === 0) return null;
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Pre-save middleware to generate slug
productSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Method to update rating (called when reviews change)
productSchema.methods.updateRating = async function () {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ product: this._id });

  if (reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
  } else {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = Math.round((totalRating / reviews.length) * 10) / 10;
    this.rating.count = reviews.length;
  }

  return this.save();
};

// Method to check if product is available
productSchema.methods.isAvailable = function (quantity = 1) {
  if (this.status !== 'active' || this.visibility !== 'public') return false;
  if (!this.stock.trackQuantity) return true;
  return this.stock.quantity >= quantity;
};

// Method to reserve stock
productSchema.methods.reserveStock = function (quantity) {
  if (!this.stock.trackQuantity) return true;

  if (this.stock.quantity < quantity) {
    throw new Error('Insufficient stock available');
  }

  this.stock.quantity -= quantity;
  return this.save();
};

// Method to release stock (e.g., when order is cancelled)
productSchema.methods.releaseStock = function (quantity) {
  if (!this.stock.trackQuantity) return true;

  this.stock.quantity += quantity;
  return this.save();
};

// Method to add variant
productSchema.methods.addVariant = function (variantData) {
  this.variants.push(variantData);
  return this.save();
};

// Method to update variant
productSchema.methods.updateVariant = function (variantId, updateData) {
  const variant = this.variants.id(variantId);
  if (!variant) {
    throw new Error('Variant not found');
  }

  Object.assign(variant, updateData);
  return this.save();
};

// Method to remove variant
productSchema.methods.removeVariant = function (variantId) {
  const variant = this.variants.id(variantId);
  if (!variant) {
    throw new Error('Variant not found');
  }

  variant.remove();
  return this.save();
};

// Method to add specification
productSchema.methods.addSpecification = function (specData) {
  this.specifications.push(specData);
  return this.save();
};

// Method to update sales data
productSchema.methods.updateSales = function (quantity, revenue) {
  this.sales.totalSold += quantity;
  this.sales.revenue += revenue;
  return this.save();
};

// Method to set primary image
productSchema.methods.setPrimaryImage = function (imageId) {
  // Reset all images to not primary
  this.images.forEach(img => img.isPrimary = false);

  // Set specified image as primary
  const image = this.images.id(imageId);
  if (image) {
    image.isPrimary = true;
  }

  return this.save();
};

// Method to add image
productSchema.methods.addImage = function (imageData) {
  // If this is the first image, make it primary
  if (this.images.length === 0) {
    imageData.isPrimary = true;
  }

  this.images.push(imageData);
  return this.save();
};

// Method to add to section
productSchema.methods.addToSection = function (section) {
  if (!this.sections.includes(section)) {
    this.sections.push(section);
  }
  return this.save();
};

// Method to remove from section
productSchema.methods.removeFromSection = function (section) {
  this.sections = this.sections.filter(s => s !== section);
  return this.save();
};

// Method to remove image
productSchema.methods.removeImage = function (imageId) {
  const image = this.images.id(imageId);
  if (!image) {
    throw new Error('Image not found');
  }

  const wasPrimary = image.isPrimary;
  image.remove();

  // If removed image was primary, make first remaining image primary
  if (wasPrimary && this.images.length > 0) {
    this.images[0].isPrimary = true;
  }

  return this.save();
};

// Method to get variant price
productSchema.methods.getVariantPrice = function (selectedVariants = []) {
  let totalModifier = 0;

  selectedVariants.forEach(selected => {
    const variant = this.variants.find(v => v.name === selected.name);
    if (variant) {
      const option = variant.options.find(o => o.value === selected.value);
      if (option) {
        totalModifier += option.priceModifier || 0;
      }
    }
  });

  return this.price + totalModifier;
};

// Method to check variant stock
productSchema.methods.checkVariantStock = function (selectedVariants = [], quantity = 1) {
  if (!this.stock.trackQuantity) return true;

  // If no variants selected, check main stock
  if (selectedVariants.length === 0) {
    return this.stock.quantity >= quantity;
  }

  // Check variant-specific stock
  let availableStock = this.stock.quantity;

  selectedVariants.forEach(selected => {
    const variant = this.variants.find(v => v.name === selected.name);
    if (variant) {
      const option = variant.options.find(o => o.value === selected.value);
      if (option && option.stock !== undefined) {
        availableStock = Math.min(availableStock, option.stock);
      }
    }
  });

  return availableStock >= quantity;
};

// Static methods
productSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, status: 'active', visibility: 'public' });
};

productSchema.statics.findBySku = function (sku) {
  return this.findOne({ sku });
};

productSchema.statics.findFeatured = function (limit = 10) {
  return this.find({
    featured: true,
    status: 'active',
    visibility: 'public'
  })
    .limit(limit)
    .sort({ createdAt: -1 });
};

productSchema.statics.findBySection = function (section, limit = 10) {
  return this.find({
    sections: section,
    status: 'active',
    visibility: 'public'
  })
    .populate('category', 'name slug')
    .limit(limit)
    .sort({ createdAt: -1 });
};

productSchema.statics.findLatest = function (limit = 10) {
  return this.find({
    status: 'active',
    visibility: 'public'
  })
    .populate('category', 'name slug')
    .limit(limit)
    .sort({ createdAt: -1 });
};

productSchema.statics.findTopSellers = function (limit = 10) {
  return this.find({
    status: 'active',
    visibility: 'public'
  })
    .populate('category', 'name slug')
    .limit(limit)
    .sort({ 'sales.totalSold': -1, 'rating.average': -1 });
};

productSchema.statics.findByCategory = function (categoryId, options = {}) {
  const query = {
    category: categoryId,
    status: 'active',
    visibility: 'public'
  };

  let queryBuilder = this.find(query);

  // Apply filters
  if (options.minPrice) queryBuilder = queryBuilder.where('price').gte(options.minPrice);
  if (options.maxPrice) queryBuilder = queryBuilder.where('price').lte(options.maxPrice);
  if (options.brand) queryBuilder = queryBuilder.where('brand').in(options.brand);
  if (options.minRating) queryBuilder = queryBuilder.where('rating.average').gte(options.minRating);

  // Apply sorting
  const sortOptions = {
    'price_asc': { price: 1 },
    'price_desc': { price: -1 },
    'rating': { 'rating.average': -1 },
    'newest': { createdAt: -1 },
    'oldest': { createdAt: 1 },
    'name_asc': { name: 1 },
    'name_desc': { name: -1 },
    'popularity': { 'sales.totalSold': -1 }
  };

  if (options.sort && sortOptions[options.sort]) {
    queryBuilder = queryBuilder.sort(sortOptions[options.sort]);
  } else {
    queryBuilder = queryBuilder.sort({ createdAt: -1 });
  }

  // Apply pagination
  if (options.page && options.limit) {
    const skip = (options.page - 1) * options.limit;
    queryBuilder = queryBuilder.skip(skip).limit(options.limit);
  }

  return queryBuilder;
};

productSchema.statics.searchProducts = function (searchTerm, options = {}) {
  const query = {
    $and: [
      { status: 'active', visibility: 'public' },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
          { brand: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  };

  let queryBuilder = this.find(query);

  // Apply same filters and sorting as findByCategory
  if (options.minPrice) queryBuilder = queryBuilder.where('price').gte(options.minPrice);
  if (options.maxPrice) queryBuilder = queryBuilder.where('price').lte(options.maxPrice);
  if (options.brand) queryBuilder = queryBuilder.where('brand').in(options.brand);
  if (options.category) queryBuilder = queryBuilder.where('category').in(options.category);
  if (options.minRating) queryBuilder = queryBuilder.where('rating.average').gte(options.minRating);

  // Sorting
  const sortOptions = {
    'relevance': { score: { $meta: 'textScore' } },
    'price_asc': { price: 1 },
    'price_desc': { price: -1 },
    'rating': { 'rating.average': -1 },
    'newest': { createdAt: -1 },
    'popularity': { 'sales.totalSold': -1 }
  };

  if (options.sort && sortOptions[options.sort]) {
    queryBuilder = queryBuilder.sort(sortOptions[options.sort]);
  } else {
    queryBuilder = queryBuilder.sort({ createdAt: -1 });
  }

  // Pagination
  if (options.page && options.limit) {
    const skip = (options.page - 1) * options.limit;
    queryBuilder = queryBuilder.skip(skip).limit(options.limit);
  }

  return queryBuilder;
};

productSchema.statics.getLowStockProducts = function (threshold = null) {
  const query = {
    'stock.trackQuantity': true,
    status: 'active'
  };

  if (threshold) {
    query['stock.quantity'] = { $lte: threshold };
  } else {
    query.$expr = { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] };
  }

  return this.find(query).sort({ 'stock.quantity': 1 });
};

productSchema.statics.getTopSelling = function (limit = 10, timeframe = null) {
  let query = { status: 'active', visibility: 'public' };

  if (timeframe) {
    const date = new Date();
    date.setDate(date.getDate() - timeframe);
    query.createdAt = { $gte: date };
  }

  return this.find(query)
    .sort({ 'sales.totalSold': -1 })
    .limit(limit);
};

// Text search indexes
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  shortDescription: 'text',
  tags: 'text', 
  brand: 'text' 
}, {
  weights: {
    name: 10,
    brand: 5,
    shortDescription: 3,
    tags: 2,
    description: 1
  }
});
productSchema.index({ category: 1, status: 1, visibility: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ featured: 1, status: 1, visibility: 1 });
productSchema.index({ sections: 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true, sparse: true });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'sales.totalSold': -1 });
productSchema.index({ 'stock.quantity': 1 });

// Compound indexes for common queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ category: 1, 'rating.average': -1 });
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ status: 1, visibility: 1, featured: 1 });
productSchema.index({ 'stock.trackQuantity': 1, 'stock.quantity': 1 });

// Clean expired reservations
productSchema.methods.cleanExpiredReservations = function () {
  if (!this.stock.reservations) return Promise.resolve(true);

  const now = new Date();
  const expiredReservations = this.stock.reservations.filter(r => r.expiresAt < now);

  if (expiredReservations.length > 0) {
    // Release expired reservations
    const totalExpired = expiredReservations.reduce((sum, r) => sum + r.quantity, 0);
    this.stock.quantity += totalExpired;
    this.stock.reserved = Math.max(0, (this.stock.reserved || 0) - totalExpired);

    // Remove expired reservations
    this.stock.reservations = this.stock.reservations.filter(r => r.expiresAt >= now);

    return this.save();
  }

  return Promise.resolve(true);
};

// Reserve stock
productSchema.methods.reserveStock = function (quantity, reservationId) {
  if (!this.stock.trackQuantity) return Promise.resolve(true);

  if (this.stock.quantity < quantity) {
    throw new Error('Insufficient stock available');
  }

  // Add to reserved stock
  this.stock.reserved = (this.stock.reserved || 0) + quantity;
  this.stock.quantity -= quantity;

  // Track reservation with expiry (15 minutes)
  if (!this.stock.reservations) this.stock.reservations = [];
  this.stock.reservations.push({
    id: reservationId,
    quantity,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  });

  return this.save();
};

// Release stock reservation
productSchema.methods.releaseReservation = function (reservationId) {
  if (!this.stock.reservations) return Promise.resolve(false);

  const reservation = this.stock.reservations.find(r => r.id === reservationId);
  if (!reservation) return Promise.resolve(false);

  // Release reserved stock back to available
  this.stock.quantity += reservation.quantity;
  this.stock.reserved = Math.max(0, (this.stock.reserved || 0) - reservation.quantity);

  // Remove reservation
  this.stock.reservations = this.stock.reservations.filter(r => r.id !== reservationId);

  return this.save();
};

export default mongoose.model('Product', productSchema);