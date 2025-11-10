import express from 'express';
import { body, param } from 'express-validator';
import {
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} from '../controllers/userController.js';
import paymentService from '../services/paymentService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/passportAuth.js';
import { validate, commonValidations } from '../middleware/validation.js';
// import { activityTrackers } from '../middleware/activityTracker.js';
import { User } from '../models/index.js';

const router = express.Router();

// Validation rules
const profileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Gender must be one of: male, female, other, prefer-not-to-say')
];

const addressValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('postcode')
    .matches(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i)
    .withMessage('Please provide a valid UK postcode'),
  body('type')
    .optional()
    .isIn(['home', 'work', 'other'])
    .withMessage('Address type must be home, work, or other')
];

const paymentMethodValidation = [
  body('type')
    .isIn(['card', 'paypal'])
    .withMessage('Payment method type must be card or paypal'),
  body('cardNumber')
    .if(body('type').equals('card'))
    .isCreditCard()
    .withMessage('Please provide a valid card number'),
  body('expiryMonth')
    .if(body('type').equals('card'))
    .isInt({ min: 1, max: 12 })
    .withMessage('Expiry month must be between 1 and 12'),
  body('expiryYear')
    .if(body('type').equals('card'))
    .isInt({ min: new Date().getFullYear(), max: new Date().getFullYear() + 20 })
    .withMessage('Expiry year must be valid'),
  body('cvv')
    .if(body('type').equals('card'))
    .isLength({ min: 3, max: 4 })
    .isNumeric()
    .withMessage('CVV must be 3 or 4 digits'),
  body('cardholderName')
    .if(body('type').equals('card'))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Cardholder name must be between 2 and 100 characters')
];

const cartItemValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99')
];

const cartUpdateValidation = [
  commonValidations.mongoId('itemId'),
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99')
];

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', profileValidation, validate, updateUserProfile);

// Address routes
router.get('/addresses', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('addresses');
        res.json({
            success: true,
            data: { addresses: user?.addresses || [] }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch addresses'
        });
    }
});
router.post('/addresses', addressValidation, validate, addAddress);
router.put('/addresses/:id', 
  [commonValidations.mongoId('id'), ...addressValidation], 
  validate, 
  updateAddress
);
router.delete('/addresses/:id', commonValidations.mongoId('id'), validate, deleteAddress);
router.patch('/addresses/:id/default', commonValidations.mongoId('id'), validate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const address = user.addresses.id(req.params.id);
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Set all addresses to not default
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });

        // Set the specified address as default
        address.isDefault = true;

        await user.save();

        res.json({
            success: true,
            message: 'Default address updated successfully',
            data: { addresses: user.addresses }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update default address'
        });
    }
});

// Payment method routes - removed duplicate definitions, using the ones below

// Wishlist routes
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', commonValidations.mongoId('productId'), validate, addToWishlist);
router.delete('/wishlist/:productId', commonValidations.mongoId('productId'), validate, removeFromWishlist);

// Cart routes
router.get('/cart', getCart);
router.post('/cart', cartItemValidation, validate, addToCart);
router.put('/cart/:itemId', cartUpdateValidation, validate, updateCartItem);
router.delete('/cart/:itemId', commonValidations.mongoId('itemId'), validate, removeFromCart);
router.delete('/cart', clearCart);

// Payment method routes
// @desc    Get user's payment methods
// @route   GET /api/users/payment-methods
// @access  Private
router.get('/payment-methods', authenticate, asyncHandler(async (req, res, next) => {
  const paymentMethods = await paymentService.getPaymentMethods(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Payment methods retrieved successfully',
    data: {
      paymentMethods,
      count: paymentMethods.length
    }
  });
}));

// @desc    Add payment method
// @route   POST /api/users/payment-methods
// @access  Private
router.post('/payment-methods', authenticate, [
  body('type').isIn(['card', 'paypal', 'apple_pay', 'google_pay']).withMessage('Invalid payment method type'),
  body('cardLast4').if(body('type').equals('card')).optional().isLength({ min: 4, max: 4 }).withMessage('Card last 4 digits must be 4 characters'),
  body('cardBrand').if(body('type').equals('card')).optional().isIn(['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb']).withMessage('Invalid card brand'),
  body('expiryMonth').if(body('type').equals('card')).isInt({ min: 1, max: 12 }).withMessage('Valid expiry month is required'),
  body('expiryYear').if(body('type').equals('card')).isInt({ min: new Date().getFullYear() }).withMessage('Valid expiry year is required'),
  body('cardholderName').if(body('type').equals('card')).trim().isLength({ min: 2, max: 100 }).withMessage('Cardholder name is required'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
  body('email').if(body('type').equals('paypal')).isEmail().withMessage('Valid email is required for PayPal'),
  body('accountId').if(body('type').isIn(['apple_pay', 'google_pay'])).optional().isString().withMessage('Account ID must be string')
], validate, addPaymentMethod);

// @desc    Update payment method
// @route   PUT /api/users/payment-methods/:id
// @access  Private
router.put('/payment-methods/:id', authenticate, [
  param('id').isMongoId().withMessage('Invalid payment method ID format'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
  body('cardholderName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Cardholder name must be 2-100 characters'),
  body('billingAddress').optional().isObject().withMessage('Billing address must be an object')
], validate, asyncHandler(async (req, res, next) => {
  const paymentMethod = await paymentService.updatePaymentMethod(req.user._id, req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Payment method updated successfully',
    data: { paymentMethod }
  });
}));

// @desc    Delete payment method
// @route   DELETE /api/users/payment-methods/:id
// @access  Private
router.delete('/payment-methods/:id', authenticate, [
  param('id').isMongoId().withMessage('Invalid payment method ID format')
], validate, asyncHandler(async (req, res, next) => {
  const result = await paymentService.deletePaymentMethod(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Payment method deleted successfully',
    data: result
  });
}));

// @desc    Set default payment method
// @route   PUT /api/users/payment-methods/:id/default
// @access  Private
router.put('/payment-methods/:id/default', authenticate, [
  param('id').isMongoId().withMessage('Invalid payment method ID format')
], validate, asyncHandler(async (req, res, next) => {
  const paymentMethod = await paymentService.setDefaultPaymentMethod(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Default payment method updated successfully',
    data: { paymentMethod }
  });
}));

// @desc    Process payment
// @route   POST /api/users/payment-methods/process
// @access  Private
router.post('/payment-methods/process', authenticate, [
  body('paymentMethodId').isString().withMessage('Payment method ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('currency').optional().isString().withMessage('Currency must be string'),
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], validate, asyncHandler(async (req, res, next) => {
  const paymentResult = await paymentService.processPayment({
    ...req.body,
    userId: req.user._id
  });

  res.status(200).json({
    success: true,
    message: 'Payment processed successfully',
    data: paymentResult
  });
}));

export default router;