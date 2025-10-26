import BaseApiService from '../core/BaseApiService.js';

class CartService extends BaseApiService {
    constructor() {
        super({
            serviceName: 'CartService',
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
            endpoints: {
                cart: '/users/cart'
            },
            cacheEnabled: false, // Cart data should always be fresh
            retryEnabled: true,
            defaultOptions: {
                timeout: 10000
            }
        });
    }

    async getCart() {
        return this.read('/users/cart');
    }

    async addToCart(productId, quantity = 1) {
        return this.create('/users/cart', { productId, quantity });
    }

    async updateCartItem(itemId, quantity) {
        return this.update(`/users/cart/${itemId}`, { quantity });
    }

    async removeFromCart(itemId) {
        return this.delete(`/users/cart/${itemId}`);
    }

    async clearCart() {
        return this.delete('/users/cart');
    }
}

export const cartService = new CartService();
export default cartService;