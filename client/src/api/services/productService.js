import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

// Product Service
// TODO: Implement product API calls

class ProductService {
  // Get all products with filters
  async getProducts(params = {}) {
    // TODO: Implement get products with filtering, sorting, pagination
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE, { params });
    return handleApiResponse(response);
  }

  // Get single product by ID
  async getProductById(id) {
    // TODO: Implement get product by ID
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`);
    return handleApiResponse(response);
  }

  // Search products
  async searchProducts(query, filters = {}) {
    // TODO: Implement product search
    const params = { q: query, ...filters };
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.SEARCH, { params });
    return handleApiResponse(response);
  }

  // Get featured products
  async getFeaturedProducts() {
    // TODO: Implement get featured products
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.FEATURED);
    return handleApiResponse(response);
  }

  // Get products by category
  async getProductsByCategory(categoryId, params = {}) {
    // TODO: Implement get products by category
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.BASE}/category/${categoryId}`, { params });
    return handleApiResponse(response);
  }

  // Get product reviews
  async getProductReviews(productId, params = {}) {
    // TODO: Implement get product reviews
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.REVIEWS(productId), { params });
    return handleApiResponse(response);
  }

  // Add product review
  async addProductReview(productId, reviewData) {
    // TODO: Implement add product review
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.REVIEWS(productId), reviewData);
    return handleApiResponse(response);
  }

  // Admin: Create product
  async createProduct(productData) {
    // TODO: Implement create product (admin only)
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.BASE, productData);
    return handleApiResponse(response);
  }

  // Admin: Update product
  async updateProduct(id, productData) {
    // TODO: Implement update product (admin only)
    const response = await apiClient.put(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`, productData);
    return handleApiResponse(response);
  }

  // Admin: Delete product
  async deleteProduct(id) {
    // TODO: Implement delete product (admin only)
    const response = await apiClient.delete(`${API_ENDPOINTS.PRODUCTS.BASE}/${id}`);
    return handleApiResponse(response);
  }
}

export default new ProductService();