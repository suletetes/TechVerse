/**
 * Cloudinary Configuration
 * Handles cloud-based image storage and transformation
 */

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import logger from '../utils/logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Verify Cloudinary configuration
const verifyCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name || !api_key || !api_secret) {
    logger.warn('⚠️ Cloudinary credentials not configured. Image uploads will use local storage.');
    return false;
  }
  
  logger.info('✅ Cloudinary configured successfully', { cloud_name });
  return true;
};

// Check if Cloudinary is enabled
export const isCloudinaryEnabled = verifyCloudinaryConfig();

/**
 * Cloudinary folder structure
 * Organized by resource type for better management
 */
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: 'techverse/products',
  CATEGORIES: 'techverse/categories',
  USERS: 'techverse/users',
  BANNERS: 'techverse/banners',
  TEMP: 'techverse/temp'
};

/**
 * Image transformation presets
 * Optimized for different use cases
 */
export const IMAGE_TRANSFORMATIONS = {
  // Product images
  PRODUCT_MAIN: {
    width: 1200,
    height: 1200,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  PRODUCT_THUMBNAIL: {
    width: 400,
    height: 400,
    crop: 'fill',
    quality: 'auto:eco',
    fetch_format: 'auto'
  },
  PRODUCT_CARD: {
    width: 600,
    height: 600,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  
  // Category images
  CATEGORY_BANNER: {
    width: 1920,
    height: 600,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  CATEGORY_ICON: {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  
  // User avatars
  AVATAR_LARGE: {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  AVATAR_SMALL: {
    width: 100,
    height: 100,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:eco',
    fetch_format: 'auto'
  },
  
  // Banner images
  BANNER_DESKTOP: {
    width: 1920,
    height: 800,
    crop: 'fill',
    quality: 'auto:best',
    fetch_format: 'auto'
  },
  BANNER_MOBILE: {
    width: 768,
    height: 600,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto'
  }
};

/**
 * Create Cloudinary storage for multer
 */
export const createCloudinaryStorage = (folder, options = {}) => {
  if (!isCloudinaryEnabled) {
    return null;
  }

  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: options.transformation || [],
      resource_type: 'image',
      ...options.params
    }
  });
};

/**
 * Generate image URL with transformations
 */
export const getTransformedImageUrl = (publicId, transformation = 'PRODUCT_CARD') => {
  if (!publicId || !isCloudinaryEnabled) {
    return publicId;
  }

  const transformOptions = IMAGE_TRANSFORMATIONS[transformation] || IMAGE_TRANSFORMATIONS.PRODUCT_CARD;
  
  return cloudinary.url(publicId, transformOptions);
};

/**
 * Generate multiple image sizes
 */
export const generateImageSizes = (publicId) => {
  if (!publicId || !isCloudinaryEnabled) {
    return { original: publicId };
  }

  return {
    original: cloudinary.url(publicId, { quality: 'auto:best', fetch_format: 'auto' }),
    large: getTransformedImageUrl(publicId, 'PRODUCT_MAIN'),
    medium: getTransformedImageUrl(publicId, 'PRODUCT_CARD'),
    thumbnail: getTransformedImageUrl(publicId, 'PRODUCT_THUMBNAIL')
  };
};

/**
 * Upload image to Cloudinary
 */
export const uploadToCloudinary = async (filePath, folder, options = {}) => {
  if (!isCloudinaryEnabled) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      ...options
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    logger.error('Cloudinary upload failed', { error: error.message, filePath });
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryEnabled || !publicId) {
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    logger.error('Cloudinary delete failed', { error: error.message, publicId });
    return false;
  }
};

/**
 * Delete multiple images from Cloudinary
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
  if (!isCloudinaryEnabled || !publicIds || publicIds.length === 0) {
    return [];
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result.deleted;
  } catch (error) {
    logger.error('Cloudinary bulk delete failed', { error: error.message, count: publicIds.length });
    return [];
  }
};

/**
 * Get image details from Cloudinary
 */
export const getImageDetails = async (publicId) => {
  if (!isCloudinaryEnabled || !publicId) {
    return null;
  }

  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      createdAt: result.created_at
    };
  } catch (error) {
    logger.error('Failed to get image details', { error: error.message, publicId });
    return null;
  }
};

/**
 * List images in a folder
 */
export const listImagesInFolder = async (folder, options = {}) => {
  if (!isCloudinaryEnabled) {
    return [];
  }

  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: options.maxResults || 100,
      ...options
    });

    return result.resources.map(resource => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      bytes: resource.bytes,
      createdAt: resource.created_at
    }));
  } catch (error) {
    logger.error('Failed to list images', { error: error.message, folder });
    return [];
  }
};

/**
 * Clean up old temporary images
 */
export const cleanupTempImages = async (olderThanHours = 24) => {
  if (!isCloudinaryEnabled) {
    return 0;
  }

  try {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const images = await listImagesInFolder(CLOUDINARY_FOLDERS.TEMP);
    
    const oldImages = images.filter(img => new Date(img.createdAt) < cutoffDate);
    
    if (oldImages.length > 0) {
      const publicIds = oldImages.map(img => img.publicId);
      await deleteMultipleFromCloudinary(publicIds);
      logger.info(`Cleaned up ${oldImages.length} temporary images`);
    }
    
    return oldImages.length;
  } catch (error) {
    logger.error('Failed to cleanup temp images', { error: error.message });
    return 0;
  }
};

export default cloudinary;
