import { Order, Product, User } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import paymentService from '../services/paymentService.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';
import { PAGINATION_DEFAULTS } from '../utils/constants.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res, next) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    shippingMethod = 'standard',
    paymentMethod,
    discountCode,
    notes
  } = req.body;

  // Validate items
  if (!items || items.length === 0) {
    return next(new AppError('Order must contain at least one item', 400, 'NO_ORDER_ITEMS'));
  }

  // Validate and process order items
  const processedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      return next(new AppError(`Product ${item.product} not found`, 400, 'PRODUCT_NOT_FOUND'));
    }

    if (!product.isAvailable(item.quantity)) {
      return next(new AppError(`Product ${product.name} is not available in requested quantity`, 400, 'INSUFFICIENT_STOCK'));
    }

    // Calculate item price (including variants)
    const itemPrice = product.getVariantPrice(item.variants || []);
    const itemTotal = itemPrice * item.quantity;

    processedItems.push({
      product: product._id,
      name: product.name,
      price: itemPrice,
      quantity: item.quantity,
      variants: item.variants || [],
      image: product.primaryImage?.url || '',
      sku: product.sku
    });

    subtotal += itemTotal;
  }

  // Calculate shipping cost
  const shippingCosts = {
    standard: 0,
    express: 4.99,
    next_day: 9.99
  };
  const shippingCost = shippingCosts[shippingMethod] || 0;

  // Apply discount if provided
  let discountAmount = 0;
  if (discountCode) {
    // TODO: Implement discount code validation
    // For now, just log it
    logger.info('Discount code applied', { code: discountCode, userId: req.user._id });
  }

  // Create order
  const orderData = {
    user: req.user._id,
    items: processedItems,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    shipping: {
      cost: shippingCost,
      method: shippingMethod,
      estimatedDays: shippingMethod === 'next_day' ? 1 : shippingMethod === 'express' ? 2 : 5
    },
    discount: discountCode ? { code: discountCode, amount: discountAmount } : undefined,
    notes,
    source: 'web',
    referrer: req.get('Referer'),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  };

  // Calculate totals
  const order = new Order(orderData);
  order.calculateTotals();

  // Reserve stock for all items
  try {
    await order.reserveStock();
    order.stockReserved = true;
    order.stockReservedAt = new Date();
  } catch (error) {
    return next(new AppError('Failed to reserve stock for order items', 400, 'STOCK_RESERVATION_FAILED'));
  }

  // Save order
  await order.save();

  // Clear user's cart
  const user = await User.findById(req.user._id);
  await user.clearCart();

  // Update user order statistics
  await user.updateOrderStats(order.total);

  logger.info('Order created successfully', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    userId: req.user._id,
    total: order.total,
    itemCount: order.items.length,
    ip: req.ip
  });

  // Send order confirmation email
  try {
    await emailService.sendOrderConfirmationEmail(user, order);
  } catch (error) {
    logger.error('Failed to send order confirmation email', error);
  }

  // Populate order for response
  await order.populate('user', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      order
    }
  });
});

// @desc    Get user orders
// @route   GET /api/orders/user
// @access  Private
export const getUserOrders = asyncHandler(async (req, res, next) => {
  const {
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
    status,
    dateFrom,
    dateTo
  } = req.query;

  // Build options
  const options = {
    page: parseInt(page),
    limit: Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT),
    status: status ? (Array.isArray(status) ? status : [status]) : undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined
  };

  // Get orders
  const orders = await Order.findByUser(req.user._id, options);
  const totalOrders = await Order.countDocuments({ user: req.user._id });

  // Calculate pagination
  const totalPages = Math.ceil(totalOrders / options.limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage,
        hasPrevPage,
        limit: options.limit
      }
    }
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name images slug');

  if (!order) {
    return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
  }

  // Check if user can access this order
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403, 'ACCESS_DENIED'));
  }

  res.status(200).json({
    success: true,
    message: 'Order retrieved successfully',
    data: {
      order
    }
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin only)
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const order = await Order.findById(id).populate('user', 'firstName lastName email');

  if (!order) {
    return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
  }

  // Update status
  await order.updateStatus(status, notes, req.user._id);

  logger.info('Order status updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    oldStatus: order.status,
    newStatus: status,
    updatedBy: req.user._id,
    ip: req.ip
  });

  // Send status update email
  try {
    await emailService.sendOrderStatusUpdateEmail(order.user, order);
  } catch (error) {
    logger.error('Failed to send order status update email', error);
  }

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: {
      order
    }
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id).populate('user', 'firstName lastName email');

  if (!order) {
    return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
  }

  // Check if user can cancel this order
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403, 'ACCESS_DENIED'));
  }

  // Check if order can be cancelled
  if (!order.canBeCancelled()) {
    return next(new AppError('Order cannot be cancelled at this stage', 400, 'CANNOT_CANCEL_ORDER'));
  }

  // Cancel order
  await order.updateStatus('cancelled', reason || 'Cancelled by user', req.user._id);

  // Process refund if payment was made
  if (order.payment.status === 'completed') {
    try {
      await paymentService.refundPayment(order.payment.paymentIntentId, order.payment.amount);
      await order.processRefund(order.payment.amount, 'Order cancellation');
    } catch (error) {
      logger.error('Failed to process refund for cancelled order', error);
      // Don't fail the cancellation if refund fails
    }
  }

  logger.info('Order cancelled', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    cancelledBy: req.user._id,
    reason,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: {
      order
    }
  });
});

