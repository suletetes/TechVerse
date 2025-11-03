/**
 * Enhanced Token Manager with Security Features
 * 
 * Provides secure token storage with browser fingerprinting, theft detection,
 * and enhanced validation for the TechVerse application.
 */

// Storage keys with versioning for future migrations
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'techverse_token_v2',
  REFRESH_TOKEN: 'techverse_refresh_token_v2',
  TOKEN_EXPIRY: 'techverse_token_expiry_v2',
  SESSION_ID: 'techverse_session_id_v2',
  TOKEN_FINGERPRINT: 'techverse_token_fp_v2',
  DEVICE_FINGERPRINT: 'techverse_device_fp_v2',
  SECURITY_CONTEXT: 'techverse_security_ctx_v2',
  TOKEN_METADATA: 'techverse_token_meta_v2'
};

// Security constants
const SECURITY_CONFIG = {
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes buffer before expiry
  FINGERPRINT_MISMATCH_THRESHOLD: 3, // Max allowed fingerprint mismatches
  TOKEN_VALIDATION_INTERVAL: 60 * 1000, // Validate tokens every minute
  SUSPICIOUS_ACTIVITY_COOLDOWN: 15 * 60 * 1000, // 15 minutes cooldown after suspicious activity
  MAX_TOKEN_AGE: 24 * 60 * 60 * 1000 // 24 hours max token age
};

class EnhancedTokenManager {
  constructor() {
    this.fingerprintMismatches = 0;
    this.lastFingerprintCheck = null;
    this.validationInterval = null;
    this.securityEventListeners = [];
    
    // Initialize security monitoring
    this.initializeSecurityMonitoring();
    
    // Migrate old tokens if they exist
    this.migrateOldTokens();
  }

