/**
 * Unified Token Management System
 * 
 * Consolidates tokenManager.js and tokenRefreshManager.js into a single,
 * comprehensive token management solution with enhanced security,
 * automatic refresh, and proper error handling.
 */

import API_BASE_URL from '../api/config.js';

// Token storage keys with versioning
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'techverse_token_v3',
  REFRESH_TOKEN: 'techverse_refresh_token_v3',
  TOKEN_EXPIRY: 'techverse_token_expiry_v3',
  SESSION_ID: 'techverse_session_id_v3',
  TOKEN_FINGERPRINT: 'techverse_token_fp_v3',
  DEVICE_FINGERPRINT: 'techverse_device_fp_v3',
  SECURITY_CONTEXT: 'techverse_security_ctx_v3',
  TOKEN_METADATA: 'techverse_token_meta_v3',
  REFRESH_STATE: 'techverse_refresh_state_v3'
};

// Security and refresh configuration
const CONFIG = {
  // Security settings
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes buffer before expiry
  FINGERPRINT_MISMATCH_THRESHOLD: 3, // Max allowed fingerprint mismatches
  TOKEN_VALIDATION_INTERVAL: 60 * 1000, // Validate tokens every minute
  SUSPICIOUS_ACTIVITY_COOLDOWN: 15 * 60 * 1000, // 15 minutes cooldown
  MAX_TOKEN_AGE: 24 * 60 * 60 * 1000, // 24 hours max token age
  
  // Refresh settings
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // 1 second base delay
  RETRY_DELAY_MULTIPLIER: 2, // Exponential backoff
  REFRESH_BUFFER_TIME: 5 * 60 * 1000, // 5 minutes before expiry
  CONCURRENT_REFRESH_TIMEOUT: 30000, // 30 seconds max for refresh
  QUEUE_TIMEOUT: 60000, // 1 minute max queue wait
  
  // Storage settings
  STORAGE_ENCRYPTION: false, // Set to true in production with HTTPS
  CROSS_TAB_SYNC: true
};

/**
 * Unified Token Manager Class
 */
class UnifiedTokenManager {
  constructor() {
    // Token state
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.tokenMetadata = null;
    
    // Security state
    this.fingerprintMismatches = 0;
    this.lastFingerprintCheck = null;
    this.securityBreach = false;
    this.securityBreachTime = null;
    
    // Refresh state
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.failedQueue = [];
    this.refreshAttempts = 0;
    this.lastRefreshTime = null;
    
    // Event listeners
    this.eventListeners = [];
    this.refreshListeners = [];
    this.securityEventListeners = [];
    
    // Intervals and timeouts
    this.validationInterval = null;
    this.refreshCheckInterval = null;
    
    // Initialize the manager
    this.initialize();
  }

  /**
   * Initialize the token manager
   */
  initialize() {
    this.loadStoredTokens();
    this.initializeSecurityMonitoring();
    this.initializeRefreshMonitoring();
    this.migrateOldTokens();
    this.startPeriodicValidation();
  }

  /**
   * Load tokens from storage
   */
  loadStoredTokens() {
    try {
      this.accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      this.refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      this.tokenExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      
      const metadataStr = localStorage.getItem(STORAGE_KEYS.TOKEN_METADATA);
      this.tokenMetadata = metadataStr ? JSON.parse(metadataStr) : null;
      
      if (this.tokenExpiry) {
        this.tokenExpiry = parseInt(this.tokenExpiry);
      }
    } catch (error) {
      console.warn('Failed to load stored tokens:', error);
      this.clearTokens();
    }
  }

