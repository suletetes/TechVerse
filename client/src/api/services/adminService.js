import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

class AdminService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes for admin data
  }

  // Dashboard Analytics
  async getDashboardStats(params = {}) {
    try {
      const {
        period = '30d', // 7d, 30d, 90d, 1y
        ...otherParams
      } = params;

      const cacheKey = `dashboard_stats_${period}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }

      const response = await apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD, {
        params: { period, ...otherParams }
      });
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error(error.message || 'Failed to fetch dashboard statistics');
    }
  }

  // Product Management
  async getAdminProducts(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'createdAt',
        order = 'desc',
        status,
        category,
        search,
        ...otherParams
      } = params;

      const queryParams = {
        page,
        limit,
        sort,
        order,
        ...otherParams
      };

      // Add optional filters
      if (status) queryParams.status = status;
      if (category) queryParams.category = category;
      if (search) queryParams.search = search;

      const response = await apiClient.get(API_ENDPOINTS.ADMIN.PRODUCTS, {
        params: queryParams
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching admin products:', error);
      throw new Error(error.message || 'Failed to fetch products');
    }
  }

  // Order Management
  async getAdminOrders(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'createdAt',
        order = 'desc',
        status,
        startDate,
        endDate,
        search,
        ...otherParams
      } = params;

      const queryParams = {
        page,
        limit,
        sort,
        order,
        ...otherParams
      };

      // Add optional filters
      if (status) queryParams.status = status;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;
      if (search) queryParams.search = search;

      const response = await apiClient.get(API_ENDPOINTS.ADMIN.ORDERS, {
        params: queryParams
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      throw new Error(error.message || 'Failed to fetch orders');
    }
  }

  async updateOrderStatus(orderId, status, notes = '') {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!status) {
      throw new Error('Order status is required');
    }

    try {
      const response = await apiClient.put(`${API_ENDPOINTS.ADMIN.ORDERS}/${orderId}/status`, {
        status,
        notes: notes.trim()
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw new Error(error.message || 'Failed to update order status');
    }
  }

  // User Management
  async getAdminUsers(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'createdAt',
        order = 'desc',
        role,
        status,
        search,
        ...otherParams
      } = params;

      const queryParams = {
        page,
        limit,
        sort,
        order,
        ...otherParams
      };

      // Add optional filters
      if (role) queryParams.role = role;
      if (status) queryParams.status = status;
      if (search) queryParams.search = search;

      const response = await apiClient.get(API_ENDPOINTS.ADMIN.USERS, {
        params: queryParams
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }
  }

  async updateUserStatus(userId, status) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!status) {
      throw new Error('User status is required');
    }

    try {
      const response = await apiClient.put(`${API_ENDPOINTS.ADMIN.USERS}/${userId}/status`, {
        status
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating user ${userId} status:`, error);
      throw new Error(error.message || 'Failed to update user status');
    }
  }

  async updateUserRole(userId, role) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!role) {
      throw new Error('User role is required');
    }

    try {
      const response = await apiClient.put(`${API_ENDPOINTS.ADMIN.USERS}/${userId}/role`, {
        role
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating user ${userId} role:`, error);
      throw new Error(error.message || 'Failed to update user role');
    }
  }

  // Category Management
  async getCategories() {
    const cacheKey = 'admin_categories';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.CATEGORIES);
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error(error.message || 'Failed to fetch categories');
    }
  }

  async createCategory(categoryData) {
    try {
      // Validate category data
      if (!categoryData.name || !categoryData.name.trim()) {
        throw new Error('Category name is required');
      }

      const response = await apiClient.post(API_ENDPOINTS.ADMIN.CATEGORIES, categoryData);
      const data = await handleApiResponse(response);
      
      // Clear categories cache
      this.cache.delete('admin_categories');
      
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error(error.message || 'Failed to create category');
    }
  }

  async updateCategory(categoryId, categoryData) {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    try {
      const response = await apiClient.put(`${API_ENDPOINTS.ADMIN.CATEGORIES}/${categoryId}`, categoryData);
      const data = await handleApiResponse(response);
      
      // Clear categories cache
      this.cache.delete('admin_categories');
      
      return data;
    } catch (error) {
      console.error(`Error updating category ${categoryId}:`, error);
      throw new Error(error.message || 'Failed to update category');
    }
  }

  async deleteCategory(categoryId) {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.ADMIN.CATEGORIES}/${categoryId}`);
      const data = await handleApiResponse(response);
      
      // Clear categories cache
      this.cache.delete('admin_categories');
      
      return data;
    } catch (error) {
      console.error(`Error deleting category ${categoryId}:`, error);
      throw new Error(error.message || 'Failed to delete category');
    }
  }

  // Analytics
  async getAnalytics(params = {}) {
    try {
      const {
        type = 'overview', // overview, sales, products, users
        period = '30d',
        ...otherParams
      } = params;

      const cacheKey = `analytics_${type}_${period}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }

      const response = await apiClient.get(API_ENDPOINTS.ADMIN.ANALYTICS, {
        params: { type, period, ...otherParams }
      });
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error(error.message || 'Failed to fetch analytics');
    }
  }

  // Bulk Operations
  async bulkUpdateProducts(productIds, updateData) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Product IDs array is required');
    }

    try {
      const response = await apiClient.put(`${API_ENDPOINTS.ADMIN.PRODUCTS}/bulk`, {
        productIds,
        updateData
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw new Error(error.message || 'Failed to bulk update products');
    }
  }

  async bulkDeleteProducts(productIds) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Product IDs array is required');
    }

    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.ADMIN.PRODUCTS}/bulk`, {
        data: { productIds }
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      throw new Error(error.message || 'Failed to bulk delete products');
    }
  }

  // Export/Import
  async exportData(type, params = {}) {
    if (!type) {
      throw new Error('Export type is required');
    }

    try {
      const response = await apiClient.get(`${API_ENDPOINTS.ADMIN.DASHBOARD}/export/${type}`, {
        params,
        headers: {
          'Accept': 'application/octet-stream'
        }
      });
      
      return response.blob();
    } catch (error) {
      console.error(`Error exporting ${type} data:`, error);
      throw new Error(error.message || `Failed to export ${type} data`);
    }
  }

  async importData(type, file) {
    if (!type) {
      throw new Error('Import type is required');
    }

    if (!file) {
      throw new Error('File is required');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.upload(`${API_ENDPOINTS.ADMIN.DASHBOARD}/import/${type}`, formData);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error importing ${type} data:`, error);
      throw new Error(error.message || `Failed to import ${type} data`);
    }
  }

  // Utility Methods
  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new AdminService();