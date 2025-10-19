import express from 'express';
import { body, query } from 'express-validator';
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteUploadedImage,
  getImageInfo,
  testImageAccessibility
} from '../controllers/uploadController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import ImageService from '../services/imageService.js';

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

// Protected routes (Admin only)
router.post('/image', 
  authenticate, 
  requireAdmin, 
  ImageService.uploadSingle('image'), 
  uploadSingleImage
);

router.post('/images', 
  authenticate, 
  requireAdmin, 
  ImageService.uploadMultiple('images', 10), 
  uploadMultipleImages
);

router.delete('/image', 
  deleteImageValidation,
  validate,
  authenticate, 
  requireAdmin, 
  deleteUploadedImage
);

router.get('/image/info', 
  imageInfoValidation,
  validate,
  authenticate, 
  requireAdmin, 
  getImageInfo
);

export default router;