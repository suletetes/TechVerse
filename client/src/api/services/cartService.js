import BaseApiService from '../core/BaseApiService.js';

class CartService extends BaseApiService {
    constructor() {
        super({
            serviceName: 'CartService',
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
            endpoints: {
                cart: '/cart'
            },
            cacheEnabled: false, // Cart data should always be fresh
            retryEnabled: true,
            defaultOptions: {
                timeout: 10000
            }
        });
    }

    async getCart() {
        return this.read('/cart');
    }

    async addToCart(productId, quantity = 1, options = {}) {
        return this.create('/cart/add', { productId, quantity, options });
    }

    async updateCartItem(itemId, quantity) {
        return this.update(`/cart/update/${itemId}`, { quantity });
    }

    async removeFromCart(itemId) {
        return this.delete(`/cart/remove/${itemId}`);
    }

    async clearCart() {
        return this.delete('/cart/clear');
    }

    async validateCart() {
        return this.create('/cart/validate', {});
    }
}

export const cartService = new CartService();
export default cartService;