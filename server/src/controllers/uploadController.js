import ImageService from '../services/imageService.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import enhancedLogger from '../utils/enhancedLogger.js';
import { optimizeImage, cleanupOldImages } from '../utils/imageOptimizer.js';
import path from 'path';
import fs from 'fs/promises';

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private (Admin only)
export const uploadSingleImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400, 'NO_FILE_UPLOADED'));
  }

  try {
    // Simple validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return next(new AppError('Invalid file type. Only images are allowed.', 400, 'INVALID_FILE_TYPE'));
    }

    // Check if Cloudinary upload (has path starting with http)
    const isCloudinary = req.file.path && req.file.path.startsWith('http');
    
    let imageUrl, publicId;
    
    if (isCloudinary) {
      // Cloudinary upload
      imageUrl = req.file.path; // Cloudinary returns secure_url in path
      publicId = req.file.filename; // Cloudinary returns public_id in filename
    } else {
      // Local upload
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const relativePath = req.file.path.replace(process.cwd(), '').replace(/\\/g, '/');
      imageUrl = `${baseUrl}${relativePath}`;
      publicId = null;
    }

    const imageData = {
      url: imageUrl,
      publicId: publicId,
      path: req.file.path,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    logger.info('Image uploaded successfully', {
      originalName: req.file.originalname,
      size: req.file.size,
      storage: isCloudinary ? 'cloudinary' : 'local',
      userId: req.user?._id
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image: imageData
      }
    });

  } catch (error) {
    logger.error('Image upload failed', error);
    return next(new AppError(error.message, 500, 'IMAGE_UPLOAD_ERROR'));
  }
});

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private (Admin only)
export const uploadMultipleImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No files uploaded', 400, 'NO_FILES_UPLOADED'));
  }

  try {
    const uploadedImages = [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    for (const file of req.files) {
      // Check if Cloudinary upload
      const isCloudinary = file.path && file.path.startsWith('http');
      
      let imageUrl, publicId;
      
      if (isCloudinary) {
        // Cloudinary upload
        imageUrl = file.path;
        publicId = file.filename;
      } else {
        // Local upload
        const relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
        imageUrl = `${baseUrl}${relativePath}`;
        publicId = null;
      }

      const imageData = {
        url: imageUrl,
        publicId: publicId,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };

      uploadedImages.push(imageData);
    }

    logger.info('Multiple images uploaded successfully', {
      count: uploadedImages.length,
      userId: req.user?._id
    });

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: {
        images: uploadedImages
      }
    });

  } catch (error) {
    logger.error('Multiple image upload failed', error);
    return next(new AppError(error.message, 500, 'IMAGE_UPLOAD_ERROR'));
  }
});

// @desc    Delete uploaded image
// @route   DELETE /api/upload/image
// @access  Private (Admin only)
export const deleteUploadedImage = asyncHandler(async (req, res, next) => {
  const { imagePath } = req.body;

  if (!imagePath) {
    return next(new AppError('Image path is required', 400, 'IMAGE_PATH_REQUIRED'));
  }

  try {
    await ImageService.deleteImage(imagePath);

    logger.info('Image deleted successfully', {
      imagePath,
      userId: req.user?._id
    });

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    logger.error('Image deletion failed', error);
    return next(new AppError(error.message, 500, 'IMAGE_DELETE_ERROR'));
  }
});

// @desc    Get image information
// @route   GET /api/upload/image/info
// @access  Private (Admin only)
export const getImageInfo = asyncHandler(async (req, res, next) => {
  const { imagePath } = req.query;

  if (!imagePath) {
    return next(new AppError('Image path is required', 400, 'IMAGE_PATH_REQUIRED'));
  }

  try {
    const imageInfo = await ImageService.getImageInfo(imagePath);

    res.status(200).json({
      success: true,
      message: 'Image information retrieved successfully',
      data: {
        imageInfo
      }
    });

  } catch (error) {
    logger.error('Failed to get image info', error);
    return next(new AppError(error.message, 500, 'IMAGE_INFO_ERROR'));
  }
});

// @desc    Test image accessibility
// @route   GET /api/upload/test
// @access  Public (for testing)
export const testImageAccessibility = asyncHandler(async (req, res, next) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  // Test URLs for different image types
  const testImages = {
    clientImages: {
      laptop: `${baseUrl}/img/laptop-product.webp`,
      phone: `${baseUrl}/img/phone-product.webp`,
      tablet: `${baseUrl}/img/tablet-product.webp`,
      tv: `${baseUrl}/img/tv-product.webp`
    },
    uploadedImages: {
      example: `${baseUrl}/uploads/products/example-image.jpg`,
      note: 'Upload an image to test this endpoint'
    }
  };

  res.status(200).json({
    success: true,
    message: 'Image accessibility test endpoints',
    data: {
      baseUrl,
      testImages,
      instructions: {
        clientImages: 'These should be accessible if client/public/img/ is properly served',
        uploadedImages: 'These will be accessible after uploading images to server/uploads/',
        testCommands: [
          `curl -I ${testImages.clientImages.laptop}`,
          `curl -I ${testImages.clientImages.phone}`,
          'Upload an image via POST /api/upload/image to test uploaded images'
        ]
      }
    }
  });
});

