import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true }, // Store product name at time of order
  price: { type: Number, required: true }, // Store price at time of order
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  variants: [{
    name: String,
    value: String
  }],
  image: String, // Store primary image URL
  sku: String
});

const shippingAddressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  company: String,
  address: { type: String, required: true },
  apartment: String,
  city: { type: String, required: true },
  postcode: { type: String, required: true },
  country: { type: String, required: true },
  phone: String
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: String,
  paymentIntentId: String, // Stripe payment intent ID
  amount: { type: Number, required: true },
  currency: { type: String, default: 'GBP' },
  paidAt: Date,
  refundedAmount: { type: Number, default: 0 },
  refunds: [{
    amount: Number,
    reason: String,
    refundedAt: { type: Date, default: Date.now },
    transactionId: String
  }]
});

const trackingSchema = new mongoose.Schema({
  carrier: String,
  trackingNumber: String,
  trackingUrl: String,
  estimatedDelivery: Date,
  updates: [{
    status: String,
    description: String,
    location: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  
  // Pricing
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  shipping: {
    cost: { type: Number, default: 0 },
    method: String,
    estimatedDays: Number
  },
  discount: {
    amount: { type: Number, default: 0 },
    code: String,
    type: { type: String, enum: ['percentage', 'fixed'] }
  },
  total: { type: Number, required: true },
  
  // Addresses
  shippingAddress: { type: shippingAddressSchema, required: true },
  billingAddress: shippingAddressSchema,
  
  // Payment
  payment: paymentSchema,
  
  // Order Status
  status: {
    type: String,
    enum: [
      'pending',           // Order placed, awaiting payment
      'confirmed',         // Payment confirmed
      'processing',        // Order being prepared
      'shipped',          // Order shipped
      'delivered',        // Order delivered
      'cancelled',        // Order cancelled
      'refunded',         // Order refunded
      'returned'          // Order returned
    ],
    default: 'pending'
  },
  
  // Fulfillment
  fulfillmentStatus: {
    type: String,
    enum: ['unfulfilled', 'partial', 'fulfilled'],
    default: 'unfulfilled'
  },
  
  // Tracking
  tracking: trackingSchema,
  
  // Timestamps
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Notes
  notes: String,
  customerNotes: String,
  
  // Flags
  isGift: { type: Boolean, default: false },
  giftMessage: String,
  
  // Risk assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  
  // Customer service
  tags: [String],
  
  // Analytics
  source: String, // e.g., 'web', 'mobile', 'admin'
  referrer: String,
  
  // Reviews
  canReview: { type: Boolean, default: false },
  reviewedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for order age
orderSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for can cancel
orderSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed', 'processing'].includes(this.status);
});

// Virtual for can return
orderSchema.virtual('canReturn').get(function() {
  if (this.status !== 'delivered') return false;
  const deliveryDate = this.deliveredAt || this.createdAt;
  const daysSinceDelivery = (Date.now() - deliveryDate) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery <= 30; // 30-day return policy
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last order of the day
    const lastOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^ORD${year}${month}${day}`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  const now = new Date();
  
  this.status = newStatus;
  if (notes) this.notes = notes;
  
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = now;
      break;
    case 'shipped':
      this.shippedAt = now;
      this.fulfillmentStatus = 'fulfilled';
      break;
    case 'delivered':
      this.deliveredAt = now;
      this.canReview = true;
      break;
    case 'cancelled':
      this.cancelledAt = now;
      break;
  }
  
  return this.save();
};

// Method to add tracking update
orderSchema.methods.addTrackingUpdate = function(status, description, location = '') {
  if (!this.tracking) {
    this.tracking = { updates: [] };
  }
  
  this.tracking.updates.push({
    status,
    description,
    location,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate tax (20% VAT for UK)
  this.tax = this.subtotal * 0.2;
  
  // Apply discount
  let discountAmount = 0;
  if (this.discount.amount > 0) {
    if (this.discount.type === 'percentage') {
      discountAmount = this.subtotal * (this.discount.amount / 100);
    } else {
      discountAmount = this.discount.amount;
    }
  }
  
  this.total = this.subtotal + this.tax + this.shipping.cost - discountAmount;
  
  return this;
};

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.product': 1 });

export default mongoose.model('Order', orderSchema);