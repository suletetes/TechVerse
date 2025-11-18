// API Services Export
export { default as authService } from './authService.js';
export { default as productService } from './productService.js';
export { default as orderService } from './orderService.js';
export { default as userService } from './userService.js';
export { default as adminService } from './adminService.js';
export { default as cartService } from './cartService.js';
export { default as wishlistService } from './wishlistService.js';
export { default as searchService } from './searchService.js';
export { default as reviewService } from './reviewService.js';
export { default as uploadService } from './uploadService.js';
export { default as enhancedApiService } from './enhancedApiService.js';
export { default as apiUtils } from './apiUtils.js';
export { default as requestDeduplicator } from './requestDeduplicator.js';
export { default as retryManager } from './retryManager.js';
export { default as errorHandler } from './errorHandler.js';

// Import services for the combined object
import authService from './authService.js';
import productService from './productService.js';
import orderService from './orderService.js';
import userService from './userService.js';
import adminService from './adminService.js';
import cartService from './cartService.js';
import wishlistService from './wishlistService.js';
import reviewService from './reviewService.js';
import uploadService from './uploadService.js';
import enhancedApiService from './enhancedApiService.js';
import apiUtils from './apiUtils.js';
import requestDeduplicator from './requestDeduplicator.js';
import retryManager from './retryManager.js';
import errorHandler from './errorHandler.js';

// Export all services as a single object for convenience
export const apiServices = {
  auth: authService,
  product: productService,
  order: orderService,
  user: userService,
  admin: adminService,
  cart: cartService,
  wishlist: wishlistService,
  review: reviewService,
  upload: uploadService,
  enhanced: enhancedApiService,
  utils: apiUtils,
  requestDeduplicator,
  retryManager,
  errorHandler
};