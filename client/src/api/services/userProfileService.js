import BaseApiService from '../core/BaseApiService.js';
import { dataDebugger } from '../../utils/dataDebugger.js';

class UserProfileService extends BaseApiService {
    constructor() {
        super({
            serviceName: 'UserProfileService',
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
            endpoints: {
                profile: '/users/profile',
                addresses: '/users/addresses',
                paymentMethods: '/users/payment-methods'
            },
            cacheEnabled: false, // Disable cache for profile data to ensure fresh updates
            retryEnabled: true,
            defaultOptions: {
                timeout: 15000 // Increase timeout
            }
        });
    }

    // Profile methods
    async getProfile() {
        try {
            dataDebugger.log('USER_PROFILE', 'GET_PROFILE_START', {});
            const result = await this.read(`/users/profile?_t=${Date.now()}`);
            dataDebugger.log('USER_PROFILE', 'GET_PROFILE_SUCCESS', result);
            return result;
        } catch (error) {
            dataDebugger.log('USER_PROFILE', 'GET_PROFILE_ERROR', { error: error.message }, error);
            throw error;
        }
    }

    async updateProfile(profileData) {
        try {
            dataDebugger.log('USER_PROFILE', 'UPDATE_PROFILE_START', profileData);
            
            // Validate required fields
            if (!profileData || typeof profileData !== 'object') {
                throw new Error('Profile data is required and must be an object');
            }

            // Clean the data - remove empty strings and undefined values
            const cleanData = {};
            Object.keys(profileData).forEach(key => {
                const value = profileData[key];
                if (value !== undefined && value !== null && value !== '') {
                    cleanData[key] = value;
                }
            });

            if (Object.keys(cleanData).length === 0) {
                throw new Error('No valid data to update');
            }

            dataDebugger.log('USER_PROFILE', 'UPDATE_PROFILE_CLEAN_DATA', cleanData);
            
            const result = await this.update('/users/profile', cleanData);
            dataDebugger.log('USER_PROFILE', 'UPDATE_PROFILE_SUCCESS', result);
            return result;
        } catch (error) {
            dataDebugger.log('USER_PROFILE', 'UPDATE_PROFILE_ERROR', { profileData, error: error.message }, error);
            throw error;
        }
    }

    // Address methods
    async getAddresses() {
        return this.read(`/users/addresses?_t=${Date.now()}`);
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

    async setDefaultAddress(addressId) {
        return this.request(`/users/addresses/${addressId}/default`, 'PATCH');
    }

    // Payment method methods
    async getPaymentMethods() {
        return this.read(`/users/payment-methods?_t=${Date.now()}`);
    }

    async addPaymentMethod(paymentMethodData) {
        return this.create('/users/payment-methods', paymentMethodData);
    }

    async deletePaymentMethod(methodId) {
        return this.delete(`/users/payment-methods/${methodId}`);
    }
}

export const userProfileService = new UserProfileService();