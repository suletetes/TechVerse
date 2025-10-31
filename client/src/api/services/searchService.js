/**
 * Search Service - Advanced search functionality with autocomplete
 * Implements requirements 20.1, 20.2, 20.3, 20.4, 20.5
 */

import BaseApiService from '../core/BaseApiService.js';
import { API_ENDPOINTS } from '../config.js';

class SearchService extends BaseApiService {
  constructor() {
    super({
      serviceName: 'SearchService',
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      endpoints: API_ENDPOINTS.SEARCH,
      cacheEnabled: true,
      retryEnabled: true,
      defaultOptions: {
        timeout: 10000
      }
    });

    // Cache for search suggestions and filters
    this.suggestionsCache = new Map();
    this.filtersCache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Advanced product search with comprehensive filtering
   */
  async searchProducts(params = {}) {
    const {
      q = '',
      category = '',
      minPrice = 0,
      maxPrice = 999999,
      brand = '',
      rating = 0,
      inStock = false,
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      tags = '',
      specifications = ''
    } = params;

    // Handle empty or short queries
    const trimmedQuery = q.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return {
        success: true,
        data: {
          products: [],
          suggestions: [],
          facets: {},
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalProducts: 0,
            hasNext: false,
            hasPrev: false,
            limit
          },
          searchQuery: params
        }
      };
    }

    const searchParams = {
      q: trimmedQuery,
      page,
      limit,
      sortBy,
      sortOrder
    };

    // Add filters
    if (category) searchParams.category = category;
    if (minPrice > 0) searchParams.minPrice = minPrice;
    if (maxPrice < 999999) searchParams.maxPrice = maxPrice;
    if (brand) searchParams.brand = brand;
    if (rating > 0) searchParams.rating = rating;
    if (inStock) searchParams.inStock = inStock;
    if (tags) searchParams.tags = tags;
    if (specifications) searchParams.specifications = specifications;

    try {
      return this.read('/search/products', searchParams);
    } catch (error) {
      console.warn('Search failed:', error.message);
      return {
        success: true,
        data: {
          products: [],
          suggestions: [],
          facets: {},
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalProducts: 0,
            hasNext: false,
            hasPrev: false,
            limit
          },
          searchQuery: params
        }
      };
    }
  }

  /**
   * Get autocomplete suggestions with caching
   */
  async getAutocomplete(query, limit = 10) {
    const trimmedQuery = query.trim().toLowerCase();
    
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return {
        success: true,
        data: { suggestions: [] }
      };
    }

    // Check cache first
    const cacheKey = `autocomplete_${trimmedQuery}_${limit}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.read('/search/autocomplete', {
        q: trimmedQuery,
        limit
      });

      // Cache the result
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.warn('Autocomplete failed:', error.message);
      return {
        success: true,
        data: { suggestions: [] }
      };
    }
  }

  /**
   * Get search filters/facets for advanced filtering
   */
  async getSearchFilters(category = '') {
    const cacheKey = `filters_${category}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = category ? { category } : {};
      const result = await this.read('/search/filters', params);

      // Cache the result
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.warn('Failed to get search filters:', error.message);
      return {
        success: true,
        data: {
          priceRange: { minPrice: 0, maxPrice: 1000 },
          brands: [],
          categories: [],
          ratings: []
        }
      };
    }
  }

  /**
   * Get search suggestions for empty results
   */
  async getSearchSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const result = await this.read('/search/suggestions', { q: query });
      return result.data?.suggestions || [];
    } catch (error) {
      console.warn('Failed to get search suggestions:', error.message);
      return [];
    }
  }

  /**
   * Track search analytics
   */
  async trackSearch(query, resultsCount, filters = {}) {
    try {
      await this.create('/search/analytics', {
        query: query.trim(),
        resultsCount,
        filters,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Analytics tracking is non-critical, just log the error
      console.warn('Failed to track search analytics:', error.message);
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(limit = 10) {
    const cacheKey = `popular_searches_${limit}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.read('/search/popular', { limit });
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.warn('Failed to get popular searches:', error.message);
      return {
        success: true,
        data: { searches: [] }
      };
    }
  }

  /**
   * Get search history for logged-in users
   */
  async getSearchHistory(limit = 20) {
    try {
      return this.read('/search/history', { limit });
    } catch (error) {
      console.warn('Failed to get search history:', error.message);
      return {
        success: true,
        data: { history: [] }
      };
    }
  }

  /**
   * Clear search history
   */
  async clearSearchHistory() {
    try {
      return this.delete('/search/history');
    } catch (error) {
      console.warn('Failed to clear search history:', error.message);
      return { success: false, message: 'Failed to clear search history' };
    }
  }

  /**
   * Save search query to history
   */
  async saveSearchToHistory(query, filters = {}) {
    if (!query || query.length < 2) {
      return;
    }

    try {
      await this.create('/search/history', {
        query: query.trim(),
        filters,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // History saving is non-critical
      console.warn('Failed to save search to history:', error.message);
    }
  }

  /**
   * Get category-specific search filters
   */
  async getCategoryFilters(categoryId) {
    const cacheKey = `category_filters_${categoryId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.read(`/search/category/${categoryId}/filters`);
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.warn('Failed to get category filters:', error.message);
      return {
        success: true,
        data: { filters: {} }
      };
    }
  }

  /**
   * Search within specific category with enhanced filters
   */
  async searchInCategory(categoryId, params = {}) {
    const searchParams = {
      ...params,
      category: categoryId
    };

    return this.searchProducts(searchParams);
  }

  /**
   * Get search results with faceted navigation
   */
  async getFacetedSearch(params = {}) {
    try {
      return this.read('/search/faceted', params);
    } catch (error) {
      console.warn('Faceted search failed:', error.message);
      return this.searchProducts(params);
    }
  }

  /**
   * Cache management methods
   */
  getCachedData(key) {
    const cached = this.suggestionsCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.suggestionsCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (this.suggestionsCache.size > 100) {
      const oldestKey = this.suggestionsCache.keys().next().value;
      this.suggestionsCache.delete(oldestKey);
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.suggestionsCache.clear();
    this.filtersCache.clear();
  }

  /**
   * Debounced search for real-time search as user types
   */
  createDebouncedSearch(delay = 300) {
    let timeoutId;
    
    return (query, callback) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const results = await this.getAutocomplete(query);
          callback(results);
        } catch (error) {
          callback({ success: false, error: error.message });
        }
      }, delay);
    };
  }

  /**
   * Build search URL for sharing/bookmarking
   */
  buildSearchUrl(params = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });

    return `/search?${searchParams.toString()}`;
  }

  /**
   * Parse search URL parameters
   */
  parseSearchUrl(url) {
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const params = {};

    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }

    return params;
  }
}

export default new SearchService();