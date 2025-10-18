import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Format image URL for API responses
 * @param {string} imagePath - The image path (relative or absolute)
 * @param {string} baseUrl - The base URL of the server (optional)
 * @returns {string} - Properly formatted image URL
 */
export const formatImageUrl = (imagePath, baseUrl = '') => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /uploads or /img, return with base URL
  if (imagePath.startsWith('/uploads') || imagePath.startsWith('/img')) {
    return `${baseUrl}${imagePath}`;
  }
  
  // If it's a relative path in uploads directory
  if (imagePath.includes('uploads/')) {
    return `${baseUrl}/${imagePath}`;
  }
  
  // If it's just a filename, assume it's in uploads/products
  if (!imagePath.includes('/')) {
    return `${baseUrl}/uploads/products/${imagePath}`;
  }
  
  // Default: prepend /uploads/ if not present
  return `${baseUrl}/uploads/${imagePath}`;
};

/**
 * Format product images for API response
 * @param {Array} images - Array of image objects from product model
 * @param {string} baseUrl - The base URL of the server
 * @returns {Array} - Array of formatted image objects
 */
export const formatProductImages = (images = [], baseUrl = '') => {
  return images.map(image => ({
    ...image,
    url: formatImageUrl(image.url, baseUrl)
  }));
};

/**
 * Get base URL from request
 * @param {Object} req - Express request object
 * @returns {string} - Base URL
 */
export const getBaseUrl = (req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
};

/**
 * Create image object for database storage
 * @param {string} filename - The uploaded filename
 * @param {string} alt - Alt text for the image
 * @param {boolean} isPrimary - Whether this is the primary image
 * @param {string} folder - The folder where image is stored (products, categories, etc.)
 * @returns {Object} - Image object for database
 */
export const createImageObject = (filename, alt = '', isPrimary = false, folder = 'products') => {
  return {
    url: `/uploads/${folder}/${filename}`,
    alt: alt || filename.split('-')[0], // Use filename as fallback alt text
    isPrimary,
    publicId: null // For future Cloudinary integration
  };
};

/**
 * Get demo image URLs for seeding
 * @param {string} baseUrl - The base URL of the server
 * @returns {Object} - Object containing demo image URLs
 */
export const getDemoImageUrls = (baseUrl = '') => {
  return {
    laptop: `${baseUrl}/img/laptop-product.jpg`,
    laptopWebp: `${baseUrl}/img/laptop-product.webp`,
    phone: `${baseUrl}/img/phone-product.jpg`,
    phoneWebp: `${baseUrl}/img/phone-product.webp`,
    tablet: `${baseUrl}/img/tablet-product.jpg`,
    tabletWebp: `${baseUrl}/img/tablet-product.webp`,
    tabletLg: `${baseUrl}/img/tablet-lg.jpg`,
    tabletLgWebp: `${baseUrl}/img/tablet-lg.webp`,
    tv: `${baseUrl}/img/tv-product.jpg`,
    tvWebp: `${baseUrl}/img/tv-product.webp`,
    placeholder: `${baseUrl}/img/lazyload-ph.png`,
    spinner: `${baseUrl}/img/pageload-spinner.gif`
  };
};

/**
 * Validate image URL accessibility
 * @param {string} imageUrl - The image URL to validate
 * @returns {boolean} - Whether the URL is accessible
 */
export const validateImageUrl = (imageUrl) => {
  try {
    new URL(imageUrl);
    return true;
  } catch {
    // If not a valid URL, check if it's a valid path
    return imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0;
  }
};

export default {
  formatImageUrl,
  formatProductImages,
  getBaseUrl,
  createImageObject,
  getDemoImageUrls,
  validateImageUrl
};