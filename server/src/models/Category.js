import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image: {
    url: String,
    alt: String,
    publicId: String
  },
  icon: String, // Icon class or SVG
  color: String, // Hex color for UI theming
  
  // SEO
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  
  // Display settings
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  showInMenu: {
    type: Boolean,
    default: true
  },
  
  // Product count (virtual or cached)
  productCount: {
    type: Number,
    default: 0
  },
  
  // Attributes for products in this category
  attributes: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select', 'multiselect'],
      default: 'text'
    },
    options: [String], // For select/multiselect types
    required: { type: Boolean, default: false },
    filterable: { type: Boolean, default: true }
  }],
  
  // Commission settings for marketplace
  commission: {
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full path (breadcrumb)
categorySchema.virtual('path', {
  ref: 'Category',
  localField: 'parent',
  foreignField: '_id',
  justOne: true
});

// Virtual for children categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for level (depth in hierarchy)
categorySchema.virtual('level').get(function() {
  // This would need to be calculated based on parent chain
  // For now, return 0 for root categories
  return this.parent ? 1 : 0;
});

// Slug generation is handled in the comprehensive pre-save middleware below

// Method to get full category path
categorySchema.methods.getFullPath = async function() {
  const path = [this];
  let current = this;
  
  while (current.parent) {
    current = await this.constructor.findById(current.parent);
    if (current) {
      path.unshift(current);
    } else {
      break;
    }
  }
  
  return path;
};

// Method to get all descendants
categorySchema.methods.getDescendants = async function() {
  const descendants = [];
  
  const findChildren = async (parentId) => {
    const children = await this.constructor.find({ parent: parentId });
    for (const child of children) {
      descendants.push(child);
      await findChildren(child._id);
    }
  };
  
  await findChildren(this._id);
  return descendants;
};

// Method to update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ 
    category: this._id, 
    status: 'active' 
  });
  
  this.productCount = count;
  return this.save();
};

// Method to get all parent categories
categorySchema.methods.getParents = async function() {
  const parents = [];
  let current = this;
  
  while (current.parent) {
    current = await this.constructor.findById(current.parent);
    if (current) {
      parents.unshift(current);
    } else {
      break;
    }
  }
  
  return parents;
};

// Method to get breadcrumb path
categorySchema.methods.getBreadcrumb = async function() {
  const parents = await this.getParents();
  return [...parents, this];
};

// Method to check if category has children
categorySchema.methods.hasChildren = async function() {
  const count = await this.constructor.countDocuments({ parent: this._id });
  return count > 0;
};

// Method to move category to new parent
categorySchema.methods.moveTo = async function(newParentId) {
  // Prevent circular references
  if (newParentId) {
    const newParent = await this.constructor.findById(newParentId);
    if (!newParent) {
      throw new Error('New parent category not found');
    }
    
    const newParentPath = await newParent.getParents();
    if (newParentPath.some(p => p._id.toString() === this._id.toString())) {
      throw new Error('Cannot move category to its own descendant');
    }
  }
  
  this.parent = newParentId;
  return this.save();
};

// Static method to build category tree
categorySchema.statics.buildTree = async function(parentId = null, maxDepth = 5, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];
  
  const categories = await this.find({ 
    parent: parentId, 
    isActive: true,
    showInMenu: true 
  })
    .sort({ displayOrder: 1, name: 1 });
  
  const tree = [];
  
  for (const category of categories) {
    const categoryObj = category.toObject();
    categoryObj.children = await this.buildTree(category._id, maxDepth, currentDepth + 1);
    categoryObj.hasChildren = categoryObj.children.length > 0;
    tree.push(categoryObj);
  }
  
  return tree;
};

// Static method to get category with product count
categorySchema.statics.getWithProductCount = async function(includeInactive = false) {
  const matchStage = includeInactive ? {} : { isActive: true };
  
  return await this.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'products',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$category', '$$categoryId'] },
              status: 'active'
            }
          }
        ],
        as: 'products'
      }
    },
    {
      $addFields: {
        productCount: { $size: '$products' }
      }
    },
    {
      $project: {
        products: 0
      }
    },
    {
      $sort: { displayOrder: 1, name: 1 }
    }
  ]);
};

