import { Activity } from '../models/index.js';
import logger from '../utils/logger.js';

// Middleware to track user activities
export const trackActivity = (type, getDescription, getMetadata = null) => {
  return async (req, res, next) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json;
    
    res.json = function(data) {
      // Only log activity on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        setImmediate(async () => {
          try {
            const description = typeof getDescription === 'function' 
              ? getDescription(req, res, data) 
              : getDescription;
            
            const metadata = getMetadata 
              ? (typeof getMetadata === 'function' ? getMetadata(req, res, data) : getMetadata)
              : {};

            await Activity.logActivity(
              req.user._id,
              type,
              description,
              metadata,
              req
            );
          } catch (error) {
            logger.error('Activity tracking failed:', error);
          }
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Helper function to create activity tracking middleware
export const createActivityTracker = (type, description, metadata = {}) => {
  return trackActivity(type, description, metadata);
};

// Pre-defined activity trackers
export const activityTrackers = {
  login: trackActivity('login', 'User logged in', (req) => ({
    method: req.body.method || 'email',
    rememberMe: req.body.rememberMe || false
  })),
  
  logout: trackActivity('logout', 'User logged out'),
  
  profileUpdate: trackActivity('profile_update', 'Profile updated', (req) => ({
    updatedFields: Object.keys(req.body)
  })),
  
  passwordChange: trackActivity('password_change', 'Password changed'),
  
  productView: trackActivity('product_view', (req) => `Viewed product: ${req.params.id}`, (req) => ({
    productId: req.params.id
  })),
  
  productSearch: trackActivity('product_search', (req) => `Searched for: ${req.query.search}`, (req) => ({
    query: req.query.search,
    category: req.query.category,
    filters: req.query
  })),
  
  cartAdd: trackActivity('cart_add', (req) => 'Added item to cart', (req) => ({
    productId: req.body.productId,
    quantity: req.body.quantity
  })),
  
  cartRemove: trackActivity('cart_remove', (req) => 'Removed item from cart', (req) => ({
    itemId: req.params.itemId
  })),
  
  cartUpdate: trackActivity('cart_update', (req) => 'Updated cart item', (req) => ({
    itemId: req.params.itemId,
    quantity: req.body.quantity
  })),
  
  wishlistAdd: trackActivity('wishlist_add', (req) => 'Added item to wishlist', (req) => ({
    productId: req.params.productId
  })),
  
  wishlistRemove: trackActivity('wishlist_remove', (req) => 'Removed item from wishlist', (req) => ({
    productId: req.params.productId
  })),
  
  orderCreate: trackActivity('order_create', 'Created new order', (req, res, data) => ({
    orderId: data?.data?.order?._id,
    totalAmount: data?.data?.order?.totalAmount
  })),
  
  addressAdd: trackActivity('address_add', 'Added new address', (req) => ({
    addressType: req.body.type
  })),
  
  addressUpdate: trackActivity('address_update', 'Updated address', (req) => ({
    addressId: req.params.id
  })),
  
  addressDelete: trackActivity('address_delete', 'Deleted address', (req) => ({
    addressId: req.params.id
  })),
  
  paymentMethodAdd: trackActivity('payment_method_add', 'Added payment method', (req) => ({
    type: req.body.type
  })),
  
  paymentMethodDelete: trackActivity('payment_method_delete', 'Deleted payment method', (req) => ({
    paymentMethodId: req.params.id
  }))
};