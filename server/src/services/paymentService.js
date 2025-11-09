// Payment Method Management Service
// Handles secure payment method storage, validation, and processing

import crypto from 'crypto';
import { User, Activity } from '../models/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

class PaymentService {
  /**
   * Encryption key for sensitive payment data
   */
  constructor() {
    this.encryptionKey = process.env.PAYMENT_ENCRYPTION_KEY || 'default-key-change-in-production';
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Encrypt sensitive payment data
   * @param {string} text - Text to encrypt
   * @returns {Object} Encrypted data with IV and auth tag
   */
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt sensitive payment data
   * @param {Object} encryptedData - Encrypted data object
   * @returns {string} Decrypted text
   */
  decrypt(encryptedData) {
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new AppError('Failed to decrypt payment data', 500, 'DECRYPTION_ERROR');
    }
  }

  /**
   * Add payment method for user
   * @param {string} userId - User ID
   * @param {Object} paymentData - Payment method data
   * @returns {Object} Added payment method
   */
  async addPaymentMethod(userId, paymentData) {
    const {
      type,
      cardNumber,
      expiryMonth,
      expiryYear,
      cardholderName,
      billingAddress,
      isDefault = false
    } = paymentData;

    // Validate payment method type
    const validTypes = ['card', 'paypal', 'apple_pay', 'google_pay'];
    if (!validTypes.includes(type)) {
      throw new AppError('Invalid payment method type', 400, 'INVALID_PAYMENT_TYPE');
    }

    // Validate card data for card types
    if (type === 'card') {
      this.validateCardData({ cardNumber, expiryMonth, expiryYear, cardholderName });
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Generate payment method ID
    const paymentMethodId = `pm_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Prepare payment method object
    const paymentMethod = {
      id: paymentMethodId,
      type,
      isDefault,
      createdAt: new Date(),
      lastUsed: null,
      billingAddress: billingAddress || {}
    };

    // Handle card-specific data with encryption
    if (['credit_card', 'debit_card'].includes(type)) {
      // Mask card number for display
      const maskedCardNumber = this.maskCardNumber(cardNumber);
      
      // Encrypt full card number
      const encryptedCardNumber = this.encrypt(cardNumber);
      
      paymentMethod.card = {
        last4: cardNumber.slice(-4),
        maskedNumber: maskedCardNumber,
        encryptedNumber: encryptedCardNumber,
        expiryMonth: parseInt(expiryMonth),
        expiryYear: parseInt(expiryYear),
        cardholderName,
        brand: this.detectCardBrand(cardNumber)
      };
    }

    // Handle digital wallet types
    if (['paypal', 'apple_pay', 'google_pay'].includes(type)) {
      paymentMethod.wallet = {
        provider: type,
        accountId: paymentData.accountId || null,
        email: paymentData.email || null
      };
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      user.paymentMethods.forEach(pm => {
        pm.isDefault = false;
      });
    }

    // Add to user's payment methods
    user.paymentMethods.push(paymentMethod);
    await user.save();

    // Log activity
    await Activity.create({
      user: userId,
      action: 'payment_method_added',
      resource: 'PaymentMethod',
      resourceId: paymentMethodId,
      details: {
        type,
        isDefault,
        last4: paymentMethod.card?.last4 || null,
        brand: paymentMethod.card?.brand || type
      }
    });

    logger.info('Payment method added', {
      userId,
      paymentMethodId,
      type,
      isDefault
    });

    // Return sanitized payment method (without encrypted data)
    return this.sanitizePaymentMethod(paymentMethod);
  }

  /**
   * Get user's payment methods
   * @param {string} userId - User ID
   * @returns {Array} User's payment methods
   */
  async getPaymentMethods(userId) {
    const user = await User.findById(userId).select('paymentMethods');
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Return sanitized payment methods
    return user.paymentMethods.map(pm => this.sanitizePaymentMethod(pm));
  }

  /**
   * Update payment method
   * @param {string} userId - User ID
   * @param {string} paymentMethodId - Payment method ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated payment method
   */
  async updatePaymentMethod(userId, paymentMethodId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const paymentMethod = user.paymentMethods.id(paymentMethodId);
    if (!paymentMethod) {
      throw new AppError('Payment method not found', 404, 'PAYMENT_METHOD_NOT_FOUND');
    }

    // Update allowed fields
    const allowedUpdates = ['isDefault', 'billingAddress', 'cardholderName'];
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'cardholderName' && paymentMethod.card) {
          paymentMethod.card.cardholderName = updateData[key];
        } else if (key === 'billingAddress') {
          paymentMethod.billingAddress = { ...paymentMethod.billingAddress, ...updateData[key] };
        } else {
          paymentMethod[key] = updateData[key];
        }
      }
    });

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
      user.paymentMethods.forEach(pm => {
        if (pm.id !== paymentMethodId) {
          pm.isDefault = false;
        }
      });
    }

    await user.save();

    // Log activity
    await Activity.create({
      user: userId,
      action: 'payment_method_updated',
      resource: 'PaymentMethod',
      resourceId: paymentMethodId,
      details: {
        updatedFields: Object.keys(updateData),
        isDefault: paymentMethod.isDefault
      }
    });

    logger.info('Payment method updated', {
      userId,
      paymentMethodId,
      updatedFields: Object.keys(updateData)
    });

    return this.sanitizePaymentMethod(paymentMethod);
  }

  /**
   * Delete payment method
   * @param {string} userId - User ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Object} Deletion result
   */
  async deletePaymentMethod(userId, paymentMethodId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const paymentMethod = user.paymentMethods.id(paymentMethodId);
    if (!paymentMethod) {
      throw new AppError('Payment method not found', 404, 'PAYMENT_METHOD_NOT_FOUND');
    }

    // Store info for logging before deletion
    const paymentMethodInfo = {
      type: paymentMethod.type,
      isDefault: paymentMethod.isDefault,
      last4: paymentMethod.card?.last4 || null
    };

    // Remove payment method
    user.paymentMethods.pull(paymentMethodId);

    // If deleted method was default, set another as default if available
    if (paymentMethodInfo.isDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[0].isDefault = true;
    }

    await user.save();

    // Log activity
    await Activity.create({
      user: userId,
      action: 'payment_method_deleted',
      resource: 'PaymentMethod',
      resourceId: paymentMethodId,
      details: paymentMethodInfo
    });

    logger.info('Payment method deleted', {
      userId,
      paymentMethodId,
      ...paymentMethodInfo
    });

    return {
      success: true,
      deletedPaymentMethod: paymentMethodInfo,
      remainingMethods: user.paymentMethods.length
    };
  }

  /**
   * Set default payment method
   * @param {string} userId - User ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Object} Updated payment method
   */
  async setDefaultPaymentMethod(userId, paymentMethodId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const paymentMethod = user.paymentMethods.id(paymentMethodId);
    if (!paymentMethod) {
      throw new AppError('Payment method not found', 404, 'PAYMENT_METHOD_NOT_FOUND');
    }

    // Unset all defaults and set new default
    user.paymentMethods.forEach(pm => {
      pm.isDefault = pm.id === paymentMethodId;
    });

    await user.save();

    // Log activity
    await Activity.create({
      user: userId,
      action: 'payment_method_default_changed',
      resource: 'PaymentMethod',
      resourceId: paymentMethodId,
      details: {
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4 || null
      }
    });

    logger.info('Default payment method changed', {
      userId,
      paymentMethodId
    });

    return this.sanitizePaymentMethod(paymentMethod);
  }

  /**
   * Validate card data
   * @param {Object} cardData - Card data to validate
   */
  validateCardData({ cardNumber, expiryMonth, expiryYear, cardholderName }) {
    // Remove spaces and validate card number
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      throw new AppError('Invalid card number format', 400, 'INVALID_CARD_NUMBER');
    }

    // Luhn algorithm validation
    if (!this.validateLuhn(cleanCardNumber)) {
      throw new AppError('Invalid card number', 400, 'INVALID_CARD_NUMBER');
    }

    // Validate expiry
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const expMonth = parseInt(expiryMonth);
    const expYear = parseInt(expiryYear);

    if (expMonth < 1 || expMonth > 12) {
      throw new AppError('Invalid expiry month', 400, 'INVALID_EXPIRY_MONTH');
    }

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      throw new AppError('Card has expired', 400, 'CARD_EXPIRED');
    }

    // Validate cardholder name
    if (!cardholderName || cardholderName.trim().length < 2) {
      throw new AppError('Invalid cardholder name', 400, 'INVALID_CARDHOLDER_NAME');
    }
  }

  /**
   * Validate card number using Luhn algorithm
   * @param {string} cardNumber - Card number to validate
   * @returns {boolean} Is valid
   */
  validateLuhn(cardNumber) {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detect card brand from card number
   * @param {string} cardNumber - Card number
   * @returns {string} Card brand
   */
  detectCardBrand(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
    if (/^(?:2131|1800|35\d{3})\d{11}$/.test(cleanNumber)) return 'jcb';
    
    return 'unknown';
  }

  /**
   * Mask card number for display
   * @param {string} cardNumber - Card number to mask
   * @returns {string} Masked card number
   */
  maskCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const last4 = cleanNumber.slice(-4);
    const masked = '*'.repeat(cleanNumber.length - 4) + last4;
    
    // Add spacing for readability
    return masked.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Sanitize payment method for client response
   * @param {Object} paymentMethod - Payment method to sanitize
   * @returns {Object} Sanitized payment method
   */
  sanitizePaymentMethod(paymentMethod) {
    const sanitized = {
      id: paymentMethod.id,
      type: paymentMethod.type,
      isDefault: paymentMethod.isDefault,
      createdAt: paymentMethod.createdAt,
      lastUsed: paymentMethod.lastUsed,
      billingAddress: paymentMethod.billingAddress
    };

    // Add card-specific data (without encrypted info)
    if (paymentMethod.card) {
      sanitized.card = {
        last4: paymentMethod.card.last4,
        maskedNumber: paymentMethod.card.maskedNumber,
        expiryMonth: paymentMethod.card.expiryMonth,
        expiryYear: paymentMethod.card.expiryYear,
        cardholderName: paymentMethod.card.cardholderName,
        brand: paymentMethod.card.brand
      };
    }

    // Add wallet-specific data
    if (paymentMethod.wallet) {
      sanitized.wallet = {
        provider: paymentMethod.wallet.provider,
        email: paymentMethod.wallet.email
        // Exclude sensitive accountId
      };
    }

    return sanitized;
  }

  /**
   * Process payment (placeholder for payment gateway integration)
   * @param {Object} paymentData - Payment processing data
   * @returns {Object} Payment result
   */
  async processPayment(paymentData) {
    const {
      paymentMethodId,
      amount,
      currency = 'USD',
      orderId,
      userId
    } = paymentData;

    // In a real implementation, this would integrate with payment gateways
    // like Stripe, PayPal, Square, etc.
    
    logger.info('Payment processing initiated', {
      paymentMethodId,
      amount,
      currency,
      orderId,
      userId
    });

    // Simulate payment processing
    const paymentResult = {
      success: true,
      transactionId: `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      amount,
      currency,
      status: 'completed',
      processedAt: new Date(),
      paymentMethodId,
      orderId
    };

    // Update last used timestamp for payment method
    await this.updateLastUsed(userId, paymentMethodId);

    // Log activity
    await Activity.create({
      user: userId,
      action: 'payment_processed',
      resource: 'Payment',
      resourceId: paymentResult.transactionId,
      details: {
        amount,
        currency,
        orderId,
        paymentMethodId,
        status: paymentResult.status
      }
    });

    return paymentResult;
  }

  /**
   * Update last used timestamp for payment method
   * @param {string} userId - User ID
   * @param {string} paymentMethodId - Payment method ID
   */
  async updateLastUsed(userId, paymentMethodId) {
    const user = await User.findById(userId);
    if (user) {
      const paymentMethod = user.paymentMethods.id(paymentMethodId);
      if (paymentMethod) {
        paymentMethod.lastUsed = new Date();
        await user.save();
      }
    }
  }
}

export default new PaymentService();