import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

// User Service
// TODO: Implement user API calls

class UserService {
  // Get user profile
  async getProfile() {
    // TODO: Implement get user profile
    const response = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
    return handleApiResponse(response);
  }

  // Update user profile
  async updateProfile(profileData) {
    // TODO: Implement update user profile
    const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE, profileData);
    return handleApiResponse(response);
  }

  // Address management
  async addAddress(addressData) {
    // TODO: Implement add address
    const response = await apiClient.post(API_ENDPOINTS.USERS.ADDRESSES, addressData);
    return handleApiResponse(response);
  }

  async updateAddress(id, addressData) {
    // TODO: Implement update address
    const response = await apiClient.put(`${API_ENDPOINTS.USERS.ADDRESSES}/${id}`, addressData);
    return handleApiResponse(response);
  }

  async deleteAddress(id) {
    // TODO: Implement delete address
    const response = await apiClient.delete(`${API_ENDPOINTS.USERS.ADDRESSES}/${id}`);
    return handleApiResponse(response);
  }

  // Payment method management
  async addPaymentMethod(paymentData) {
    // TODO: Implement add payment method
    const response = await apiClient.post(API_ENDPOINTS.USERS.PAYMENT_METHODS, paymentData);
    return handleApiResponse(response);
  }

  async updatePaymentMethod(id, paymentData) {
    // TODO: Implement update payment method
    const response = await apiClient.put(`${API_ENDPOINTS.USERS.PAYMENT_METHODS}/${id}`, paymentData);
    return handleApiResponse(response);
  }

  async deletePaymentMethod(id) {
    // TODO: Implement delete payment method
    const response = await apiClient.delete(`${API_ENDPOINTS.USERS.PAYMENT_METHODS}/${id}`);
    return handleApiResponse(response);
  }

  // Wishlist management
  async getWishlist() {
    // TODO: Implement get wishlist
    const response = await apiClient.get(API_ENDPOINTS.USERS.WISHLIST);
    return handleApiResponse(response);
  }

  async addToWishlist(productId) {
    // TODO: Implement add to wishlist
    const response = await apiClient.post(`${API_ENDPOINTS.USERS.WISHLIST}/${productId}`);
    return handleApiResponse(response);
  }

  async removeFromWishlist(productId) {
    // TODO: Implement remove from wishlist
    const response = await apiClient.delete(`${API_ENDPOINTS.USERS.WISHLIST}/${productId}`);
    return handleApiResponse(response);
  }

  // Cart management
  async getCart() {
    // TODO: Implement get cart
    const response = await apiClient.get(API_ENDPOINTS.USERS.CART);
    return handleApiResponse(response);
  }

  async addToCart(cartData) {
    // TODO: Implement add to cart
    const response = await apiClient.post(API_ENDPOINTS.USERS.CART, cartData);
    return handleApiResponse(response);
  }

  async updateCartItem(itemId, updateData) {
    // TODO: Implement update cart item
    const response = await apiClient.put(`${API_ENDPOINTS.USERS.CART}/${itemId}`, updateData);
    return handleApiResponse(response);
  }

  async removeFromCart(itemId) {
    // TODO: Implement remove from cart
    const response = await apiClient.delete(`${API_ENDPOINTS.USERS.CART}/${itemId}`);
    return handleApiResponse(response);
  }

  async clearCart() {
    // TODO: Implement clear cart
    const response = await apiClient.delete(API_ENDPOINTS.USERS.CART);
    return handleApiResponse(response);
  }
}

export default new UserService();