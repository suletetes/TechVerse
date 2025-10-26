import BaseApiService from '../core/BaseApiService.js';

class WishlistService extends BaseApiService {
    constructor() {
        super({
            serviceName: 'WishlistService',
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
            endpoints: {
                wishlist: '/users/wishlist'
            },
            cacheEnabled: false, // Wishlist data should always be fresh
            retryEnabled: true,
            defaultOptions: {
                timeout: 10000
            }
        });
    }

    async getWishlist() {
        return this.read('/users/wishlist');
    }

    async addToWishlist(productId, notes = '') {
        return this.create(`/users/wishlist/${productId}`, { notes });
    }

    async removeFromWishlist(productId) {
        return this.delete(`/users/wishlist/${productId}`);
    }
}

export const wishlistService = new WishlistService();
export default wishlistService;