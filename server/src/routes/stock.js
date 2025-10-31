import express from 'express';
import { body, param, query } from 'express-validator';
import stockService from '../services/stockService.js';
import { authenticate, requireAdmin } from '../middleware/passportAuth.js';
import { validate, commonValidations } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

// @desc    Reserve stock for cart items
// @route   POST /api/stock/reserve
// @access  Private
router.post('/reserve', authenticate, [
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
  body('items.*.variantId').optional().isMongoId().withMessage('Valid variant ID required if provided'),
  body('sessionId').optional().isString().withMessage('Session ID must be string')
], validate, asyncHandler(async (req, res, next) => {
  const { items, sessionId = `session_${Date.now()}` } = req.body;
  const userId = req.user._id.toString();

  const result = await stockService.reserveStock(items, userId, sessionId);

  res.status(200).json({
    success: true,
    message: 'Stock reserved successfully',
    data: result
  });
}));

// @desc    Confirm stock reservation (for order completion)
// @route   POST /api/stock/confirm
// @access  Private
router.post('/confirm', authenticate, [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
  body('items.*.variantId').optional().isMongoId().withMessage('Valid variant ID required if provided')
], validate, asyncHandler(async (req, res, next) => {
  const { orderId, items } = req.body;
  const userId = req.user._id.toString();

  const result = await stockService.confirmStockReservation(orderId, items, userId);

  res.status(200).json({
    success: true,
    message: 'Stock reservation confirmed',
    data: result
  });
}));

// @desc    Release stock reservations
// @route   POST /api/stock/release
// @access  Private
router.post('/release', authenticate, [
  body('reservations').isArray({ min: 1 }).withMessage('Reservations array is required'),
  body('reservations.*.productId').isMongoId().withMessage('Valid product ID is required'),
  body('reservations.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
  body('reservations.*.userId').optional().isMongoId().withMessage('Valid user ID required if provided'),
  body('reason').optional().isString().withMessage('Reason must be string')
], validate, asyncHandler(async (req, res, next) => {
  const { reservations, reason = 'manual_release' } = req.body;

  const result = await stockService.releaseReservations(reservations, reason);

  res.status(200).json({
    success: true,
    message: 'Stock reservations released',
    data: result
  });
}));

// @desc    Get stock status for products
// @route   GET /api/stock/status
// @access  Private
router.get('/status', authenticate, [
  query('productIds').isString().withMessage('Product IDs are required'),
], validate, asyncHandler(async (req, res, next) => {
  const { productIds } = req.query;
  const productIdArray = productIds.split(',').filter(id => id.trim());

  if (productIdArray.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one product ID is required'
    });
  }

  const stockStatus = await stockService.getStockStatus(productIdArray);

  res.status(200).json({
    success: true,
    message: 'Stock status retrieved successfully',
    data: {
      products: stockStatus,
      count: stockStatus.length
    }
  });
}));

// @desc    Cleanup expired reservations (Admin only)
// @route   POST /api/stock/cleanup-expired
// @access  Private (Admin)
router.post('/cleanup-expired', authenticate, requireAdmin, asyncHandler(async (req, res, next) => {
  const result = await stockService.cleanupExpiredReservations();

  logger.info('Expired reservations cleanup triggered by admin', {
    adminId: req.user._id,
    result,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Expired reservations cleaned up successfully',
    data: result
  });
}));

// @desc    Bulk stock update (Admin only)
// @route   PUT /api/stock/bulk-update
// @access  Private (Admin)
router.put('/bulk-update', authenticate, requireAdmin, [
  body('updates').isArray({ min: 1, max: 100 }).withMessage('Updates array is required (max 100 items)'),
  body('updates.*.productId').isMongoId().withMessage('Valid product ID is required'),
  body('updates.*.quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative integer'),
  body('updates.*.reason').optional().isString().withMessage('Reason must be string')
], validate, asyncHandler(async (req, res, next) => {
  const { updates } = req.body;
  const userId = req.user._id.toString();

  const result = await stockService.bulkStockUpdate(updates, userId);

  logger.info('Bulk stock update completed by admin', {
    adminId: req.user._id,
    total: result.total,
    successful: result.successful.length,
    failed: result.failed.length,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `Bulk stock update completed. ${result.successful.length} successful, ${result.failed.length} failed.`,
    data: result
  });
}));

