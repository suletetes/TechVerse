import emailService from '../services/emailService.js';
import enhancedLogger from '../utils/enhancedLogger.js';
import { User, Order, Product } from '../models/index.js';

/**
 * Email Notification Middleware
 * Handles automatic email notifications for various events
 */

/**
 * Send welcome email after user registration
 */
export const sendWelcomeEmailMiddleware = async (req, res, next) => {
  // Only send if registration was successful
  if (res.statusCode === 201 && req.body.email) {
    try {
      const user = res.locals.user || req.user;
      
      if (user) {
        // Send welcome email asynchronously
        setImmediate(async () => {
          try {
            await emailService.sendWelcomeEmail(user);
            enhancedLogger.info('Welcome email sent', {
              userId: user._id,
              email: user.email
            });
          } catch (error) {
            enhancedLogger.error('Failed to send welcome email', {
              userId: user._id,
              email: user.email,
              error: error.message
            });
          }
        });
      }
    } catch (error) {
      enhancedLogger.error('Welcome email middleware error', {
        error: error.message
      });
    }
  }
  
  next();
};

/**
 * Send order confirmation email after order creation
 */
export const sendOrderConfirmationMiddleware = async (req, res, next) => {
  // Only send if order creation was successful
  if (res.statusCode === 201 && res.locals.order) {
    try {
      const order = res.locals.order;
      const user = req.user;
      
      if (order && user) {
        // Send order confirmation email asynchronously
        setImmediate(async () => {
          try {
            await emailService.sendOrderConfirmation(order, user);
            enhancedLogger.info('Order confirmation email sent', {
              orderId: order._id,
              orderNumber: order.orderNumber,
              userId: user._id,
              email: user.email
            });
          } catch (error) {
            enhancedLogger.error('Failed to send order confirmation email', {
              orderId: order._id,
              userId: user._id,
              error: error.message
            });
          }
        });
      }
    } catch (error) {
      enhancedLogger.error('Order confirmation email middleware error', {
        error: error.message
      });
    }
  }
  
  next();
};

/**
 * Send order status update email when order status changes
 */
