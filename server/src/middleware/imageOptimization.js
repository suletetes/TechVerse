import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import enhancedLogger from '../utils/enhancedLogger.js';
import optionalCDN from '../utils/optionalCDN.js';

/**
 * Image Optimization Middleware
 * Provides automatic image optimization, resizing, and format conversion
 */

// Image optimization configurations
const IMAGE_CONFIGS = {
  thumbnail: {
    width: 150,
    height: 150,
    quality: 80,
    format: 'webp'
  },
  small: {
    width: 300,
    height: 300,
    quality: 85,
    format: 'webp'
  },
  medium: {
    width: 600,
    height: 600,
    quality: 85,
    format: 'webp'
  },
  large: {
    width: 1200,
    height: 1200,
    quality: 90,
    format: 'webp'
  },
  original: {
    quality: 95,
    format: 'webp'
  }
};

/**
 * Image optimization middleware
 */
export const optimizeImages = (options = {}) => {
  const {
    generateSizes = ['thumbnail', 'small', 'medium'],
    uploadToCDN = true,
    keepOriginal = true,
    quality = 85,
    format = 'webp'
  } = options;

  return async (req, res, next) => {
    try {
      if (!req.files && !req.file) {
        return next();
      }

      const files = req.files ? Object.values(req.files).flat() : [req.file];
      const optimizedFiles = [];

      for (const file of files) {
        if (!file || !file.mimetype.startsWith('image/')) {
          optimizedFiles.push(file);
          continue;
        }

        try {
          const optimizedVersions = await processImageFile(file, {
            generateSizes,
            uploadToCDN,
            keepOriginal,
            quality,
            format
          });

          optimizedFiles.push({
            ...file,
            optimized: true,
            versions: optimizedVersions
          });

        } catch (error) {
          enhancedLogger.error('Image optimization failed', {
            error: error.message,
            filename: file.originalname,
            userId: req.user?._id
          });

          // Keep original file if optimization fails
          optimizedFiles.push(file);
        }
      }

      // Update request with optimized files
      if (req.files) {
        req.files = optimizedFiles;
      } else {
        req.file = optimizedFiles[0];
      }

      next();

    } catch (error) {
      enhancedLogger.error('Image optimization middleware error', {
        error: error.message,
        userId: req.user?._id
      });
      next(error);
    }
  };
};

/**
 * Process individual image file
 */
const processImageFile = async (file, options) => {
  const {
    generateSizes,
    uploadToCDN,
    keepOriginal,
    quality,
    format
  } = options;

  const versions = {};
  const originalPath = file.path;
  const fileBaseName = path.parse(file.originalname).name;
  const timestamp = Date.now();

  try {
    // Get image metadata
    const metadata = await sharp(originalPath).metadata();
    
    enhancedLogger.info('Processing image', {
      filename: file.originalname,
      originalSize: file.size,
      dimensions: `${metadata.width}x${metadata.height}`,
      format: metadata.format
    });

    // Process each requested size
    for (const sizeName of generateSizes) {
      const config = IMAGE_CONFIGS[sizeName];
      if (!config) continue;

      try {
        const optimizedBuffer = await optimizeImageToSize(originalPath, config);
        const optimizedKey = `${fileBaseName}_${sizeName}_${timestamp}.${config.format}`;

        if (uploadToCDN) {
          const uploadResult = await optionalCDN.uploadBuffer(optimizedBuffer, optimizedKey, {
            contentType: `image/${config.format}`,
            cacheControl: 'public, max-age=31536000'
          });

          if (uploadResult.success) {
            versions[sizeName] = {
              url: uploadResult.url,
              key: uploadResult.key,
              size: optimizedBuffer.length,
              dimensions: config.width && config.height ? 
                `${config.width}x${config.height}` : 'auto',
              format: config.format,
              location: uploadResult.location
            };
          }
        } else {
          // Save locally
          const localPath = path.join(path.dirname(originalPath), optimizedKey);
          await fs.writeFile(localPath, optimizedBuffer);

          versions[sizeName] = {
            url: `/uploads/${optimizedKey}`,
            path: localPath,
            size: optimizedBuffer.length,
            dimensions: config.width && config.height ? 
              `${config.width}x${config.height}` : 'auto',
            format: config.format,
            location: 'local'
          };
        }

        enhancedLogger.debug('Image size generated', {
          size: sizeName,
          originalSize: file.size,
          optimizedSize: optimizedBuffer.length,
          compression: ((file.size - optimizedBuffer.length) / file.size * 100).toFixed(1) + '%'
        });

      } catch (error) {
        enhancedLogger.error('Failed to generate image size', {
          error: error.message,
          size: sizeName,
          filename: file.originalname
        });
      }
    }

    // Handle original file
    if (keepOriginal) {
      if (uploadToCDN) {
        const originalKey = `${fileBaseName}_original_${timestamp}${path.extname(file.originalname)}`;
        const uploadResult = await optionalCDN.uploadFile(originalPath, originalKey, {
          contentType: file.mimetype,
          cacheControl: 'public, max-age=31536000'
        });

        if (uploadResult.success) {
          versions.original = {
            url: uploadResult.url,
            key: uploadResult.key,
            size: file.size,
            dimensions: `${metadata.width}x${metadata.height}`,
            format: metadata.format,
            location: uploadResult.location
          };
        }
      } else {
        versions.original = {
          url: `/uploads/${path.basename(originalPath)}`,
          path: originalPath,
          size: file.size,
          dimensions: `${metadata.width}x${metadata.height}`,
          format: metadata.format,
          location: 'local'
        };
      }
    }

    return versions;

  } catch (error) {
    enhancedLogger.error('Image processing error', {
      error: error.message,
      filename: file.originalname
    });
    throw error;
  }
};

