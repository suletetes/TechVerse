import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

class UserService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes for user data
  }

  // Profile Management
  async getProfile() {
    const cacheKey = 'user_profile';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(error.message || 'Failed to fetch user profile');
    }
  }

  async updateProfile(profileData) {
    try {
      // Validate required fields
      if (profileData.email && !this.isValidEmail(profileData.email)) {
        throw new Error('Invalid email format');
      }

      if (profileData.phone && !this.isValidPhone(profileData.phone)) {
        throw new Error('Invalid phone number format');
      }

      const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE, profileData);
      const data = await handleApiResponse(response);
      
      // Update cache
      this.cache.set('user_profile', {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(error.message || 'Failed to update user profile');
    }
  }

  // Address Management
  async getAddresses() {
    const cacheKey = 'user_addresses';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.ADDRESSES);
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw new Error(error.message || 'Failed to fetch addresses');
    }
  }

  async addAddress(addressData) {
    try {
      // Validate address data
      this.validateAddressData(addressData);

      const response = await apiClient.post(API_ENDPOINTS.USERS.ADDRESSES, addressData);
      const data = await handleApiResponse(response);
      
      // Clear addresses cache
      this.cache.delete('user_addresses');
      
      return data;
    } catch (error) {
      console.error('Error adding address:', error);
      throw new Error(error.message || 'Failed to add address');
    }
  }

  async updateAddress(id, addressData) {
    if (!id) {
      throw new Error('Address ID is required');
    }

    try {
      // Validate address data
      this.validateAddressData(addressData);

      const response = await apiClient.put(`${API_ENDPOINTS.USERS.ADDRESSES}/${id}`, addressData);
      const data = await handleApiResponse(response);
      
      // Clear addresses cache
      this.cache.delete('user_addresses');
      
      return data;
    } catch (error) {
      console.error(`Error updating address ${id}:`, error);
      throw new Error(error.message || 'Failed to update address');
    }
  }

  async deleteAddress(id) {
    if (!id) {
      throw new Error('Address ID is required');
    }

    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.USERS.ADDRESSES}/${id}`);
      const data = await handleApiResponse(response);
      
      // Clear addresses cache
      this.cache.delete('user_addresses');
      
      return data;
    } catch (error) {
      console.error(`Error deleting address ${id}:`, error);
      throw new Error(error.message || 'Failed to delete address');
    }
  }

  // Payment Method Management
  async getPaymentMethods() {
    const cacheKey = 'user_payment_methods';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.PAYMENT_METHODS);
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw new Error(error.message || 'Failed to fetch payment methods');
    }
  }

  async addPaymentMethod(paymentData) {
    try {
      // Validate payment method data
      this.validatePaymentMethodData(paymentData);

      const response = await apiClient.post(API_ENDPOINTS.USERS.PAYMENT_METHODS, paymentData);
      const data = await handleApiResponse(response);
      
      // Clear payment methods cache
      this.cache.delete('user_payment_methods');
      
      return data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw new Error(error.message || 'Failed to add payment method');
    }
  }

  async updatePaymentMethod(id, paymentData) {
    if (!id) {
      throw new Error('Payment method ID is required');
    }

    try {
      // Validate payment method data
      this.validatePaymentMethodData(paymentData);

      const response = await apiClient.put(`${API_ENDPOINTS.USERS.PAYMENT_METHODS}/${id}`, paymentData);
      const data = await handleApiResponse(response);
      
      // Clear payment methods cache
      this.cache.delete('user_payment_methods');
      
      return data;
    } catch (error) {
      console.error(`Error updating payment method ${id}:`, error);
      throw new Error(error.message || 'Failed to update payment method');
    }
  }

  async deletePaymentMethod(id) {
    if (!id) {
      throw new Error('Payment method ID is required');
    }

    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.USERS.PAYMENT_METHODS}/${id}`);
      const data = await handleApiResponse(response);
      
      // Clear payment methods cache
      this.cache.delete('user_payment_methods');
      
      return data;
    } catch (error) {
      console.error(`Error deleting payment method ${id}:`, error);
      throw new Error(error.message || 'Failed to delete payment method');
    }
  }

  // Wishlist Management
  async getWishlist(params = {}) {
    try {
      const { page = 1, limit = 20 } = params;
      
      const response = await apiClient.get('/users/wishlist', {
        params: { page, limit }
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw new Error(error.message || 'Failed to fetch wishlist');
    }
  }

  async addToWishlist(productId) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      const response = await apiClient.post(`/users/wishlist/${productId}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error adding product ${productId} to wishlist:`, error);
      throw new Error(error.message || 'Failed to add to wishlist');
    }
  }

  async removeFromWishlist(productId) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      const response = await apiClient.delete(`/users/wishlist/${productId}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error removing product ${productId} from wishlist:`, error);
      throw new Error(error.message || 'Failed to remove from wishlist');
    }
  }

  async isInWishlist(productId) {
    if (!productId) {
      return false;
    }

    try {
      const wishlist = await this.getWishlist();
      return wishlist.items?.some(item => item.product._id === productId) || false;
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      return false;
    }
  }

  // Cart Management
  async getCart() {
    const cacheKey = 'user_cart';
    
    // Check cache first (shorter cache for cart)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // 30 seconds cache
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get('/users/cart');
      
      // Safety check for response
      if (!response) {
        throw new Error('No response received from cart endpoint');
      }
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Cart response structure:', {
          hasHeaders: !!response.headers,
          hasData: response.data !== undefined,
          status: response.status,
          type: typeof response,
          keys: Object.keys(response || {})
        });
      }
      
      // Check if response is already processed data (not a fetch Response)
      let data;
      if (response && typeof response === 'object' && response.data !== undefined && !response.headers) {
        // Response is already processed data from ApiClient
        data = response;
      } else {
        // Response is a fetch Response object, needs processing
        data = await handleApiResponse(response);
      }
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      
      // For development, provide more detailed error information
      if (process.env.NODE_ENV === 'development') {
        console.error('Cart error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response
        });
      }
      
      // Return empty cart data instead of throwing to prevent app crashes
      return {
        success: true,
        data: {
          items: [],
          total: 0,
          itemCount: 0
        }
      };
    }
  }

  async addToCart(cartData) {
    try {
      const { productId, quantity = 1, options = {} } = cartData;

      if (!productId) {
        throw new Error('Product ID is required');
      }

      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const response = await apiClient.post('/users/cart', {
        productId,
        quantity: parseInt(quantity),
        options
      });
      
      const data = await handleApiResponse(response);
      
      // Clear cart cache
      this.cache.delete('user_cart');
      
      return data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw new Error(error.message || 'Failed to add to cart');
    }
  }

  async updateCartItem(itemId, updateData) {
    if (!itemId) {
      throw new Error('Cart item ID is required');
    }

    try {
      const { quantity } = updateData;

      if (quantity !== undefined && quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const response = await apiClient.put(`/users/cart/${itemId}`, {
        ...updateData,
        ...(quantity && { quantity: parseInt(quantity) })
      });
      
      const data = await handleApiResponse(response);
      
      // Clear cart cache
      this.cache.delete('user_cart');
      
      return data;
    } catch (error) {
      console.error(`Error updating cart item ${itemId}:`, error);
      throw new Error(error.message || 'Failed to update cart item');
    }
  }

  async removeFromCart(itemId) {
    if (!itemId) {
      throw new Error('Cart item ID is required');
    }

    try {
      const response = await apiClient.delete(`/users/cart/${itemId}`);
      const data = await handleApiResponse(response);
      
      // Clear cart cache
      this.cache.delete('user_cart');
      
      return data;
    } catch (error) {
      console.error(`Error removing cart item ${itemId}:`, error);
      throw new Error(error.message || 'Failed to remove from cart');
    }
  }

  async clearCart() {
    try {
      const response = await apiClient.delete('/users/cart');
      const data = await handleApiResponse(response);
      
      // Clear cart cache
      this.cache.delete('user_cart');
      
      return data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error(error.message || 'Failed to clear cart');
    }
  }

  // Validation Methods
  validateAddressData(addressData) {
    const requiredFields = ['street', 'city', 'postalCode', 'country'];
    
    for (const field of requiredFields) {
      if (!addressData[field] || !addressData[field].trim()) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate postal code format (basic validation)
    if (addressData.postalCode && !/^[A-Z0-9\s-]{3,10}$/i.test(addressData.postalCode)) {
      throw new Error('Invalid postal code format');
    }
  }

  validatePaymentMethodData(paymentData) {
    const { type, cardNumber, expiryMonth, expiryYear, cvv } = paymentData;

    if (!type || !['card', 'paypal', 'bank'].includes(type)) {
      throw new Error('Invalid payment method type');
    }

    if (type === 'card') {
      if (!cardNumber || !/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
        throw new Error('Invalid card number');
      }

      if (!expiryMonth || expiryMonth < 1 || expiryMonth > 12) {
        throw new Error('Invalid expiry month');
      }

      const currentYear = new Date().getFullYear();
      if (!expiryYear || expiryYear < currentYear || expiryYear > currentYear + 20) {
        throw new Error('Invalid expiry year');
      }

      if (!cvv || !/^\d{3,4}$/.test(cvv)) {
        throw new Error('Invalid CVV');
      }
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Utility Methods
  clearCache() {
    this.cache.clear();
  }

  clearUserDataCache() {
    const userDataKeys = ['user_profile', 'user_addresses', 'user_payment_methods', 'user_cart'];
    userDataKeys.forEach(key => this.cache.delete(key));
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new UserService();