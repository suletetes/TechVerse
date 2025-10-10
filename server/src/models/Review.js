import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: [200, 'Pro cannot exceed 200 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [200, 'Con cannot exceed 200 characters']
  }],
  images: [{
    url: { type: String, required: true },
    alt: String,
    publicId: String
  }],
  verified: {
    type: Boolean,
    default: false
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpful: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votedAt: { type: Date, default: Date.now }
  }],
  notHelpful: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votedAt: { type: Date, default: Date.now }
  }],
  reported: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other'],
      required: true
    },
    details: String,
    reportedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  moderatorNotes: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  // Response from seller/admin
  response: {
    text: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpfulness score
reviewSchema.virtual('helpfulnessScore').get(function() {
  const helpfulCount = this.helpful.length;
  const notHelpfulCount = this.notHelpful.length;
  const totalVotes = helpfulCount + notHelpfulCount;
  
  if (totalVotes === 0) return 0;
  return (helpfulCount / totalVotes) * 100;
});

// Virtual for total votes
reviewSchema.virtual('totalVotes').get(function() {
  return this.helpful.length + this.notHelpful.length;
});

// Pre-save middleware to check for verified purchase
reviewSchema.pre('save', async function(next) {
  if (this.isNew && this.order) {
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      _id: this.order,
      user: this.user,
      status: 'delivered',
      'items.product': this.product
    });
    
    if (order) {
      this.verifiedPurchase = true;
      this.verified = true;
    }
  }
  next();
});

// Post-save middleware to update product rating
reviewSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  if (product) {
    await product.updateRating();
  }
});

// Post-remove middleware to update product rating
reviewSchema.post('remove', async function() {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  if (product) {
    await product.updateRating();
  }
});

// Method to mark as helpful
reviewSchema.methods.markHelpful = function(userId) {
  // Remove from not helpful if exists
  this.notHelpful = this.notHelpful.filter(vote => 
    vote.user.toString() !== userId.toString()
  );
  
  // Add to helpful if not already there
  const existingVote = this.helpful.find(vote => 
    vote.user.toString() === userId.toString()
  );
  
  if (!existingVote) {
    this.helpful.push({ user: userId });
  }
  
  return this.save();
};

// Method to mark as not helpful
reviewSchema.methods.markNotHelpful = function(userId) {
  // Remove from helpful if exists
  this.helpful = this.helpful.filter(vote => 
    vote.user.toString() !== userId.toString()
  );
  
  // Add to not helpful if not already there
  const existingVote = this.notHelpful.find(vote => 
    vote.user.toString() === userId.toString()
  );
  
  if (!existingVote) {
    this.notHelpful.push({ user: userId });
  }
  
  return this.save();
};

// Method to report review
reviewSchema.methods.reportReview = function(userId, reason, details = '') {
  const existingReport = this.reported.find(report => 
    report.user.toString() === userId.toString()
  );
  
  if (existingReport) {
    throw new Error('You have already reported this review');
  }
  
  this.reported.push({
    user: userId,
    reason,
    details
  });
  
  return this.save();
};

// Method to moderate review
reviewSchema.methods.moderate = function(status, moderatorId, notes = '') {
  this.status = status;
  this.moderatorNotes = notes;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  
  return this.save();
};

// Method to add response
reviewSchema.methods.addResponse = function(text, responderId) {
  this.response = {
    text,
    respondedBy: responderId,
    respondedAt: new Date()
  };
  
  return this.save();
};

// Static methods
reviewSchema.statics.findByProduct = function(productId, options = {}) {
  let query = this.find({ 
    product: productId, 
    status: 'approved' 
  });
  
  if (options.rating) {
    query = query.where('rating').equals(options.rating);
  }
  
  if (options.verified) {
    query = query.where('verifiedPurchase').equals(true);
  }
  
  // Sorting options
  const sortOptions = {
    'newest': { createdAt: -1 },
    'oldest': { createdAt: 1 },
    'rating_high': { rating: -1 },
    'rating_low': { rating: 1 },
    'helpful': { 'helpful': -1 }
  };
  
  const sort = sortOptions[options.sort] || { createdAt: -1 };
  query = query.sort(sort);
  
  // Pagination
  if (options.page && options.limit) {
    const skip = (options.page - 1) * options.limit;
    query = query.skip(skip).limit(options.limit);
  }
  
  return query.populate('user', 'firstName lastName');
};

reviewSchema.statics.findByUser = function(userId, options = {}) {
  let query = this.find({ user: userId });
  
  if (options.product) {
    query = query.where('product').equals(options.product);
  }
  
  return query.sort({ createdAt: -1 })
    .populate('product', 'name images');
};

reviewSchema.statics.getProductRatingBreakdown = function(productId) {
  return this.aggregate([
    { 
      $match: { 
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        ratings: {
          $push: {
            rating: '$_id',
            count: '$count'
          }
        },
        totalReviews: { $sum: '$count' },
        averageRating: { $avg: '$_id' }
      }
    }
  ]);
};

reviewSchema.statics.getPendingReviews = function(limit = 50) {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name');
};

reviewSchema.statics.getReportedReviews = function() {
  return this.find({ 
    'reported.0': { $exists: true },
    status: { $ne: 'hidden' }
  })
    .sort({ 'reported.reportedAt': -1 })
    .populate('user', 'firstName lastName email')
    .populate('product', 'name');
};

// Compound unique index to prevent duplicate reviews per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Other indexes
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ verifiedPurchase: 1 });
reviewSchema.index({ 'reported.reportedAt': -1 });
reviewSchema.index({ createdAt: -1 });

export default mongoose.model('Review', reviewSchema);