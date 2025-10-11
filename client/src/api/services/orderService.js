import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

class OrderService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 1 * 60 * 1000; // 1 minute for order data
  }

  // Create new order
  async createOrder(orderData) {
    try {
      // Validate order data
      this.validateOrderData(orderData);

      const response = await apiClient.post(API_ENDPOINTS.ORDERS.BASE, orderData);
      const data = await handleApiResponse(response);
      
      // Clear user orders cache
      this.clearUserOrdersCache();
      
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(error.message || 'Failed to create order');
    }
  }

  // Get user orders with pagination and filtering
  async getUserOrders(params = {}) {
    try {
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
        page,
        limit,
        sort,
        order,
        ...otherParams
      };

      // Add optional filters
      if (status) queryParams.status = status;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const cacheKey = `user_orders_${JSON.stringify(queryParams)}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }

      const response = await apiClient.get(API_ENDPOINTS.ORDERS.USER_ORDERS, { 
        params: queryParams 
      });
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw new Error(error.message || 'Failed to fetch orders');
    }
  }

  // Get order by ID with caching
  async getOrderById(id) {
    if (!id) {
      throw new Error('Order ID is required');
    }

    const cacheKey = `order_${id}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(`${API_ENDPOINTS.ORDERS.BASE}/${id}`);
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw new Error(error.message || 'Failed to fetch order');
    }
  }

  // Cancel order
  async cancelOrder(id, reason = '') {
    if (!id) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await apiClient.put(`${API_ENDPOINTS.ORDERS.BASE}/${id}/cancel`, { 
        reason: reason.trim() 
      });
      const data = await handleApiResponse(response);
      
      // Clear order cache
      this.clearOrderCache(id);
      
      return data;
    } catch (error) {
      console.error(`Error cancelling order ${id}:`, error);
      throw new Error(error.message || 'Failed to cancel order');
    }
  }

  // Get order tracking information
  async getOrderTracking(id) {
    if (!id) {
      throw new Error('Order ID is required');
    }

    const cacheKey = `order_tracking_${id}`;
    
    // Check cache first (shorter cache for tracking)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // 30 seconds cache
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDERS.TRACKING(id));
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching tracking for order ${id}:`, error);
      throw new Error(error.message || 'Failed to fetch order tracking');
    }
  }

  // Process payment for order
  async processPayment(orderId, paymentData) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      // Validate payment data
      this.validatePaymentData(paymentData);

      const response = await apiClient.post(
        `${API_ENDPOINTS.ORDERS.BASE}/${orderId}/payment`, 
        paymentData
      );
      const data = await handleApiResponse(response);
      
      // Clear order cache
      this.clearOrderCache(orderId);
      
      return data;
    } catch (error) {
      console.error(`Error processing payment for order ${orderId}:`, error);
      throw new Error(error.message || 'Failed to process payment');
    }
  }

  // Get order summary/statistics
  async getOrderSummary(params = {}) {
    try {
      const {
        period = '30d', // 7d, 30d, 90d, 1y
        ...otherParams
      } = params;

      const cacheKey = `order_summary_${period}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }

      const response = await apiClient.get(`${API_ENDPOINTS.ORDERS.BASE}/summary`, {
        params: { period, ...otherParams }
      });
      const data = await handleApiResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching order summary:', error);
      throw new Error(error.message || 'Failed to fetch order summary');
    }
  }

  // Reorder (create new order from existing order)
  async reorder(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await apiClient.post(`${API_ENDPOINTS.ORDERS.BASE}/${orderId}/reorder`);
      const data = await handleApiResponse(response);
      
      // Clear user orders cache
      this.clearUserOrdersCache();
      
      return data;
    } catch (error) {
      console.error(`Error reordering from order ${orderId}:`, error);
      throw new Error(error.message || 'Failed to reorder');
    }
  }

  // Request order refund
  async requestRefund(orderId, refundData) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const { reason, items, amount } = refundData;

      if (!reason || reason.trim().length < 10) {
        throw new Error('Refund reason must be at least 10 characters');
      }

      const response = await apiClient.post(`${API_ENDPOINTS.ORDERS.BASE}/${orderId}/refund`, {
        reason: reason.trim(),
        items,
        amount
      });
      const data = await handleApiResponse(response);
      
      // Clear order cache
      this.clearOrderCache(orderId);
      
      return data;
    } catch (error) {
      console.error(`Error requesting refund for order ${orderId}:`, error);
      throw new Error(error.message || 'Failed to request refund');
    }
  }

  // Get order invoice
  async getOrderInvoice(orderId, format = 'pdf') {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await apiClient.get(`${API_ENDPOINTS.ORDERS.BASE}/${orderId}/invoice`, {
        params: { format },
        headers: {
          'Accept': format === 'pdf' ? 'application/pdf' : 'application/json'
        }
      });

      if (format === 'pdf') {
        // Return blob for PDF download
        return response.blob();
      } else {
        return handleApiResponse(response);
      }
    } catch (error) {
      console.error(`Error fetching invoice for order ${orderId}:`, error);
      throw new Error(error.message || 'Failed to fetch invoice');
    }
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

    try {
      const response = await apiClient.put(`${API_ENDPOINTS.ORDERS.BASE}/${orderId}/status`, {
        status,
        notes: notes.trim()
      });
      const data = await handleApiResponse(response);
      
      // Clear order cache
      this.clearOrderCache(orderId);
      
      return data;
    } catch (error) {
      console.error(`Error updating status for order ${orderId}:`, error);
      throw new Error(error.message || 'Failed to update order status');
    }
  }

  // Validation Methods
  validateOrderData(orderData) {
    const { items, shippingAddress, paymentMethod } = orderData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Validate each item
    items.forEach((item, index) => {
      if (!item.productId) {
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

    const requiredAddressFields = ['street', 'city', 'postalCode', 'country'];
    requiredAddressFields.forEach(field => {
      if (!shippingAddress[field] || !shippingAddress[field].trim()) {
        throw new Error(`Shipping address ${field} is required`);
      }
    });

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
  clearOrderCache(orderId) {
    if (orderId) {
      this.cache.delete(`order_${orderId}`);
      this.cache.delete(`order_tracking_${orderId}`);
    }
    this.clearUserOrdersCache();
  }

  clearUserOrdersCache() {
    // Clear all user orders cache entries
    for (const key of this.cache.keys()) {
      if (key.startsWith('user_orders_') || key.startsWith('order_summary_')) {
        this.cache.delete(key);
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Helper method to format order status for display
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

  // Helper method to calculate order total
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
}

export default new OrderService();