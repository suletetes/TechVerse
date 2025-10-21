// Enhanced Helper Utilities
// Consolidates common helper functions and utilities

import { STORAGE_KEYS, ERROR_CODES } from '../constants/index.js';

// Deep clone utility
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    Object.keys(obj).forEach(key => {
      clonedObj[key] = deepClone(obj[key]);
    });
    return clonedObj;
  }
};

// Deep merge utility
export const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }

  return deepMerge(target, ...sources);
};

// Type checking utilities
export const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

export const isArray = (item) => {
  return Array.isArray(item);
};

export const isFunction = (item) => {
  return typeof item === 'function';
};

export const isString = (item) => {
  return typeof item === 'string';
};

export const isNumber = (item) => {
  return typeof item === 'number' && !isNaN(item);
};

export const isBoolean = (item) => {
  return typeof item === 'boolean';
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Array utilities
export const arrayUtils = {
  // Remove duplicates from array
  unique: (array, key = null) => {
    if (!Array.isArray(array)) return [];
    
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = typeof key === 'function' ? key(item) : item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(array)];
  },
  
  // Group array by key
  groupBy: (array, key) => {
    if (!Array.isArray(array)) return {};
    
    return array.reduce((groups, item) => {
      const value = typeof key === 'function' ? key(item) : item[key];
      groups[value] = groups[value] || [];
      groups[value].push(item);
      return groups;
    }, {});
  },
  
  // Sort array by multiple keys
  sortBy: (array, keys) => {
    if (!Array.isArray(array)) return [];
    
    return [...array].sort((a, b) => {
      for (const key of keys) {
        const { field, direction = 'asc' } = typeof key === 'string' ? { field: key } : key;
        
        let aVal = typeof field === 'function' ? field(a) : a[field];
        let bVal = typeof field === 'function' ? field(b) : b[field];
        
        // Handle null/undefined values
        if (aVal == null && bVal == null) continue;
        if (aVal == null) return direction === 'asc' ? 1 : -1;
        if (bVal == null) return direction === 'asc' ? -1 : 1;
        
        // Convert to comparable values
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  },
  
  // Chunk array into smaller arrays
  chunk: (array, size) => {
    if (!Array.isArray(array) || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  // Find differences between arrays
  difference: (array1, array2, key = null) => {
    if (!Array.isArray(array1) || !Array.isArray(array2)) return [];
    
    if (key) {
      const set2 = new Set(array2.map(item => typeof key === 'function' ? key(item) : item[key]));
      return array1.filter(item => {
        const value = typeof key === 'function' ? key(item) : item[key];
        return !set2.has(value);
      });
    }
    
    const set2 = new Set(array2);
    return array1.filter(item => !set2.has(item));
  },
  
  // Intersection of arrays
  intersection: (array1, array2, key = null) => {
    if (!Array.isArray(array1) || !Array.isArray(array2)) return [];
    
    if (key) {
      const set2 = new Set(array2.map(item => typeof key === 'function' ? key(item) : item[key]));
      return array1.filter(item => {
        const value = typeof key === 'function' ? key(item) : item[key];
        return set2.has(value);
      });
    }
    
    const set2 = new Set(array2);
    return array1.filter(item => set2.has(item));
  }
};

// Object utilities
export const objectUtils = {
  // Get nested property safely
  get: (obj, path, defaultValue = undefined) => {
    if (!obj || typeof path !== 'string') return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') return defaultValue;
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  },
  
  // Set nested property
  set: (obj, path, value) => {
    if (!obj || typeof path !== 'string') return obj;
    
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return obj;
  },
  
  // Pick specific properties
  pick: (obj, keys) => {
    if (!obj || !Array.isArray(keys)) return {};
    
    const result = {};
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },
  
  // Omit specific properties
  omit: (obj, keys) => {
    if (!obj || !Array.isArray(keys)) return obj;
    
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },
  
  // Transform object keys
  mapKeys: (obj, transformer) => {
    if (!obj || typeof transformer !== 'function') return obj;
    
    const result = {};
    Object.keys(obj).forEach(key => {
      const newKey = transformer(key, obj[key]);
      result[newKey] = obj[key];
    });
    return result;
  },
  
  // Transform object values
  mapValues: (obj, transformer) => {
    if (!obj || typeof transformer !== 'function') return obj;
    
    const result = {};
    Object.keys(obj).forEach(key => {
      result[key] = transformer(obj[key], key);
    });
    return result;
  },
  
  // Flatten nested object
  flatten: (obj, prefix = '', separator = '.') => {
    const result = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      
      if (isObject(value) && !Array.isArray(value)) {
        Object.assign(result, objectUtils.flatten(value, newKey, separator));
      } else {
        result[newKey] = value;
      }
    });
    
    return result;
  }
};

// String utilities
export const stringUtils = {
  // Generate random string
  random: (length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  },
  
  // Generate UUID v4
  uuid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  // Escape HTML
  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // Unescape HTML
  unescapeHtml: (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },
  
  // Convert camelCase to kebab-case
  kebabCase: (str) => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  },
  
  // Convert kebab-case to camelCase
  camelCase: (str) => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  },
  
  // Convert to snake_case
  snakeCase: (str) => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();
  }
};

