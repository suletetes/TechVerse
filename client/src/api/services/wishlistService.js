import apiClient from '../config.js';

class WishlistService {
  async getWishlist(page = 1, limit = 20) {
    try {
      const response = await apiClient.get('/users/wishlist', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  }

  async addToWishlist(productId) {
    try {
      const response = await apiClient.post(`/users/wishlist/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  async removeFromWishlist(productId) {
    try {
      const response = await apiClient.delete(`/users/wishlist/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  async isInWishlist(productId) {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.data?.items?.some(item => 
        item.product._id === productId || item.product === productId
      ) || false;
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      return false;
    }
  }

  async toggleWishlist(productId) {
    try {
      const isInWishlist = await this.isInWishlist(productId);
      if (isInWishlist) {
        return await this.removeFromWishlist(productId);
      } else {
        return await this.addToWishlist(productId);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      throw error;
    }
  }

  async getWishlistWithDetails(page = 1, limit = 20) {
    try {
      const response = await apiClient.get('/users/wishlist', {
        params: { page, limit }
      });
      return response.data?.data?.items || [];
    } catch (error) {
      console.error('Error fetching wishlist with details:', error);
      throw error;
    }
  }

  // Check if product is in wishlist (local check)
  isInWishlist(productId, wishlistItems = []) {
    if (!productId || !Array.isArray(wishlistItems)) return false;
    return wishlistItems.some(item => 
      (item.product?._id === productId) || 
      (item.product === productId) ||
      (item._id === productId)
    );
  }

  // Get wishlist count (local check)
  getWishlistCount(wishlistItems = []) {
    return Array.isArray(wishlistItems) ? wishlistItems.length : 0;
  }

  async syncWishlist(productIds = []) {
    try {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return { success: true, message: 'No items to sync' };
      }

      const response = await apiClient.post('/users/wishlist/sync', {
        productIds
      });
      return response.data;
    } catch (error) {
      console.error('Error syncing wishlist:', error);
      throw error;
    }
  }
}

const wishlistService = new WishlistService();
export default wishlistService;