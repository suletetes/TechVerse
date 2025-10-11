import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import logger from '../utils/logger.js';

class ImageService {
  constructor() {
    this.isConfigured = false;
    this.initializeCloudinary();
  }

  // Initialize Cloudinary
  initializeCloudinary() {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME || 
          !process.env.CLOUDINARY_API_KEY || 
          !process.env.CLOUDINARY_API_SECRET) {
        logger.warn('Cloudinary configuration missing. Image service will use local storage.');
        return;
      }

      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });

      this.isConfigured = true;
      logger.info('Image service (Cloudinary) configured successfully');

    } catch (error) {
      logger.error('Failed to initialize Cloudinary', error);
      this.isConfigured = false;
    }
  }

  // Upload single image
  async uploadImage(file, folder = 'products', options = {}) {
    try {
      // Process image before upload
      const processedFile = await this.processImage(file, options);

      if (this.isConfigured) {
        return await this.uploadToCloudinary(processedFile, folder, options);
      } else {
        return await this.uploadToLocal(processedFile, folder);
      }

    } catch (error) {
      logger.error('Failed to upload image', {
        filename: file.originalname || file.filename,
        error: error.message
      });
      throw error;
    }
  }

  // Upload multiple images
  async uploadMultipleImages(files, folder = 'products', options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, folder, options));
      const results = await Promise.all(uploadPromises);
      
      logger.info('Multiple images uploaded successfully', {
        count: results.length,
        folder
      });

      return results;

    } catch (error) {
      logger.error('Failed to upload multiple images', {
        count: files.length,
        folder,
        error: error.message
      });
      throw error;
    }
  }

  // Process image (resize, optimize, etc.)
  async processImage(file, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'jpeg',
      generateThumbnail = true,
      thumbnailSize = 300
    } = options;

    try {
      let imageBuffer;
      
      // Get image buffer
      if (file.buffer) {
        imageBuffer = file.buffer;
      } else if (file.path) {
        imageBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error('Invalid file format');
      }

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      
      // Process main image
      let processedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer();

      // Generate thumbnail if requested
      let thumbnailBuffer = null;
      if (generateThumbnail) {
        thumbnailBuffer = await sharp(imageBuffer)
          .resize(thumbnailSize, thumbnailSize, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      return {
        ...file,
        buffer: processedBuffer,
        thumbnailBuffer,
        processedMetadata: {
          originalWidth: metadata.width,
          originalHeight: metadata.height,
          originalSize: imageBuffer.length,
          processedSize: processedBuffer.length,
          format: metadata.format
        }
      };

    } catch (error) {
      logger.error('Failed to process image', {
        filename: file.originalname || file.filename,
        error: error.message
      });
      throw error;
    }
  }

  // Upload to Cloudinary
  async uploadToCloudinary(file, folder, options = {}) {
    try {
      const uploadOptions = {
        folder: `techverse/${folder}`,
        resource_type: 'image',
        format: 'jpg',
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive',
        ...options.cloudinaryOptions
      };

      // Upload main image
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      // Upload thumbnail if available
      let thumbnailResult = null;
      if (file.thumbnailBuffer) {
        const thumbnailOptions = {
          ...uploadOptions,
          folder: `techverse/${folder}/thumbnails`,
          public_id: `${result.public_id}_thumb`
        };

        thumbnailResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            thumbnailOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.thumbnailBuffer);
        });
      }

      const imageData = {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        alt: file.originalname || '',
        thumbnail: thumbnailResult ? {
          url: thumbnailResult.secure_url,
          publicId: thumbnailResult.public_id
        } : null,
        metadata: file.processedMetadata
      };

      logger.info('Image uploaded to Cloudinary', {
        publicId: result.public_id,
        url: result.secure_url,
        size: result.bytes
      });

      return imageData;

    } catch (error) {
      logger.error('Failed to upload to Cloudinary', {
        folder,
        error: error.message
      });
      throw error;
    }
  }

  // Upload to local storage (fallback)
  async uploadToLocal(file, folder) {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}_${randomString}.jpg`;
      const filepath = path.join(uploadDir, filename);

      // Save main image
      fs.writeFileSync(filepath, file.buffer);

      // Save thumbnail if available
      let thumbnailPath = null;
      if (file.thumbnailBuffer) {
        const thumbnailDir = path.join(uploadDir, 'thumbnails');
        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true });
        }
        
        const thumbnailFilename = `thumb_${filename}`;
        thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
        fs.writeFileSync(thumbnailPath, file.thumbnailBuffer);
      }

      const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
      const imageData = {
        url: `${baseUrl}/uploads/${folder}/${filename}`,
        publicId: filename,
        width: null, // Would need to extract from metadata
        height: null,
        format: 'jpeg',
        size: file.buffer.length,
        alt: file.originalname || '',
        thumbnail: thumbnailPath ? {
          url: `${baseUrl}/uploads/${folder}/thumbnails/thumb_${filename}`,
          publicId: `thumb_${filename}`
        } : null,
        metadata: file.processedMetadata,
        localPath: filepath
      };

      logger.info('Image uploaded to local storage', {
        filename,
        path: filepath,
        size: file.buffer.length
      });

      return imageData;

    } catch (error) {
      logger.error('Failed to upload to local storage', {
        folder,
        error: error.message
      });
      throw error;
    }
  }

  // Delete image
  async deleteImage(publicId) {
    try {
      if (this.isConfigured) {
        await this.deleteFromCloudinary(publicId);
      } else {
        await this.deleteFromLocal(publicId);
      }

      logger.info('Image deleted successfully', { publicId });

    } catch (error) {
      logger.error('Failed to delete image', {
        publicId,
        error: error.message
      });
      throw error;
    }
  }

  // Delete from Cloudinary
  async deleteFromCloudinary(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      // Also delete thumbnail if exists
      try {
        await cloudinary.uploader.destroy(`${publicId}_thumb`);
      } catch (thumbError) {
        // Thumbnail might not exist, ignore error
      }

      return result;

    } catch (error) {
      logger.error('Failed to delete from Cloudinary', {
        publicId,
        error: error.message
      });
      throw error;
    }
  }

  // Delete from local storage
  async deleteFromLocal(publicId) {
    try {
      // Find and delete the file
      const uploadDirs = ['products', 'users', 'reviews', 'categories'];
      
      for (const dir of uploadDirs) {
        const filepath = path.join(process.cwd(), 'uploads', dir, publicId);
        const thumbnailPath = path.join(process.cwd(), 'uploads', dir, 'thumbnails', `thumb_${publicId}`);
        
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          
          // Delete thumbnail if exists
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
          }
          
          break;
        }
      }

    } catch (error) {
      logger.error('Failed to delete from local storage', {
        publicId,
        error: error.message
      });
      throw error;
    }
  }

  // Generate different image sizes
  async generateImageVariants(publicId, variants = []) {
    if (!this.isConfigured) {
      logger.warn('Image variants generation requires Cloudinary');
      return [];
    }

    try {
      const results = [];

      for (const variant of variants) {
        const { name, width, height, crop = 'fill', quality = 'auto' } = variant;
        
        const url = cloudinary.url(publicId, {
          width,
          height,
          crop,
          quality,
          fetch_format: 'auto',
          flags: 'progressive'
        });

        results.push({
          name,
          url,
          width,
          height
        });
      }

      return results;

    } catch (error) {
      logger.error('Failed to generate image variants', {
        publicId,
        error: error.message
      });
      throw error;
    }
  }

  // Get optimized image URL
  getOptimizedUrl(publicId, options = {}) {
    if (!this.isConfigured) {
      return null;
    }

    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format,
      flags: 'progressive'
    });
  }

  // Validate image file
  validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }

    return true;
  }

  // Get image metadata
  async getImageMetadata(file) {
    try {
      let imageBuffer;
      
      if (file.buffer) {
        imageBuffer = file.buffer;
      } else if (file.path) {
        imageBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error('Invalid file format');
      }

      const metadata = await sharp(imageBuffer).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: imageBuffer.length,
        hasAlpha: metadata.hasAlpha,
        channels: metadata.channels,
        density: metadata.density
      };

    } catch (error) {
      logger.error('Failed to get image metadata', {
        filename: file.originalname || file.filename,
        error: error.message
      });
      throw error;
    }
  }

  // Batch operations
  async batchDelete(publicIds) {
    try {
      const results = [];
      
      for (const publicId of publicIds) {
        try {
          await this.deleteImage(publicId);
          results.push({ publicId, success: true });
        } catch (error) {
          results.push({ publicId, success: false, error: error.message });
        }
      }

      return results;

    } catch (error) {
      logger.error('Batch delete failed', {
        publicIds,
        error: error.message
      });
      throw error;
    }
  }

  // Clean up orphaned images
  async cleanupOrphanedImages(folder, validPublicIds = []) {
    if (!this.isConfigured) {
      logger.warn('Cleanup requires Cloudinary configuration');
      return;
    }

    try {
      // Get all images in folder
      const result = await cloudinary.search
        .expression(`folder:techverse/${folder}`)
        .max_results(500)
        .execute();

      const orphanedImages = result.resources.filter(
        resource => !validPublicIds.includes(resource.public_id)
      );

      if (orphanedImages.length > 0) {
        const deletePromises = orphanedImages.map(image => 
          this.deleteImage(image.public_id)
        );
        
        await Promise.all(deletePromises);
        
        logger.info('Orphaned images cleaned up', {
          folder,
          count: orphanedImages.length
        });
      }

    } catch (error) {
      logger.error('Failed to cleanup orphaned images', {
        folder,
        error: error.message
      });
    }
  }
}

export default new ImageService();