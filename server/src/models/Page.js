import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Page content is required']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  publishedAt: Date,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Static method to get published page by slug
pageSchema.statics.getBySlug = function(slug) {
  return this.findOne({ 
    slug, 
    isPublished: true 
  });
};

export default mongoose.model('Page', pageSchema);