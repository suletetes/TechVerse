import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

class ProductService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get all products with filters, sorting, and pagination
  async getProducts(params = {}) {
    try {
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

      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, {
        params: queryParams
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message || 'Failed to fetch products');
    }
  }

  // Get single product by ID with caching
  async getProductById(id) {
    if (!id) {
      throw new Error('Product ID is required');
    }

    const cacheKey = `product_${id}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`);
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw new Error(error.message || 'Failed to fetch product');
    }
  }

  // Search products with debouncing support
  async searchProducts(query, filters = {}) {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    try {
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

      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.SEARCH, { params });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error(error.message || 'Failed to search products');
    }
  }

  // Get featured products with caching
  async getFeaturedProducts(limit = 10) {
    const cacheKey = `featured_products_${limit}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.FEATURED, {
        params: { limit }
      });
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw new Error(error.message || 'Failed to fetch featured products');
    }
  }

  // Get products by category
  async getProductsByCategory(categoryId, params = {}) {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    try {
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

      const response = await apiClient.get(
        `${API_ENDPOINTS.PRODUCTS.BASE}/category/${categoryId}`,
        { params: queryParams }
      );
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      throw new Error(error.message || 'Failed to fetch category products');
    }
  }

  // Get product reviews with pagination
  async getProductReviews(productId, params = {}) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
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

      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.REVIEWS(productId), {
        params: queryParams
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      throw new Error(error.message || 'Failed to fetch product reviews');
    }
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

    try {
      const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.REVIEWS(productId), {
        rating: parseInt(rating),
        comment: comment.trim(),
        title: title?.trim() || ''
      });

      // Clear product cache to refresh data
      this.clearProductCache(productId);

      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error adding review for product ${productId}:`, error);
      throw new Error(error.message || 'Failed to add product review');
    }
  }

  // Admin: Create product
  async createProduct(productData) {
    try {
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

      const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.BASE, productData);

      // Clear relevant caches
      this.clearCache();

      return handleApiResponse(response);
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error(error.message || 'Failed to create product');
    }
  }

  // Admin: Update product
  async updateProduct(id, productData) {
    if (!id) {
      throw new Error('Product ID is required');
    }

    try {
      // Validate price if provided
      if (productData.price !== undefined && productData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }

      const response = await apiClient.put(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`, productData);

      // Clear product cache
      this.clearProductCache(id);

      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw new Error(error.message || 'Failed to update product');
    }
  }

  // Admin: Delete product
  async deleteProduct(id) {
    if (!id) {
      throw new Error('Product ID is required');
    }

    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`);

      // Clear product cache
      this.clearProductCache(id);

      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw new Error(error.message || 'Failed to delete product');
    }
  }

  // Get top selling products
  async getTopSellingProducts(limit = 10, timeframe = null) {
    const cacheKey = `top_selling_${limit}_${timeframe || 'all'}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const params = { limit };
      if (timeframe) params.timeframe = timeframe;

      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.TOP_SELLERS, { params });
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      throw new Error(error.message || 'Failed to fetch top selling products');
    }
  }

  // Get latest products
  async getLatestProducts(limit = 10) {
    const cacheKey = `latest_products_${limit}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.LATEST, {
        params: { limit }
      });
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching latest products:', error);
      throw new Error(error.message || 'Failed to fetch latest products');
    }
  }

  // Get products on sale
  async getProductsOnSale(limit = 10) {
    const cacheKey = `products_on_sale_${limit}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.ON_SALE, {
        params: { limit }
      });
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching products on sale:', error);
      throw new Error(error.message || 'Failed to fetch products on sale');
    }
  }

  // Get quick picks
  async getQuickPicks(limit = 8) {
    const cacheKey = `quick_picks_${limit}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.QUICK_PICKS, {
        params: { limit }
      });
      const data = await handleApiResponse(response);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching quick picks:', error);
      throw new Error(error.message || 'Failed to fetch quick picks');
    }
  }

  // Get product categories
  async getCategories() {
    const cacheKey = 'product_categories';

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.CATEGORIES);
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

  // Get related products
  async getRelatedProducts(productId, limit = 4) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.BASE}/${productId}/related`, {
        params: { limit }
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching related products for ${productId}:`, error);
      throw new Error(error.message || 'Failed to fetch related products');
    }
  }

  // Utility methods
  clearProductCache(productId) {
    if (productId) {
      this.cache.delete(`product_${productId}`);
    }
    // Clear other related caches
    this.cache.delete('featured_products');
    for (const key of this.cache.keys()) {
      if (key.startsWith('featured_products_')) {
        this.cache.delete(key);
      }
    }
  }

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

export default new ProductService();