export default {
  uploadSingleImage,
  uploadMultipleImages,
  deleteUploadedImage,
  getImageInfo,
  testImageAccessibility
};

// Enhanced upload functions for Task 24

// @desc    Upload product images with optimization
// @route   POST /api/upload/product-images
// @access  Private (Admin only)
export const uploadProductImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No files uploaded', 400, 'NO_FILES_UPLOADED'));
  }

  try {
    const processedImages = [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    for (const file of req.files) {
      // Validate and optimize each image
      const filename = path.parse(file.filename).name;
      const outputDir = path.dirname(file.path);

      const optimizationResult = await optimizeImage(
        file.path,
        outputDir,
        filename,
        {
          sizes: ['thumbnail', 'small', 'medium', 'large'],
          formats: ['webp', 'jpeg'],
          quality: 85
        }
      );

      // Generate URLs for each variant
      const imageVariants = {};
      for (const variant of optimizationResult.variants) {
        const size = variant.size;
        const format = variant.format;
        
        if (!imageVariants[size]) {
          imageVariants[size] = {};
        }
        
        imageVariants[size][format] = {
          url: `${baseUrl}/uploads/products/${variant.filename}`,
          width: variant.width,
          height: variant.height,
          fileSize: variant.fileSize
        };
      }

      processedImages.push({
        originalName: file.originalname,
        variants: imageVariants,
        metadata: optimizationResult.original,
        compressionRatio: optimizationResult.compressionRatio
      });

      // Clean up original file
      await fs.unlink(file.path);
    }

    enhancedLogger.info('Product images uploaded and optimized', {
      imageCount: processedImages.length,
      userId: req.user._id,
      requestId: req.id
    });

    res.status(201).json({
      success: true,
      message: 'Product images uploaded and optimized successfully',
      data: {
        images: processedImages,
        count: processedImages.length
      }
    });

  } catch (error) {
    enhancedLogger.error('Product image upload failed', {
      error: error.message,
      userId: req.user._id,
      requestId: req.id
    });
    return next(new AppError(error.message, 500, 'PRODUCT_IMAGE_UPLOAD_ERROR'));
  }
});

// @desc    Upload user avatar with optimization
// @route   POST /api/upload/user-avatar
// @access  Private (Authenticated users)
export const uploadUserAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400, 'NO_FILE_UPLOADED'));
  }

  try {
    const filename = path.parse(req.file.filename).name;
    const outputDir = path.dirname(req.file.path);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Optimize avatar with specific settings
    const optimizationResult = await optimizeImage(
      req.file.path,
      outputDir,
      filename,
      {
        sizes: ['thumbnail', 'small', 'medium'], // No large size needed for avatars
        formats: ['webp', 'jpeg'],
        quality: 90 // Higher quality for avatars
      }
    );

    // Generate avatar URLs
    const avatarUrls = {};
    for (const variant of optimizationResult.variants) {
      const size = variant.size;
      const format = variant.format;
      
      if (!avatarUrls[size]) {
        avatarUrls[size] = {};
      }
      
      avatarUrls[size][format] = {
        url: `${baseUrl}/uploads/${variant.filename}`,
        width: variant.width,
        height: variant.height
      };
    }

    // Clean up original file
    await fs.unlink(req.file.path);

    enhancedLogger.info('User avatar uploaded', {
      userId: req.user._id,
      originalName: req.file.originalname,
      compressionRatio: optimizationResult.compressionRatio,
      requestId: req.id
    });

    res.status(201).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: {
          urls: avatarUrls,
          metadata: optimizationResult.original,
          compressionRatio: optimizationResult.compressionRatio
        }
      }
    });

  } catch (error) {
    enhancedLogger.error('Avatar upload failed', {
      error: error.message,
      userId: req.user._id,
      requestId: req.id
    });
    return next(new AppError(error.message, 500, 'AVATAR_UPLOAD_ERROR'));
  }
});

