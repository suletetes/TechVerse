// Enhanced Formatting Utilities
// Consolidates and enhances formatting functions from multiple files

import { CURRENCY, DATE_FORMATS, LOCALES } from '../constants/index.js';

// Currency formatting with enhanced options
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = CURRENCY.CODE,
    locale = CURRENCY.LOCALE,
    minimumFractionDigits = CURRENCY.DECIMAL_PLACES,
    maximumFractionDigits = CURRENCY.DECIMAL_PLACES,
    showSymbol = true,
    showCode = false
  } = options;
  
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${CURRENCY.SYMBOL}0.00` : '0.00';
  }
  
  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits,
    maximumFractionDigits
  });
  
  let formatted = formatter.format(amount);
  
  if (showCode && showSymbol) {
    formatted += ` ${currency}`;
  }
  
  return formatted;
};

// Enhanced date formatting with relative time support
export const formatDate = (date, format = DATE_FORMATS.DISPLAY, options = {}) => {
  const { locale = LOCALES.EN_GB, timezone } = options;
  
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const formatOptions = timezone ? { timeZone: timezone } : {};
  
  switch (format) {
    case DATE_FORMATS.DISPLAY:
      return dateObj.toLocaleDateString(locale, formatOptions);
      
    case DATE_FORMATS.DATETIME:
      return dateObj.toLocaleString(locale, {
        ...formatOptions,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
    case DATE_FORMATS.TIME:
      return dateObj.toLocaleTimeString(locale, {
        ...formatOptions,
        hour: '2-digit',
        minute: '2-digit'
      });
      
    case DATE_FORMATS.ISO:
      return dateObj.toISOString();
      
    case DATE_FORMATS.API:
      return dateObj.toISOString().split('T')[0];
      
    case DATE_FORMATS.RELATIVE:
      return formatRelativeTime(dateObj, options);
      
    default:
      return dateObj.toLocaleDateString(locale, formatOptions);
  }
};

// Relative time formatting (e.g., "2 hours ago", "in 3 days")
export const formatRelativeTime = (date, options = {}) => {
  const { locale = LOCALES.EN_GB, now = new Date() } = options;
  
  const dateObj = new Date(date);
  const nowObj = new Date(now);
  
  if (isNaN(dateObj.getTime()) || isNaN(nowObj.getTime())) {
    return 'Invalid Date';
  }
  
  const diffMs = dateObj.getTime() - nowObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Use Intl.RelativeTimeFormat if available
  if (Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (Math.abs(diffDays) >= 1) {
      return rtf.format(diffDays, 'day');
    } else if (Math.abs(diffHours) >= 1) {
      return rtf.format(diffHours, 'hour');
    } else if (Math.abs(diffMinutes) >= 1) {
      return rtf.format(diffMinutes, 'minute');
    } else {
      return rtf.format(diffSeconds, 'second');
    }
  }
  
  // Fallback for older browsers
  const abs = Math.abs;
  const isPast = diffMs < 0;
  
  if (abs(diffDays) >= 1) {
    return isPast ? `${abs(diffDays)} day${abs(diffDays) > 1 ? 's' : ''} ago` : `in ${abs(diffDays)} day${abs(diffDays) > 1 ? 's' : ''}`;
  } else if (abs(diffHours) >= 1) {
    return isPast ? `${abs(diffHours)} hour${abs(diffHours) > 1 ? 's' : ''} ago` : `in ${abs(diffHours)} hour${abs(diffHours) > 1 ? 's' : ''}`;
  } else if (abs(diffMinutes) >= 1) {
    return isPast ? `${abs(diffMinutes)} minute${abs(diffMinutes) > 1 ? 's' : ''} ago` : `in ${abs(diffMinutes)} minute${abs(diffMinutes) > 1 ? 's' : ''}`;
  } else {
    return 'just now';
  }
};

// Enhanced number formatting
export const formatNumber = (number, options = {}) => {
  const {
    decimals = 0,
    locale = LOCALES.EN_GB,
    style = 'decimal',
    notation = 'standard',
    compactDisplay = 'short'
  } = options;
  
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  const formatOptions = {
    style,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  };
  
  if (notation === 'compact') {
    formatOptions.notation = 'compact';
    formatOptions.compactDisplay = compactDisplay;
  }
  
  return new Intl.NumberFormat(locale, formatOptions).format(number);
};

// Percentage formatting
export const formatPercentage = (value, total = 100, options = {}) => {
  const { decimals = 1, locale = LOCALES.EN_GB } = options;
  
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  const percentage = total === 100 ? value : (value / total) * 100;
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(percentage / 100);
};

// Phone number formatting with international support
export const formatPhoneNumber = (phone, options = {}) => {
  const { country = 'GB', format = 'international' } = options;
  
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (country === 'GB' && format === 'national') {
    // UK national format: 01234 567890
    const match = cleaned.match(/^(?:44)?(\d{2})(\d{4})(\d{6})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`;
    }
  }
  
  if (country === 'GB' && format === 'international') {
    // UK international format: +44 1234 567890
    const match = cleaned.match(/^(?:44)?(\d{2})(\d{4})(\d{6})$/);
    if (match) {
      return `+44 ${match[1]} ${match[2]} ${match[3]}`;
    }
  }
  
  // Generic international format
  if (cleaned.length >= 10) {
    const countryCode = cleaned.slice(0, -10);
    const number = cleaned.slice(-10);
    const area = number.slice(0, 3);
    const exchange = number.slice(3, 6);
    const subscriber = number.slice(6);
    
    return countryCode ? `+${countryCode} ${area} ${exchange} ${subscriber}` : `${area} ${exchange} ${subscriber}`;
  }
  
  return phone; // Return original if no pattern matches
};

