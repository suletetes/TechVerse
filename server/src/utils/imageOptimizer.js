import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import enhancedLogger from './enhancedLogger.js';

/**
 * Image Optimization Utilities
 * Handles image compression, resizing, and format conversion
 */

/**
 * Image optimization configuration
 */
const IMAGE_CONFIG = {
  // Quality settings
  jpeg: { quality: 85 },
  webp: { quality: 80 },
  png: { compressionLevel: 8 },
  
  // Size variants
  sizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
    original: null // Keep original size
  },
  
  // Maximum file size (5MB)
  maxFileSize: 5 * 1024 * 1024,
  
  // Allowed formats
  allowedFormats: ['jpeg', 'jpg', 'png', 'webp'],
  
  // Output formats
  outputFormats: ['webp', 'jpeg'] // WebP with JPEG fallback
};

/**
 * Optimize and resize image
 */
export const optimizeImage = async (inputPath, outputDir, filename, options = {}) => {
  try {
    const {
      sizes = ['thumbnail', 'small', medium', 'large'],
      formats = IMAGE_CONFIG.outputFormats,
      quality = null
    } = options;

    const results = [];
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    
    enhancedLogger.info('Optimizing image', {
      filename,
      originalSize: metadata.size,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height
    });

    // Process each size variant
    for (const sizeName of sizes) {
      const sizeConfig = IMAGE_CONFIG.sizes[sizeName];
      
      for (const format of formats) {
        const outputFilename = `${filename}_${sizeName}.${format}`;
        const outputPath = path.join(outputDir, outputFilename);
        
        let pipeline = sharp(inputPath);
        
        // Resize if size config exists
        if (sizeConfig) {
          pipeline = pipeline.resize(sizeConfig.width, sizeConfig.height, {
            fit: 'cover',
            position: 'center'
          });
        }
        
        // Apply format-specific optimization
        switch (format) {
          case 'webp':
            pipeline = pipeline.webp({
              quality: quality || IMAGE_CONFIG.webp.quality,
              effort: 6 // Higher effort for better compression
            });
            break;
          case 'jpeg':
          case 'jpg':
            pipeline = pipeline.jpeg({
              quality: quality || IMAGE_CONFIG.jpeg.quality,
              progressive: true,
              mozjpeg: true
            });
            break;
          case 'png':
            pipeline = pipeline.png({
              compressionLevel: IMAGE_CONFIG.png.compressionLevel,
              progressive: true
            });
            break;
        }
        
        // Save optimized image
        const info = await pipeline.toFile(outputPath);
        
        results.push({
          size: sizeName,
          format,
          filename: outputFilename,
          path: outputPath,
          width: info.width,
          height: info.height,
          fileSize: info.size
        });
        
        enhancedLogger.debug('Image variant created', {
          size: sizeName,
          format,
          filename: outputFilename,
          fileSize: info.size,
          compression: `${((metadata.size - info.size) / metadata.size * 100).toFixed(1)}%`
        });
      }
    }
    
    // Calculate total compression
    const totalOriginalSize = metadata.size * results.length;
    const totalOptimizedSize = results.reduce((sum, result) => sum + result.fileSize, 0);
    const compressionRatio = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    
    enhancedLogger.info('Image optimization completed', {
      filename,
      variants: results.length,
      originalSize: metadata.size,
      totalOptimizedSize,
      compressionRatio: `${compressionRatio}%`
    });
    
    return {
      success: true,
      original: {
        size: metadata.size,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height
      },
      variants: results,
      compressionRatio
    };
    
  } catch (error) {
    enhancedLogger.error('Image optimization failed', {
      filename,
      error: error.message,
      stack: error.stack
    });
    
    throw new Error(`Image optimization failed: ${error.message}`);
  }
};

/**
 * Validate image file
 */
export const validateImage = async (filePath, options = {}) => {
  try {
    const {
      maxSize = IMAGE_CONFIG.maxFileSize,
      allowedFormats = IMAGE_CONFIG.allowedFormats,
      minWidth = 100,
      minHeight = 100,
      maxWidth = 4000,
      maxHeight = 4000
    } = options;

    // Check file size
    const stats = await fs.stat(filePath);
    if (stats.size > maxSize) {
      throw new Error(`File size ${stats.size} exceeds maximum allowed size ${maxSize}`);
    }

    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    
    // Check format
    if (!allowedFormats.includes(metadata.format)) {
      throw new Error(`Format ${metadata.format} is not allowed. Allowed formats: ${allowedFormats.join(', ')}`);
    }
    
    // Check dimensions
    if (metadata.width < minWidth || metadata.height < minHeight) {
      throw new Error(`Image dimensions ${metadata.width}x${metadata.height} are too small. Minimum: ${minWidth}x${minHeight}`);
    }
    
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      throw new Error(`Image dimensions ${metadata.width}x${metadata.height} are too large. Maximum: ${maxWidth}x${maxHeight}`);
    }
    
    return {
      valid: true,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: stats.size,
        hasAlpha: metadata.hasAlpha,
        channels: metadata.channels
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Generate responsive image HTML
 */
export const generateResponsiveImageHTML = (baseUrl, filename, alt = '', className = '') => {
  const webpSources = IMAGE_CONFIG.sizes;
  const jpegSources = IMAGE_CONFIG.sizes;
  
  let html = '<picture>';
  
  // WebP sources
  html += '<source type="image/webp" srcset="';
  const webpSrcset = Object.keys(webpSources)
    .filter(size => size !== 'original')
    .map(size => {
      const config = webpSources[size];
      return `${baseUrl}/${filename}_${size}.webp ${config.width}w`;
    })
    .join(', ');
  html += webpSrcset + '">';
  
  // JPEG fallback sources
  html += '<source type="image/jpeg" srcset="';
  const jpegSrcset = Object.keys(jpegSources)
    .filter(size => size !== 'original')
    .map(size => {
      const config = jpegSources[size];
      return `${baseUrl}/${filename}_${size}.jpeg ${config.width}w`;
    })
    .join(', ');
  html += jpegSrcset + '">';
  
  // Fallback img tag
  html += `<img src="${baseUrl}/${filename}_medium.jpeg" alt="${alt}" class="${className}" loading="lazy">`;
  html += '</picture>';
  
  return html;
};

/**
 * Clean up old image files
 */
export const cleanupOldImages = async (directory, maxAge = 30 * 24 * 60 * 60 * 1000) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
        
        enhancedLogger.debug('Deleted old image file', {
          file,
          age: Math.round((now - stats.mtime.getTime()) / (24 * 60 * 60 * 1000))
        });
      }
    }
    
    enhancedLogger.info('Image cleanup completed', {
      directory,
      deletedCount,
      maxAgeDays: Math.round(maxAge / (24 * 60 * 60 * 1000))
    });
    
    return { deletedCount };
    
  } catch (error) {
    enhancedLogger.error('Image cleanup failed', {
      directory,
      error: error.message
    });
    
    throw error;
  }
};

/**
 * Get image information
 */
export const getImageInfo = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    const stats = await fs.stat(imagePath);
    
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    throw new Error(`Failed to get image info: ${error.message}`);
  }
};

/**
 * Lazy loading middleware for images
 */
export const lazyLoadingMiddleware = (req, res, next) => {
  // Add lazy loading headers for image responses
  if (req.originalUrl.includes('/images/') || req.originalUrl.includes('/uploads/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Add CORS headers for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
  
  next();
};

export default {
  optimizeImage,
  validateImage,
  generateResponsiveImageHTML,
  cleanupOldImages,
  getImageInfo,
  lazyLoadingMiddleware,
  IMAGE_CONFIG
};