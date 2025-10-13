import mongoose from 'mongoose';

const homepageSectionSchema = new mongoose.Schema({
  sectionType: {
    type: String,
    enum: ['latest', 'topSellers', 'quickPicks', 'weeklyDeals'],
    required: true,
    unique: true
  },
  mode: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto'
  },
  // For manual mode - specific product IDs
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // For auto mode - query configuration
  autoConfig: {
    limit: { type: Number, default: 10 },
    sortBy: { 
      type: String, 
      enum: ['newest', 'oldest', 'price_asc', 'price_desc', 'rating', 'popularity'],
      default: 'newest'
    },
    filters: {
      featured: Boolean,
      minRating: Number,
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      brand: String,
      tags: [String]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  title: String,
  subtitle: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Method to get products for this section
homepageSectionSchema.methods.getProducts = async function() {
  const Product = mongoose.model('Product');
  
  if (this.mode === 'manual') {
    // Return manually selected products in order
    const products = await Product.find({
      _id: { $in: this.productIds },
      status: 'active',
      visibility: 'public'
    }).populate('category', 'name slug');
    
    // Maintain the order from productIds
    const orderedProducts = this.productIds.map(id => 
      products.find(p => p._id.toString() === id.toString())
    ).filter(Boolean);
    
    return orderedProducts;
  } else {
    // Auto mode - build query from config
    const query = {
      status: 'active',
      visibility: 'public'
    };
    
    const config = this.autoConfig;
    
    // Apply filters
    if (config.filters.featured) query.featured = true;
    if (config.filters.minRating) query['rating.average'] = { $gte: config.filters.minRating };
    if (config.filters.category) query.category = config.filters.category;
    if (config.filters.brand) query.brand = config.filters.brand;
    if (config.filters.tags && config.filters.tags.length > 0) {
      query.tags = { $in: config.filters.tags };
    }
    
    // Build sort
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'price_asc': { price: 1 },
      'price_desc': { price: -1 },
      'rating': { 'rating.average': -1 },
      'popularity': { 'sales.totalSold': -1 }
    };
    
    const sort = sortOptions[config.sortBy] || { createdAt: -1 };
    
    // Special handling for different section types
    if (this.sectionType === 'topSellers') {
      query['sales.totalSold'] = { $gt: 0 };
      Object.assign(sort, { 'sales.totalSold': -1 });
    } else if (this.sectionType === 'quickPicks') {
      query.$or = [
        { featured: true },
        { 'rating.average': { $gte: 4.5 } }
      ];
    } else if (this.sectionType === 'weeklyDeals') {
      query.comparePrice = { $exists: true, $gt: 0 };
      query.$expr = { $gt: ['$comparePrice', '$price'] };
    }
    
    return await Product.find(query)
      .sort(sort)
      .limit(config.limit)
      .populate('category', 'name slug');
  }
};

// Static method to get all sections with products
homepageSectionSchema.statics.getAllSectionsWithProducts = async function() {
  const sections = await this.find({ isActive: true })
    .sort({ displayOrder: 1 });
  
  const result = {};
  
  for (const section of sections) {
    const products = await section.getProducts();
    result[section.sectionType] = {
      config: section,
      products
    };
  }
  
  return result;
};

// Static method to initialize default sections
homepageSectionSchema.statics.initializeDefaults = async function() {
  const defaultSections = [
    {
      sectionType: 'latest',
      mode: 'auto',
      autoConfig: {
        limit: 10,
        sortBy: 'newest',
        filters: {}
      },
      title: 'The Latest',
      subtitle: 'Take a look at what\'s new',
      displayOrder: 1
    },
    {
      sectionType: 'topSellers',
      mode: 'auto',
      autoConfig: {
        limit: 10,
        sortBy: 'popularity',
        filters: {}
      },
      title: 'Top Sellers',
      subtitle: 'Find the perfect gift',
      displayOrder: 2
    },
    {
      sectionType: 'quickPicks',
      mode: 'auto',
      autoConfig: {
        limit: 8,
        sortBy: 'rating',
        filters: {
          minRating: 4.0
        }
      },
      title: 'Quick Picks',
      subtitle: 'Perfect gifts at perfect prices',
      displayOrder: 3
    },
    {
      sectionType: 'weeklyDeals',
      mode: 'auto',
      autoConfig: {
        limit: 6,
        sortBy: 'newest',
        filters: {}
      },
      title: 'Weekly Deals',
      subtitle: 'Discover our amazing offers',
      displayOrder: 4
    }
  ];
  
  for (const sectionData of defaultSections) {
    const existing = await this.findOne({ sectionType: sectionData.sectionType });
    if (!existing) {
      await this.create(sectionData);
    }
  }
};

export default mongoose.model('HomepageSection', homepageSectionSchema);