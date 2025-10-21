/**
 * Product Service extending BaseApiService
 * Implements requirements 2.1, 4.2, 4.3
 */

import BaseApiService from '../core/BaseApiService.js';
import { API_ENDPOINTS } from '../config.js';

class ProductService extends BaseApiService {
  constructor() {
    super({
      serviceName: 'ProductService',
      endpoints: API_ENDPOINTS.PRODUCTS,
      cacheEnabled: true,
      retryEnabled: true,
      defaultOptions: {
        timeout: 15000 // Products can have larger payloads
      }
    });
  }

  // Get all products with filters, sorting, and pagination
  async getProducts(params = {}) {
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      category,
      minPrice,
      maxPrice,
      inStock,
      featured,
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
    if (category) queryParams.category = category;
    if (minPrice !== undefined) queryParams.minPrice = minPrice;
    if (maxPrice !== undefined) queryParams.maxPrice = maxPrice;
    if (inStock !== undefined) queryParams.inStock = inStock;
    if (featured !== undefined) queryParams.featured = featured;
    if (search) queryParams.search = search;

    return this.getPaginated(this.endpoints.BASE, page, limit, {
      params: queryParams
    });
  }

  // Get single product by ID
  async getProductById(id) {
    if (!id) {
      throw new Error('Product ID is required');
    }

    return this.read(`${this.endpoints.BASE}/${id}`);
  }

  // Search products
  async searchProducts(query, filters = {}) {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      sort = 'relevance',
      ...otherFilters
    } = filters;

    const params = {
      q: query.trim(),
      page,
      limit,
      sort,
      ...otherFilters
    };

    // Add optional filters
    if (category) params.category = category;
    if (minPrice !== undefined) params.minPrice = minPrice;
    if (maxPrice !== undefined) params.maxPrice = maxPrice;

    return this.search(this.endpoints.SEARCH, query, params);
  }

  // Get featured products
  async getFeaturedProducts(limit = 10) {
    return this.read(this.endpoints.FEATURED, { limit });
  }

  // Get products by category
  async getProductsByCategory(categoryId, params = {}) {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice,
      inStock,
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
    if (minPrice !== undefined) queryParams.minPrice = minPrice;
    if (maxPrice !== undefined) queryParams.maxPrice = maxPrice;
    if (inStock !== undefined) queryParams.inStock = inStock;

    return this.getPaginated(`${this.endpoints.BASE}/category/${categoryId}`, page, limit, {
      params: queryParams
    });
  }

  // Get product reviews
  async getProductReviews(productId, params = {}) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      rating,
      ...otherParams
    } = params;

    const queryParams = {
      page,
      limit,
      sort,
      order,
      ...otherParams
    };

    // Filter by rating if specified
    if (rating !== undefined) queryParams.rating = rating;

    return this.getPaginated(this.endpoints.REVIEWS(productId), page, limit, {
      params: queryParams
    });
  }

  // Add product review
  async addProductReview(productId, reviewData) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const { rating, comment, title } = reviewData;

    // Validate review data
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (!comment || comment.trim().length < 10) {
      throw new Error('Review comment must be at least 10 characters');
    }

    return this.create(this.endpoints.REVIEWS(productId), {
      rating: parseInt(rating),
      comment: comment.trim(),
      title: title?.trim() || ''
    });
  }

  // Admin: Create product
  async createProduct(productData) {
    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate price
    if (productData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    return this.create(this.endpoints.BASE, productData);
  }

  // Admin: Update product
  async updateProduct(id, productData) {
    if (!id) {
      throw new Error('Product ID is required');
    }

    // Validate price if provided
    if (productData.price !== undefined && productData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    return this.update(`${this.endpoints.BASE}/${id}`, productData);
  }

  // Admin: Delete product
  async deleteProduct(id) {
    if (!id) {
      throw new Error('Product ID is required');
    }

    return this.delete(`${this.endpoints.BASE}/${id}`);
  }

  // Get top selling products
  async getTopSellingProducts(limit = 10, timeframe = null) {
    const params = { limit };
    if (timeframe) params.timeframe = timeframe;

    return this.read(this.endpoints.TOP_SELLERS, params);
  }

  // Get latest products
  async getLatestProducts(limit = 10) {
    return this.read(this.endpoints.LATEST, { limit });
  }

  // Get products on sale
  async getProductsOnSale(limit = 10) {
    return this.read(this.endpoints.ON_SALE, { limit });
  }

  // Get quick picks
  async getQuickPicks(limit = 8) {
    return this.read(this.endpoints.QUICK_PICKS, { limit });
  }

  // Get product categories
  async getCategories() {
    return this.read(this.endpoints.CATEGORIES);
  }

  // Get related products
  async getRelatedProducts(productId, limit = 4) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    return this.read(`${this.endpoints.BASE}/${productId}/related`, { limit });
  }

  // Bulk operations
  async bulkUpdateProducts(productIds, updateData) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Product IDs array is required');
    }

    return this.batchUpdate(this.endpoints.BASE, {
      productIds,
      updateData
    });
  }

  async bulkDeleteProducts(productIds) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Product IDs array is required');
    }

    return this.batchDelete(this.endpoints.BASE, productIds);
  }

  // Advanced search with filters
  async advancedSearch(searchParams) {
    const {
      query,
      filters = {},
      sort = 'relevance',
      page = 1,
      limit = 20
    } = searchParams;

    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    return this.search(this.endpoints.SEARCH, query, {
      ...filters,
      sort,
      page,
      limit
    });
  }

  // Get product variants (if applicable)
  async getProductVariants(productId) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    return this.read(`${this.endpoints.BASE}/${productId}/variants`);
  }

  // Check product availability
  async checkAvailability(productId, quantity = 1) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    return this.read(`${this.endpoints.BASE}/${productId}/availability`, {
      quantity
    });
  }

  // Get product price history (for analytics)
  async getPriceHistory(productId, period = '30d') {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    return this.read(`${this.endpoints.BASE}/${productId}/price-history`, {
      period
    });
  }

  // Homepage section management methods
  
  // Get products by section
  async getProductsBySection(section, limit = 10) {
    const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
    if (!validSections.includes(section)) {
      throw new Error('Invalid section name');
    }

    return this.read(`${this.endpoints.BASE}/section/${section}`, { limit });
  }

  // Add product to section
  async addProductToSection(productId, section) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
    if (!validSections.includes(section)) {
      throw new Error('Invalid section name');
    }

    return this.update(`${this.endpoints.BASE}/${productId}/sections`, {
      action: 'add',
      section
    });
  }

  // Remove product from section
  async removeProductFromSection(productId, section) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
    if (!validSections.includes(section)) {
      throw new Error('Invalid section name');
    }

    return this.update(`${this.endpoints.BASE}/${productId}/sections`, {
      action: 'remove',
      section
    });
  }

  // Update product sections (replace all sections)
  async updateProductSections(productId, sections) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
    const invalidSections = sections.filter(s => !validSections.includes(s));
    if (invalidSections.length > 0) {
      throw new Error(`Invalid section names: ${invalidSections.join(', ')}`);
    }

    return this.update(`${this.endpoints.BASE}/${productId}/sections`, {
      action: 'replace',
      sections
    });
  }

  // Get all homepage sections with their assigned products
  async getHomepageSections() {
    return this.read(`${this.endpoints.BASE}/homepage-sections`);
  }
}

export default new ProductService();