/**
 * Admin Service extending BaseApiService
 * Implements requirements 2.1, 4.2, 4.3
 */

import BaseApiService from '../core/BaseApiService.js';
import { API_ENDPOINTS } from '../config.js';

class AdminService extends BaseApiService {
  constructor() {
    super({
      serviceName: 'AdminService',
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      endpoints: API_ENDPOINTS.ADMIN,
      cacheEnabled: true,
      retryEnabled: true,
      defaultOptions: {
        timeout: 30000 // Admin operations might take longer
      }
    });
  }

  // Dashboard Analytics
  async getDashboardStats(params = {}) {
    const {
      period = '30d', // 7d, 30d, 90d, 1y
      ...otherParams
    } = params;

    return this.read(this.endpoints.DASHBOARD, {
      period,
      ...otherParams
    });
  }

  // Product Management
  async getAdminProducts(params = {}) {
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
      sort,
      order,
      ...otherParams
    };

    // Add optional filters
    if (status) queryParams.status = status;
    if (category) queryParams.category = category;
    if (search) queryParams.search = search;

    return this.getPaginated(this.endpoints.PRODUCTS, page, limit, {
      params: queryParams
    });
  }

  // Validate product slug availability
  async validateProductSlug(slug) {
    if (!slug) {
      throw new Error('Slug is required');
    }

    return this.read(`/products/validate-slug/${slug}`);
  }

  // Create product
  async createProduct(productData) {
    if (!productData.name || !productData.name.trim()) {
      throw new Error('Product name is required');
    }

    if (!productData.category) {
      throw new Error('Product category is required');
    }

    if (!productData.price || parseFloat(productData.price) <= 0) {
      throw new Error('Product price is required and must be greater than 0');
    }

    return this.create('/products', productData);
  }

  // Update product
  async updateProduct(productId, productData) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    return this.update(`/products/${productId}`, productData);
  }

  // Order Management
  async getAdminOrders(params = {}) {
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
      sort,
      order,
      ...otherParams
    };

    // Add optional filters
    if (status) queryParams.status = status;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    if (search) queryParams.search = search;

    return this.getPaginated(this.endpoints.ORDERS, page, limit, {
      params: queryParams
    });
  }

  async updateOrderStatus(orderId, status, notes = '') {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!status) {
      throw new Error('Order status is required');
    }

    return this.update(`${this.endpoints.ORDERS}/${orderId}/status`, {
      status,
      notes: notes.trim()
    });
  }

  // User Management
  async getAdminUsers(params = {}) {
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
      sort,
      order,
      ...otherParams
    };

    // Add optional filters
    if (role) queryParams.role = role;
    if (status) queryParams.status = status;
    if (search) queryParams.search = search;

    return this.getPaginated(this.endpoints.USERS, page, limit, {
      params: queryParams
    });
  }

  async updateUserStatus(userId, status) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!status) {
      throw new Error('User status is required');
    }

    return this.update(`${this.endpoints.USERS}/${userId}/status`, {
      status
    });
  }

  async updateUserRole(userId, role) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!role) {
      throw new Error('User role is required');
    }

    return this.update(`${this.endpoints.USERS}/${userId}/role`, {
      role
    });
  }

  // Category Management
  async getCategories() {
    return this.read(this.endpoints.CATEGORIES);
  }

  async createCategory(categoryData) {
    // Validate category data
    if (!categoryData.name || !categoryData.name.trim()) {
      throw new Error('Category name is required');
    }

    return this.create(this.endpoints.CATEGORIES, categoryData);
  }

  async updateCategory(categoryId, categoryData) {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    return this.update(`${this.endpoints.CATEGORIES}/${categoryId}`, categoryData);
  }

  async deleteCategory(categoryId) {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    return this.delete(`${this.endpoints.CATEGORIES}/${categoryId}`);
  }

  // Analytics
  async getAnalytics(params = {}) {
    const {
      type = 'overview', // overview, sales, products, users
      period = '30d',
      ...otherParams
    } = params;

    return this.read(this.endpoints.ANALYTICS, {
      type,
      period,
      ...otherParams
    });
  }

  // Bulk Operations
  async bulkUpdateProducts(productIds, updateData) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Product IDs array is required');
    }

    return this.batchUpdate(this.endpoints.PRODUCTS, {
      productIds,
      updateData
    });
  }

  async bulkDeleteProducts(productIds) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Product IDs array is required');
    }

    return this.batchDelete(this.endpoints.PRODUCTS, productIds);
  }

  async bulkUpdateOrders(orderIds, updateData) {
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('Order IDs array is required');
    }

    return this.batchUpdate(this.endpoints.ORDERS, {
      orderIds,
      updateData
    });
  }

  async bulkUpdateUsers(userIds, updateData) {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required');
    }

    return this.batchUpdate(this.endpoints.USERS, {
      userIds,
      updateData
    });
  }

  // Export/Import
  async exportData(type, params = {}) {
    if (!type) {
      throw new Error('Export type is required');
    }

    return this.read(`${this.endpoints.DASHBOARD}/export/${type}`, params, {
      headers: {
        'Accept': 'application/octet-stream'
      }
    });
  }

  async importData(type, file) {
    if (!type) {
      throw new Error('Import type is required');
    }

    if (!file) {
      throw new Error('File is required');
    }

    return this.uploadFile(`${this.endpoints.DASHBOARD}/import/${type}`, file);
  }

  // Advanced Analytics
  async getSalesAnalytics(params = {}) {
    const {
      period = '30d',
      groupBy = 'day',
      ...otherParams
    } = params;

    return this.read(`${this.endpoints.ANALYTICS}/sales`, {
      period,
      groupBy,
      ...otherParams
    });
  }

  async getProductAnalytics(params = {}) {
    const {
      period = '30d',
      metric = 'views',
      ...otherParams
    } = params;

    return this.read(`${this.endpoints.ANALYTICS}/products`, {
      period,
      metric,
      ...otherParams
    });
  }

  async getUserAnalytics(params = {}) {
    const {
      period = '30d',
      metric = 'registrations',
      ...otherParams
    } = params;

    return this.read(`${this.endpoints.ANALYTICS}/users`, {
      period,
      metric,
      ...otherParams
    });
  }

  // System Management
  async getSystemHealth() {
    return this.read(`${this.endpoints.DASHBOARD}/health`);
  }

  async getSystemLogs(params = {}) {
    const {
      level = 'error',
      limit = 100,
      ...otherParams
    } = params;

    return this.read(`${this.endpoints.DASHBOARD}/logs`, {
      level,
      limit,
      ...otherParams
    });
  }

  async clearSystemCache(cacheType = 'all') {
    return this.create(`${this.endpoints.DASHBOARD}/cache/clear`, {
      type: cacheType
    });
  }

  // Configuration Management
  async getSystemConfig() {
    return this.read(`${this.endpoints.DASHBOARD}/config`);
  }

  async updateSystemConfig(configData) {
    return this.update(`${this.endpoints.DASHBOARD}/config`, configData);
  }

  // Notification Management
  async getNotifications(params = {}) {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      ...otherParams
    } = params;

    const queryParams = { ...otherParams };
    if (type) queryParams.type = type;
    if (status) queryParams.status = status;

    return this.getPaginated(`${this.endpoints.DASHBOARD}/notifications`, page, limit, {
      params: queryParams
    });
  }

  async createNotification(notificationData) {
    return this.create(`${this.endpoints.DASHBOARD}/notifications`, notificationData);
  }

  async markNotificationAsRead(notificationId) {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    return this.update(`${this.endpoints.DASHBOARD}/notifications/${notificationId}/read`);
  }

  // Report Generation
  async generateReport(reportType, params = {}) {
    if (!reportType) {
      throw new Error('Report type is required');
    }

    return this.create(`${this.endpoints.DASHBOARD}/reports/${reportType}`, params);
  }

  async getReportStatus(reportId) {
    if (!reportId) {
      throw new Error('Report ID is required');
    }

    return this.read(`${this.endpoints.DASHBOARD}/reports/status/${reportId}`);
  }

  async downloadReport(reportId) {
    if (!reportId) {
      throw new Error('Report ID is required');
    }

    return this.read(`${this.endpoints.DASHBOARD}/reports/download/${reportId}`, {}, {
      headers: {
        'Accept': 'application/octet-stream'
      }
    });
  }

  // Inventory Management
  async getInventoryStatus(params = {}) {
    return this.read(`${this.endpoints.PRODUCTS}/inventory`, params);
  }

  async updateInventory(productId, inventoryData) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    return this.update(`${this.endpoints.PRODUCTS}/${productId}/inventory`, inventoryData);
  }

  async getLowStockProducts(threshold = 10) {
    return this.read(`${this.endpoints.PRODUCTS}/low-stock`, {
      threshold
    });
  }
}

export default new AdminService();