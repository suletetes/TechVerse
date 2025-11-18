/**
 * Admin Data Manager
 * Centralized admin data loading and management
 */

import { adminService } from '../api/services/index.js';
import { tokenManager } from './tokenManager.js';

class AdminDataManager {
  constructor() {
    this.cache = new Map();
    this.loading = new Set();
    this.listeners = new Map();
  }

  // Check if user is authenticated and has admin role
  isAdminAuthenticated() {
    const token = tokenManager.getToken();
    if (!token) {
      console.log('❌ No authentication token found');
      return false;
    }

    // For development, we'll be more lenient
    if (import.meta.env?.DEV) {
      console.log('✅ Development mode - allowing admin access');
      return true;
    }

    return true; // In production, add proper role checking
  }

  // Load products with proper error handling
  async loadProducts(params = {}) {
    const cacheKey = `products_${JSON.stringify(params)}`;
    
    if (this.loading.has('products')) {
      console.log('⏳ Products already loading, waiting...');
      return this.waitForLoad('products');
    }

    try {
      this.loading.add('products');
      this.notifyListeners('products', { loading: true, error: null });

      console.log('📦 Loading products...', params);
      
      const response = await adminService.getAdminProducts({
        limit: 20,
        page: 1,
        ...params
      });

      console.log('✅ Products loaded successfully:', response);

      const products = response.data?.products || response.products || [];
      const pagination = response.data?.pagination || response.pagination || {};

      this.cache.set(cacheKey, { products, pagination, timestamp: Date.now() });
      this.notifyListeners('products', { 
        loading: false, 
        error: null, 
        data: products, 
        pagination 
      });

      return { products, pagination };

    } catch (error) {
      console.error('❌ Error loading products:', error);
      
      let errorMessage = 'Failed to load products';
      
      // Check for specific error types
      if (error.message.includes('Token refresh disabled')) {
        errorMessage = 'Authentication issue. Please reset auth state.';
      } else if (error.message.includes('Access denied') || error.message.includes('No valid token')) {
        errorMessage = 'Access denied. Please login as admin.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication required. Please login.';
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden. Admin permissions required.';
      } else if (error.status === 404) {
        errorMessage = 'Products endpoint not found. Check server configuration.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Check your connection.';
      } else {
        errorMessage = error.message || error.data?.message || 'Unknown error occurred';
      }

      console.error('📦 Products error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        data: error.data
      });

      this.notifyListeners('products', { 
        loading: false, 
        error: errorMessage, 
        data: [], 
        pagination: {} 
      });

      throw new Error(errorMessage);
    } finally {
      this.loading.delete('products');
    }
  }

  // Load orders with proper error handling
  async loadOrders(params = {}) {
    const cacheKey = `orders_${JSON.stringify(params)}`;
    
    if (this.loading.has('orders')) {
      console.log('⏳ Orders already loading, waiting...');
      return this.waitForLoad('orders');
    }

    try {
      this.loading.add('orders');
      this.notifyListeners('orders', { loading: true, error: null });

      console.log('📋 Loading orders...', params);
      
      const response = await adminService.getAdminOrders({
        limit: 20,
        page: 1,
        ...params
      });

      console.log('✅ Orders loaded successfully:', response);

      const orders = response.data?.orders || response.orders || [];
      const pagination = response.data?.pagination || response.pagination || {};

      this.cache.set(cacheKey, { orders, pagination, timestamp: Date.now() });
      this.notifyListeners('orders', { 
        loading: false, 
        error: null, 
        data: orders, 
        pagination 
      });

      return { orders, pagination };

    } catch (error) {
      console.error('❌ Error loading orders:', error);
      
      let errorMessage = 'Failed to load orders';
      
      // Check for specific error types
      if (error.message.includes('Token refresh disabled')) {
        errorMessage = 'Authentication issue. Please reset auth state.';
      } else if (error.message.includes('Access denied') || error.message.includes('No valid token')) {
        errorMessage = 'Access denied. Please login as admin.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication required. Please login.';
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden. Admin permissions required.';
      } else if (error.status === 404) {
        errorMessage = 'Orders endpoint not found. Check server configuration.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Check your connection.';
      } else {
        errorMessage = error.message || error.data?.message || 'Unknown error occurred';
      }

      console.error('📋 Orders error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        data: error.data
      });

      this.notifyListeners('orders', { 
        loading: false, 
        error: errorMessage, 
        data: [], 
        pagination: {} 
      });

      throw new Error(errorMessage);
    } finally {
      this.loading.delete('orders');
    }
  }

  // Load users with proper error handling
  async loadUsers(params = {}) {
    const cacheKey = `users_${JSON.stringify(params)}`;
    
    if (this.loading.has('users')) {
      console.log('⏳ Users already loading, waiting...');
      return this.waitForLoad('users');
    }

    try {
      this.loading.add('users');
      this.notifyListeners('users', { loading: true, error: null });

      console.log('👥 Loading users...', params);
      
      const response = await adminService.getAdminUsers({
        limit: 20,
        page: 1,
        ...params
      });

      console.log('✅ Users loaded successfully:', response);

      const users = response.data?.users || response.users || [];
      const pagination = response.data?.pagination || response.pagination || {};

      this.cache.set(cacheKey, { users, pagination, timestamp: Date.now() });
      this.notifyListeners('users', { 
        loading: false, 
        error: null, 
        data: users, 
        pagination 
      });

      return { users, pagination };

    } catch (error) {
      console.error('❌ Error loading users:', error);
      
      let errorMessage = 'Failed to load users';
      
      // Check for specific error types
      if (error.message.includes('Token refresh disabled')) {
        errorMessage = 'Authentication issue. Please reset auth state.';
      } else if (error.message.includes('Access denied') || error.message.includes('No valid token')) {
        errorMessage = 'Access denied. Please login as admin.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication required. Please login.';
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden. Admin permissions required.';
      } else if (error.status === 404) {
        errorMessage = 'Users endpoint not found. Check server configuration.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Check your connection.';
      } else {
        errorMessage = error.message || error.data?.message || 'Unknown error occurred';
      }

      console.error('👥 Users error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        data: error.data
      });

      this.notifyListeners('users', { 
        loading: false, 
        error: errorMessage, 
        data: [], 
        pagination: {} 
      });

      throw new Error(errorMessage);
    } finally {
      this.loading.delete('users');
    }
  }

  // Wait for a load operation to complete
  async waitForLoad(type) {
    return new Promise((resolve) => {
      const checkLoading = () => {
        if (!this.loading.has(type)) {
          resolve();
        } else {
          setTimeout(checkLoading, 100);
        }
      };
      checkLoading();
    });
  }

  // Add listener for data changes
  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);

    // Return unsubscribe function
    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(callback);
      }
    };
  }

  // Notify listeners of data changes
  notifyListeners(type, data) {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${type} listener:`, error);
        }
      });
    }
  }

  // Clear cache
  clearCache(type = null) {
    if (type) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(type)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Get cached data
  getCached(type, params = {}) {
    const cacheKey = `${type}_${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached;
    }
    
    return null;
  }
}

// Create singleton instance
export const adminDataManager = new AdminDataManager();

// Make available globally in development
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.adminDataManager = adminDataManager;
  console.log('🔧 Development helper: window.adminDataManager');
}

export default adminDataManager;