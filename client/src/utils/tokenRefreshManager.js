/**
 * Enhanced Token Refresh Manager
 * 
 * Handles automatic token refresh with proper queue management,
 * retry logic, and security validation for the TechVerse application.
 */

import { tokenManager } from './tokenManager.js';
import API_BASE_URL from '../api/config.js';

// Refresh configuration
const REFRESH_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // 1 second base delay
  RETRY_DELAY_MULTIPLIER: 2, // Exponential backoff
  REFRESH_BUFFER_TIME: 5 * 60 * 1000, // 5 minutes before expiry
  CONCURRENT_REFRESH_TIMEOUT: 30000, // 30 seconds max for refresh
  QUEUE_TIMEOUT: 60000, // 1 minute max queue wait
  SECURITY_COOLDOWN: 15 * 60 * 1000 // 15 minutes after security breach
};

class TokenRefreshManager {
  constructor() {
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.failedQueue = [];
    this.refreshAttempts = 0;
    this.lastRefreshTime = null;
    this.refreshListeners = [];
    this.securityBreach = false;
    this.securityBreachTime = null;

    // Initialize refresh monitoring
    this.initializeRefreshMonitoring();
  }

  /**
   * Initialize automatic refresh monitoring
   */
  initializeRefreshMonitoring() {
    // Check token expiry every minute
    setInterval(() => {
      this.checkTokenExpiry();
    }, 60000);

    // Listen for security events
    if (tokenManager.addSecurityEventListener) {
      tokenManager.addSecurityEventListener((event) => {
        this.handleSecurityEvent(event);
      });
    }

    // Listen for page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.checkTokenExpiry();
        }
      });
    }
  }

  /**
   * Handle security events from token manager
   */
  handleSecurityEvent(event) {
    if (event.type === 'SUSPICIOUS_ACTIVITY_DETECTED' || event.type === 'FINGERPRINT_MISMATCH') {
      this.securityBreach = true;
      this.securityBreachTime = Date.now();

      // Clear refresh queue and stop refreshing
      this.clearRefreshQueue('Security breach detected');
      this.isRefreshing = false;
      this.refreshPromise = null;

      // Token refresh disabled due to security breach
    }
  }

  /**
   * Check if token needs refresh
   */
  checkTokenExpiry() {
    if (this.securityBreach) {
      const timeSinceBreach = Date.now() - (this.securityBreachTime || 0);
      if (timeSinceBreach < REFRESH_CONFIG.SECURITY_COOLDOWN) {
        return; // Still in security cooldown
      } else {
        this.securityBreach = false;
        this.securityBreachTime = null;
      }
    }

    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return;

    const timeUntilExpiry = expiry - Date.now();

    // If token expires soon, trigger refresh
    if (timeUntilExpiry <= REFRESH_CONFIG.REFRESH_BUFFER_TIME && timeUntilExpiry > 0) {
      // Token expiring soon, triggering automatic refresh
      this.refreshToken().catch(error => {
        console.error('Automatic token refresh failed:', error);
      });
    }
  }

  /**
   * Refresh access token with enhanced error handling
   */
  async refreshToken(forceRefresh = false) {
    // Check security status
    if (this.securityBreach && !forceRefresh) {
      throw new Error('Token refresh disabled due to security breach');
    }

    // If already refreshing, return existing promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    // Check if we have a refresh token
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      const error = new Error('No refresh token available');
      this.handleRefreshFailure(error, true);
      throw error;
    }

    // Check rate limiting
    if (this.lastRefreshTime && Date.now() - this.lastRefreshTime < 5000) {
      throw new Error('Token refresh rate limited');
    }

    this.isRefreshing = true;
    this.refreshAttempts++;

    // Create refresh promise with timeout
    this.refreshPromise = this.executeRefresh(refreshToken);

    try {
      const result = await Promise.race([
        this.refreshPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Refresh timeout')), REFRESH_CONFIG.CONCURRENT_REFRESH_TIMEOUT)
        )
      ]);

      this.handleRefreshSuccess(result);
      return result;

    } catch (error) {
      this.handleRefreshFailure(error);
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Execute the actual refresh request
   */
  async executeRefresh(refreshToken) {
    const requestId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('Executing token refresh...', { requestId, attempt: this.refreshAttempts });

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({
        refreshToken,
        deviceFingerprint: tokenManager.generateBrowserFingerprint?.() || 'unknown'
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Refresh failed with status ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const data = await response.json();

    if (!data.success || !data.data?.tokens?.accessToken) {
      throw new Error('Invalid refresh response format');
    }

    return data;
  }

  /**
   * Handle successful token refresh
   */
  handleRefreshSuccess(data) {
    try {
      const { tokens, user } = data.data;

      // Update tokens with enhanced security
      tokenManager.setToken(
        tokens.accessToken,
        tokens.expiresIn,
        tokens.sessionId
      );

      // Rotate refresh token if provided
      if (tokens.refreshToken) {
        tokenManager.setRefreshToken(tokens.refreshToken);
      }

      // Update user data if provided
      if (user) {
        localStorage.setItem('techverse_user', JSON.stringify(user));
        if (user.permissions) {
          localStorage.setItem('techverse_permissions', JSON.stringify(user.permissions));
        }
      }

      // Update session expiry
      if (tokens.expiresAt) {
        localStorage.setItem('session_expiry', new Date(tokens.expiresAt).getTime().toString());
      }

      // Reset refresh state
      this.refreshAttempts = 0;
      this.lastRefreshTime = Date.now();

      // Process queued requests
      this.processFailedQueue();

      // Notify listeners
      this.notifyRefreshListeners('success', { tokens, user });

      console.log('Token refresh successful', {
        sessionId: tokens.sessionId?.substring(0, 8) + '...',
        expiresAt: tokens.expiresAt,
        queueSize: this.failedQueue.length
      });

    } catch (error) {
      console.error('Error processing refresh success:', error);
      this.handleRefreshFailure(error);
    }
  }

  /**
   * Handle token refresh failure
   */
  handleRefreshFailure(error, isFatal = false) {
    console.error('Token refresh failed:', {
      message: error.message,
      status: error.status,
      attempt: this.refreshAttempts,
      isFatal
    });

    // Check if we should retry
    const shouldRetry = !isFatal &&
      this.refreshAttempts < REFRESH_CONFIG.MAX_RETRY_ATTEMPTS &&
      this.isRetryableError(error);

    if (shouldRetry) {
      const delay = REFRESH_CONFIG.RETRY_DELAY_BASE *
        Math.pow(REFRESH_CONFIG.RETRY_DELAY_MULTIPLIER, this.refreshAttempts - 1);

      console.log(`Retrying token refresh in ${delay}ms (attempt ${this.refreshAttempts})`);

      setTimeout(() => {
        this.refreshToken().catch(retryError => {
          console.error('Token refresh retry failed:', retryError);
        });
      }, delay);

      return;
    }

    // Fatal failure - clear tokens and redirect
    this.handleFatalRefreshFailure(error);
  }

  /**
   * Handle fatal refresh failure
   */
  handleFatalRefreshFailure(error) {
    // Clear all authentication data
    tokenManager.clearTokens();

    // Clear failed queue with error
    this.clearRefreshQueue(error.message);

    // Reset refresh state
    this.refreshAttempts = 0;
    this.lastRefreshTime = null;

    // Notify listeners
    this.notifyRefreshListeners('failure', { error });

    // Dispatch auth error event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authError', {
        detail: {
          type: 'TOKEN_REFRESH_FAILED',
          message: error.message,
          status: error.status,
          timestamp: new Date().toISOString()
        }
      }));

      // Redirect to login after a short delay
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          const reason = error.status === 401 ? 'session_expired' : 'refresh_failed';
          window.location.href = `/login?reason=${reason}`;
        }
      }, 1000);
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Don't retry on authentication errors or client errors
    if (error.status === 401 || error.status === 403) {
      return false;
    }

    // Don't retry on invalid refresh token
    if (error.message?.includes('invalid') || error.message?.includes('expired')) {
      return false;
    }

    // Retry on network errors and server errors
    return error.status >= 500 || error.message?.includes('timeout') || error.message?.includes('network');
  }

  /**
   * Add request to failed queue
   */
  addToFailedQueue(request) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        resolve,
        reject,
        request,
        timestamp: Date.now()
      };

      this.failedQueue.push(queueItem);

      // Set timeout for queue item
      setTimeout(() => {
        const index = this.failedQueue.indexOf(queueItem);
        if (index !== -1) {
          this.failedQueue.splice(index, 1);
          reject(new Error('Queue timeout'));
        }
      }, REFRESH_CONFIG.QUEUE_TIMEOUT);
    });
  }

  /**
   * Process failed queue after successful refresh
   */
  processFailedQueue() {
    const queue = [...this.failedQueue];
    this.failedQueue = [];

    console.log(`Processing ${queue.length} queued requests after token refresh`);

    queue.forEach(({ resolve, request }) => {
      try {
        resolve(request());
      } catch (error) {
        console.error('Error processing queued request:', error);
      }
    });
  }

  /**
   * Clear failed queue with error
   */
  clearRefreshQueue(errorMessage) {
    const queue = [...this.failedQueue];
    this.failedQueue = [];

    queue.forEach(({ reject }) => {
      reject(new Error(errorMessage || 'Token refresh failed'));
    });
  }

  /**
   * Add refresh event listener
   */
  addRefreshListener(listener) {
    this.refreshListeners.push(listener);
    return () => {
      this.refreshListeners = this.refreshListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify refresh listeners
   */
  notifyRefreshListeners(type, data) {
    this.refreshListeners.forEach(listener => {
      try {
        listener({ type, data, timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Refresh listener error:', error);
      }
    });
  }

  /**
   * Get refresh status
   */
  getRefreshStatus() {
    return {
      isRefreshing: this.isRefreshing,
      refreshAttempts: this.refreshAttempts,
      lastRefreshTime: this.lastRefreshTime,
      queueSize: this.failedQueue.length,
      securityBreach: this.securityBreach,
      securityBreachTime: this.securityBreachTime
    };
  }

  /**
   * Force token refresh (bypass security checks)
   */
  async forceRefresh() {
    return this.refreshToken(true);
  }

  /**
   * Check if refresh is needed
   */
  isRefreshNeeded() {
    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return false;

    const timeUntilExpiry = expiry - Date.now();
    return timeUntilExpiry <= REFRESH_CONFIG.REFRESH_BUFFER_TIME;
  }

  /**
   * Preemptive refresh (refresh before expiry)
   */
  async preemptiveRefresh() {
    if (this.isRefreshNeeded() && !this.isRefreshing) {
      return this.refreshToken();
    }
    return null;
  }
}

// Create and export singleton instance
export const tokenRefreshManager = new TokenRefreshManager();

export default tokenRefreshManager;