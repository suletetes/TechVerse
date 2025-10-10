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
  reviewedAt: Date,
  
  // Status history for audit trail
  statusHistory: [{
    from: String,
    to: String,
    timestamp: { type: Date, default: Date.now },
    notes: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Fraud detection
  fraudScore: { type: Number, default: 0 },
  fraudFlags: [String],
  
  // Inventory management
  stockReserved: { type: Boolean, default: false },
  stockReservedAt: Date
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

// Method to update status with validation
orderSchema.methods.updateStatus = async function(newStatus, notes = '', updatedBy = null) {
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'returned'],
    'delivered': ['returned'],
    'cancelled': [],
    'refunded': [],
    'returned': ['refunded']
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  const now = new Date();
  const oldStatus = this.status;
  
  this.status = newStatus;
  if (notes) this.notes = notes;
  
  // Update relevant timestamps
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
      // Release reserved stock
      await this.releaseStock();
      break;
    case 'returned':
      // Release stock back to inventory
      await this.releaseStock();
      break;
  }
  
  // Log status change
  if (!this.statusHistory) this.statusHistory = [];
  this.statusHistory.push({
    from: oldStatus,
    to: newStatus,
    timestamp: now,
    notes,
    updatedBy
  });
  
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
  
  // Auto-update order status based on tracking
  if (status.toLowerCase().includes('delivered')) {
    this.updateStatus('delivered', `Package delivered: ${description}`);
  }
  
  return this.save();
};

// Method to calculate totals with tax and discounts
orderSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate tax (20% VAT for UK, but could be configurable)
  const taxRate = 0.2; // 20% VAT
  this.tax = Math.round(this.subtotal * taxRate * 100) / 100;
  
  // Apply discount
  let discountAmount = 0;
  if (this.discount && this.discount.amount > 0) {
    if (this.discount.type === 'percentage') {
      discountAmount = Math.round(this.subtotal * (this.discount.amount / 100) * 100) / 100;
    } else {
      discountAmount = this.discount.amount;
    }
    
    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, this.subtotal);
  }
  
  // Calculate final total
  this.total = Math.round((this.subtotal + this.tax + this.shipping.cost - discountAmount) * 100) / 100;
  
  return this;
};

// Method to reserve stock for order items
orderSchema.methods.reserveStock = async function() {
  const Product = mongoose.model('Product');
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      await product.reserveStock(item.quantity);
    }
  }
};

// Method to release stock (for cancellations/returns)
orderSchema.methods.releaseStock = async function() {
  const Product = mongoose.model('Product');
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      await product.releaseStock(item.quantity);
    }
  }
};

// Method to process refund
orderSchema.methods.processRefund = function(amount, reason = '') {
  if (!this.payment.refunds) this.payment.refunds = [];
  
  const refund = {
    amount,
    reason,
    refundedAt: new Date(),
    transactionId: `ref_${Date.now()}`
  };
  
  this.payment.refunds.push(refund);
  this.payment.refundedAmount += amount;
  
  // Update payment status
  if (this.payment.refundedAmount >= this.payment.amount) {
    this.payment.status = 'refunded';
  } else {
    this.payment.status = 'partially_refunded';
  }
  
  return this.save();
};

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed', 'processing'].includes(this.status);
};

// Method to check if order can be returned
orderSchema.methods.canBeReturned = function() {
  if (this.status !== 'delivered') return false;
  
  const deliveryDate = this.deliveredAt || this.createdAt;
  const daysSinceDelivery = (Date.now() - deliveryDate) / (1000 * 60 * 60 * 24);
  
  return daysSinceDelivery <= 30; // 30-day return policy
};

// Method to generate invoice
orderSchema.methods.generateInvoice = function() {
  return {
    orderNumber: this.orderNumber,
    invoiceDate: new Date(),
    customer: {
      name: `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`,
      email: this.user.email, // This would need to be populated
      address: this.billingAddress || this.shippingAddress
    },
    items: this.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    })),
    subtotal: this.subtotal,
    tax: this.tax,
    shipping: this.shipping.cost,
    discount: this.discount.amount || 0,
    total: this.total
  };
};

// Method to send notification emails
orderSchema.methods.sendStatusNotification = async function() {
  const emailService = require('../services/emailService.js').default;
  
  try {
    // This would need the user to be populated
    await emailService.sendOrderStatusUpdateEmail(this.user, this);
  } catch (error) {
    console.error('Failed to send order notification:', error);
  }
};

// Static methods
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber });
};

orderSchema.statics.findByUser = function(userId, options = {}) {
  let query = this.find({ user: userId });
  
  if (options.status) {
    query = query.where('status').in(Array.isArray(options.status) ? options.status : [options.status]);
  }
  
  if (options.dateFrom) {
    query = query.where('createdAt').gte(options.dateFrom);
  }
  
  if (options.dateTo) {
    query = query.where('createdAt').lte(options.dateTo);
  }
  
  return query.sort({ createdAt: -1 });
};

orderSchema.statics.getOrderStats = function(dateFrom, dateTo) {
  const matchStage = {};
  
  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        statusBreakdown: {
          $push: {
            status: '$status',
            total: '$total'
          }
        }
      }
    },
    {
      $addFields: {
        statusCounts: {
          $reduce: {
            input: '$statusBreakdown',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [[{
                    k: '$$this.status',
                    v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.status', input: '$$value' } }, 0] }, 1] }
                  }]]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

orderSchema.statics.getRevenueByPeriod = function(period = 'day', dateFrom, dateTo) {
  const matchStage = { status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } };
  
  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
  }
  
  const groupStage = {
    day: {
      $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
    },
    week: {
      $dateToString: { format: '%Y-W%U', date: '$createdAt' }
    },
    month: {
      $dateToString: { format: '%Y-%m', date: '$createdAt' }
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupStage[period] || groupStage.day,
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
        averageOrderValue: { $avg: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ 'tracking.trackingNumber': 1 });
orderSchema.index({ fraudScore: -1 });

// Compound indexes
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);