// @desc    Update variant stock (Admin only)
// @route   PUT /api/stock/variant/:productId/:variantId
// @access  Private (Admin)
router.put('/variant/:productId/:variantId', authenticate, requireAdmin, [
  commonValidations.mongoId('productId'),
  commonValidations.mongoId('variantId'),
  body('quantityChange').isInt().withMessage('Quantity change must be integer'),
  body('reason').optional().isString().withMessage('Reason must be string')
], validate, asyncHandler(async (req, res, next) => {
  const { productId, variantId } = req.params;
  const { quantityChange, reason = 'manual_adjustment' } = req.body;

  const result = await stockService.updateVariantStock(productId, variantId, quantityChange);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  logger.info('Variant stock updated by admin', {
    adminId: req.user._id,
    productId,
    variantId,
    quantityChange,
    reason,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Variant stock updated successfully',
    data: {
      productId,
      variantId,
      quantityChange,
      reason,
      updatedAt: new Date()
    }
  });
}));

// @desc    Get stock analytics (Admin only)
// @route   GET /api/stock/analytics
// @access  Private (Admin)
router.get('/analytics', authenticate, requireAdmin, asyncHandler(async (req, res, next) => {
  const { period = '30' } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Import Product model for analytics
  const { Product } = await import('../models/index.js');

  const [
    stockDistribution,
    lowStockProducts,
    outOfStockProducts,
    reservationStats,
    stockMovement
  ] = await Promise.all([
    // Stock level distribution
    Product.aggregate([
      { $match: { status: 'active' } },
      {
        $addFields: {
          availableStock: { $subtract: ['$stock.quantity', '$stock.reserved'] },
          stockStatus: {
            $cond: [
              { $eq: [{ $subtract: ['$stock.quantity', '$stock.reserved'] }, 0] },
              'out-of-stock',
              {
                $cond: [
                  { $lte: [{ $subtract: ['$stock.quantity', '$stock.reserved'] }, '$stock.lowStockThreshold'] },
                  'low-stock',
                  'in-stock'
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$stockStatus',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$availableStock'] } }
        }
      }
    ]),

    // Low stock products
    Product.find({
      status: 'active',
      $expr: { $lte: [{ $subtract: ['$stock.quantity', '$stock.reserved'] }, '$stock.lowStockThreshold'] }
    })
    .select('name sku stock price')
    .limit(20)
    .lean(),

    // Out of stock products
    Product.find({
      status: 'active',
      $expr: { $eq: [{ $subtract: ['$stock.quantity', '$stock.reserved'] }, 0] }
    })
    .select('name sku stock price')
    .limit(20)
    .lean(),

    // Reservation statistics
    Product.aggregate([
      { $match: { 'stock.reservations.0': { $exists: true } } },
      {
        $project: {
          totalReserved: '$stock.reserved',
          activeReservations: { $size: '$stock.reservations' },
          expiredReservations: {
            $size: {
              $filter: {
                input: '$stock.reservations',
                cond: { $lt: ['$$this.expiresAt', new Date()] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalReservedQuantity: { $sum: '$totalReserved' },
          totalActiveReservations: { $sum: '$activeReservations' },
          totalExpiredReservations: { $sum: '$expiredReservations' },
          productsWithReservations: { $sum: 1 }
        }
      }
    ]),

    // Recent stock movements (from Activity model)
    (async () => {
      const { Activity } = await import('../models/index.js');
      return Activity.find({
        action: { $in: ['stock_updated', 'stock_bulk_updated'] },
        createdAt: { $gte: startDate }
      })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    })()
  ]);

  res.status(200).json({
    success: true,
    message: 'Stock analytics retrieved successfully',
    data: {
      period: parseInt(period),
      distribution: stockDistribution,
      alerts: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      reservations: reservationStats[0] || {
        totalReservedQuantity: 0,
        totalActiveReservations: 0,
        totalExpiredReservations: 0,
        productsWithReservations: 0
      },
      recentMovements: stockMovement
    }
  });
}));

export default router;