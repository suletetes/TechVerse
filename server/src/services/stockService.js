import { Product } from '../models/index.js';
import logger from '../utils/logger.js';

class StockService {
  // Reserve stock for cart/checkout
  async reserveStock(productId, quantity, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Clean expired reservations first
      await product.cleanExpiredReservations();

      const reservationId = `${userId}_${Date.now()}`;
      await product.reserveStock(quantity, reservationId);

      logger.info('Stock reserved', {
        productId,
        quantity,
        userId,
        reservationId
      });

      return reservationId;
    } catch (error) {
      logger.error('Stock reservation failed', {
        productId,
        quantity,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Get low stock products
  async getLowStockProducts(threshold = null) {
    try {
      const query = {
        'stock.trackQuantity': true,
        status: 'active'
      };

      if (threshold) {
        query['stock.quantity'] = { $lte: threshold };
      } else {
        query.$expr = { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] };
      }

      const products = await Product.find(query)
        .select('name sku stock category')
        .populate('category', 'name')
        .sort({ 'stock.quantity': 1 });

      return products;
    } catch (error) {
      logger.error('Failed to get low stock products', error);
      throw error;
    }
  }

  // Clean expired reservations (scheduled task)
  async cleanExpiredReservations() {
    try {
      await Product.cleanAllExpiredReservations();
      logger.info('Expired reservations cleaned');
    } catch (error) {
      logger.error('Failed to clean expired reservations', error);
    }
  }
}

export default new StockService();