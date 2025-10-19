/**
 * Data Synchronization Manager
 * Handles optimistic updates, conflict resolution, and data consistency
 */

class DataSyncManager {
  constructor() {
    this.pendingOperations = new Map();
    this.cache = new Map();
    this.conflictResolvers = new Map();
    this.syncListeners = new Set();
    this.retryQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.syncInterval = null;
    this.isOnline = navigator.onLine;

    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingOperations();
      this.notifyListeners('network', { online: true });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('network', { online: false });
    });
  }

  /**
   * Start periodic synchronization
   */
  startPeriodicSync(interval = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingOperations();
      }
    }, interval);
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform optimistic update with rollback capability
   * @param {string} key - Unique identifier for the operation
   * @param {*} optimisticData - Data to apply optimistically
   * @param {Function} serverOperation - Function that performs the server operation
   * @param {Function} rollbackFn - Function to rollback optimistic changes
   * @param {Object} options - Additional options
   */
  async optimisticUpdate(key, optimisticData, serverOperation, rollbackFn, options = {}) {
    const operationId = `${key}_${Date.now()}_${Math.random()}`;
    const operation = {
      id: operationId,
      key,
      optimisticData,
      serverOperation,
      rollbackFn,
      timestamp: Date.now(),
      retries: 0,
      options
    };

    try {
      // Apply optimistic update immediately
      this.applyOptimisticUpdate(key, optimisticData);
      this.notifyListeners('optimistic_update', { key, data: optimisticData });

      // Store pending operation
      this.pendingOperations.set(operationId, operation);

      if (this.isOnline) {
        // Attempt server operation immediately
        const result = await this.executeServerOperation(operation);
        this.pendingOperations.delete(operationId);
        return result;
      } else {
        // Queue for later when online
        this.notifyListeners('queued', { key, operationId });
        return { success: true, queued: true, operationId };
      }
    } catch (error) {
      // Rollback optimistic update on immediate failure
      if (rollbackFn) {
        rollbackFn();
      }
      this.pendingOperations.delete(operationId);
      this.notifyListeners('rollback', { key, error });
      throw error;
    }
  }

  /**
   * Execute server operation with retry logic
   * @param {Object} operation - Operation to execute
   */
  async executeServerOperation(operation) {
    try {
      const result = await operation.serverOperation();
      
      // Update cache with server response
      this.updateCache(operation.key, result.data || result);
      this.notifyListeners('sync_success', { 
        key: operation.key, 
        data: result.data || result 
      });

      return result;
    } catch (error) {
      // Handle conflicts
      if (error.status === 409 || error.code === 'CONFLICT') {
        return this.handleConflict(operation, error);
      }

      // Retry logic for other errors
      if (operation.retries < this.maxRetries) {
        operation.retries += 1;
        this.scheduleRetry(operation);
        throw new Error(`Operation failed, retrying... (${operation.retries}/${this.maxRetries})`);
      }

      // Max retries reached, rollback
      if (operation.rollbackFn) {
        operation.rollbackFn();
      }
      this.notifyListeners('sync_failed', { 
        key: operation.key, 
        error,
        operation 
      });
      throw error;
    }
  }

  /**
   * Handle conflict resolution
   * @param {Object} operation - Operation that caused conflict
   * @param {Error} error - Conflict error
   */
  async handleConflict(operation, error) {
    const resolver = this.conflictResolvers.get(operation.key) || this.defaultConflictResolver;
    
    try {
      const resolution = await resolver(operation, error);
      
      switch (resolution.strategy) {
        case 'server_wins':
          // Use server data, rollback optimistic update
          if (operation.rollbackFn) {
            operation.rollbackFn();
          }
          this.updateCache(operation.key, resolution.data);
          this.notifyListeners('conflict_resolved', {
            key: operation.key,
            strategy: 'server_wins',
            data: resolution.data
          });
          return { success: true, data: resolution.data };

        case 'client_wins':
          // Retry with force flag
          operation.options.force = true;
          return this.executeServerOperation(operation);

        case 'merge':
          // Apply merged data and retry
          operation.optimisticData = resolution.data;
          this.applyOptimisticUpdate(operation.key, resolution.data);
          return this.executeServerOperation(operation);

        case 'manual':
          // Let user decide
          this.notifyListeners('conflict_manual', {
            key: operation.key,
            operation,
            error,
            serverData: error.data
          });
          throw new Error('Manual conflict resolution required');

        default:
          throw new Error(`Unknown conflict resolution strategy: ${resolution.strategy}`);
      }
    } catch (resolutionError) {
      // Fallback to rollback
      if (operation.rollbackFn) {
        operation.rollbackFn();
      }
      this.notifyListeners('conflict_failed', {
        key: operation.key,
        error: resolutionError
      });
      throw resolutionError;
    }
  }

  /**
   * Default conflict resolver - server wins
   * @param {Object} operation - Operation that caused conflict
   * @param {Error} error - Conflict error
   */
  defaultConflictResolver(operation, error) {
    return {
      strategy: 'server_wins',
      data: error.data || error.serverData
    };
  }

  /**
   * Register custom conflict resolver
   * @param {string} key - Operation key
   * @param {Function} resolver - Conflict resolver function
   */
  registerConflictResolver(key, resolver) {
    this.conflictResolvers.set(key, resolver);
  }

  /**
   * Apply optimistic update to cache
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  applyOptimisticUpdate(key, data) {
    const existing = this.cache.get(key);
    const updated = {
      ...existing,
      ...data,
      _optimistic: true,
      _timestamp: Date.now()
    };
    this.cache.set(key, updated);
  }

  /**
   * Update cache with server data
   * @param {string} key - Cache key
   * @param {*} data - Server data
   */
  updateCache(key, data) {
    const updated = {
      ...data,
      _optimistic: false,
      _timestamp: Date.now(),
      _synced: true
    };
    this.cache.set(key, updated);
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   */
  getCachedData(key) {
    return this.cache.get(key);
  }

  /**
   * Invalidate cache entry
   * @param {string} key - Cache key
   */
  invalidateCache(key) {
    this.cache.delete(key);
    this.notifyListeners('cache_invalidated', { key });
  }

  /**
   * Clear entire cache
   */
  clearCache() {
    this.cache.clear();
    this.notifyListeners('cache_cleared', {});
  }

  /**
   * Schedule retry for failed operation
   * @param {Object} operation - Operation to retry
   */
  scheduleRetry(operation) {
    const delay = this.retryDelay * Math.pow(2, operation.retries - 1); // Exponential backoff
    
    setTimeout(() => {
      if (this.isOnline && this.pendingOperations.has(operation.id)) {
        this.executeServerOperation(operation)
          .then(() => {
            this.pendingOperations.delete(operation.id);
          })
          .catch(() => {
            // Will be handled by executeServerOperation
          });
      }
    }, delay);
  }

  /**
   * Process all pending operations
   */
  async processPendingOperations() {
    const operations = Array.from(this.pendingOperations.values());
    
    for (const operation of operations) {
      try {
        await this.executeServerOperation(operation);
        this.pendingOperations.delete(operation.id);
      } catch (error) {
        // Individual operation errors are handled in executeServerOperation
        console.warn('Failed to sync operation:', operation.key, error);
      }
    }
  }

  /**
   * Sync pending operations (called periodically)
   */
  async syncPendingOperations() {
    if (this.pendingOperations.size === 0) return;

    this.notifyListeners('sync_started', { 
      pendingCount: this.pendingOperations.size 
    });

    await this.processPendingOperations();

    this.notifyListeners('sync_completed', { 
      remainingCount: this.pendingOperations.size 
    });
  }

  /**
   * Validate data consistency
   * @param {string} key - Data key to validate
   * @param {*} localData - Local data
   * @param {*} serverData - Server data
   */
  validateConsistency(key, localData, serverData) {
    const inconsistencies = [];

    // Check for basic differences
    if (JSON.stringify(localData) !== JSON.stringify(serverData)) {
      inconsistencies.push({
        type: 'data_mismatch',
        key,
        local: localData,
        server: serverData
      });
    }

    // Check timestamps
    if (localData._timestamp && serverData._timestamp) {
      if (localData._timestamp > serverData._timestamp) {
        inconsistencies.push({
          type: 'timestamp_conflict',
          key,
          localTime: localData._timestamp,
          serverTime: serverData._timestamp
        });
      }
    }

    if (inconsistencies.length > 0) {
      this.notifyListeners('consistency_issues', {
        key,
        inconsistencies
      });
    }

    return inconsistencies;
  }

  /**
   * Force refresh data from server
   * @param {string} key - Data key to refresh
   * @param {Function} fetchFn - Function to fetch fresh data
   */
  async forceRefresh(key, fetchFn) {
    try {
      this.notifyListeners('refresh_started', { key });
      
      const freshData = await fetchFn();
      this.updateCache(key, freshData);
      
      this.notifyListeners('refresh_completed', { 
        key, 
        data: freshData 
      });
      
      return freshData;
    } catch (error) {
      this.notifyListeners('refresh_failed', { key, error });
      throw error;
    }
  }

  /**
   * Add sync event listener
   * @param {Function} listener - Event listener function
   */
  addSyncListener(listener) {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Notify all listeners of sync events
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  notifyListeners(event, data) {
    this.syncListeners.forEach(listener => {
      try {
        listener({ event, data, timestamp: Date.now() });
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.pendingOperations.size,
      cacheSize: this.cache.size,
      retryQueueSize: this.retryQueue.length
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopPeriodicSync();
    this.pendingOperations.clear();
    this.cache.clear();
    this.conflictResolvers.clear();
    this.syncListeners.clear();
    this.retryQueue.length = 0;
  }
}

// Create singleton instance
export const dataSyncManager = new DataSyncManager();

// Export class for custom instances
export { DataSyncManager };