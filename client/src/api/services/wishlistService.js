import BaseApiService from '../core/BaseApiService.js';

class WishlistService extends BaseApiService {
    constructor() {
        super({
            serviceName: 'WishlistService',
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
            endpoints: {
                wishlist: '/wishlist'
            },
            cacheEnabled: false, // Wishlist data should always be fresh
            retryEnabled: true,
            defaultOptions: {
                timeout: 10000
            }
        });
    }

    async getWishlist() {
        return this.read('/wishlist');
    }

    async addToWishlist(productId, notes = '') {
        return this.create(`/wishlist/add/${productId}`, { notes });
    }

    async removeFromWishlist(productId) {
        return this.delete(`/wishlist/remove/${productId}`);
    }

    async fetchWishlistCount() {
        try {
            const response = await this.read('/wishlist/summary');
            return {
                success: true,
                count: response.data?.totalItems || 0
            };
        } catch (error) {
            console.error('Error getting wishlist count:', error);
            return {
                success: false,
                count: 0,
                error: error.response?.data?.message || 'Failed to get wishlist count'
            };
        }
    }

    // Utility functions for local state (no API calls)
    getWishlistCount(items = []) {
        return Array.isArray(items) ? items.length : 0;
    }

    isInWishlist(productId, items = []) {
        if (!productId || !Array.isArray(items)) return false;
        return items.some(item => 
            item.product?._id === productId || 
            item.product === productId || 
            item._id === productId
        );
    }

    async syncWishlist(productIds = []) {
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return { success: true, message: 'No items to sync' };
        }
        
        try {
            return this.create('/wishlist/sync', { productIds });
        } catch (error) {
            console.error('Error syncing wishlist:', error);
            throw error;
        }
    }

    async checkWishlistStatus(productId) {
        return this.read(`/wishlist/check/${productId}`);
    }

    async moveToCart(productId, quantity = 1, options = {}) {
        return this.create(`/wishlist/move-to-cart/${productId}`, { quantity, options });
    }

    async clearWishlist() {
        return this.delete('/wishlist/clear');
    }
}

export const wishlistService = new WishlistService();
export default wishlistService;