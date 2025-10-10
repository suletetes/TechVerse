// Data Formatting Utilities
// TODO: Implement data formatting functions

import { CURRENCY, DATE_FORMATS } from './constants.js';

// Currency formatting
export const formatCurrency = (amount, currency = CURRENCY.CODE) => {
  // TODO: Format currency based on locale
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Date formatting
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  // TODO: Format date based on format type
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  switch (format) {
    case DATE_FORMATS.DISPLAY:
      return dateObj.toLocaleDateString('en-GB');
    case DATE_FORMATS.DATETIME:
      return dateObj.toLocaleString('en-GB');
    case DATE_FORMATS.TIME:
      return dateObj.toLocaleTimeString('en-GB');
    default:
      return dateObj.toLocaleDateString('en-GB');
  }
};

// Number formatting
export const formatNumber = (number, decimals = 0) => {
  // TODO: Format numbers with proper separators
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

// Phone number formatting
export const formatPhoneNumber = (phone) => {
  // TODO: Format phone number
  if (!phone) return '';
  
  // Basic UK phone formatting
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4})(\d{6})$/);
  
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]}`;
  }
  
  return phone;
};

// Text truncation
export const truncateText = (text, maxLength = 100) => {
  // TODO: Truncate text with ellipsis
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Capitalize first letter
export const capitalize = (text) => {
  // TODO: Capitalize first letter of each word
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Format file size
export const formatFileSize = (bytes) => {
  // TODO: Format file size in human readable format
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPhoneNumber,
  truncateText,
  capitalize,
  formatFileSize
};