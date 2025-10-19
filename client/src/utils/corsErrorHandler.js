/**
 * Client-side CORS Error Detection and Handling
 */

import config from '../config/environment.js';

// CORS error detection patterns
const CORS_ERROR_PATTERNS = [
  /CORS/i,
  /Cross-Origin Request Blocked/i,
  /Access to fetch at .* has been blocked by CORS policy/i,
  /No 'Access-Control-Allow-Origin' header/i,
  /Origin .* is not allowed by Access-Control-Allow-Origin/i
];

// Network error patterns that might be CORS-related
const NETWORK_ERROR_PATTERNS = [
  /NetworkError/i,
  /Failed to fetch/i,
  /ERR_BLOCKED_BY_CLIENT/i,
  /ERR_NETWORK/i
];

/**
 * Detect if an error is CORS-related
 */
export const isCorsError = (error) => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  
  // Direct CORS error detection
  if (CORS_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage))) {
    return true;
  }
  
  // Check for specific error properties
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    // This could be a CORS error, but we need more context
    return 'possible';
  }
  
  // Check for network errors that might be CORS
  if (NETWORK_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage))) {
    return 'possible';
  }
  
  // Check response status and headers
  if (error.response) {
    const { status, headers } = error.response;
    
    // 403 without CORS headers might be CORS error
    if (status === 403 && !headers['access-control-allow-origin']) {
      return 'likely';
    }
    
    // Check for CORS error codes
    if (error.response.data?.code?.startsWith('CORS_')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Generate user-friendly CORS error message
 */
export const generateCorsErrorMessage = (error, requestUrl) => {
  const corsDetection = isCorsError(error);
  
  if (corsDetection === true) {
    return {
      title: 'Connection Blocked',
      message: 'The server has blocked this request due to security policies. This usually happens when the website domain is not authorized to access the API.',
      type: 'cors',
      canRetry: false,
      suggestions: config.DEBUG_MODE ? [
        'Check if the API server is running',
        'Verify CORS configuration on the server',
        'Ensure the client URL is in the server\'s allowed origins'
      ] : [
        'Please try refreshing the page',
        'Contact support if the problem persists'
      ]
    };
  }
  
  if (corsDetection === 'likely' || corsDetection === 'possible') {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. This might be due to network issues or security restrictions.',
      type: 'network-cors',
      canRetry: true,
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact support if the problem continues'
      ]
    };
  }
  
  return null;
};

/**
 * Handle CORS errors with appropriate user feedback
 */
export const handleCorsError = (error, requestUrl, options = {}) => {
  const corsError = generateCorsErrorMessage(error, requestUrl);
  
  if (!corsError) {
    return null; // Not a CORS error
  }
  
  // Log CORS error for debugging
  if (config.DEBUG_MODE || config.ENABLE_LOGGING) {
    console.group('🚫 CORS Error Detected');
    console.error('Original Error:', error);
    console.log('Request URL:', requestUrl);
    console.log('Current Origin:', window.location.origin);
    console.log('API Base URL:', config.API_BASE_URL);
    console.log('Environment:', config.ENVIRONMENT);
    console.groupEnd();
  }
  
  // Create enhanced error object
  const enhancedError = {
    ...corsError,
    originalError: error,
    requestUrl,
    timestamp: new Date().toISOString(),
    environment: config.ENVIRONMENT,
    origin: window.location.origin,
    apiBaseUrl: config.API_BASE_URL
  };
  
  // Call error callback if provided
  if (options.onError) {
    options.onError(enhancedError);
  }
  
  return enhancedError;
};

/**
 * Test CORS configuration by making a preflight request
 */
export const testCorsConfiguration = async () => {
  const testUrl = `${config.API_BASE_URL}/health/cors`;
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      cors: data.cors,
      message: 'CORS configuration is working correctly'
    };
    
  } catch (error) {
    const corsError = handleCorsError(error, testUrl);
    
    return {
      success: false,
      error: corsError || {
        title: 'Connection Test Failed',
        message: error.message,
        type: 'unknown'
      },
      originalError: error
    };
  }
};

/**
 * Get CORS troubleshooting information
 */
export const getCorsDebugInfo = () => {
  return {
    environment: config.ENVIRONMENT,
    currentOrigin: window.location.origin,
    apiBaseUrl: config.API_BASE_URL,
    corsEnabled: config.CORS_ENABLED,
    debugMode: config.DEBUG_MODE,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port
  };
};

/**
 * Middleware to add CORS error handling to fetch requests
 */
export const withCorsErrorHandling = (fetchFunction) => {
  return async (url, options = {}) => {
    try {
      const response = await fetchFunction(url, options);
      return response;
    } catch (error) {
      const corsError = handleCorsError(error, url, options);
      
      if (corsError) {
        // Throw enhanced CORS error
        const enhancedError = new Error(corsError.message);
        enhancedError.name = 'CorsError';
        enhancedError.corsInfo = corsError;
        enhancedError.originalError = error;
        throw enhancedError;
      }
      
      // Re-throw original error if not CORS-related
      throw error;
    }
  };
};

export default {
  isCorsError,
  generateCorsErrorMessage,
  handleCorsError,
  testCorsConfiguration,
  getCorsDebugInfo,
  withCorsErrorHandling
};