// Text formatting utilities
export const formatText = {
  // Truncate text with ellipsis
  truncate: (text, maxLength = 100, options = {}) => {
    const { suffix = '...', wordBoundary = true } = options;
    
    if (!text || text.length <= maxLength) return text || '';
    
    if (wordBoundary) {
      const truncated = text.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      return lastSpace > 0 ? truncated.substring(0, lastSpace) + suffix : truncated + suffix;
    }
    
    return text.substring(0, maxLength) + suffix;
  },
  
  // Capitalize text
  capitalize: (text, options = {}) => {
    const { allWords = false, preserveCase = false } = options;
    
    if (!text) return '';
    
    if (allWords) {
      return text.split(' ').map(word => 
        word.charAt(0).toUpperCase() + (preserveCase ? word.slice(1) : word.slice(1).toLowerCase())
      ).join(' ');
    }
    
    return text.charAt(0).toUpperCase() + (preserveCase ? text.slice(1) : text.slice(1).toLowerCase());
  },
  
  // Convert to slug format
  slugify: (text, options = {}) => {
    const { separator = '-', lowercase = true } = options;
    
    if (!text) return '';
    
    let slug = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, separator); // Replace spaces with separator
    
    return lowercase ? slug.toLowerCase() : slug;
  },
  
  // Extract initials
  initials: (name, options = {}) => {
    const { maxInitials = 2, uppercase = true } = options;
    
    if (!name) return '';
    
    const words = name.trim().split(/\s+/);
    const initials = words
      .slice(0, maxInitials)
      .map(word => word.charAt(0))
      .join('');
    
    return uppercase ? initials.toUpperCase() : initials;
  },
  
  // Mask sensitive data
  mask: (text, options = {}) => {
    const { 
      maskChar = '*', 
      visibleStart = 2, 
      visibleEnd = 2, 
      minLength = 4 
    } = options;
    
    if (!text || text.length < minLength) return text;
    
    const start = text.substring(0, visibleStart);
    const end = text.substring(text.length - visibleEnd);
    const middle = maskChar.repeat(text.length - visibleStart - visibleEnd);
    
    return start + middle + end;
  }
};

// File size formatting
export const formatFileSize = (bytes, options = {}) => {
  const { 
    decimals = 2, 
    binary = false, 
    locale = LOCALES.EN_GB 
  } = options;
  
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return 'Unknown';
  
  const k = binary ? 1024 : 1000;
  const sizes = binary 
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return `${formatter.format(size)} ${sizes[i]}`;
};

// Duration formatting
export const formatDuration = (milliseconds, options = {}) => {
  const { 
    format = 'auto', // 'auto', 'short', 'long', 'precise'
    locale = LOCALES.EN_GB 
  } = options;
  
  if (!milliseconds || isNaN(milliseconds)) return '0ms';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (format === 'precise') {
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);
    if (milliseconds % 1000 > 0) parts.push(`${milliseconds % 1000}ms`);
    return parts.join(' ') || '0ms';
  }
  
  if (format === 'auto') {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    if (seconds < 60) return `${(milliseconds / 1000).toFixed(2)}s`;
    if (minutes < 60) return `${Math.round(minutes)}m ${seconds % 60}s`;
    if (hours < 24) return `${Math.round(hours)}h ${minutes % 60}m`;
    return `${days}d ${hours % 24}h`;
  }
  
  // Use Intl.DurationFormat if available (future API)
  if (format === 'long' && Intl.DurationFormat) {
    try {
      const formatter = new Intl.DurationFormat(locale, { style: 'long' });
      return formatter.format({ milliseconds });
    } catch (error) {
      // Fallback to manual formatting
    }
  }
  
  // Manual long format
  if (format === 'long') {
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 > 1 ? 's' : ''}`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}`);
    if (seconds % 60 > 0) parts.push(`${seconds % 60} second${seconds % 60 > 1 ? 's' : ''}`);
    return parts.join(', ') || '0 seconds';
  }
  
  return `${Math.round(milliseconds)}ms`;
};

// Address formatting
export const formatAddress = (address, options = {}) => {
  const { 
    format = 'multiline', // 'multiline', 'inline', 'short'
    country = 'GB' 
  } = options;
  
  if (!address) return '';
  
  const {
    line1,
    line2,
    city,
    state,
    postcode,
    country: addressCountry
  } = address;
  
  const parts = [line1, line2, city, state, postcode].filter(Boolean);
  
  if (format === 'inline') {
    return parts.join(', ');
  }
  
  if (format === 'short') {
    return [city, postcode].filter(Boolean).join(', ');
  }
  
  // Multiline format (default)
  return parts.join('\n');
};

// List formatting
export const formatList = (items, options = {}) => {
  const { 
    style = 'long', // 'long', 'short', 'narrow'
    type = 'conjunction', // 'conjunction', 'disjunction'
    locale = LOCALES.EN_GB 
  } = options;
  
  if (!Array.isArray(items) || items.length === 0) return '';
  
  if (items.length === 1) return String(items[0]);
  
  if (Intl.ListFormat) {
    const formatter = new Intl.ListFormat(locale, { style, type });
    return formatter.format(items.map(String));
  }
  
  // Fallback for older browsers
  if (items.length === 2) {
    return type === 'disjunction' 
      ? `${items[0]} or ${items[1]}`
      : `${items[0]} and ${items[1]}`;
  }
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  const conjunction = type === 'disjunction' ? 'or' : 'and';
  
  return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
};

// Export all formatters
export default {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  formatPhoneNumber,
  formatText,
  formatFileSize,
  formatDuration,
  formatAddress,
  formatList
};