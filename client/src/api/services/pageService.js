import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

class PageService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
  }

  // Get all pages
  async getPages() {
    const cacheKey = 'pages';

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.PAGES.BASE);
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching pages:', error);
      throw new Error(error.message || 'Failed to fetch pages');
    }
  }

  // Get page by slug
  async getPageBySlug(slug) {
    if (!slug) {
      throw new Error('Page slug is required');
    }

    const cacheKey = `page_${slug}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.PAGES.BY_SLUG(slug));
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching page ${slug}:`, error);
      throw new Error(error.message || 'Failed to fetch page');
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

export default new PageService();