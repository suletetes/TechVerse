import api from '../../lib/apiClient';

class StripeService {
  /**
   * Create payment intent
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Payment intent response with clientSecret
   */
  async createPaymentIntent(data) {
    try {
      const response = await api.post('/payments/create-intent', data);
      return response;
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  /**
   * Get payment intent status
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent details
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const response = await api.get(`/payments/intent/${paymentIntentId}`);
      return response;
    } catch (error) {
      console.error('Get payment intent error:', error);
      throw error;
    }
  }
}

const stripeService = new StripeService();
export default stripeService;
