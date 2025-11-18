import express from 'express';
import { body, query } from 'express-validator';
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteUploadedImage,
  getImageInfo,
  testImageAccessibility,
  uploadProductImages,
  uploadUserAvatar,
  uploadReviewImages,
  cleanupOldFiles,
  getUploadStats
} from '../controllers/uploadController.js';
import { authenticate, requireAdmin } from '../middleware/passportAuth.js';
import { validate } from '../middleware/validation.js';
import CloudinaryImageService from '../services/cloudinaryImageService.js';
import {
  advancedFileValidation,
  fileQuarantine,
  uploadRateLimit,
  virusScanning,
  fileIntegrityCheck,
  auditFileOperation
} from '../middleware/enhancedFileUploadSecurity.js';

const router = express.Router();

// Validation rules
const deleteImageValidation = [
  body('filename')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Filename is required and must not exceed 255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Filename contains invalid characters')
];

const imageInfoValidation = [
  query('filename')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Filename is required and must not exceed 255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Filename contains invalid characters')
];

// Public test endpoint
router.get('/test', testImageAccessibility);

// Protected routes (Admin only) with enhanced security
// Simplified upload route for debugging
router.post('/image', 
  authenticate, 
  requireAdmin,
  CloudinaryImageService.uploadSingle('image', 'techverse/products'),
  uploadSingleImage
);

router.post('/images', 
  authenticate, 
  requireAdmin,
  auditFileOperation('MULTIPLE_IMAGE_UPLOAD'),
  uploadRateLimit({ maxUploadsPerHour: 50 }),
  CloudinaryImageService.uploadMultiple('images', 10, 'techverse/products'),
  advancedFileValidation({
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    checkFileSignature: true
  }),
  virusScanning,
  fileIntegrityCheck,
  fileQuarantine,
  uploadMultipleImages
);

// Specific upload endpoints as required by task 24

// Product image uploads (Admin only)
router.post('/product-images', 
  authenticate, 
  requireAdmin,
  auditFileOperation('PRODUCT_IMAGE_UPLOAD'),
  uploadRateLimit({ maxUploadsPerHour: 200 }),
  CloudinaryImageService.uploadMultiple('productImages', 10, 'techverse/products'),
  advancedFileValidation({
    maxFileSize: 15 * 1024 * 1024, // 15MB for product images
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    checkFileSignature: true
  }),
  virusScanning,
  fileIntegrityCheck,
  fileQuarantine,
  uploadProductImages
);

// User avatar uploads (Authenticated users)
router.post('/user-avatar', 
  authenticate,
  auditFileOperation('USER_AVATAR_UPLOAD'),
  uploadRateLimit({ maxUploadsPerHour: 10, maxSizePerHour: 50 * 1024 * 1024 }),
  CloudinaryImageService.uploadSingle('avatar', 'techverse/users'),
  advancedFileValidation({
    maxFileSize: 5 * 1024 * 1024, // 5MB for avatars
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    checkFileSignature: true
  }),
  virusScanning,
  fileIntegrityCheck,
  fileQuarantine,
  uploadUserAvatar
);

// Review image uploads (Authenticated users)
router.post('/review-images', 
  authenticate,
  auditFileOperation('REVIEW_IMAGE_UPLOAD'),
  uploadRateLimit({ maxUploadsPerHour: 20, maxSizePerHour: 100 * 1024 * 1024 }),
  CloudinaryImageService.uploadMultiple('reviewImages', 5, 'techverse/reviews'),
  advancedFileValidation({
    maxFileSize: 8 * 1024 * 1024, // 8MB for review images
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    checkFileSignature: true
  }),
  virusScanning,
  fileIntegrityCheck,
  fileQuarantine,
  uploadReviewImages
);

// Legacy endpoints (maintain backward compatibility)
router.delete('/image', 
  deleteImageValidation,
  validate,
  authenticate, 
  requireAdmin, 
  auditFileOperation('IMAGE_DELETE'),
  deleteUploadedImage
);

router.get('/image/info', 
  imageInfoValidation,
  validate,
  authenticate, 
  requireAdmin, 
  getImageInfo
);

// File management endpoints (Admin only)
router.delete('/cleanup', 
  authenticate, 
  requireAdmin,
  auditFileOperation('FILE_CLEANUP'),
  cleanupOldFiles
);

router.get('/stats', 
  authenticate, 
  requireAdmin,
  getUploadStats
);

export default router;