  /**
   * Generate comprehensive browser fingerprint
   */
  generateBrowserFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('TechVerse Security Check', 2, 2);
      
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages?.join(',') || '',
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        canvas: canvas.toDataURL(),
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        webgl: this.getWebGLFingerprint()
      };
      
      return this.simpleHash(JSON.stringify(fingerprint));
    } catch (error) {
      console.warn('Failed to generate browser fingerprint:', error);
      return this.simpleHash(navigator.userAgent + screen.width + screen.height);
    }
  }

  /**
   * Get WebGL fingerprint
   */
  getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return 'no-webgl';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL || gl.VENDOR),
        renderer: gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
      };
    } catch (error) {
      return 'webgl-error';
    }
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate token format and structure
   */
  validateTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'Invalid token type' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Invalid JWT format' };
    }
    
    try {
      const header = JSON.parse(atob(parts[0]));
      if (!header.alg || !header.typ) {
        return { valid: false, reason: 'Invalid JWT header' };
      }
      
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.id || !payload.email || !payload.exp) {
        return { valid: false, reason: 'Invalid JWT payload' };
      }
      
      const tokenAge = Date.now() - (payload.iat * 1000);
      if (tokenAge > CONFIG.MAX_TOKEN_AGE) {
        return { valid: false, reason: 'Token too old' };
      }
      
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, reason: 'Token parsing failed' };
    }
  }

  /**
   * Set access token with enhanced security
   */
  setToken(token, expiresIn = '7d', sessionId = null) {
    const validation = this.validateTokenFormat(token);
    if (!validation.valid) {
      this.emitSecurityEvent('INVALID_TOKEN_FORMAT', { reason: validation.reason });
      throw new Error(`Invalid token: ${validation.reason}`);
    }
    
    try {
      const browserFingerprint = this.generateBrowserFingerprint();
      const deviceInfo = this.generateDeviceInfo();
      
      // Calculate expiry time
      let expiryTime;
      if (typeof expiresIn === 'string') {
        const match = expiresIn.match(/^(\d+)([dhms])$/);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2];
          const multipliers = { 
            d: 24 * 60 * 60 * 1000, 
            h: 60 * 60 * 1000, 
            m: 60 * 1000, 
            s: 1000 
          };
          expiryTime = Date.now() + (value * multipliers[unit]);
        } else {
          expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
        }
      } else {
        expiryTime = Date.now() + (expiresIn * 1000);
      }
      
      // Create token metadata
      const tokenMetadata = {
        issuedAt: Date.now(),
        expiresAt: expiryTime,
        sessionId: sessionId || this.generateSessionId(),
        browserFingerprint,
        deviceFingerprint: deviceInfo.fingerprint,
        deviceMetadata: deviceInfo.metadata,
        securityLevel: 'enhanced',
        version: '3.0'
      };
      
      // Store tokens and metadata
      this.accessToken = token;
      this.tokenExpiry = expiryTime;
      this.tokenMetadata = tokenMetadata;
      
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      localStorage.setItem(STORAGE_KEYS.TOKEN_FINGERPRINT, browserFingerprint);
      localStorage.setItem(STORAGE_KEYS.DEVICE_FINGERPRINT, deviceInfo.fingerprint);
      localStorage.setItem(STORAGE_KEYS.TOKEN_METADATA, JSON.stringify(tokenMetadata));
      
      if (sessionId) {
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
      }
      
      // Reset security counters
      this.fingerprintMismatches = 0;
      this.lastFingerprintCheck = Date.now();
      
      // Start monitoring
      this.startPeriodicValidation();
      
      this.emitEvent('TOKEN_SET', { sessionId, expiresAt: new Date(expiryTime).toISOString() });
      this.emitSecurityEvent('TOKEN_STORED', {
        sessionId: sessionId?.substring(0, 8) + '...',
        expiresAt: new Date(expiryTime).toISOString(),
        fingerprint: browserFingerprint.substring(0, 8) + '...'
      });
      
    } catch (error) {
      this.emitSecurityEvent('TOKEN_STORAGE_ERROR', { error: error.message });
      throw new Error(`Failed to store token securely: ${error.message}`);
    }
  }

  /**
   * Get access token with security validation
   */
  getToken() {
    try {
      if (!this.accessToken) return null;
      
      const validation = this.validateTokenFormat(this.accessToken);
      if (!validation.valid) {
        this.emitSecurityEvent('INVALID_STORED_TOKEN', { reason: validation.reason });
        this.clearTokens();
        return null;
      }
      
      // Check expiry with buffer
      if (this.tokenExpiry && Date.now() > (this.tokenExpiry - CONFIG.TOKEN_EXPIRY_BUFFER)) {
        this.emitSecurityEvent('TOKEN_EXPIRED', { expiry: new Date(this.tokenExpiry).toISOString() });
        return null;
      }
      
      // Verify browser fingerprint
      const storedFingerprint = localStorage.getItem(STORAGE_KEYS.TOKEN_FINGERPRINT);
      if (storedFingerprint) {
        const currentFingerprint = this.generateBrowserFingerprint();
        
        if (storedFingerprint !== currentFingerprint) {
          this.fingerprintMismatches++;
          this.emitSecurityEvent('FINGERPRINT_MISMATCH', {
            stored: storedFingerprint.substring(0, 8) + '...',
            current: currentFingerprint.substring(0, 8) + '...',
            mismatches: this.fingerprintMismatches
          });
          
          if (this.fingerprintMismatches >= CONFIG.FINGERPRINT_MISMATCH_THRESHOLD) {
            this.handleSuspiciousActivity();
            return null;
          }
        } else {
          this.fingerprintMismatches = 0;
        }
      }
      
      return this.accessToken;
    } catch (error) {
      this.emitSecurityEvent('TOKEN_RETRIEVAL_ERROR', { error: error.message });
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Set refresh token
   */
  setRefreshToken(token) {
    if (!token) {
      throw new Error('Refresh token is required');
    }
    
    try {
      this.refreshToken = token;
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      
      this.emitSecurityEvent('REFRESH_TOKEN_STORED', {
        protocol: window.location.protocol,
        secure: window.location.protocol === 'https:'
      });
    } catch (error) {
      this.emitSecurityEvent('REFRESH_TOKEN_STORAGE_ERROR', { error: error.message });
      throw error;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return this.refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if tokens exist and are valid
   */
  hasValidTokens() {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    return !!(token && refreshToken);
  }

  /**
   * Check if token will expire soon
   */
  isTokenExpiringSoon(bufferMinutes = 10) {
    if (!this.tokenExpiry) return false;
    return Date.now() > (this.tokenExpiry - (bufferMinutes * 60 * 1000));
  }

  /**
   * Refresh access token with enhanced error handling
   */
  async refreshToken(forceRefresh = false) {
    if (this.securityBreach && !forceRefresh) {
      throw new Error('Token refresh disabled due to security breach');
    }

    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      const error = new Error('No refresh token available');
      this.handleRefreshFailure(error, true);
      throw error;
    }

    if (this.lastRefreshTime && Date.now() - this.lastRefreshTime < 5000) {
      throw new Error('Token refresh rate limited');
    }

    this.isRefreshing = true;
    this.refreshAttempts++;

    this.refreshPromise = this.executeRefresh(refreshToken);

    try {
      const result = await Promise.race([
        this.refreshPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Refresh timeout')), CONFIG.CONCURRENT_REFRESH_TIMEOUT)
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

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({
        refreshToken,
        deviceFingerprint: this.generateBrowserFingerprint()
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

      this.setToken(tokens.accessToken, tokens.expiresIn, tokens.sessionId);

      if (tokens.refreshToken) {
        this.setRefreshToken(tokens.refreshToken);
      }

      if (user) {
        localStorage.setItem('techverse_user', JSON.stringify(user));
        if (user.permissions) {
          localStorage.setItem('techverse_permissions', JSON.stringify(user.permissions));
        }
      }

      if (tokens.expiresAt) {
        localStorage.setItem('session_expiry', new Date(tokens.expiresAt).getTime().toString());
      }

      this.refreshAttempts = 0;
      this.lastRefreshTime = Date.now();

      this.processFailedQueue();
      this.notifyRefreshListeners('success', { tokens, user });

      this.emitEvent('TOKEN_REFRESHED', { tokens, user });

    } catch (error) {
      console.error('Error processing refresh success:', error);
      this.handleRefreshFailure(error);
    }
  }

  /**
   * Handle token refresh failure
   */
  handleRefreshFailure(error, isFatal = false) {
    const shouldRetry = !isFatal &&
      this.refreshAttempts < CONFIG.MAX_RETRY_ATTEMPTS &&
      this.isRetryableError(error);

    if (shouldRetry) {
      const delay = CONFIG.RETRY_DELAY_BASE *
        Math.pow(CONFIG.RETRY_DELAY_MULTIPLIER, this.refreshAttempts - 1);

      setTimeout(() => {
        this.refreshToken().catch(retryError => {
          console.error('Token refresh retry failed:', retryError);
        });
      }, delay);

      return;
    }

    this.handleFatalRefreshFailure(error);
  }

  /**
   * Handle fatal refresh failure
   */
  handleFatalRefreshFailure(error) {
    this.clearTokens();
    this.clearRefreshQueue(error.message);

    this.refreshAttempts = 0;
    this.lastRefreshTime = null;

    this.notifyRefreshListeners('failure', { error });
    this.emitEvent('TOKEN_REFRESH_FAILED', { error });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authError', {
        detail: {
          type: 'TOKEN_REFRESH_FAILED',
          message: error.message,
          status: error.status,
          timestamp: new Date().toISOString()
        }
      }));

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
    if (error.status === 401 || error.status === 403) return false;
    if (error.message?.includes('invalid') || error.message?.includes('expired')) return false;
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

      setTimeout(() => {
        const index = this.failedQueue.indexOf(queueItem);
        if (index !== -1) {
          this.failedQueue.splice(index, 1);
          reject(new Error('Queue timeout'));
        }
      }, CONFIG.QUEUE_TIMEOUT);
    });
  }

  /**
   * Process failed queue after successful refresh
   */
  processFailedQueue() {
    const queue = [...this.failedQueue];
    this.failedQueue = [];

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
   * Clear all tokens and security data
   */
  clearTokens() {
    // Clear instance variables
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.tokenMetadata = null;

    // Clear storage
    const keysToRemove = Object.values(STORAGE_KEYS).concat([
      'techverse_token', 'techverse_refresh_token', 'techverse_token_expiry',
      'techverse_session_id', 'techverse_token_fp', 'techverse_user',
      'techverse_permissions', 'session_expiry', 'user_preferences',
      'techverse_security_context'
    ]);
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    });

    try {
      sessionStorage.removeItem('techverse_temp_data');
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }

    this.stopPeriodicValidation();
    this.fingerprintMismatches = 0;
    this.lastFingerprintCheck = null;

    this.emitEvent('TOKENS_CLEARED', { timestamp: new Date().toISOString() });
    this.emitSecurityEvent('TOKENS_CLEARED', { timestamp: new Date().toISOString() });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authTokensCleared', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
  }

  /**
   * Generate device information
   */
  generateDeviceInfo() {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      timestamp: new Date().toISOString(),
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    };
    
    return {
      fingerprint: this.simpleHash(JSON.stringify(deviceInfo)),
      metadata: deviceInfo
    };
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Handle suspicious activity
   */
  handleSuspiciousActivity() {
    this.clearTokens();
    this.securityBreach = true;
    this.securityBreachTime = Date.now();

    const cooldownExpiry = Date.now() + CONFIG.SUSPICIOUS_ACTIVITY_COOLDOWN;
    localStorage.setItem('techverse_security_cooldown', cooldownExpiry.toString());

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('securityBreach', {
        detail: {
          type: 'SUSPICIOUS_ACTIVITY',
          timestamp: new Date().toISOString(),
          cooldownExpiry: new Date(cooldownExpiry).toISOString()
        }
      }));
    }

    this.emitSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
      fingerprintMismatches: this.fingerprintMismatches,
      cooldownExpiry: new Date(cooldownExpiry).toISOString()
    });
  }

  /**
   * Initialize security monitoring
   */
  initializeSecurityMonitoring() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (Object.values(STORAGE_KEYS).includes(event.key)) {
          this.emitSecurityEvent('CROSS_TAB_TOKEN_CHANGE', {
            key: event.key,
            oldValue: event.oldValue ? 'present' : 'null',
            newValue: event.newValue ? 'present' : 'null'
          });
        }
      });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.validateStoredTokens();
        }
      });
    }
  }

  /**
   * Initialize refresh monitoring
   */
  initializeRefreshMonitoring() {
    this.refreshCheckInterval = setInterval(() => {
      this.checkTokenExpiry();
    }, 60000);
  }

  /**
   * Check token expiry and trigger refresh if needed
   */
  checkTokenExpiry() {
    if (this.securityBreach) {
      const timeSinceBreach = Date.now() - (this.securityBreachTime || 0);
      if (timeSinceBreach < CONFIG.SUSPICIOUS_ACTIVITY_COOLDOWN) {
        return;
      } else {
        this.securityBreach = false;
        this.securityBreachTime = null;
      }
    }

    if (!this.tokenExpiry) return;

    const timeUntilExpiry = this.tokenExpiry - Date.now();

    if (timeUntilExpiry <= CONFIG.REFRESH_BUFFER_TIME && timeUntilExpiry > 0) {
      this.refreshToken().catch(error => {
        console.error('Automatic token refresh failed:', error);
      });
    }
  }

  /**
   * Start periodic token validation
   */
  startPeriodicValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }
    
    this.validationInterval = setInterval(() => {
      this.validateStoredTokens();
    }, CONFIG.TOKEN_VALIDATION_INTERVAL);
  }

  /**
   * Stop periodic validation
   */
  stopPeriodicValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
    
    if (this.refreshCheckInterval) {
      clearInterval(this.refreshCheckInterval);
      this.refreshCheckInterval = null;
    }
  }

  /**
   * Validate stored tokens
   */
  validateStoredTokens() {
    if (!this.accessToken) return;
    
    const validation = this.validateTokenFormat(this.accessToken);
    if (!validation.valid) {
      this.emitSecurityEvent('PERIODIC_VALIDATION_FAILED', { reason: validation.reason });
      this.clearTokens();
    }
  }

  /**
   * Migrate old tokens to new format
   */
  migrateOldTokens() {
    const oldToken = localStorage.getItem('techverse_token');
    const oldRefreshToken = localStorage.getItem('techverse_refresh_token');
    const oldExpiry = localStorage.getItem('techverse_token_expiry');
    
    if (oldToken && !localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
      try {
        const validation = this.validateTokenFormat(oldToken);
        if (validation.valid) {
          const expiryTime = oldExpiry ? parseInt(oldExpiry) : Date.now() + (7 * 24 * 60 * 60 * 1000);
          this.setToken(oldToken, Math.floor((expiryTime - Date.now()) / 1000));
          
          if (oldRefreshToken) {
            this.setRefreshToken(oldRefreshToken);
          }
          
          this.emitSecurityEvent('TOKEN_MIGRATION_SUCCESS', {
            oldFormat: 'v2',
            newFormat: 'v3'
          });
        }
        
        ['techverse_token', 'techverse_refresh_token', 'techverse_token_expiry'].forEach(key => {
          localStorage.removeItem(key);
        });
        
      } catch (error) {
        console.warn('Token migration failed:', error);
        this.emitSecurityEvent('TOKEN_MIGRATION_FAILED', { error: error.message });
      }
    }
  }

  /**
   * Event system
   */
  addEventListener(listener) {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  addRefreshListener(listener) {
    this.refreshListeners.push(listener);
    return () => {
      this.refreshListeners = this.refreshListeners.filter(l => l !== listener);
    };
  }

  addSecurityEventListener(listener) {
    this.securityEventListeners.push(listener);
    return () => {
      this.securityEventListeners = this.securityEventListeners.filter(l => l !== listener);
    };
  }

  emitEvent(type, data = {}) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      data
    };

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  notifyRefreshListeners(type, data) {
    this.refreshListeners.forEach(listener => {
      try {
        listener({ type, data, timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Refresh listener error:', error);
      }
    });
  }

  emitSecurityEvent(type, data = {}) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      data
    };
    
    // Security event logged silently
    
    this.securityEventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Security event listener error:', error);
      }
    });
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      // Token status
      hasValidTokens: this.hasValidTokens(),
      isExpiringSoon: this.isTokenExpiringSoon(),
      tokenExpiry: this.tokenExpiry,
      
      // Security status
      inSecurityCooldown: this.securityBreach,
      fingerprintMismatches: this.fingerprintMismatches,
      securityLevel: this.tokenMetadata?.securityLevel || 'basic',
      lastCheck: this.lastFingerprintCheck,
      tokenAge: this.tokenMetadata ? Date.now() - this.tokenMetadata.issuedAt : null,
      
      // Refresh status
      isRefreshing: this.isRefreshing,
      refreshAttempts: this.refreshAttempts,
      lastRefreshTime: this.lastRefreshTime,
      queueSize: this.failedQueue.length
    };
  }
}

// Create and export singleton instance
export const unifiedTokenManager = new UnifiedTokenManager();

export default unifiedTokenManager;