import express from 'express';
import { body, param } from 'express-validator';
import {
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, commonValidations } from '../middleware/validation.js';

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
    .withMessage('Please provide a valid date of birth')
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
router.post('/addresses', addressValidation, validate, addAddress);
router.put('/addresses/:id', 
  [commonValidations.mongoId('id'), ...addressValidation], 
  validate, 
  updateAddress
);
router.delete('/addresses/:id', commonValidations.mongoId('id'), validate, deleteAddress);

// Payment method routes
router.post('/payment-methods', paymentMethodValidation, validate, addPaymentMethod);
router.put('/payment-methods/:id', 
  [commonValidations.mongoId('id'), ...paymentMethodValidation], 
  validate, 
  updatePaymentMethod
);
router.delete('/payment-methods/:id', commonValidations.mongoId('id'), validate, deletePaymentMethod);

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

export default router;