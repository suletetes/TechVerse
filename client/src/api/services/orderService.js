/**
 * Order Service extending BaseApiService
 * Implements requirements 2.1, 4.2, 4.3
 */

import BaseApiService from '../core/BaseApiService.js';
import { API_ENDPOINTS } from '../config.js';

class OrderService extends BaseApiService {
  constructor() {
    super({
      serviceName: 'OrderService',
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      endpoints: API_ENDPOINTS.ORDERS,
      cacheEnabled: true,
      retryEnabled: true,
      defaultOptions: {
        timeout: 20000 // Orders might take longer to process
      }
    });
    
    // Debug: Log available endpoints
    if (import.meta.env.DEV) {
      console.log('OrderService endpoints:', this.endpoints);
    }
  }

  // Create new order
  async createOrder(orderData) {
    // Validate order data
    this.validateOrderData(orderData);

    return this.create('/orders', orderData);
  }

  // Get user orders with pagination and filtering
  async getUserOrders(params = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sort = 'createdAt',
      order = 'desc',
      ...otherParams
    } = params;

    const queryParams = {
      sort,
      order,
      ...otherParams
    };

    // Add optional filters
    if (status) queryParams.status = status;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    return this.getPaginated('/orders/user', page, limit, {
      params: queryParams
    });
  }

  // Get order by ID
  async getOrderById(id) {
    if (!id) {
      throw new Error('Order ID is required');
    }

    return this.read(`/orders/${id}`);
  }

  // Get order by order number
  async getOrderByNumber(orderNumber) {
    if (!orderNumber) {
      throw new Error('Order number is required');
    }

    return this.read(`/orders/number/${orderNumber}`);
  }

  // Cancel order
  async cancelOrder(id, reason = '') {
    if (!id) {
      throw new Error('Order ID is required');
    }

    return this.update(`/orders/${id}/cancel`, {
      reason: reason.trim()
    });
  }

  // Get order tracking information
  async getOrderTracking(id) {
    if (!id) {
      throw new Error('Order ID is required');
    }

    return this.read(`/orders/${id}/tracking`, {}, {
      // Shorter cache for tracking info
      cacheTimeout: 30000
    });
  }

  // Process payment for order
  async processPayment(orderId, paymentData) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Validate payment data
    this.validatePaymentData(paymentData);

    return this.create(`/orders/${orderId}/payment`, paymentData);
  }

  // Get order summary/statistics
  async getOrderSummary(params = {}) {
    const {
      period = '30d', // 7d, 30d, 90d, 1y
      ...otherParams
    } = params;

    return this.read('/orders/summary', {
      period,
      ...otherParams
    });
  }

  // Reorder (create new order from existing order)
  async reorder(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    return this.create(`/orders/${orderId}/reorder`);
  }

  // Request order refund
  async requestRefund(orderId, refundData) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const { reason, items, amount } = refundData;

    if (!reason || reason.trim().length < 10) {
      throw new Error('Refund reason must be at least 10 characters');
    }

    return this.create(`/orders/${orderId}/refund`, {
      reason: reason.trim(),
      items,
      amount
    });
  }

  // Get order invoice
  async getOrderInvoice(orderId, format = 'pdf') {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    return this.read(`/orders/${orderId}/invoice`, {
      format
    }, {
      headers: {
        'Accept': format === 'pdf' ? 'application/pdf' : 'application/json'
      }
    });
  }

  // Admin: Update order status
  async updateOrderStatus(orderId, status, notes = '') {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!status) {
      throw new Error('Order status is required');
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    return this.update(`/orders/${orderId}/status`, {
      status,
      notes: notes.trim()
    });
  }

  // Get order history for a user
  async getOrderHistory(userId, params = {}) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const {
      page = 1,
      limit = 20,
      ...otherParams
    } = params;

    return this.getPaginated(`/orders/user/${userId}`, page, limit, {
      params: otherParams
    });
  }

  // Bulk operations for admin
  async bulkUpdateOrderStatus(orderIds, status, notes = '') {
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('Order IDs array is required');
    }

    if (!status) {
      throw new Error('Order status is required');
    }

    return this.batchUpdate('/orders', {
      orderIds,
      updateData: { status, notes: notes.trim() }
    });
  }

  // Export orders (admin)
  async exportOrders(params = {}) {
    return this.read('/orders/export', params, {
      headers: {
        'Accept': 'application/octet-stream'
      }
    });
  }

  // Get order analytics (admin)
  async getOrderAnalytics(params = {}) {
    const {
      period = '30d',
      groupBy = 'day',
      ...otherParams
    } = params;

    return this.read('/orders/analytics', {
      period,
      groupBy,
      ...otherParams
    });
  }

  // Validation Methods
  validateOrderData(orderData) {
    const { items, shippingAddress, paymentMethod } = orderData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Validate each item
    items.forEach((item, index) => {
      if (!item.product && !item.productId) {
        throw new Error(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (!item.price || item.price <= 0) {
        throw new Error(`Item ${index + 1}: Price must be greater than 0`);
      }
    });

    // Validate shipping address
    if (!shippingAddress) {
      throw new Error('Shipping address is required');
    }

    // Check for address field (can be 'address' or 'street')
    if (!shippingAddress.address && !shippingAddress.street) {
      throw new Error('Shipping address is required');
    }
    if (!shippingAddress.city || !shippingAddress.city.trim()) {
      throw new Error('Shipping address city is required');
    }
    // Check for postal code (can be 'postcode' or 'postalCode')
    if (!shippingAddress.postcode && !shippingAddress.postalCode) {
      throw new Error('Shipping address postal code is required');
    }
    if (!shippingAddress.country || !shippingAddress.country.trim()) {
      throw new Error('Shipping address country is required');
    }

    // Validate payment method
    if (!paymentMethod) {
      throw new Error('Payment method is required');
    }
  }

  validatePaymentData(paymentData) {
    const { method, amount } = paymentData;

    if (!method) {
      throw new Error('Payment method is required');
    }

    if (!amount || amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // Additional validation based on payment method
    if (method === 'card' && paymentData.cardToken) {
      if (!paymentData.cardToken.trim()) {
        throw new Error('Card token is required for card payments');
      }
    }

    if (method === 'paypal' && paymentData.paypalOrderId) {
      if (!paymentData.paypalOrderId.trim()) {
        throw new Error('PayPal order ID is required for PayPal payments');
      }
    }
  }

  // Utility Methods
  formatOrderStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded'
    };
    return statusMap[status] || status;
  }

  calculateOrderTotal(items, shipping = 0, tax = 0, discount = 0) {
    const subtotal = items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    return {
      subtotal,
      shipping,
      tax,
      discount,
      total: subtotal + shipping + tax - discount
    };
  }

  // Get order status timeline
  async getOrderStatusTimeline(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    return this.read(`/orders/${orderId}/timeline`);
  }

  // Estimate delivery date
  async estimateDelivery(orderData) {
    return this.create('/orders/estimate-delivery', orderData);
  }

  // Calculate shipping cost
  async calculateShipping(shippingData) {
    return this.create('/orders/calculate-shipping', shippingData);
  }
}

export default new OrderService();