// Centralized API Configuration
// Environment-aware base URL resolution and endpoint definitions

// Determine base URL based on environment
const getBaseURL = () => {
  // Check if we're in production
  if (import.meta.env.PROD) {
    // Use environment variable or default production URL
    return import.meta.env.VITE_API_URL || 'https://api.techverse.com';
  }
  
  // Development mode
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

export const API_BASE_URL = getBaseURL();

// API Endpoints organized by feature domain
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
    refreshToken: '/api/auth/refresh-token',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    verifyEmail: '/api/auth/verify-email',
    me: '/api/auth/me'
  },

  // Products
  products: {
    base: '/api/products',
    byId: (id) => `/api/products/${id}`,
    bySlug: (slug) => `/api/products/slug/${slug}`,
    byCategory: (category) => `/api/products/category/${category}`,
    featured: '/api/products/featured',
    latest: '/api/products/latest',
    topSellers: '/api/products/top-sellers',
    search: '/api/products/search',
    related: (id) => `/api/products/${id}/related`,
    reviews: (id) => `/api/products/${id}/reviews`
  },

  // Categories
  categories: {
    base: '/api/categories',
    byId: (id) => `/api/categories/${id}`,
    bySlug: (slug) => `/api/categories/slug/${slug}`,
    tree: '/api/categories/tree'
  },

  // Cart
  cart: {
    base: '/api/cart',
    add: '/api/cart/add',
    update: '/api/cart/update',
    remove: '/api/cart/remove',
    clear: '/api/cart/clear',
    count: '/api/cart/count'
  },

  // Orders
  orders: {
    base: '/api/orders',
    byId: (id) => `/api/orders/${id}`,
    create: '/api/orders',
    cancel: (id) => `/api/orders/${id}/cancel`,
    track: (id) => `/api/orders/${id}/track`,
    history: '/api/orders/history'
  },

  // User Profile
  user: {
    profile: '/api/user/profile',
    updateProfile: '/api/user/profile',
    addresses: '/api/user/addresses',
    addAddress: '/api/user/addresses',
    updateAddress: (id) => `/api/user/addresses/${id}`,
    deleteAddress: (id) => `/api/user/addresses/${id}`,
    paymentMethods: '/api/user/payment-methods',
    wishlist: '/api/user/wishlist',
    addToWishlist: '/api/user/wishlist/add',
    removeFromWishlist: (id) => `/api/user/wishlist/${id}`
  },

  // Reviews
  reviews: {
    base: '/api/reviews',
    byId: (id) => `/api/reviews/${id}`,
    create: '/api/reviews',
    update: (id) => `/api/reviews/${id}`,
    delete: (id) => `/api/reviews/${id}`,
    helpful: (id) => `/api/reviews/${id}/helpful`
  },

  // Payment
  payment: {
    createIntent: '/api/payments/create-intent',
    confirm: '/api/payments/confirm',
    webhook: '/api/payments/webhook',
    refund: (id) => `/api/payments/${id}/refund`
  },

  // Admin
  admin: {
    // Products
    products: '/api/admin/products',
    product: (id) => `/api/admin/products/${id}`,
    createProduct: '/api/admin/products',
    updateProduct: (id) => `/api/admin/products/${id}`,
    deleteProduct: (id) => `/api/admin/products/${id}`,
    
    // Orders
    orders: '/api/admin/orders',
    order: (id) => `/api/admin/orders/${id}`,
    updateOrderStatus: (id) => `/api/admin/orders/${id}/status`,
    cancelOrder: (id) => `/api/admin/orders/${id}/cancel`,
    refundOrder: (id) => `/api/admin/orders/${id}/refund`,
    
    // Users
    users: '/api/admin/users',
    user: (id) => `/api/admin/users/${id}`,
    updateUser: (id) => `/api/admin/users/${id}`,
    deleteUser: (id) => `/api/admin/users/${id}`,
    
    // Categories
    categories: '/api/admin/categories',
    category: (id) => `/api/admin/categories/${id}`,
    createCategory: '/api/admin/categories',
    updateCategory: (id) => `/api/admin/categories/${id}`,
    deleteCategory: (id) => `/api/admin/categories/${id}`,
    
    // Reviews
    reviews: '/api/admin/reviews',
    review: (id) => `/api/admin/reviews/${id}`,
    approveReview: (id) => `/api/admin/reviews/${id}/approve`,
    rejectReview: (id) => `/api/admin/reviews/${id}/reject`,
    deleteReview: (id) => `/api/admin/reviews/${id}`,
    
    // Analytics
    analytics: '/api/admin/analytics',
    dashboard: '/api/admin/dashboard',
    stats: '/api/admin/stats'
  },

  // Upload
  upload: {
    single: '/api/upload/single',
    multiple: '/api/upload/multiple',
    delete: '/api/upload/delete'
  },

  // CSRF
  csrf: {
    token: '/api/csrf-token'
  }
};

// Helper function to build full URL
export const buildURL = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Export configuration object
export default {
  baseURL: API_BASE_URL,
  endpoints: API_ENDPOINTS,
  buildURL
};
