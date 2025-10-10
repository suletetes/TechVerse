import express from 'express';
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

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Address routes
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

// Payment method routes
router.post('/payment-methods', addPaymentMethod);
router.put('/payment-methods/:id', updatePaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);

// Wishlist routes
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// Cart routes
router.get('/cart', getCart);
router.post('/cart', addToCart);
router.put('/cart/:itemId', updateCartItem);
router.delete('/cart/:itemId', removeFromCart);
router.delete('/cart', clearCart);

export default router;