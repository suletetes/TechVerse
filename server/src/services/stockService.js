// Real-time Stock Management Service
// Handles stock reservations, updates, and tracking with concurrency control

import { Product, Order } from '../models/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

class StockService {
  /**
   * Reserve stock for cart items
   * @param {Array} items - Cart items to reserve stock for
   * @param {string} userId - User ID for tracking
   * @param {string} sessionId - Session ID for reservation tracking
   * @returns {Object} Reservation result
   */
  async reserveStock(items, userId, sessionId) {
    const reservations = [];
    const failures = [];

    try {
      // Process each item with atomic operations
      for (const item of items) {
        try {
          const reservation = await this.reserveItemStock(
            item.productId,
            item.quantity,
            item.variantId,
            userId,
            sessionId
          );
          reservations.push(reservation);
        } catch (error) {
          failures.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            error: error.message
          });
        }
      }

      // If any reservations failed, rollback successful ones
      if (failures.length > 0) {
        await this.rollbackReservations(reservations);
        throw new AppError('Stock reservation failed for some items', 400, 'STOCK_RESERVATION_FAILED', {
          failures,
          reservations: reservations.length
        });
      }

      // Log successful reservation
      logger.info('Stock reserved successfully', {
        userId,
        sessionId,
        itemCount: items.length,
        reservations: reservations.length
      });

