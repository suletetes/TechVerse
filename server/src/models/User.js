import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import passwordService from '../services/passwordService.js';

const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  firstName: { 
    type: String, 
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  apartment: {
    type: String,
    trim: true,
    maxlength: [50, 'Apartment cannot exceed 50 characters']
  },
  city: { 
    type: String, 
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  postcode: { 
    type: String, 
    required: [true, 'Postcode is required'],
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, 'Please enter a valid UK postcode']
  },
  country: { 
    type: String, 
    required: true, 
    default: 'United Kingdom',
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Payment methods removed - now handled by Stripe
// Only store Stripe customer ID for payment processing

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  dateOfBirth: Date,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  addresses: [addressSchema],
  // Stripe integration
  stripeCustomerId: {
    type: String,
    sparse: true,
    index: true
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [99, 'Quantity cannot exceed 99']
    },
    variants: [{
      name: String,
      value: String
    }],
    price: {
      type: Number,
      required: true,
      min: 0
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    newsletter: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    emailMarketing: { type: Boolean, default: true },
    smsMarketing: { type: Boolean, default: false },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' }
  },
  // Activity tracking
  lastLogin: Date,
  lastActivity: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  ipAddress: String,
  userAgent: String,
  
  // Security enhancements
  passwordChangedAt: Date,
  securityQuestions: [{
    question: String,
    answerHash: String
  }],
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  backupCodes: [String],
  trustedDevices: [{
    deviceId: String,
    deviceName: String,
    ipAddress: String,
    userAgent: String,
    lastUsed: Date,
    trusted: { type: Boolean, default: false }
  }],
  
  // Session management
  activeSessions: [{
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
    lastActivity: Date,
    isActive: { type: Boolean, default: true }
  }],
  
  // Account verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Social login
  googleId: String,
  githubId: String,
  facebookId: String,
  
  // Analytics
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  
  // Referral system
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralCount: { type: Number, default: 0 },
  
  // Account status
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'pending', 'closed'],
    default: 'pending'
  },
  suspensionReason: String,
  suspendedUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Use Argon2 for new password hashes
    this.password = await passwordService.hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password (supports both Argon2 and bcrypt)
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error('Password not set for this user');
  }
  return await passwordService.verifyPassword(candidatePassword, this.password);
};

// Method to check if password hash needs upgrade
userSchema.methods.needsPasswordUpgrade = function() {
  return passwordService.needsUpgrade(this.password);
};

// Method to upgrade password hash (requires plain text password)
userSchema.methods.upgradePasswordHash = async function(plainTextPassword) {
  if (!this.password) {
    throw new Error('No existing password hash to upgrade');
  }
  
  const newHash = await passwordService.migrateHash(plainTextPassword, this.password);
  if (newHash) {
    this.password = newHash;
    return true;
  }
  return false;
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    isEmailVerified: this.isEmailVerified
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const payload = {
    id: this._id,
    type: 'refresh'
  };
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

// Method to generate referral code
userSchema.methods.generateReferralCode = function() {
  const code = this.firstName.substring(0, 3).toUpperCase() + 
               Math.random().toString(36).substring(2, 8).toUpperCase();
  this.referralCode = code;
  return code;
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { 
        loginAttempts: 1,
        lastActivity: new Date()
      }
    });
  }
  
  const updates = { 
    $inc: { loginAttempts: 1 },
    $set: { lastActivity: new Date() }
  };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { 
      lastLogin: new Date(),
      lastActivity: new Date()
    }
  });
};

// Method to add address
userSchema.methods.addAddress = function(addressData) {
  // If this is the first address or marked as default, make it default
  if (this.addresses.length === 0 || addressData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
    addressData.isDefault = true;
  }
  
  this.addresses.push(addressData);
  return this.save();
};

// Method to update address
userSchema.methods.updateAddress = function(addressId, updateData) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  // If setting as default, unset others
  if (updateData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
  }
  
  Object.assign(address, updateData);
  return this.save();
};

// Method to remove address
userSchema.methods.removeAddress = function(addressId) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  const wasDefault = address.isDefault;
  address.remove();
  
  // If removed address was default, make first remaining address default
  if (wasDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true;
  }
  
  return this.save();
};

// Method to add to cart
userSchema.methods.addToCart = function(productId, quantity = 1, variants = [], price) {
  const existingItem = this.cart.find(item => 
    item.product.toString() === productId.toString() &&
    JSON.stringify(item.variants) === JSON.stringify(variants)
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price; // Update price in case it changed
  } else {
    this.cart.push({
      product: productId,
      quantity,
      variants,
      price
    });
  }
  
  return this.save();
};

// Method to update cart item
userSchema.methods.updateCartItem = function(itemId, quantity) {
  const item = this.cart.id(itemId);
  if (!item) {
    throw new Error('Cart item not found');
  }
  
  if (quantity <= 0) {
    item.remove();
  } else {
    item.quantity = quantity;
  }
  
  return this.save();
};

// Method to remove from cart
userSchema.methods.removeFromCart = function(itemId) {
  const item = this.cart.id(itemId);
  if (!item) {
    throw new Error('Cart item not found');
  }
  
  item.remove();
  return this.save();
};

// Method to clear cart
userSchema.methods.clearCart = function() {
  this.cart = [];
  return this.save();
};

// Method to update order statistics
userSchema.methods.updateOrderStats = function(orderTotal) {
  this.totalOrders += 1;
  this.totalSpent += orderTotal;
  this.averageOrderValue = this.totalSpent / this.totalOrders;
  return this.save();
};

// Payment methods now handled by Stripe - no local storage needed

// Method to add active session
userSchema.methods.addSession = function(sessionId, ipAddress, userAgent) {
  // Remove old sessions (keep only last 5)
  if (this.activeSessions.length >= 5) {
    this.activeSessions.sort((a, b) => b.lastActivity - a.lastActivity);
    this.activeSessions = this.activeSessions.slice(0, 4);
  }
  
  this.activeSessions.push({
    sessionId,
    ipAddress,
    userAgent: userAgent?.substring(0, 200), // Limit length
    lastActivity: new Date()
  });
  
  return this.save();
};

// Method to update session activity
userSchema.methods.updateSessionActivity = function(sessionId) {
  const session = this.activeSessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove session
userSchema.methods.removeSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(s => s.sessionId !== sessionId);
  return this.save();
};

// Method to clear all sessions except current
userSchema.methods.clearOtherSessions = function(currentSessionId) {
  this.activeSessions = this.activeSessions.filter(s => s.sessionId === currentSessionId);
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByVerificationToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

userSchema.statics.findByPasswordResetToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
};

userSchema.statics.findByReferralCode = function(code) {
  return this.findOne({ referralCode: code.toUpperCase() });
};

// Pre-save middleware for referral code
userSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    this.generateReferralCode();
  }
  next();
});

// Pre-save middleware for email verification
userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.accountStatus = 'pending';
  }
  next();
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ referralCode: 1 }, { sparse: true });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ totalSpent: -1 });

// Compound indexes
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model('User', userSchema);