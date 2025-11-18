/**
 * CSRF Token Utilities
 * Handles CSRF token management for secure API requests
 */

import { tokenManager } from './tokenManager.js';

/**
 * Get CSRF token from cookie
 */
export const getCsrfTokenFromCookie = () => {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token') {
        return decodeURIComponent(value);
      }
    }
  }
  return null;
};

/**
 * Fetch CSRF token from server
 */
export const fetchCsrfToken = async () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  // Try authenticated endpoint first
  try {
    const response = await fetch(`${baseURL}/security/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenManager.getToken()}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ CSRF token fetched successfully (authenticated)');
      return data.csrfToken;
    } else {
      console.warn('❌ Failed to fetch CSRF token:', response.status, response.statusText);
    }
  } catch (error) {
    console.warn('❌ Failed to fetch CSRF token:', error.message);
  }

  // Fallback to simple endpoint
  try {
    console.log('🔄 Trying simple CSRF endpoint...');
    const response = await fetch(`${baseURL}/security/csrf-token-simple`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ CSRF token fetched successfully (simple)');
      return data.csrfToken;
    } else {
      console.error('❌ Failed to fetch CSRF token (simple):', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Failed to fetch CSRF token (simple):', error.message);
  }

  return null;
};

/**
 * Ensure CSRF token is available
 * Fetches token if not present in cookie
 */
export const ensureCsrfToken = async () => {
  let token = getCsrfTokenFromCookie();
  
  if (!token) {
    console.log('🔄 No CSRF token found, fetching from server...');
    token = await fetchCsrfToken();
  }
  
  return token;
};

/**
 * Add CSRF token to request headers
 */
export const addCsrfTokenToHeaders = async (headers = {}) => {
  const token = await ensureCsrfToken();
  
  if (token) {
    return {
      ...headers,
      'X-CSRF-Token': token
    };
  }
  
  return headers;
};