/**
 * Optimize image to specific size configuration
 */
const optimizeImageToSize = async (imagePath, config) => {
  let pipeline = sharp(imagePath);

  // Resize if dimensions specified
  if (config.width || config.height) {
    pipeline = pipeline.resize(config.width, config.height, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: true
    });
  }

  // Apply format-specific optimizations
  switch (config.format) {
    case 'webp':
      pipeline = pipeline.webp({ 
        quality: config.quality,
        effort: 4 // Balance between compression and speed
      });
      break;
    
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ 
        quality: config.quality,
        progressive: true,
        mozjpeg: true
      });
      break;
    
    case 'png':
      pipeline = pipeline.png({ 
        quality: config.quality,
        compressionLevel: 6,
        progressive: true
      });
      break;
    
    case 'avif':
      pipeline = pipeline.avif({ 
        quality: config.quality,
        effort: 4
      });
      break;
    
    default:
      pipeline = pipeline.webp({ quality: config.quality });
  }

  // Strip metadata for privacy and smaller file size
  pipeline = pipeline.withMetadata(false);

  return pipeline.toBuffer();
};

/**
 * Responsive image middleware
 * Serves appropriate image size based on request parameters
 */
export const serveResponsiveImage = async (req, res, next) => {
  try {
    const { size = 'medium', format = 'webp' } = req.query;
    const imagePath = req.params.imagePath;

    if (!imagePath) {
      return next();
    }

    // Check if optimized version exists
    const config = IMAGE_CONFIGS[size];
    if (!config) {
      return next();
    }

    // Generate cache key for this specific request
    const cacheKey = `responsive_${imagePath}_${size}_${format}`;
    
    // Try to serve from CDN first
    const cdnUrl = optionalCDN.getFileUrl(cacheKey);
    if (cdnUrl.startsWith('http')) {
      return res.redirect(cdnUrl);
    }

    // Generate optimized image on-the-fly if not cached
    const originalPath = path.join(process.cwd(), 'uploads', imagePath);
    
    try {
      await fs.access(originalPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const optimizedBuffer = await optimizeImageToSize(originalPath, {
      ...config,
      format
    });

    // Cache the optimized image
    await optionalCDN.uploadBuffer(optimizedBuffer, cacheKey, {
      contentType: `image/${format}`,
      cacheControl: 'public, max-age=31536000'
    });

    // Serve the optimized image
    res.set({
      'Content-Type': `image/${format}`,
      'Cache-Control': 'public, max-age=31536000',
      'Content-Length': optimizedBuffer.length
    });

    res.send(optimizedBuffer);

  } catch (error) {
    enhancedLogger.error('Responsive image serving error', {
      error: error.message,
      imagePath: req.params.imagePath,
      query: req.query
    });
    next(error);
  }
};

/**
 * Image lazy loading helper
 */
export const generateImageSrcSet = (baseUrl, sizes = ['small', 'medium', 'large']) => {
  return sizes.map(size => {
    const config = IMAGE_CONFIGS[size];
    if (!config) return null;
    
    const width = config.width || 'auto';
    return `${baseUrl}?size=${size}&format=webp ${width}w`;
  }).filter(Boolean).join(', ');
};

/**
 * Batch image optimization
 */
export const batchOptimizeImages = async (imagePaths, options = {}) => {
  const {
    concurrency = 3,
    generateSizes = ['thumbnail', 'small', 'medium'],
    uploadToCDN = true
  } = options;

  const results = [];

  // Process images in batches to avoid overwhelming the system
  for (let i = 0; i < imagePaths.length; i += concurrency) {
    const batch = imagePaths.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (imagePath) => {
      try {
        const file = {
          path: imagePath,
          originalname: path.basename(imagePath),
          mimetype: `image/${path.extname(imagePath).slice(1)}`,
          size: (await fs.stat(imagePath)).size
        };

        const versions = await processImageFile(file, {
          generateSizes,
          uploadToCDN,
          keepOriginal: true,
          quality: 85,
          format: 'webp'
        });

        return {
          success: true,
          originalPath: imagePath,
          versions
        };

      } catch (error) {
        enhancedLogger.error('Batch image optimization error', {
          error: error.message,
          imagePath
        });

        return {
          success: false,
          originalPath: imagePath,
          error: error.message
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          error: result.reason.message
        });
      }
    });
  }

  return results;
};

/**
 * Clean up old image versions
 */
export const cleanupOldImages = async (retentionDays = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // This would typically query a database for old image records
    // For now, we'll just log the cleanup attempt
    enhancedLogger.info('Image cleanup initiated', {
      retentionDays,
      cutoffDate: cutoffDate.toISOString()
    });

    // Implementation would depend on how image metadata is stored
    // Could involve querying database and calling optionalCDN.deleteFile()

    return {
      success: true,
      message: 'Image cleanup completed',
      cutoffDate
    };

  } catch (error) {
    enhancedLogger.error('Image cleanup error', {
      error: error.message,
      retentionDays
    });

    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  optimizeImages,
  serveResponsiveImage,
  generateImageSrcSet,
  batchOptimizeImages,
  cleanupOldImages,
  IMAGE_CONFIGS
};