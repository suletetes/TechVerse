import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

/**
 * Audit Service
 * Handles audit logging and retrieval
 */

class AuditService {
  /**
   * Log role change
   */
  async logRoleChange(action, roleId, performedBy, changes = {}, metadata = {}) {
    try {
      await AuditLog.create({
        action,
        performedBy,
        targetRole: roleId,
        changes,
        metadata,
        timestamp: new Date()
      });

      logger.info('Role change logged', {
        action,
        roleId,
        performedBy
      });
    } catch (error) {
      logger.error('Error logging role change', {
        error: error.message,
        action,
        roleId,
        performedBy
      });
    }
  }

  /**
   * Log permission change
   */
  async logPermissionChange(action, roleId, performedBy, changes = {}, metadata = {}) {
    try {
      await AuditLog.create({
        action,
        performedBy,
        targetRole: roleId,
        changes,
        metadata,
        timestamp: new Date()
      });

      logger.info('Permission change logged', {
        action,
        roleId,
        performedBy
      });
    } catch (error) {
      logger.error('Error logging permission change', {
        error: error.message,
        action,
        roleId,
        performedBy
      });
    }
  }

  /**
   * Log role assignment
   */
  async logRoleAssignment(userId, roleId, performedBy, changes = {}, metadata = {}) {
    try {
      await AuditLog.logRoleAssignment(userId, roleId, performedBy, changes, metadata);

      logger.info('Role assignment logged', {
        userId,
        roleId,
        performedBy
      });
    } catch (error) {
      logger.error('Error logging role assignment', {
        error: error.message,
        userId,
        roleId,
        performedBy
      });
    }
  }

  /**
   * Log unauthorized access
   */
  async logUnauthorizedAccess(userId, metadata = {}) {
    try {
      await AuditLog.logUnauthorizedAccess(userId, metadata);

      logger.warn('Unauthorized access logged', {
        userId,
        endpoint: metadata.endpoint,
        permission: metadata.permission
      });
    } catch (error) {
      logger.error('Error logging unauthorized access', {
        error: error.message,
        userId
      });
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters = {}) {
    try {
      const logs = await AuditLog.getFilteredLogs(filters);

      logger.debug('Audit logs retrieved', {
        count: logs.length,
        filters
      });

      return logs;
    } catch (error) {
      logger.error('Error retrieving audit logs', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId, options = {}) {
    try {
      const { limit = 50, startDate, endDate } = options;

      const filters = {
        targetUser: userId,
        limit,
        startDate,
        endDate
      };

      const logs = await AuditLog.getFilteredLogs(filters);

      return logs;
    } catch (error) {
      logger.error('Error retrieving user audit logs', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get audit logs for a specific role
   */
  async getRoleAuditLogs(roleId, options = {}) {
    try {
      const { limit = 50, startDate, endDate } = options;

      const filters = {
        targetRole: roleId,
        limit,
        startDate,
        endDate
      };

      const logs = await AuditLog.getFilteredLogs(filters);

      return logs;
    } catch (error) {
      logger.error('Error retrieving role audit logs', {
        error: error.message,
        roleId
      });
      throw error;
    }
  }

  /**
   * Get audit logs by action type
   */
  async getAuditLogsByAction(action, options = {}) {
    try {
      const { limit = 100, startDate, endDate } = options;

      const filters = {
        action,
        limit,
        startDate,
        endDate
      };

      const logs = await AuditLog.getFilteredLogs(filters);

      return logs;
    } catch (error) {
      logger.error('Error retrieving audit logs by action', {
        error: error.message,
        action
      });
      throw error;
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit = 50) {
    try {
      const logs = await AuditLog.find()
        .populate('performedBy', 'firstName lastName email')
        .populate('targetUser', 'firstName lastName email')
        .populate('targetRole', 'name displayName')
        .sort({ timestamp: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      logger.error('Error retrieving recent audit logs', {
        error: error.message,
        limit
      });
      throw error;
    }
  }

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogsToCSV(filters = {}) {
    try {
      const csvData = await AuditLog.exportToCSV(filters);

      logger.info('Audit logs exported to CSV', {
        rowCount: csvData.length - 1, // Exclude header row
        filters
      });

      return csvData;
    } catch (error) {
      logger.error('Error exporting audit logs to CSV', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(startDate, endDate) {
    try {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);

      const query = Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {};

      const stats = await AuditLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const total = await AuditLog.countDocuments(query);

      const unauthorizedAttempts = await AuditLog.countDocuments({
        ...query,
        action: 'unauthorized_access'
      });

      return {
        total,
        unauthorizedAttempts,
        byAction: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting audit statistics', {
        error: error.message,
        startDate,
        endDate
      });
      throw error;
    }
  }

  /**
   * Get most active users (by audit log entries)
   */
  async getMostActiveUsers(limit = 10, startDate, endDate) {
    try {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);

      const query = Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {};

      const activeUsers = await AuditLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$performedBy',
            actionCount: { $sum: 1 }
          }
        },
        { $sort: { actionCount: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            actionCount: 1,
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            email: '$user.email',
            role: '$user.role'
          }
        }
      ]);

      return activeUsers;
    } catch (error) {
      logger.error('Error getting most active users', {
        error: error.message,
        limit,
        startDate,
        endDate
      });
      throw error;
    }
  }

  /**
   * Delete old audit logs (for cleanup)
   */
  async deleteOldAuditLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      logger.info('Old audit logs deleted', {
        deletedCount: result.deletedCount,
        cutoffDate,
        daysToKeep
      });

      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate
      };
    } catch (error) {
      logger.error('Error deleting old audit logs', {
        error: error.message,
        daysToKeep
      });
      throw error;
    }
  }
}

export default new AuditService();
