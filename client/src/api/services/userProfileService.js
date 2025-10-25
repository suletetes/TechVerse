import BaseApiService from '../core/BaseApiService.js';

class UserProfileService extends BaseApiService {
    constructor() {
        super({
            serviceName: 'UserProfileService',
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
            endpoints: {
                addresses: '/profile/addresses',
                paymentMethods: '/profile/payment-methods'
            },
            cacheEnabled: true,
            retryEnabled: true,
            defaultOptions: {
                timeout: 10000
            }
        });
    }

    // Address methods
    async getAddresses() {
        return this.read('/users/addresses');
    }

    async addAddress(addressData) {
        return this.create('/users/addresses', addressData);
    }

    async updateAddress(addressId, addressData) {
        return this.update(`/users/addresses/${addressId}`, addressData);
    }

    async deleteAddress(addressId) {
        return this.delete(`/users/addresses/${addressId}`);
    }

    // Payment method methods
    async getPaymentMethods() {
        return this.read('/profile/payment-methods');
    }

    async addPaymentMethod(paymentMethodData) {
        return this.create('/profile/payment-methods', paymentMethodData);
    }

    async deletePaymentMethod(methodId) {
        return this.delete(`/profile/payment-methods/${methodId}`);
    }
}

export const userProfileService = new UserProfileService();