      return {
        success: true,
        reservations,
        totalItems: items.length,
        reservationId: `res_${Date.now()}_${sessionId}`
      };

    } catch (error) {
      logger.error('Stock reservation error', {
        userId,
        sessionId,
        error: error.message,
        itemCount: items.length
      });
      throw error;
    }
  }

  /**
   * Reserve stock for a single item
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to reserve
   * @param {string} variantId - Variant ID (optional)
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Object} Reservation details
   */
  async reserveItemStock(productId, quantity, variantId, userId, sessionId) {
    // Use findOneAndUpdate with atomic operations for concurrency safety
    const updateQuery = {
      _id: productId,
      'stock.trackQuantity': true,
      'stock.quantity': { $gte: quantity }
    };

    const updateOperation = {
      $inc: { 'stock.reserved': quantity },
      $push: {
        'stock.reservations': {
          userId,
          sessionId,
          quantity,
          variantId,
          reservedAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        }
      },
      $set: { 'stock.lastUpdated': new Date() }
    };

    const product = await Product.findOneAndUpdate(
      updateQuery,
      updateOperation,
      { new: true, runValidators: true }
    );

    if (!product) {
      // Check if product exists but insufficient stock
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }
      
      const availableStock = existingProduct.stock.quantity - existingProduct.stock.reserved;
      throw new AppError(
        `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
        400,
        'INSUFFICIENT_STOCK',
        { available: availableStock, requested: quantity }
      );
    }

    // Handle variant stock if applicable
    if (variantId && product.variants) {
      await this.updateVariantStock(productId, variantId, -quantity);
    }

    return {
      productId,
      variantId,
      quantity,
      reservedAt: new Date(),
      availableStock: product.stock.quantity - product.stock.reserved
    };
  }

  /**
   * Confirm stock reservation (convert to actual sale)
   * @param {string} orderId - Order ID
   * @param {Array} items - Order items
   * @param {string} userId - User ID
   * @returns {Object} Confirmation result
   */
  async confirmStockReservation(orderId, items, userId) {
    const confirmations = [];
    const failures = [];

    try {
      for (const item of items) {
        try {
          const confirmation = await this.confirmItemStock(
            item.productId,
            item.quantity,
            item.variantId,
            orderId,
            userId
          );
          confirmations.push(confirmation);
        } catch (error) {
          failures.push({
            productId: item.productId,
            variantId: item.variantId,
            error: error.message
          });
        }
      }

      if (failures.length > 0) {
        throw new AppError('Stock confirmation failed for some items', 400, 'STOCK_CONFIRMATION_FAILED', {
          failures
        });
      }

      // Create stock history entries
      await this.createStockHistory(orderId, items, 'order_confirmed', userId);

      logger.info('Stock reservation confirmed', {
        orderId,
        userId,
        itemCount: items.length
      });

      return {
        success: true,
        confirmations,
        orderId
      };

    } catch (error) {
      logger.error('Stock confirmation error', {
        orderId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Confirm stock for a single item
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to confirm
   * @param {string} variantId - Variant ID (optional)
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID
   * @returns {Object} Confirmation details
   */
  async confirmItemStock(productId, quantity, variantId, orderId, userId) {
    const updateQuery = {
      _id: productId,
      'stock.reserved': { $gte: quantity }
    };

    const updateOperation = {
      $inc: {
        'stock.quantity': -quantity,
        'stock.reserved': -quantity
      },
      $pull: {
        'stock.reservations': {
          userId: userId,
          quantity: quantity
        }
      },
      $set: { 'stock.lastUpdated': new Date() }
    };

    const product = await Product.findOneAndUpdate(
      updateQuery,
      updateOperation,
      { new: true }
    );

    if (!product) {
      throw new AppError('Stock confirmation failed - insufficient reserved stock', 400, 'INSUFFICIENT_RESERVED_STOCK');
    }

    return {
      productId,
      variantId,
      quantity,
      confirmedAt: new Date(),
      remainingStock: product.stock.quantity
    };
  }

  /**
   * Release stock reservations (e.g., when cart is abandoned)
   * @param {Array} reservations - Reservations to release
   * @param {string} reason - Reason for release
   * @returns {Object} Release result
   */
  async releaseReservations(reservations, reason = 'manual_release') {
    const releases = [];
    const failures = [];

    try {
      for (const reservation of reservations) {
        try {
          const release = await this.releaseItemReservation(
            reservation.productId,
            reservation.quantity,
            reservation.variantId,
            reservation.userId,
            reason
          );
          releases.push(release);
        } catch (error) {
          failures.push({
            productId: reservation.productId,
            error: error.message
          });
        }
      }

      logger.info('Stock reservations released', {
        reason,
        releases: releases.length,
        failures: failures.length
      });

      return {
        success: true,
        releases,
        failures
      };

    } catch (error) {
      logger.error('Stock release error', {
        reason,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Release reservation for a single item
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to release
   * @param {string} variantId - Variant ID (optional)
   * @param {string} userId - User ID
   * @param {string} reason - Release reason
   * @returns {Object} Release details
   */
  async releaseItemReservation(productId, quantity, variantId, userId, reason) {
    const updateOperation = {
      $inc: { 'stock.reserved': -quantity },
      $pull: {
        'stock.reservations': {
          userId: userId,
          quantity: quantity
        }
      },
      $set: { 'stock.lastUpdated': new Date() }
    };

    const product = await Product.findByIdAndUpdate(
      productId,
      updateOperation,
      { new: true }
    );

    if (!product) {
      throw new AppError('Product not found for reservation release', 404, 'PRODUCT_NOT_FOUND');
    }

    return {
      productId,
      variantId,
      quantity,
      releasedAt: new Date(),
      reason,
      availableStock: product.stock.quantity - product.stock.reserved
    };
  }

  /**
   * Clean up expired reservations
   * @returns {Object} Cleanup result
   */
  async cleanupExpiredReservations() {
    try {
      const expiredReservations = await Product.aggregate([
        {
          $match: {
            'stock.reservations': {
              $elemMatch: {
                expiresAt: { $lt: new Date() }
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            expiredReservations: {
              $filter: {
                input: '$stock.reservations',
                cond: { $lt: ['$$this.expiresAt', new Date()] }
              }
            }
          }
        }
      ]);

      let totalReleased = 0;
      let productsUpdated = 0;

      for (const product of expiredReservations) {
        const totalExpiredQuantity = product.expiredReservations.reduce(
          (sum, res) => sum + res.quantity, 0
        );

        await Product.findByIdAndUpdate(product._id, {
          $inc: { 'stock.reserved': -totalExpiredQuantity },
          $pull: {
            'stock.reservations': {
              expiresAt: { $lt: new Date() }
            }
          },
          $set: { 'stock.lastUpdated': new Date() }
        });

        totalReleased += totalExpiredQuantity;
        productsUpdated++;
      }

      logger.info('Expired reservations cleaned up', {
        productsUpdated,
        totalReleased,
        cleanupTime: new Date()
      });

      return {
        success: true,
        productsUpdated,
        totalReleased,
        cleanupTime: new Date()
      };

    } catch (error) {
      logger.error('Cleanup expired reservations error', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update variant stock
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @param {number} quantityChange - Quantity change (positive or negative)
   * @returns {Object} Update result
   */
  async updateVariantStock(productId, variantId, quantityChange) {
    const product = await Product.findById(productId);
    if (!product || !product.variants) {
      return { success: false, message: 'Product or variants not found' };
    }

    let updated = false;
    for (const variant of product.variants) {
      const option = variant.options.find(opt => opt._id.toString() === variantId);
      if (option) {
        option.stock = Math.max(0, (option.stock || 0) + quantityChange);
        updated = true;
        break;
      }
    }

    if (updated) {
      await product.save();
      return { success: true, quantityChange };
    }

    return { success: false, message: 'Variant not found' };
  }

  /**
   * Create stock history entry
   * @param {string} orderId - Order ID
   * @param {Array} items - Order items
   * @param {string} action - Action type
   * @param {string} userId - User ID
   */
  async createStockHistory(orderId, items, action, userId) {
    const historyEntries = items.map(item => ({
      product: item.productId,
      variant: item.variantId,
      quantity: item.quantity,
      action,
      orderId,
      userId,
      timestamp: new Date(),
      metadata: {
        price: item.price,
        productName: item.name
      }
    }));

    // Activity logging removed - feature deprecated
  }

  /**
   * Rollback reservations in case of failure
   * @param {Array} reservations - Reservations to rollback
   */
  async rollbackReservations(reservations) {
    for (const reservation of reservations) {
      try {
        await this.releaseItemReservation(
          reservation.productId,
          reservation.quantity,
          reservation.variantId,
          reservation.userId || 'system',
          'rollback'
        );
      } catch (error) {
        logger.error('Rollback reservation error', {
          productId: reservation.productId,
          error: error.message
        });
      }
    }
  }

  /**
   * Get stock status for products
   * @param {Array} productIds - Product IDs to check
   * @returns {Object} Stock status information
   */
  async getStockStatus(productIds) {
    const products = await Product.find(
      { _id: { $in: productIds } },
      'name sku stock variants'
    ).lean();

    return products.map(product => ({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      stock: {
        quantity: product.stock.quantity,
        reserved: product.stock.reserved,
        available: product.stock.quantity - product.stock.reserved,
        lowStockThreshold: product.stock.lowStockThreshold,
        status: this.getStockStatusLabel(product.stock)
      },
      variants: product.variants?.map(variant => ({
        name: variant.name,
        options: variant.options.map(option => ({
          value: option.value,
          stock: option.stock || 0,
          available: Math.max(0, (option.stock || 0))
        }))
      })) || []
    }));
  }

  /**
   * Get stock status label
   * @param {Object} stock - Stock object
   * @returns {string} Status label
   */
  getStockStatusLabel(stock) {
    const available = stock.quantity - stock.reserved;
    if (available <= 0) return 'out-of-stock';
    if (available <= stock.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  }

  /**
   * Bulk stock update
   * @param {Array} updates - Stock updates
   * @param {string} userId - User ID performing update
   * @returns {Object} Update result
   */
  async bulkStockUpdate(updates, userId) {
    const results = {
      successful: [],
      failed: [],
      total: updates.length
    };

    for (const update of updates) {
      try {
        const { productId, quantity, reason = 'manual_adjustment' } = update;
        
        const product = await Product.findByIdAndUpdate(
          productId,
          {
            $set: {
              'stock.quantity': quantity,
              'stock.lastUpdated': new Date()
            }
          },
          { new: true }
        );

        if (!product) {
          results.failed.push({ productId, error: 'Product not found' });
          continue;
        }

        // Activity logging removed - feature deprecated

        results.successful.push({
          productId,
          name: product.name,
          newQuantity: quantity,
          status: this.getStockStatusLabel(product.stock)
        });

      } catch (error) {
        results.failed.push({
          productId: update.productId,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default new StockService();