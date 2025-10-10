// Server Constants
// TODO: Define server-side constants

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  RETURNED: 'returned'
};

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

// Product statuses
export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  OUT_OF_STOCK: 'out_of_stock'
};

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password_reset',
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_STATUS_UPDATE: 'order_status_update'
};

// File upload settings
export const UPLOAD_SETTINGS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILES_PER_UPLOAD: 10
};

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100
};

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600,    // 1 hour
  VERY_LONG: 86400 // 24 hours
};

export default {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PRODUCT_STATUS,
  EMAIL_TEMPLATES,
  UPLOAD_SETTINGS,
  PAGINATION_DEFAULTS,
  CACHE_TTL
};