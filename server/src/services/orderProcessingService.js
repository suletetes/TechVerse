// Advanced Order Processing Service
// Handles order lifecycle, inventory management, notifications, and status tracking

import { Order, Product, User, Activity } from '../models/index.js';
import stockService from './stockService.js';
import paymentService from './paymentService.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

class OrderProcessingService {
  /**
   * Create and process a new order
   * @param {Object} orderData - Order creation data
   * @param {string} userId - User ID
   * @returns {Object} Created order with processing result
   */
  async createOrder(orderData, userId) {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethodId,
      shippingMethod = 'standard',
      notes = ''
    } = orderData;

    try {
      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Validate and calculate order totals
      const orderCalculation = await this.calculateOrderTotals(items, shippingMethod);
      
      // Reserve stock for order items
      const stockReservation = await stockService.reserveStock(
        items,
        userId,
        `order_${Date.now()}`
      );

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order object
      const order = new Order({
        orderNumber,
        user: userId,
        items: orderCalculation.items,
        subtotal: orderCalculation.subtotal,
        tax: orderCalculation.tax,
        shipping: orderCalculation.shipping,
        total: orderCalculation.total,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        payment: {
          method: paymentMethodId,
          status: 'pending',
          amount: orderCalculation.total
        },
        shipping: {
          method: shippingMethod,
          status: 'pending',
          estimatedDelivery: this.calculateEstimatedDelivery(shippingMethod)
        },
        status: 'pending',
        notes,
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          notes: 'Order created and awaiting payment'
        }],
        metadata: {
          stockReservationId: stockReservation.reservationId,
          createdAt: new Date(),
          source: 'web'
        }
      });

      await order.save();

      // Process payment
      let paymentResult = null;
      try {
        paymentResult = await paymentService.processPayment({
          paymentMethodId,
          amount: orderCalculation.total,
          currency: 'USD',
          orderId: order._id,
          userId
        });

        if (paymentResult.success) {
          await this.updateOrderStatus(order._id, 'confirmed', 'Payment processed successfully', userId);
          
          // Confirm stock reservation
          await stockService.confirmStockReservation(order._id, items, userId);
        } else {
          await this.updateOrderStatus(order._id, 'payment_failed', 'Payment processing failed', userId);
          
          // Release stock reservation
          await stockService.releaseReservations(stockReservation.reservations, 'payment_failed');
        }
      } catch (paymentError) {
        logger.error('Payment processing failed', {
          orderId: order._id,
          userId,
          error: paymentError.message
        });

        await this.updateOrderStatus(order._id, 'payment_failed', `Payment failed: ${paymentError.message}`, userId);
        
        // Release stock reservation
        await stockService.releaseReservations(stockReservation.reservations, 'payment_failed');
        
        throw new AppError('Payment processing failed', 400, 'PAYMENT_FAILED', {
          orderId: order._id,
          orderNumber: order.orderNumber
        });
      }

      // Log order creation activity
      await Activity.create({
        user: userId,
        action: 'order_created',
        resource: 'Order',
        resourceId: order._id,
        details: {
          orderNumber: order.orderNumber,
          total: order.total,
          itemCount: items.length,
          paymentStatus: paymentResult?.status || 'failed'
        }
      });

      logger.info('Order created and processed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId,
        total: order.total,
        paymentStatus: paymentResult?.status || 'failed'
      });

      return {
        order: await order.populate('user', 'firstName lastName email'),
        payment: paymentResult,
        stockReservation
      };

    } catch (error) {
      logger.error('Order creation failed', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calculate order totals including tax and shipping
   * @param {Array} items - Order items
   * @param {string} shippingMethod - Shipping method
   * @returns {Object} Order calculation details
   */
  async calculateOrderTotals(items, shippingMethod) {
    let subtotal = 0;
    const processedItems = [];

    // Validate items and calculate subtotal
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404, 'PRODUCT_NOT_FOUND');
      }

      // Check stock availability
      const availableStock = product.stock.quantity - product.stock.reserved;
      if (availableStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
        variant: item.variantId || null
      });
    }

    // Calculate tax (simplified - 8.5% tax rate)
    const taxRate = 0.085;
    const tax = Math.round(subtotal * taxRate * 100) / 100;

    // Calculate shipping
    const shipping = this.calculateShipping(subtotal, shippingMethod);

    // Calculate total
    const total = Math.round((subtotal + tax + shipping) * 100) / 100;

    return {
      items: processedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      shipping,
      total
    };
  }

  /**
   * Calculate shipping cost
   * @param {number} subtotal - Order subtotal
   * @param {string} shippingMethod - Shipping method
   * @returns {number} Shipping cost
   */
  calculateShipping(subtotal, shippingMethod) {
    // Free shipping over $50
    if (subtotal >= 50) {
      return 0;
    }

    const shippingRates = {
      standard: 5.99,
      express: 12.99,
      overnight: 24.99,
      pickup: 0
    };

    return shippingRates[shippingMethod] || shippingRates.standard;
  }

  /**
   * Calculate estimated delivery date
   * @param {string} shippingMethod - Shipping method
   * @returns {Date} Estimated delivery date
   */
  calculateEstimatedDelivery(shippingMethod) {
    const deliveryDays = {
      standard: 5,
      express: 2,
      overnight: 1,
      pickup: 0
    };

    const days = deliveryDays[shippingMethod] || deliveryDays.standard;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    
    return deliveryDate;
  }

  /**
   * Generate unique order number
   * @returns {string} Order number
   */
  async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get order count for today to ensure uniqueness
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const todayOrderCount = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    const sequence = (todayOrderCount + 1).toString().padStart(4, '0');
    
    return `ORD${year}${month}${day}${sequence}`;
  }

  /**
   * Update order status with history tracking
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @param {string} notes - Status change notes
   * @param {string} userId - User ID making the change
   * @returns {Object} Updated order
   */
  async updateOrderStatus(orderId, status, notes = '', userId = null) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const previousStatus = order.status;
    
    // Update order status
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      notes,
      updatedBy: userId
    });

    // Update payment status if relevant
    if (['confirmed', 'payment_failed'].includes(status)) {
      order.payment.status = status === 'confirmed' ? 'completed' : 'failed';
    }

    // Update shipping status if relevant
    if (['processing', 'shipped', 'delivered'].includes(status)) {
      order.shipping.status = status;
      
      if (status === 'shipped') {
        order.shipping.shippedAt = new Date();
        order.shipping.trackingNumber = this.generateTrackingNumber();
      }
      
      if (status === 'delivered') {
        order.shipping.deliveredAt = new Date();
      }
    }

    await order.save();

    // Log status change activity
    if (userId) {
      await Activity.create({
        user: userId,
        action: 'order_status_updated',
        resource: 'Order',
        resourceId: orderId,
        details: {
          orderNumber: order.orderNumber,
          previousStatus,
          newStatus: status,
          notes
        }
      });
    }

    // Send notifications based on status
    await this.sendStatusNotification(order, status, previousStatus);

    logger.info('Order status updated', {
      orderId,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: status,
      userId
    });

    return order;
  }

  /**
   * Generate tracking number
   * @returns {string} Tracking number
   */
  generateTrackingNumber() {
    const prefix = 'TRK';
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `${prefix}${timestamp.slice(-8)}${random}`;
  }

  /**
   * Send status notification to user
   * @param {Object} order - Order object
   * @param {string} newStatus - New status
   * @param {string} previousStatus - Previous status
   */
  async sendStatusNotification(order, newStatus, previousStatus) {
    // In a real implementation, this would send emails, SMS, or push notifications
    
    const notificationMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is being processed and will ship soon.',
      shipped: `Your order has been shipped! Tracking number: ${order.shipping.trackingNumber}`,
      delivered: 'Your order has been delivered. Thank you for your purchase!',
      cancelled: 'Your order has been cancelled. If you have any questions, please contact support.',
      payment_failed: 'Payment for your order failed. Please update your payment method.'
    };

    const message = notificationMessages[newStatus];
    if (message) {
      logger.info('Order notification sent', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: order.user,
        status: newStatus,
        message
      });

      // Here you would integrate with email service, SMS service, etc.
      // await emailService.sendOrderStatusUpdate(order.user.email, {
      //   orderNumber: order.orderNumber,
      //   status: newStatus,
      //   message,
      //   trackingNumber: order.shipping.trackingNumber
      // });
    }
  }

  /**
   * Cancel order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @param {string} userId - User ID requesting cancellation
   * @returns {Object} Cancellation result
   */
  async cancelOrder(orderId, reason, userId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new AppError(
        `Order cannot be cancelled. Current status: ${order.status}`,
        400,
        'ORDER_NOT_CANCELLABLE'
      );
    }

    // Update order status
    await this.updateOrderStatus(orderId, 'cancelled', `Cancelled: ${reason}`, userId);

    // Release stock back to inventory
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { 'stock.quantity': item.quantity },
          $set: { 'stock.lastUpdated': new Date() }
        });
      }
    }

    // Process refund if payment was completed
    if (order.payment.status === 'completed') {
      // In a real implementation, process refund through payment gateway
      order.payment.status = 'refunded';
      order.payment.refundedAt = new Date();
      await order.save();
    }

    // Log cancellation activity
    await Activity.create({
      user: userId,
      action: 'order_cancelled',
      resource: 'Order',
      resourceId: orderId,
      details: {
        orderNumber: order.orderNumber,
        reason,
        refundAmount: order.payment.status === 'refunded' ? order.total : 0
      }
    });

    logger.info('Order cancelled', {
      orderId,
      orderNumber: order.orderNumber,
      reason,
      userId,
      refundProcessed: order.payment.status === 'refunded'
    });

    return {
      success: true,
      order,
      refundProcessed: order.payment.status === 'refunded',
      stockRestored: true
    };
  }

  /**
   * Get order analytics
   * @param {Object} filters - Analytics filters
   * @returns {Object} Order analytics data
   */
  async getOrderAnalytics(filters = {}) {
    const { 
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      status = null
    } = filters;

    const matchQuery = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (status) {
      matchQuery.status = status;
    }

    const [
      orderStats,
      statusDistribution,
      revenueByDay,
      topProducts,
      averageOrderValue
    ] = await Promise.all([
      // Basic order statistics
      Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]),

      // Status distribution
      Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$total' }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Revenue by day
      Order.aggregate([
        { 
          $match: { 
            ...matchQuery,
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Top selling products
      Order.aggregate([
        { 
          $match: { 
            ...matchQuery,
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            name: '$product.name',
            sku: '$product.sku',
            totalSold: 1,
            totalRevenue: 1,
            orderCount: 1
          }
        }
      ]),

      // Average order value trend
      Order.aggregate([
        { 
          $match: { 
            ...matchQuery,
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            avgOrderValue: { $avg: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    return {
      summary: orderStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        completedOrders: 0,
        cancelledOrders: 0
      },
      statusDistribution,
      trends: {
        revenue: revenueByDay,
        averageOrderValue
      },
      topProducts,
      period: {
        startDate,
        endDate
      }
    };
  }
}

export default new OrderProcessingService();