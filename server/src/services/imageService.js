import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const productsDir = path.join(uploadsDir, 'products');
const categoriesDir = path.join(uploadsDir, 'categories');
const reviewsDir = path.join(uploadsDir, 'reviews');

// Create directories if they don't exist
[uploadsDir, productsDir, categoriesDir, reviewsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    
    // Determine upload path based on route or field name
    if (req.route?.path?.includes('products') || file.fieldname === 'productImages') {
      uploadPath = productsDir;
    } else if (req.route?.path?.includes('categories') || file.fieldname === 'categoryImage') {
      uploadPath = categoriesDir;
    } else if (req.route?.path?.includes('reviews') || file.fieldname === 'reviewImages') {
      uploadPath = reviewsDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const name = file.originalname.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

class ImageService {
  /**
   * Upload single image
   */
  static uploadSingle(fieldName = 'image') {
    return upload.single(fieldName);
  }

  /**
   * Upload multiple images
   */
  static uploadMultiple(fieldName = 'images', maxCount = 10) {
    return upload.array(fieldName, maxCount);
  }

  /**
   * Upload mixed fields
   */
  static uploadFields(fields) {
    return upload.fields(fields);
  }

  /**
   * Process uploaded image (resize, optimize, create WebP version)
   */
  static async processImage(filePath, options = {}) {
    try {
      const {
        width = 800,
        height = 600,
        quality = 80,
        createWebP = true,
        createThumbnail = false,
        thumbnailSize = 200
      } = options;

      const ext = path.extname(filePath).toLowerCase();
      const basePath = filePath.replace(ext, '');
      
      // Process main image
      const processedPath = `${basePath}-processed${ext}`;
      await sharp(filePath)
        .resize(width, height, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality })
        .png({ quality })
        .toFile(processedPath);

      // Create WebP version
      let webpPath = null;
      if (createWebP) {
        webpPath = `${basePath}.webp`;
        await sharp(filePath)
          .resize(width, height, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .webp({ quality })
          .toFile(webpPath);
      }

      // Create thumbnail
      let thumbnailPath = null;
      if (createThumbnail) {
        thumbnailPath = `${basePath}-thumb${ext}`;
        await sharp(filePath)
          .resize(thumbnailSize, thumbnailSize, { 
            fit: 'cover' 
          })
          .jpeg({ quality: 70 })
          .png({ quality: 70 })
          .toFile(thumbnailPath);
      }

      // Remove original file
      fs.unlinkSync(filePath);

      return {
        original: processedPath,
        webp: webpPath,
        thumbnail: thumbnailPath
      };

    } catch (error) {
      logger.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Delete image file(s)
   */
  static async deleteImage(imagePath) {
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        logger.info(`Deleted image: ${imagePath}`);
      }

      // Also try to delete WebP version
      const webpPath = imagePath.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
      if (fs.existsSync(webpPath)) {
        fs.unlinkSync(webpPath);
        logger.info(`Deleted WebP version: ${webpPath}`);
      }

      // Also try to delete thumbnail
      const ext = path.extname(imagePath);
      const thumbPath = imagePath.replace(ext, `-thumb${ext}`);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
        logger.info(`Deleted thumbnail: ${thumbPath}`);
      }

    } catch (error) {
      logger.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Get image URL for frontend
   */
  static getImageUrl(imagePath, baseUrl = '') {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it starts with /uploads, return as is (server will serve it)
    if (imagePath.startsWith('/uploads')) {
      return `${baseUrl}${imagePath}`;
    }
    
    // If it starts with /img, return as is (client public images)
    if (imagePath.startsWith('/img')) {
      return `${baseUrl}${imagePath}`;
    }
    
    // Otherwise, assume it's a relative path in uploads
    return `${baseUrl}/uploads/${imagePath}`;
  }

  /**
   * Validate image file
   */
  static validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    return true;
  }

  /**
   * Get image info
   */
  static async getImageInfo(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = fs.statSync(imagePath);
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      logger.error('Error getting image info:', error);
      throw new Error('Failed to get image information');
    }
  }

  /**
   * Create image variants (different sizes)
   */
  static async createImageVariants(originalPath, variants = []) {
    const results = {};
    
    try {
      for (const variant of variants) {
        const { name, width, height, quality = 80 } = variant;
        const ext = path.extname(originalPath);
        const basePath = originalPath.replace(ext, '');
        const variantPath = `${basePath}-${name}${ext}`;
        
        await sharp(originalPath)
          .resize(width, height, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality })
          .png({ quality })
          .toFile(variantPath);
          
        results[name] = variantPath;
      }
      
      return results;
    } catch (error) {
      logger.error('Error creating image variants:', error);
      throw new Error('Failed to create image variants');
    }
  }
}

export default ImageService;