/**
 * CSRF Token Utilities
 * Handles CSRF token management for secure API requests
 */

import { tokenManager } from './tokenManager.js';
import { API_BASE_URL } from '../config/api.js';

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
  // API_BASE_URL already includes /api from .env
  const baseURL = API_BASE_URL;
  
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
      return data.csrfToken;
    }
  } catch (error) {
    // Failed to fetch CSRF token
  }

  // Fallback to simple endpoint
  try {
    const response = await fetch(`${baseURL}/security/csrf-token-simple`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.csrfToken;
    }
  } catch (error) {
    // Failed to fetch CSRF token
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