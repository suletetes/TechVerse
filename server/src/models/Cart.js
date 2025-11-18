import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 99
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  options: {
    type: Object,
    default: {}
  },
  priceModifier: {
    type: Number,
    default: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Calculate totals before saving
cartSchema.pre('save', function() {
  this.subtotal = this.items.reduce((sum, item) => {
    const itemPrice = item.price + (item.priceModifier || 0);
    return sum + (itemPrice * item.quantity);
  }, 0);
  this.total = this.subtotal; // Can add tax/shipping later
});

// TTL index for automatic cleanup
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Cart', cartSchema);