export const sendOrderStatusUpdateMiddleware = async (req, res, next) => {
  // Only send if order update was successful
  if (res.statusCode === 200 && req.params.id && req.body.status) {
    try {
      const orderId = req.params.id;
      const newStatus = req.body.status;
      
      // Get the updated order with user information
      setImmediate(async () => {
        try {
          const order = await Order.findById(orderId).populate('user');
          
          if (order && order.user) {
            // Get previous status from order history or assume it was different
            const previousStatus = order.statusHistory && order.statusHistory.length > 1 ? 
              order.statusHistory[order.statusHistory.length - 2].status : 
              'pending';
            
            await emailService.sendOrderStatusUpdate(order, order.user, previousStatus);
            
            enhancedLogger.info('Order status update email sent', {
              orderId: order._id,
              orderNumber: order.orderNumber,
              userId: order.user._id,
              email: order.user.email,
              newStatus,
              previousStatus
            });
          }
        } catch (error) {
          enhancedLogger.error('Failed to send order status update email', {
            orderId,
            newStatus,
            error: error.message
          });
        }
      });
    } catch (error) {
      enhancedLogger.error('Order status update email middleware error', {
        error: error.message
      });
    }
  }
  
  next();
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmailMiddleware = async (req, res, next) => {
  // Only send if password reset request was successful
  if (res.statusCode === 200 && res.locals.resetToken && res.locals.user) {
    try {
      const user = res.locals.user;
      const resetToken = res.locals.resetToken;
      
      // Send password reset email asynchronously
      setImmediate(async () => {
        try {
          await emailService.sendPasswordReset(user, resetToken);
          enhancedLogger.info('Password reset email sent', {
            userId: user._id,
            email: user.email
          });
        } catch (error) {
          enhancedLogger.error('Failed to send password reset email', {
            userId: user._id,
            email: user.email,
            error: error.message
          });
        }
      });
    } catch (error) {
      enhancedLogger.error('Password reset email middleware error', {
        error: error.message
      });
    }
  }
  
  next();
};

/**
 * Send email verification
 */
export const sendEmailVerificationMiddleware = async (req, res, next) => {
  // Only send if email verification request was successful
  if (res.statusCode === 200 && res.locals.verificationToken && res.locals.user) {
    try {
      const user = res.locals.user;
      const verificationToken = res.locals.verificationToken;
      
      // Send email verification asynchronously
      setImmediate(async () => {
        try {
          await emailService.sendEmailVerification(user, verificationToken);
          enhancedLogger.info('Email verification sent', {
            userId: user._id,
            email: user.email
          });
        } catch (error) {
          enhancedLogger.error('Failed to send email verification', {
            userId: user._id,
            email: user.email,
            error: error.message
          });
        }
      });
    } catch (error) {
      enhancedLogger.error('Email verification middleware error', {
        error: error.message
      });
    }
  }
  
  next();
};

/**
 * Monitor stock levels and send alerts
 */
export const stockMonitoringMiddleware = async (req, res, next) => {
  // Monitor stock after product updates or order placements
  if ((req.method === 'PUT' || req.method === 'POST') && 
      (req.originalUrl.includes('/products') || req.originalUrl.includes('/orders')) &&
      res.statusCode < 300) {
    
    try {
      // Check for low stock products asynchronously
      setImmediate(async () => {
        try {
          const lowStockProducts = await Product.find({
            $expr: {
              $lte: ['$stock.quantity', '$stock.lowStockThreshold']
            },
            'stock.trackQuantity': true,
            status: 'active'
          });

          for (const product of lowStockProducts) {
            // Check if we've already sent an alert recently (within 24 hours)
            const lastAlert = product.lastLowStockAlert;
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            if (!lastAlert || lastAlert < twentyFourHoursAgo) {
              await emailService.sendLowStockAlert(product, product.stock.quantity);
              
              // Update last alert timestamp
              await Product.findByIdAndUpdate(product._id, {
                lastLowStockAlert: now
              });

              enhancedLogger.info('Low stock alert sent', {
                productId: product._id,
                productName: product.name,
                currentStock: product.stock.quantity,
                threshold: product.stock.lowStockThreshold
              });
            }
          }
        } catch (error) {
          enhancedLogger.error('Stock monitoring error', {
            error: error.message
          });
        }
      });
    } catch (error) {
      enhancedLogger.error('Stock monitoring middleware error', {
        error: error.message
      });
    }
  }
  
  next();
};

/**
 * Send admin notifications for critical events
 */
export const adminNotificationMiddleware = (eventType, getMessage) => {
  return async (req, res, next) => {
    // Send admin notification for critical events
    if (res.statusCode < 300) {
      try {
        setImmediate(async () => {
          try {
            const message = typeof getMessage === 'function' ? 
              getMessage(req, res) : 
              getMessage;

            await emailService.sendAdminNotification(
              `${eventType} Alert`,
              message,
              {
                userId: req.user?._id,
                userEmail: req.user?.email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.originalUrl,
                method: req.method
              }
            );

            enhancedLogger.info('Admin notification sent', {
              eventType,
              userId: req.user?._id,
              endpoint: req.originalUrl
            });
          } catch (error) {
            enhancedLogger.error('Failed to send admin notification', {
              eventType,
              error: error.message
            });
          }
        });
      } catch (error) {
        enhancedLogger.error('Admin notification middleware error', {
          error: error.message
        });
      }
    }
    
    next();
  };
};

/**
 * Batch email notifications for bulk operations
 */
export const batchEmailNotifications = async (notifications) => {
  try {
    const results = await Promise.allSettled(
      notifications.map(notification => emailService.sendEmail(notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    enhancedLogger.info('Batch email notifications completed', {
      total: results.length,
      successful,
      failed
    });

    return { total: results.length, successful, failed, results };
  } catch (error) {
    enhancedLogger.error('Batch email notifications failed', {
      error: error.message,
      notificationCount: notifications.length
    });
    throw error;
  }
};

/**
 * Email notification queue for high-volume scenarios
 */
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 10;
    this.batchDelay = 1000; // 1 second between batches
  }

  add(emailOptions) {
    this.queue.push(emailOptions);
    
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.batchSize);
        
        await batchEmailNotifications(batch);
        
        // Delay between batches to avoid overwhelming email service
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.batchDelay));
        }
      }
    } catch (error) {
      enhancedLogger.error('Email queue processing error', {
        error: error.message,
        remainingInQueue: this.queue.length
      });
    } finally {
      this.processing = false;
    }
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    };
  }
}

// Create singleton email queue
const emailQueue = new EmailQueue();

export { emailQueue };

export default {
  sendWelcomeEmailMiddleware,
  sendOrderConfirmationMiddleware,
  sendOrderStatusUpdateMiddleware,
  sendPasswordResetEmailMiddleware,
  sendEmailVerificationMiddleware,
  stockMonitoringMiddleware,
  adminNotificationMiddleware,
  batchEmailNotifications,
  emailQueue
};