// Local storage utilities with error handling
export const storageUtils = {
  // Set item with error handling
  set: (key, value, options = {}) => {
    const { encrypt = false, expiry = null } = options;
    
    try {
      let dataToStore = value;
      
      if (expiry) {
        dataToStore = {
          value,
          expiry: Date.now() + expiry
        };
      }
      
      const serialized = JSON.stringify(dataToStore);
      
      if (encrypt) {
        // Basic encoding (not secure encryption)
        const encoded = btoa(serialized);
        localStorage.setItem(key, encoded);
      } else {
        localStorage.setItem(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  // Get item with error handling
  get: (key, options = {}) => {
    const { decrypt = false, defaultValue = null } = options;
    
    try {
      let item = localStorage.getItem(key);
      
      if (!item) return defaultValue;
      
      if (decrypt) {
        item = atob(item);
      }
      
      const parsed = JSON.parse(item);
      
      // Check expiry
      if (parsed && typeof parsed === 'object' && parsed.expiry) {
        if (Date.now() > parsed.expiry) {
          localStorage.removeItem(key);
          return defaultValue;
        }
        return parsed.value;
      }
      
      return parsed;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },
  
  // Remove item
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },
  
  // Clear all items with prefix
  clearPrefix: (prefix) => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Storage clear prefix error:', error);
      return false;
    }
  },
  
  // Get storage size
  getSize: () => {
    try {
      let total = 0;
      Object.keys(localStorage).forEach(key => {
        total += localStorage.getItem(key).length;
      });
      return total;
    } catch (error) {
      console.error('Storage size error:', error);
      return 0;
    }
  }
};

// URL utilities
export const urlUtils = {
  // Parse query string
  parseQuery: (queryString = window.location.search) => {
    const params = new URLSearchParams(queryString);
    const result = {};
    
    for (const [key, value] of params) {
      result[key] = value;
    }
    
    return result;
  },
  
  // Build query string
  buildQuery: (params) => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  },
  
  // Update URL without page reload
  updateUrl: (path, params = {}, options = {}) => {
    const { replace = false, preserveQuery = false } = options;
    
    let url = path;
    
    if (preserveQuery) {
      const currentParams = urlUtils.parseQuery();
      const mergedParams = { ...currentParams, ...params };
      const queryString = urlUtils.buildQuery(mergedParams);
      url = queryString ? `${path}?${queryString}` : path;
    } else if (Object.keys(params).length > 0) {
      const queryString = urlUtils.buildQuery(params);
      url = `${path}?${queryString}`;
    }
    
    if (replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
  },
  
  // Check if URL is external
  isExternal: (url) => {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin !== window.location.origin;
    } catch (error) {
      return false;
    }
  }
};

// Debounce and throttle utilities
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Retry utility with exponential backoff
export const retry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = () => true
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }
      
      const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Performance measurement utility
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await fn(...args);
      const endTime = performance.now();
      
      console.log(`⏱️ ${name} took ${(endTime - startTime).toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ ${name} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    }
  };
};

// Export all utilities
export default {
  deepClone,
  deepMerge,
  isObject,
  isArray,
  isFunction,
  isString,
  isNumber,
  isBoolean,
  isEmpty,
  arrayUtils,
  objectUtils,
  stringUtils,
  storageUtils,
  urlUtils,
  debounce,
  throttle,
  retry,
  measurePerformance
};