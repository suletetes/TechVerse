import apiClient from '../config.js';

class CartService {
  async getCart() {
    try {
      const response = await apiClient.get('/users/cart');
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  async addToCart(productId, quantity = 1, options = {}) {
    try {
      const response = await apiClient.post('/users/cart', {
        productId,
        quantity,
        options
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async updateCartItem(itemId, quantity) {
    try {
      const response = await apiClient.put(`/users/cart/${itemId}`, {
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  async removeFromCart(itemId) {
    try {
      const response = await apiClient.delete(`/users/cart/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  async clearCart() {
    try {
      const response = await apiClient.delete('/users/cart');
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
}

const cartService = new CartService();
export default cartService;