// Static method to get featured categories
categorySchema.statics.getFeatured = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    isActive: true 
  })
    .sort({ displayOrder: 1 })
    .limit(limit);
};

// Static method to search categories
categorySchema.statics.searchCategories = function(searchTerm) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  }).sort({ name: 1 });
};

// Static method to get category hierarchy for admin
categorySchema.statics.getHierarchy = async function() {
  const categories = await this.find({}).sort({ displayOrder: 1, name: 1 });
  
  const categoryMap = new Map();
  const rootCategories = [];
  
  // First pass: create map of all categories
  categories.forEach(cat => {
    categoryMap.set(cat._id.toString(), {
      ...cat.toObject(),
      children: []
    });
  });
  
  // Second pass: build hierarchy
  categories.forEach(cat => {
    const categoryObj = categoryMap.get(cat._id.toString());
    
    if (cat.parent) {
      const parent = categoryMap.get(cat.parent.toString());
      if (parent) {
        parent.children.push(categoryObj);
      }
    } else {
      rootCategories.push(categoryObj);
    }
  });
  
  return rootCategories;
};

// Static method to get categories by level
categorySchema.statics.getByLevel = function(level = 0) {
  if (level === 0) {
    return this.find({ parent: null, isActive: true })
      .sort({ displayOrder: 1, name: 1 });
  }
  
  // For deeper levels, we need to use aggregation
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $graphLookup: {
        from: 'categories',
        startWith: '$parent',
        connectFromField: 'parent',
        connectToField: '_id',
        as: 'ancestors'
      }
    },
    {
      $addFields: {
        level: { $size: '$ancestors' }
      }
    },
    { $match: { level: level } },
    { $sort: { displayOrder: 1, name: 1 } }
  ]);
};

// Static method to update all product counts
categorySchema.statics.updateAllProductCounts = async function() {
  const categories = await this.find({});
  const Product = mongoose.model('Product');
  
  for (const category of categories) {
    const count = await Product.countDocuments({ 
      category: category._id, 
      status: 'active' 
    });
    
    await this.updateOne(
      { _id: category._id },
      { productCount: count }
    );
  }
};

// Pre-save middleware to handle slug generation and validation
categorySchema.pre('save', async function(next) {
  // Generate slug if name changed
  if (this.isModified('name') || this.isNew) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure unique slug
    const query = { slug };
    if (!this.isNew) {
      query._id = { $ne: this._id };
    }
    
    while (await this.constructor.findOne(query)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      query.slug = slug;
    }
    
    this.slug = slug;
  }
  
  // Validate parent relationship
  if (this.parent) {
    const parent = await this.constructor.findById(this.parent);
    if (!parent) {
      throw new Error('Parent category not found');
    }
    
    // Prevent self-reference
    if (this.parent.toString() === this._id.toString()) {
      throw new Error('Category cannot be its own parent');
    }
  }
  
  next();
});

// Post-save middleware to update product counts (disabled for seeding performance)
// categorySchema.post('save', async function() {
//   await this.updateProductCount();
// });

// Post-remove middleware to handle orphaned products and subcategories
categorySchema.post('remove', async function() {
  const Product = mongoose.model('Product');
  
  // Move products to parent category or mark as uncategorized
  if (this.parent) {
    await Product.updateMany(
      { category: this._id },
      { category: this.parent }
    );
  } else {
    // Create or find "Uncategorized" category
    let uncategorized = await this.constructor.findOne({ slug: 'uncategorized' });
    if (!uncategorized) {
      uncategorized = await this.constructor.create({
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: 'Products without a specific category'
      });
    }
    
    await Product.updateMany(
      { category: this._id },
      { category: uncategorized._id }
    );
  }
  
  // Move subcategories to parent
  await this.constructor.updateMany(
    { parent: this._id },
    { parent: this.parent }
  );
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ isFeatured: 1, isActive: 1 });
categorySchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Category', categorySchema);