// @desc    Get order tracking
// @route   GET /api/orders/:id/tracking
// @access  Private
export const getOrderTracking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id).select('tracking status shippedAt deliveredAt orderNumber user');

  if (!order) {
    return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
  }

  // Check if user can access this order
  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403, 'ACCESS_DENIED'));
  }

  res.status(200).json({
    success: true,
    message: 'Order tracking retrieved successfully',
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      tracking: order.tracking,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt
    }
  });
});

// @desc    Process payment for order
// @route   POST /api/orders/:id/payment
// @access  Private
export const processPayment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { paymentMethodId, savePaymentMethod = false } = req.body;

  const order = await Order.findById(id).populate('user', 'firstName lastName email');

  if (!order) {
    return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
  }

  // Check if user can pay for this order
  if (order.user._id.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403, 'ACCESS_DENIED'));
  }

  // Check if order can be paid
  if (order.status !== 'pending') {
    return next(new AppError('Order cannot be paid at this stage', 400, 'CANNOT_PAY_ORDER'));
  }

  try {
    // Create payment intent
    const paymentIntent = await paymentService.createPaymentIntent(
      order.total * 100, // Convert to pence
      'gbp',
      {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: order.user._id.toString()
      }
    );

    // Confirm payment
    const confirmedPayment = await paymentService.confirmPayment(paymentIntent.id);

    // Update order payment details
    order.payment = {
      method: 'card',
      status: 'completed',
      transactionId: confirmedPayment.id,
      paymentIntentId: paymentIntent.id,
      amount: order.total,
      currency: 'GBP',
      paidAt: new Date()
    };

    // Update order status
    await order.updateStatus('confirmed', 'Payment completed successfully');

    // Save payment method if requested
    if (savePaymentMethod && paymentMethodId) {
      // TODO: Save payment method to user profile
    }

    logger.info('Order payment processed successfully', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentIntentId: paymentIntent.id,
      userId: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        order,
        paymentIntent: {
          id: paymentIntent.id,
          status: confirmedPayment.status
        }
      }
    });

  } catch (error) {
    logger.error('Payment processing failed', {
      orderId: order._id,
      error: error.message,
      userId: req.user._id
    });

    return next(new AppError('Payment processing failed', 400, 'PAYMENT_FAILED'));
  }
});

// @desc    Refund order
// @route   POST /api/orders/:id/refund
// @access  Private (Admin only)
export const refundOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const order = await Order.findById(id).populate('user', 'firstName lastName email');

  if (!order) {
    return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
  }

  // Validate refund amount
  const maxRefundAmount = order.payment.amount - (order.payment.refundedAmount || 0);
  if (amount > maxRefundAmount) {
    return next(new AppError('Refund amount exceeds available amount', 400, 'INVALID_REFUND_AMOUNT'));
  }

  try {
    // Process refund through payment service
    await paymentService.refundPayment(order.payment.paymentIntentId, amount * 100); // Convert to pence

    // Update order
    await order.processRefund(amount, reason);

    logger.info('Order refund processed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      refundAmount: amount,
      reason,
      processedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        order,
        refundAmount: amount
      }
    });

  } catch (error) {
    logger.error('Refund processing failed', {
      orderId: order._id,
      error: error.message,
      processedBy: req.user._id
    });

    return next(new AppError('Refund processing failed', 500, 'REFUND_FAILED'));
  }
});