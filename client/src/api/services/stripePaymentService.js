import apiClient from '../apiClient';

class StripePaymentService {
  /**
   * Create payment intent
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Payment intent response
   */
  async createPaymentIntent(data) {
    try {
      const response = await apiClient.post('/payments/create-intent', data);
      return response.data;
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  /**
   * Get payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const response = await apiClient.get(`/payments/intent/${paymentIntentId}`);
      return response.data;
    } catch (error) {
      console.error('Get payment intent error:', error);
      throw error;
    }
  }

  /**
   * Get customer's saved payment methods from Stripe
   * @returns {Promise<Object>} Payment methods
   */
  async getPaymentMethods() {
    try {
      const response = await apiClient.get('/payments/methods');
      return response.data;
    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error;
    }
  }

  /**
   * Remove saved payment method from Stripe
   * @param {string} paymentMethodId - Stripe payment method ID
   * @returns {Promise<Object>} Response
   */
  async removePaymentMethod(paymentMethodId) {
    try {
      const response = await apiClient.delete(`/payments/methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      console.error('Remove payment method error:', error);
      throw error;
    }
  }

  /**
   * Create refund (admin only)
   * @param {Object} data - Refund data
   * @returns {Promise<Object>} Refund response
   */
  async createRefund(data) {
    try {
      const response = await apiClient.post('/payments/refund', data);
      return response.data;
    } catch (error) {
      console.error('Create refund error:', error);
      throw error;
    }
  }

  /**
   * Process order after successful payment
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Order response
   */
  async processOrder(orderData) {
    try {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Process order error:', error);
      throw error;
    }
  }
}

const stripePaymentService = new StripePaymentService();
export default stripePaymentService;