  /**
   * Generate comprehensive browser fingerprint for token binding
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
      
      // Create hash of fingerprint components
      const fingerprintString = JSON.stringify(fingerprint);
      return this.simpleHash(fingerprintString);
    } catch (error) {
      console.warn('Failed to generate browser fingerprint:', error);
      // Fallback fingerprint
      return this.simpleHash(navigator.userAgent + screen.width + screen.height);
    }
  }

  /**
   * Get WebGL fingerprint for enhanced security (cached and optimized)
   */
  getWebGLFingerprint() {
    // In development mode, use a simple static fingerprint to avoid WebGL context issues
    if (import.meta.env?.DEV) {
      return 'dev-webgl-fingerprint';
    }

    // Cache the result to avoid creating multiple WebGL contexts
    if (this._webglFingerprint) {
      return this._webglFingerprint;
    }

    // Use localStorage cache to persist across sessions
    const cachedFingerprint = localStorage.getItem('techverse_webgl_fp_cache');
    if (cachedFingerprint) {
      try {
        this._webglFingerprint = JSON.parse(cachedFingerprint);
        return this._webglFingerprint;
      } catch (e) {
        // Invalid cache, continue to generate new one
      }
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      const gl = canvas.getContext('webgl', { 
        antialias: false,
        depth: false,
        stencil: false,
        alpha: false,
        preserveDrawingBuffer: false
      }) || canvas.getContext('experimental-webgl', { 
        antialias: false,
        depth: false,
        stencil: false,
        alpha: false,
        preserveDrawingBuffer: false
      });
      
      if (!gl) {
        this._webglFingerprint = 'no-webgl';
        localStorage.setItem('techverse_webgl_fp_cache', JSON.stringify(this._webglFingerprint));
        return this._webglFingerprint;
      }
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      this._webglFingerprint = {
        vendor: gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL || gl.VENDOR),
        renderer: gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
      };

      // Cache the result
      localStorage.setItem('techverse_webgl_fp_cache', JSON.stringify(this._webglFingerprint));

      // Properly dispose of the WebGL context
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
      
      // Clean up canvas
      canvas.width = 0;
      canvas.height = 0;
      
      return this._webglFingerprint;
    } catch (error) {
      this._webglFingerprint = 'webgl-error';
      localStorage.setItem('techverse_webgl_fp_cache', JSON.stringify(this._webglFingerprint));
      return this._webglFingerprint;
    }
  }

  /**
   * Simple hash function for fingerprinting
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate device fingerprint for additional security
   */
  generateDeviceFingerprint() {
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
      // Validate header
      const header = JSON.parse(atob(parts[0]));
      if (!header.alg || !header.typ) {
        return { valid: false, reason: 'Invalid JWT header' };
      }
      
      // Validate payload
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.id || !payload.email || !payload.exp) {
        return { valid: false, reason: 'Invalid JWT payload' };
      }
      
      // Check token age
      const tokenAge = Date.now() - (payload.iat * 1000);
      if (tokenAge > SECURITY_CONFIG.MAX_TOKEN_AGE) {
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
    // Validate token format
    const validation = this.validateTokenFormat(token);
    if (!validation.valid) {
      this.emitSecurityEvent('INVALID_TOKEN_FORMAT', { reason: validation.reason });
      throw new Error(`Invalid token: ${validation.reason}`);
    }
    
    try {
      // Generate security fingerprints
      const browserFingerprint = this.generateBrowserFingerprint();
      const deviceInfo = this.generateDeviceFingerprint();
      
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
          expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // Default 7 days
        }
      } else {
        expiryTime = Date.now() + (expiresIn * 1000); // Assume seconds
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
        version: '2.0'
      };
      
      // Store token and metadata securely
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
      
      // Start token validation monitoring
      this.startTokenValidation();
      
      // Log security event
      this.emitSecurityEvent('TOKEN_STORED', {
        sessionId: sessionId?.substring(0, 8) + '...',
        expiresAt: new Date(expiryTime).toISOString(),
        fingerprint: browserFingerprint.substring(0, 8) + '...'
      });
      
      console.log('Token stored securely with enhanced security features');
      
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
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return null;
      
      // Validate token format
      const validation = this.validateTokenFormat(token);
      if (!validation.valid) {
        this.emitSecurityEvent('INVALID_STORED_TOKEN', { reason: validation.reason });
        this.clearTokens();
        return null;
      }
      
      // Check expiry with buffer
      const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      if (expiry && Date.now() > (parseInt(expiry) - SECURITY_CONFIG.TOKEN_EXPIRY_BUFFER)) {
        this.emitSecurityEvent('TOKEN_EXPIRED', { expiry: new Date(parseInt(expiry)).toISOString() });
        return null; // Don't clear tokens here, let refresh handle it
      }
      
      // Verify browser fingerprint for theft detection (relaxed in development)
      const storedFingerprint = localStorage.getItem(STORAGE_KEYS.TOKEN_FINGERPRINT);
      if (storedFingerprint && !import.meta.env?.DEV) {
        const currentFingerprint = this.generateBrowserFingerprint();
        
        if (storedFingerprint !== currentFingerprint) {
          this.fingerprintMismatches++;
          this.emitSecurityEvent('FINGERPRINT_MISMATCH', {
            stored: storedFingerprint.substring(0, 8) + '...',
            current: currentFingerprint.substring(0, 8) + '...',
            mismatches: this.fingerprintMismatches
          });
          
          // If too many mismatches, consider it suspicious
          if (this.fingerprintMismatches >= SECURITY_CONFIG.FINGERPRINT_MISMATCH_THRESHOLD) {
            this.emitSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
              reason: 'Multiple fingerprint mismatches',
              mismatches: this.fingerprintMismatches
            });
            this.handleSuspiciousActivity();
            return null;
          }
        } else {
          // Reset mismatch counter on successful match
          this.fingerprintMismatches = 0;
        }
      } else if (import.meta.env?.DEV) {
        // In development mode, skip fingerprint validation but update stored fingerprint
        const currentFingerprint = this.generateBrowserFingerprint();
        localStorage.setItem(STORAGE_KEYS.TOKEN_FINGERPRINT, currentFingerprint);
        this.fingerprintMismatches = 0;
      }
      
      return token;
    } catch (error) {
      this.emitSecurityEvent('TOKEN_RETRIEVAL_ERROR', { error: error.message });
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Set refresh token with secure storage considerations
   */
  setRefreshToken(token) {
    if (!token) {
      throw new Error('Refresh token is required');
    }
    
    try {
      // In production with HTTPS, consider using secure HTTP-only cookies
      if (window.location.protocol === 'https:') {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      } else {
        // Refresh token stored in localStorage over HTTP - not secure for production
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      }
      
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
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
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
   * Get token expiry time
   */
  getTokenExpiry() {
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    return expiry ? parseInt(expiry) : null;
  }

  /**
   * Check if token will expire soon
   */
  isTokenExpiringSoon(bufferMinutes = 10) {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;
    return Date.now() > (expiry - (bufferMinutes * 60 * 1000));
  }

  /**
   * Get token metadata
   */
  getTokenMetadata() {
    try {
      const metadata = localStorage.getItem(STORAGE_KEYS.TOKEN_METADATA);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.warn('Failed to parse token metadata:', error);
      return null;
    }
  }

  /**
   * Clear all tokens and security data
   */
  clearTokens() {
    const keysToRemove = Object.values(STORAGE_KEYS).concat([
      // Legacy keys for backward compatibility
      'techverse_token',
      'techverse_refresh_token',
      'techverse_token_expiry',
      'techverse_session_id',
      'techverse_token_fp',
      'techverse_user',
      'techverse_permissions',
      'session_expiry',
      'user_preferences',
      'techverse_security_context'
    ]);
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    });
    
    // Clear session storage as well
    try {
      sessionStorage.removeItem('techverse_temp_data');
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
    
    // Stop token validation
    this.stopTokenValidation();
    
    // Reset security state
    this.fingerprintMismatches = 0;
    this.lastFingerprintCheck = null;
    
    // Emit security event
    this.emitSecurityEvent('TOKENS_CLEARED', { timestamp: new Date().toISOString() });
    
    // Dispatch custom event for other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authTokensCleared', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
    
    console.log('All authentication data cleared securely');
  }

  /**
   * Handle suspicious activity
   */
  handleSuspiciousActivity() {
    // Clear tokens immediately
    this.clearTokens();
    
    // Set cooldown period
    const cooldownExpiry = Date.now() + SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_COOLDOWN;
    localStorage.setItem('techverse_security_cooldown', cooldownExpiry.toString());
    
    // Dispatch security event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('securityBreach', {
        detail: {
          type: 'SUSPICIOUS_ACTIVITY',
          timestamp: new Date().toISOString(),
          cooldownExpiry: new Date(cooldownExpiry).toISOString()
        }
      }));
    }
    
    // Suspicious activity detected - tokens cleared and cooldown activated
  }

  /**
   * Check if in security cooldown
   */
  isInSecurityCooldown() {
    const cooldown = localStorage.getItem('techverse_security_cooldown');
    if (!cooldown) return false;
    
    const cooldownExpiry = parseInt(cooldown);
    if (Date.now() > cooldownExpiry) {
      localStorage.removeItem('techverse_security_cooldown');
      return false;
    }
    
    return true;
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Start token validation monitoring
   */
  startTokenValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }
    
    this.validationInterval = setInterval(() => {
      this.validateStoredTokens();
    }, SECURITY_CONFIG.TOKEN_VALIDATION_INTERVAL);
  }

  /**
   * Stop token validation monitoring
   */
  stopTokenValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  /**
   * Validate stored tokens periodically
   */
  validateStoredTokens() {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;
    
    const validation = this.validateTokenFormat(token);
    if (!validation.valid) {
      this.emitSecurityEvent('PERIODIC_VALIDATION_FAILED', { reason: validation.reason });
      this.clearTokens();
    }
  }

  /**
   * Initialize security monitoring
   */
  initializeSecurityMonitoring() {
    // Listen for storage events (cross-tab token changes)
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
      
      // Listen for page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // Page became visible, validate tokens
          this.validateStoredTokens();
        }
      });
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
        console.log('Migrating tokens to enhanced security format...');
        
        // Validate old token
        const validation = this.validateTokenFormat(oldToken);
        if (validation.valid) {
          const expiryTime = oldExpiry ? parseInt(oldExpiry) : Date.now() + (7 * 24 * 60 * 60 * 1000);
          this.setToken(oldToken, Math.floor((expiryTime - Date.now()) / 1000));
          
          if (oldRefreshToken) {
            this.setRefreshToken(oldRefreshToken);
          }
          
          this.emitSecurityEvent('TOKEN_MIGRATION_SUCCESS', {
            oldFormat: 'v1',
            newFormat: 'v2'
          });
        }
        
        // Clean up old tokens
        ['techverse_token', 'techverse_refresh_token', 'techverse_token_expiry', 'techverse_token_fp'].forEach(key => {
          localStorage.removeItem(key);
        });
        
      } catch (error) {
        console.warn('Token migration failed:', error);
        this.emitSecurityEvent('TOKEN_MIGRATION_FAILED', { error: error.message });
      }
    }
  }

  /**
   * Add security event listener
   */
  addSecurityEventListener(listener) {
    this.securityEventListeners.push(listener);
    return () => {
      this.securityEventListeners = this.securityEventListeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit security event
   */
  emitSecurityEvent(type, data = {}) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      data
    };
    
    // Log security events in development
    if (import.meta.env?.DEV) {
      console.log(`🔒 Security Event: ${type}`, data);
    }
    
    // Notify listeners
    this.securityEventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Security event listener error:', error);
      }
    });
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    const metadata = this.getTokenMetadata();
    const hasToken = !!this.getToken();
    const hasRefreshToken = !!this.getRefreshToken();
    const isExpiringSoon = this.isTokenExpiringSoon();
    const inCooldown = this.isInSecurityCooldown();
    
    return {
      hasValidTokens: hasToken && hasRefreshToken,
      isExpiringSoon,
      inSecurityCooldown: inCooldown,
      fingerprintMismatches: this.fingerprintMismatches,
      securityLevel: metadata?.securityLevel || 'basic',
      lastCheck: this.lastFingerprintCheck,
      tokenAge: metadata ? Date.now() - metadata.issuedAt : null
    };
  }
}

// Create and export singleton instance
export const tokenManager = new EnhancedTokenManager();

export default tokenManager;