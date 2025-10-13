import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

class StoreService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Get all stores
  async getStores() {
    const cacheKey = 'stores';

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.STORES.BASE);
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching stores:', error);
      throw new Error(error.message || 'Failed to fetch stores');
    }
  }

  // Get store by ID or slug
  async getStoreById(id) {
    if (!id) {
      throw new Error('Store ID is required');
    }

    const cacheKey = `store_${id}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(`${API_ENDPOINTS.STORES.BASE}/${id}`);
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching store ${id}:`, error);
      throw new Error(error.message || 'Failed to fetch store');
    }
  }

  // Utility methods
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

export default new StoreService();