// @desc    Upload review images with optimization
// @route   POST /api/upload/review-images
// @access  Private (Authenticated users)
export const uploadReviewImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No files uploaded', 400, 'NO_FILES_UPLOADED'));
  }

  try {
    const processedImages = [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    for (const file of req.files) {
      const filename = path.parse(file.filename).name;
      const outputDir = path.dirname(file.path);

      // Optimize review images with moderate settings
      const optimizationResult = await optimizeImage(
        file.path,
        outputDir,
        filename,
        {
          sizes: ['thumbnail', 'medium'], // Smaller sizes for reviews
          formats: ['webp', 'jpeg'],
          quality: 80 // Good quality but smaller file size
        }
      );

      // Generate URLs for review images
      const imageUrls = {};
      for (const variant of optimizationResult.variants) {
        const size = variant.size;
        const format = variant.format;
        
        if (!imageUrls[size]) {
          imageUrls[size] = {};
        }
        
        imageUrls[size][format] = {
          url: `${baseUrl}/uploads/reviews/${variant.filename}`,
          width: variant.width,
          height: variant.height,
          fileSize: variant.fileSize
        };
      }

      processedImages.push({
        originalName: file.originalname,
        urls: imageUrls,
        metadata: optimizationResult.original,
        compressionRatio: optimizationResult.compressionRatio
      });

      // Clean up original file
      await fs.unlink(file.path);
    }

    enhancedLogger.info('Review images uploaded', {
      imageCount: processedImages.length,
      userId: req.user._id,
      requestId: req.id
    });

    res.status(201).json({
      success: true,
      message: 'Review images uploaded successfully',
      data: {
        images: processedImages,
        count: processedImages.length
      }
    });

  } catch (error) {
    enhancedLogger.error('Review image upload failed', {
      error: error.message,
      userId: req.user._id,
      requestId: req.id
    });
    return next(new AppError(error.message, 500, 'REVIEW_IMAGE_UPLOAD_ERROR'));
  }
});

// @desc    Clean up old uploaded files
// @route   DELETE /api/upload/cleanup
// @access  Private (Admin only)
export const cleanupOldFiles = asyncHandler(async (req, res, next) => {
  try {
    const { maxAge = 30 } = req.query; // Default 30 days
    const maxAgeMs = parseInt(maxAge) * 24 * 60 * 60 * 1000;

    const uploadDirs = [
      path.join(process.cwd(), 'uploads'),
      path.join(process.cwd(), 'uploads/products'),
      path.join(process.cwd(), 'uploads/reviews'),
      path.join(process.cwd(), 'quarantine')
    ];

    let totalDeleted = 0;
    const results = [];

    for (const dir of uploadDirs) {
      try {
        const result = await cleanupOldImages(dir, maxAgeMs);
        totalDeleted += result.deletedCount;
        results.push({
          directory: path.basename(dir),
          deletedCount: result.deletedCount
        });
      } catch (error) {
        enhancedLogger.warn('Failed to cleanup directory', {
          directory: dir,
          error: error.message
        });
      }
    }

    enhancedLogger.info('File cleanup completed', {
      totalDeleted,
      maxAgeDays: parseInt(maxAge),
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(200).json({
      success: true,
      message: 'File cleanup completed successfully',
      data: {
        totalDeleted,
        results,
        maxAgeDays: parseInt(maxAge)
      }
    });

  } catch (error) {
    enhancedLogger.error('File cleanup failed', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });
    return next(new AppError(error.message, 500, 'FILE_CLEANUP_ERROR'));
  }
});

// @desc    Get upload statistics
// @route   GET /api/upload/stats
// @access  Private (Admin only)
export const getUploadStats = asyncHandler(async (req, res, next) => {
  try {
    const uploadDirs = [
      { name: 'products', path: path.join(process.cwd(), 'uploads/products') },
      { name: 'reviews', path: path.join(process.cwd(), 'uploads/reviews') },
      { name: 'general', path: path.join(process.cwd(), 'uploads') },
      { name: 'quarantine', path: path.join(process.cwd(), 'quarantine') }
    ];

    const stats = [];

    for (const dir of uploadDirs) {
      try {
        const files = await fs.readdir(dir.path);
        let totalSize = 0;
        let fileCount = 0;

        for (const file of files) {
          try {
            const filePath = path.join(dir.path, file);
            const stat = await fs.stat(filePath);
            if (stat.isFile()) {
              totalSize += stat.size;
              fileCount++;
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        }

        stats.push({
          directory: dir.name,
          fileCount,
          totalSize,
          totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
        });
      } catch (error) {
        stats.push({
          directory: dir.name,
          fileCount: 0,
          totalSize: 0,
          totalSizeMB: 0,
          error: 'Directory not accessible'
        });
      }
    }

    const totalStats = stats.reduce((acc, stat) => ({
      fileCount: acc.fileCount + stat.fileCount,
      totalSize: acc.totalSize + stat.totalSize,
      totalSizeMB: acc.totalSizeMB + stat.totalSizeMB
    }), { fileCount: 0, totalSize: 0, totalSizeMB: 0 });

    res.status(200).json({
      success: true,
      message: 'Upload statistics retrieved successfully',
      data: {
        directories: stats,
        totals: totalStats
      }
    });

  } catch (error) {
    enhancedLogger.error('Failed to get upload stats', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });
    return next(new AppError(error.message, 500, 'UPLOAD_STATS_ERROR'));
  }
});