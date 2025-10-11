// General Helper Functions
// TODO: Implement utility helper functions

// Generate unique ID
export const generateId = () => {
  // TODO: Generate unique identifier
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function
export const debounce = (func, wait) => {
  // TODO: Implement debounce for search/input
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  // TODO: Implement throttle for scroll/resize events
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone object
export const deepClone = (obj) => {
  // TODO: Deep clone objects
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Check if object is empty
export const isEmpty = (obj) => {
  // TODO: Check if object/array is empty
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
};

// Get nested object property safely
export const getNestedProperty = (obj, path, defaultValue = null) => {
  // TODO: Safely get nested properties
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
};

// Set nested object property
export const setNestedProperty = (obj, path, value) => {
  // TODO: Set nested properties
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;
  
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
  return obj;
};

// Convert query params to object
export const parseQueryParams = (queryString) => {
  // TODO: Parse URL query parameters
  const params = new URLSearchParams(queryString);
  const result = {};
  
  // for (const [key, value] = params.entries()) {
  //   result[key] = value;
  // }
  
  return result;
};

// Convert object to query string
export const objectToQueryString = (obj) => {
  // TODO: Convert object to query string
  const params = new URLSearchParams();
  
  Object.keys(obj).forEach(key => {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      params.append(key, obj[key]);
    }
  });
  
  return params.toString();
};

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Array helpers
export const arrayHelpers = {
  // Remove duplicates from array
  unique: (arr, key = null) => {
    if (key) {
      const seen = new Set();
      return arr.filter(item => {
        const value = getNestedProperty(item, key);
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    return [...new Set(arr)];
  },
  
  // Group array by key
  groupBy: (arr, key) => {
    return arr.reduce((groups, item) => {
      const value = getNestedProperty(item, key);
      if (!groups[value]) groups[value] = [];
      groups[value].push(item);
      return groups;
    }, {});
  },
  
  // Sort array by key
  sortBy: (arr, key, direction = 'asc') => {
    return [...arr].sort((a, b) => {
      const aVal = getNestedProperty(a, key);
      const bVal = getNestedProperty(b, key);
      
      if (direction === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  }
};

export default {
  generateId,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  getNestedProperty,
  setNestedProperty,
  parseQueryParams,
  objectToQueryString,
  storage,
  arrayHelpers
};