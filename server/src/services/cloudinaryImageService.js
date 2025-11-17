/**
 * Enhanced Image Service with Cloudinary Support
 * Handles both cloud and local storage with automatic fallback
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import {
  isCloudinaryEnabled,
  CLOUDINARY_FOLDERS,
  createCloudinaryStorage,
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  getTransformedImageUrl,
  generateImageSizes
} from '../config/cloudinary.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local storage configuration (fallback)
const uploadsDir = path.join(__dirname, '../../uploads');
const localFolders = {
  products: path.join(uploadsDir, 'products'),
  categories: path.join(uploadsDir, 'categories'),
  users: path.join(uploadsDir, 'users'),
  reviews: path.join(uploadsDir, 'reviews'),
  banners: path.join(uploadsDir, 'banners'),
  temp: path.join(uploadsDir, 'temp')
};

// Ensure local directories exist
Object.values(localFolders).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Local storage configuration for multer
 */
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    
    // Determine folder based on field name or route
    if (file.fieldname.includes('product') || req.route?.path?.includes('product')) {
      uploadPath = localFolders.products;
    } else if (file.fieldname.includes('category') || req.route?.path?.includes('categor')) {
      uploadPath = localFolders.categories;
    } else if (file.fieldname.includes('avatar') || file.fieldname.includes('user')) {
      uploadPath = localFolders.users;
    } else if (file.fieldname.includes('review')) {
      uploadPath = localFolders.reviews;
    } else if (file.fieldname.includes('banner')) {
      uploadPath = localFolders.banners;
    } else {
      uploadPath = localFolders.temp;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      .substring(0, 50);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter for images
 */
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
  }
};

/**
 * Create multer upload middleware
 */
const createUploadMiddleware = (folder, options = {}) => {
  const storage = isCloudinaryEnabled 
    ? createCloudinaryStorage(folder, options)
    : localStorage;

  return multer({
    storage: storage,
    limits: {
      fileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB default
      files: options.maxFiles || 10
    },
    fileFilter: imageFileFilter
  });
};

class CloudinaryImageService {
  /**
   * Upload single image
   */
  static uploadSingle(fieldName = 'image', folder = CLOUDINARY_FOLDERS.TEMP, options = {}) {
    const upload = createUploadMiddleware(folder, options);
    return upload.single(fieldName);
  }

  /**
   * Upload multiple images
   */
  static uploadMultiple(fieldName = 'images', maxCount = 10, folder = CLOUDINARY_FOLDERS.TEMP, options = {}) {
    const upload = createUploadMiddleware(folder, { ...options, maxFiles: maxCount });
    return upload.array(fieldName, maxCount);
  }

  /**
   * Upload mixed fields
   */
  static uploadFields(fields, folder = CLOUDINARY_FOLDERS.TEMP, options = {}) {
    const upload = createUploadMiddleware(folder, options);
    return upload.fields(fields);
  }

  /**
   * Process and upload single image
   */
  static async uploadImage(file, folder = CLOUDINARY_FOLDERS.TEMP, options = {}) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // If using Cloudinary and file is already uploaded
      if (isCloudinaryEnabled && file.path && file.path.startsWith('http')) {
        return {
          url: file.path,
          publicId: file.filename,
          width: file.width,
          height: file.height,
          format: file.format || path.extname(file.originalname).substring(1),
          size: file.size
        };
      }

      // If using Cloudinary but file is local (needs upload)
      if (isCloudinaryEnabled && file.path) {
        const result = await uploadToCloudinary(file.path, folder, options);
        
        // Delete local file after upload
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        return result;
      }

      // Local storage - process with Sharp
      if (file.path) {
        const processedPath = await this.processLocalImage(file.path, options);
        
        return {
          url: `/uploads/${path.relative(uploadsDir, processedPath)}`,
          path: processedPath,
          publicId: path.basename(processedPath),
          size: file.size
        };
      }

      throw new Error('Invalid file object');
    } catch (error) {
      logger.error('Image upload failed', { error: error.message, file: file?.originalname });
      throw error;
    }
  }

  /**
   * Process and upload multiple images
   */
  static async uploadMultipleImages(files, folder = CLOUDINARY_FOLDERS.TEMP, options = {}) {
    if (!files || files.length === 0) {
      return [];
    }

    const uploadPromises = files.map(file => this.uploadImage(file, folder, options));
    
    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      logger.error('Multiple image upload failed', { error: error.message, count: files.length });
      throw error;
    }
  }

  /**
   * Delete image
   */
  static async deleteImage(publicIdOrPath) {
    try {
      if (!publicIdOrPath) {
        return false;
      }

      // Cloudinary deletion
      if (isCloudinaryEnabled && !publicIdOrPath.startsWith('/')) {
        return await deleteFromCloudinary(publicIdOrPath);
      }

      // Local file deletion
      const filePath = publicIdOrPath.startsWith('/') 
        ? path.join(uploadsDir, publicIdOrPath.replace('/uploads/', ''))
        : publicIdOrPath;

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('Local image deleted', { path: filePath });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Image deletion failed', { error: error.message, publicIdOrPath });
      return false;
    }
  }

  /**
   * Delete multiple images
   */
  static async deleteMultipleImages(publicIdsOrPaths) {
    if (!publicIdsOrPaths || publicIdsOrPaths.length === 0) {
      return [];
    }

    // Cloudinary bulk deletion
    if (isCloudinaryEnabled && !publicIdsOrPaths[0].startsWith('/')) {
      return await deleteMultipleFromCloudinary(publicIdsOrPaths);
    }

    // Local file deletion
    const results = await Promise.all(
      publicIdsOrPaths.map(path => this.deleteImage(path))
    );

    return results.filter(Boolean);
  }

  /**
   * Process local image with Sharp
   */
  static async processLocalImage(filePath, options = {}) {
    try {
      const {
        width = 1200,
        height = 1200,
        quality = 90,
        format = 'jpeg'
      } = options;

      const outputPath = filePath.replace(
        path.extname(filePath),
        `-processed${path.extname(filePath)}`
      );

      await sharp(filePath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toFile(outputPath);

      // Delete original if different from output
      if (filePath !== outputPath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return outputPath;
    } catch (error) {
      logger.error('Image processing failed', { error: error.message, filePath });
      return filePath; // Return original on error
    }
  }

  /**
   * Get image URL with transformations
   */
  static getImageUrl(publicIdOrPath, transformation = 'PRODUCT_CARD') {
    if (!publicIdOrPath) {
      return null;
    }

    // Cloudinary URL with transformation
    if (isCloudinaryEnabled && !publicIdOrPath.startsWith('/')) {
      return getTransformedImageUrl(publicIdOrPath, transformation);
    }

    // Local URL
    return publicIdOrPath.startsWith('http') ? publicIdOrPath : publicIdOrPath;
  }

  /**
   * Generate multiple image sizes
   */
  static generateImageSizes(publicId) {
    return generateImageSizes(publicId);
  }

  /**
   * Validate image file
   */
  static validateImage(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    return true;
  }

  /**
   * Get storage type
   */
  static getStorageType() {
    return isCloudinaryEnabled ? 'cloudinary' : 'local';
  }

  /**
   * Check if Cloudinary is enabled
   */
  static isCloudinaryEnabled() {
    return isCloudinaryEnabled;
  }
}

export default CloudinaryImageService;
