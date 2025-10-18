import express from 'express';
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteUploadedImage,
  getImageInfo,
  testImageAccessibility
} from '../controllers/uploadController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import ImageService from '../services/imageService.js';

const router = express.Router();

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
  authenticate, 
  requireAdmin, 
  deleteUploadedImage
);

router.get('/image/info', 
  authenticate, 
  requireAdmin, 
  getImageInfo
);

export default router;