import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

// Order Service
// TODO: Implement order API calls

class OrderService {
  // Create new order
  async createOrder(orderData) {
    // TODO: Implement create order
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.BASE, orderData);
    return handleApiResponse(response);
  }

  // Get user orders
  async getUserOrders(params = {}) {
    // TODO: Implement get user orders
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.USER_ORDERS, { params });
    return handleApiResponse(response);
  }

  // Get order by ID
  async getOrderById(id) {
    // TODO: Implement get order by ID
    const response = await apiClient.get(`${API_ENDPOINTS.ORDERS.BASE}/${id}`);
    return handleApiResponse(response);
  }

  // Cancel order
  async cancelOrder(id, reason = '') {
    // TODO: Implement cancel order
    const response = await apiClient.put(`${API_ENDPOINTS.ORDERS.BASE}/${id}/cancel`, { reason });
    return handleApiResponse(response);
  }

  // Get order tracking
  async getOrderTracking(id) {
    // TODO: Implement get order tracking
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.TRACKING(id));
    return handleApiResponse(response);
  }

  // Process payment
  async processPayment(orderId, paymentData) {
    // TODO: Implement payment processing
    const response = await apiClient.post(`${API_ENDPOINTS.ORDERS.BASE}/${orderId}/payment`, paymentData);
    return handleApiResponse(response);
  }
}

export default new OrderService();