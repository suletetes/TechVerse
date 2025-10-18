import ImageService from '../services/imageService.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private (Admin only)
export const uploadSingleImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400, 'NO_FILE_UPLOADED'));
  }

  try {
    // Validate the uploaded file
    ImageService.validateImage(req.file);

    // Process the image (resize, optimize, create WebP)
    const processedImages = await ImageService.processImage(req.file.path, {
      width: 800,
      height: 600,
      quality: 85,
      createWebP: true,
      createThumbnail: true
    });

    // Generate URLs for frontend
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageData = {
      original: {
        url: ImageService.getImageUrl(processedImages.original.replace(process.cwd(), ''), baseUrl),
        path: processedImages.original
      },
      webp: processedImages.webp ? {
        url: ImageService.getImageUrl(processedImages.webp.replace(process.cwd(), ''), baseUrl),
        path: processedImages.webp
      } : null,
      thumbnail: processedImages.thumbnail ? {
        url: ImageService.getImageUrl(processedImages.thumbnail.replace(process.cwd(), ''), baseUrl),
        path: processedImages.thumbnail
      } : null
    };

    logger.info('Image uploaded successfully', {
      originalName: req.file.originalname,
      size: req.file.size,
      processedPath: processedImages.original,
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
      // Validate each file
      ImageService.validateImage(file);

      // Process each image
      const processedImages = await ImageService.processImage(file.path, {
        width: 800,
        height: 600,
        quality: 85,
        createWebP: true,
        createThumbnail: true
      });

      // Generate URLs for frontend
      const imageData = {
        original: {
          url: ImageService.getImageUrl(processedImages.original.replace(process.cwd(), ''), baseUrl),
          path: processedImages.original
        },
        webp: processedImages.webp ? {
          url: ImageService.getImageUrl(processedImages.webp.replace(process.cwd(), ''), baseUrl),
          path: processedImages.webp
        } : null,
        thumbnail: processedImages.thumbnail ? {
          url: ImageService.getImageUrl(processedImages.thumbnail.replace(process.cwd(), ''), baseUrl),
          path: processedImages.thumbnail
        } : null,
        originalName: file.originalname,
        size: file.size
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