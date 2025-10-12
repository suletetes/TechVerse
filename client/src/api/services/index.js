// API Services Export
export { default as authService } from './authService.js';
export { default as productService } from './productService.js';
export { default as orderService } from './orderService.js';
export { default as userService } from './userService.js';
export { default as adminService } from './adminService.js';
export { default as enhancedApiService } from './enhancedApiService.js';
export { default as apiUtils } from './apiUtils.js';

// Import services for the combined object
import authService from './authService.js';
import productService from './productService.js';
import orderService from './orderService.js';
import userService from './userService.js';
import adminService from './adminService.js';
import enhancedApiService from './enhancedApiService.js';
import apiUtils from './apiUtils.js';

// Export all services as a single object for convenience
export const apiServices = {
  auth: authService,
  product: productService,
  order: orderService,
  user: userService,
  admin: adminService,
  enhanced: enhancedApiService,
  utils: apiUtils
};