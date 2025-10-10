import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { UPLOAD_SETTINGS } from '../utils/constants.js';
import { AppError } from './errorHandler.js';
import logger from '../utils/logger.js';

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    'uploads/',
    'uploads/products/',
    'uploads/users/',
    'uploads/reviews/',
    'uploads/categories/',
    'uploads/temp/'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  });
};

// Initialize upload directories
ensureUploadDirs();

// Generate unique filename
const generateFileName = (originalname, userId = null) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname).toLowerCase();
  const baseName = path.basename(originalname, extension)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  
  const userPrefix = userId ? `${userId}_` : '';
  return `${userPrefix}${baseName}_${timestamp}_${randomString}${extension}`;
};

// Determine upload destination based on file type and user
const getDestination = (req, file) => {
  const baseDir = 'uploads/';
  
  // Determine subdirectory based on route or file purpose
  if (req.originalUrl.includes('/products')) {
    return path.join(baseDir, 'products/');
  } else if (req.originalUrl.includes('/users') || req.originalUrl.includes('/profile')) {
    return path.join(baseDir, 'users/');
  } else if (req.originalUrl.includes('/reviews')) {
    return path.join(baseDir, 'reviews/');
  } else if (req.originalUrl.includes('/categories')) {
    return path.join(baseDir, 'categories/');
  } else {
    return path.join(baseDir, 'temp/');
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const destination = getDestination(req, file);
      
      // Ensure directory exists
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }
      
      cb(null, destination);
    } catch (error) {
      logger.error('Upload destination error', error);
      cb(new AppError('Upload directory error', 500, 'UPLOAD_DIR_ERROR'));
    }
  },
  
  filename: (req, file, cb) => {
    try {
      const filename = generateFileName(file.originalname, req.user?._id);
      
      // Store original filename in request for later use
      if (!req.uploadedFiles) req.uploadedFiles = [];
      req.uploadedFiles.push({
        fieldname: file.fieldname,
        originalname: file.originalname,
        filename: filename,
        mimetype: file.mimetype
      });
      
      cb(null, filename);
    } catch (error) {
      logger.error('Filename generation error', error);
      cb(new AppError('Filename generation error', 500, 'FILENAME_ERROR'));
    }
  }
});

// Memory storage for temporary processing
const memoryStorage = multer.memoryStorage();

// Advanced file filter with detailed validation
const createFileFilter = (options = {}) => {
  const {
    allowedTypes = UPLOAD_SETTINGS.ALLOWED_MIME_TYPES,
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxFileSize = UPLOAD_SETTINGS.MAX_FILE_SIZE,
    checkMagicNumbers = true
  } = options;

  return (req, file, cb) => {
    try {
      // Check MIME type
      if (!allowedTypes.includes(file.mimetype)) {
        logger.warn('File upload rejected: Invalid MIME type', {
          filename: file.originalname,
          mimetype: file.mimetype,
          userId: req.user?._id
        });
        return cb(new AppError(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          400,
          'INVALID_FILE_TYPE'
        ));
      }

      // Check file extension
      const extension = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        logger.warn('File upload rejected: Invalid extension', {
          filename: file.originalname,
          extension,
          userId: req.user?._id
        });
        return cb(new AppError(
          `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
          400,
          'INVALID_FILE_EXTENSION'
        ));
      }

      // Check filename for security
      const filename = file.originalname;
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        logger.warn('File upload rejected: Suspicious filename', {
          filename,
          userId: req.user?._id
        });
        return cb(new AppError(
          'Invalid filename',
          400,
          'INVALID_FILENAME'
        ));
      }

      // Additional security checks can be added here
      // (e.g., magic number validation, virus scanning)

      cb(null, true);
    } catch (error) {
      logger.error('File filter error', error);
      cb(new AppError('File validation error', 500, 'FILE_VALIDATION_ERROR'));
    }
  };
};

// Create multer instances with different configurations
const createUploadMiddleware = (options = {}) => {
  const {
    storage: storageType = 'disk',
    limits = {},
    fileFilter = createFileFilter()
  } = options;

  const uploadLimits = {
    fileSize: limits.fileSize || UPLOAD_SETTINGS.MAX_FILE_SIZE,
    files: limits.files || UPLOAD_SETTINGS.MAX_FILES_PER_UPLOAD,
    fields: limits.fields || 10,
    fieldNameSize: limits.fieldNameSize || 100,
    fieldSize: limits.fieldSize || 1024 * 1024, // 1MB
    ...limits
  };

  return multer({
    storage: storageType === 'memory' ? memoryStorage : storage,
    limits: uploadLimits,
    fileFilter,
    onError: (err, next) => {
      logger.error('Multer error', err);
      next(new AppError('File upload error', 500, 'UPLOAD_ERROR'));
    }
  });
};

// Default upload middleware
const upload = createUploadMiddleware();

// Specialized upload configurations
export const uploadSingle = (fieldName, options = {}) => {
  const middleware = createUploadMiddleware(options);
  return middleware.single(fieldName);
};

export const uploadMultiple = (fieldName, maxCount = 5, options = {}) => {
  const middleware = createUploadMiddleware(options);
  return middleware.array(fieldName, maxCount);
};

export const uploadFields = (fields, options = {}) => {
  const middleware = createUploadMiddleware(options);
  return middleware.fields(fields);
};

// Image-specific upload middleware
export const uploadImage = (fieldName, options = {}) => {
  const imageOptions = {
    ...options,
    fileFilter: createFileFilter({
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      ...options
    })
  };
  
  return uploadSingle(fieldName, imageOptions);
};

export const uploadImages = (fieldName, maxCount = 10, options = {}) => {
  const imageOptions = {
    ...options,
    fileFilter: createFileFilter({
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      ...options
    })
  };
  
  return uploadMultiple(fieldName, maxCount, imageOptions);
};

// Product images upload (multiple images with specific validation)
export const uploadProductImages = uploadImages('images', 10, {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per image
  }
});

// User avatar upload (single image)
export const uploadUserAvatar = uploadImage('avatar', {
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// Review images upload
export const uploadReviewImages = uploadImages('images', 5, {
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB per image
  }
});

// Category image upload
export const uploadCategoryImage = uploadImage('image', {
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// Cleanup middleware to remove uploaded files on error
export const cleanupUploads = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If there was an error and files were uploaded, clean them up
    if (res.statusCode >= 400 && req.uploadedFiles) {
      req.uploadedFiles.forEach(fileInfo => {
        const filePath = path.join(getDestination(req, fileInfo), fileInfo.filename);
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.error('Failed to cleanup uploaded file', {
              filePath,
              error: err.message
            });
          } else {
            logger.debug('Cleaned up uploaded file', { filePath });
          }
        });
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// File validation middleware (for additional checks after upload)
export const validateUploadedFiles = (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  const files = req.files ? Object.values(req.files).flat() : [req.file];
  
  try {
    files.forEach(file => {
      // Additional validation can be added here
      // e.g., image dimensions, file content validation, etc.
      
      logger.debug('File uploaded successfully', {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        userId: req.user?._id
      });
    });
    
    next();
  } catch (error) {
    logger.error('File validation error', error);
    next(new AppError('File validation failed', 400, 'FILE_VALIDATION_FAILED'));
  }
};

export default upload;