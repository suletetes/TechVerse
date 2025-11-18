import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import sharp from 'sharp';
import enhancedLogger from '../utils/enhancedLogger.js';
import securityMonitor from '../utils/securityMonitor.js';

/**
 * Secure File Upload Middleware
 * Comprehensive security for file uploads with malware detection and sanitization
 */

// File type configurations
const FILE_CONFIGS = {
  images: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    requireImageProcessing: true
  },
  documents: {
    allowedMimeTypes: ['application/pdf', 'text/plain', 'application/msword'],
    allowedExtensions: ['.pdf', '.txt', '.doc', '.docx'],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    requireVirusScan: true
  },
  avatars: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    requireImageProcessing: true,
    dimensions: { width: 500, height: 500 }
  }
};

// Malicious file signatures to detect
const MALICIOUS_SIGNATURES = [
  { signature: Buffer.from('4D5A', 'hex'), description: 'PE Executable' },
  { signature: Buffer.from('7F454C46', 'hex'), description: 'ELF Executable' },
  { signature: Buffer.from('504B0304', 'hex'), description: 'ZIP Archive' },
  { signature: Buffer.from('526172211A0700', 'hex'), description: 'RAR Archive' },
  { signature: Buffer.from('377ABCAF271C', 'hex'), description: '7-Zip Archive' },
  { signature: Buffer.from('1F8B08', 'hex'), description: 'GZIP Archive' },
  { signature: Buffer.from('425A68', 'hex'), description: 'BZIP2 Archive' },
  { signature: Buffer.from('FD377A585A00', 'hex'), description: 'XZ Archive' }
];

// Suspicious content patterns
const SUSPICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /eval\s*\(/gi,
  /document\.write/gi,
  /window\.location/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi
];

/**
 * Create secure multer configuration
 */
const createSecureStorage = (uploadPath, fileType = 'images') => {
  const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.images;
  
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        // Create upload directory if it doesn't exist
        await fs.mkdir(uploadPath, { recursive: true });
        
        // Create subdirectory based on date for organization
        const dateDir = new Date().toISOString().split('T')[0];
        const fullPath = path.join(uploadPath, dateDir);
        await fs.mkdir(fullPath, { recursive: true });
        
        cb(null, fullPath);
      } catch (error) {
        enhancedLogger.error('Failed to create upload directory', {
          error: error.message,
          uploadPath,
          userId: req.user?._id
        });
        cb(error);
      }
    },
    
    filename: (req, file, cb) => {
      try {
        // Generate secure filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const sanitizedOriginalName = sanitizeFilename(file.originalname);
        const extension = path.extname(sanitizedOriginalName).toLowerCase();
        
        // Validate extension
        if (!config.allowedExtensions.includes(extension)) {
          return cb(new Error(`File extension ${extension} not allowed`));
        }
        
        const secureFilename = `${timestamp}-${randomString}${extension}`;
        
        // Log file upload attempt
        enhancedLogger.security('File upload initiated', {
          originalName: file.originalname,
          secureFilename,
          mimetype: file.mimetype,
          userId: req.user?._id,
          ip: req.ip,
          requestId: req.id
        });
        
        cb(null, secureFilename);
      } catch (error) {
        enhancedLogger.error('Failed to generate secure filename', {
          error: error.message,
          originalName: file.originalname,
          userId: req.user?._id
        });
        cb(error);
      }
    }
  });
  
  return storage;
};

/**
 * File filter with comprehensive security checks
 */
const createSecureFileFilter = (fileType = 'images') => {
  const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.images;
  
  return async (req, file, cb) => {
    try {
      // Basic MIME type validation
      if (!config.allowedMimeTypes.includes(file.mimetype)) {
        enhancedLogger.security('File upload blocked - invalid MIME type', {
          filename: file.originalname,
          mimetype: file.mimetype,
          allowedTypes: config.allowedMimeTypes,
          userId: req.user?._id,
          ip: req.ip
        });
        
        return cb(new Error(`File type ${file.mimetype} not allowed`));
      }
      
      // Extension validation
      const extension = path.extname(file.originalname).toLowerCase();
      if (!config.allowedExtensions.includes(extension)) {
        enhancedLogger.security('File upload blocked - invalid extension', {
          filename: file.originalname,
          extension,
          allowedExtensions: config.allowedExtensions,
          userId: req.user?._id,
          ip: req.ip
        });
        
        return cb(new Error(`File extension ${extension} not allowed`));
      }
      
      // Filename security validation
      if (!isSecureFilename(file.originalname)) {
        enhancedLogger.security('File upload blocked - suspicious filename', {
          filename: file.originalname,
          userId: req.user?._id,
          ip: req.ip
        });
        
        return cb(new Error('Filename contains suspicious characters'));
      }
      
      cb(null, true);
    } catch (error) {
      enhancedLogger.error('File filter error', {
        error: error.message,
        filename: file.originalname,
        userId: req.user?._id
      });
      cb(error);
    }
  };
};

/**
 * Create secure multer instance
 */
export const createSecureUpload = (uploadPath, fileType = 'images', options = {}) => {
  const config = { ...FILE_CONFIGS[fileType], ...options };
  
  return multer({
    storage: createSecureStorage(uploadPath, fileType),
    fileFilter: createSecureFileFilter(fileType),
    limits: {
      fileSize: config.maxSize,
      files: config.maxFiles,
      fields: 10,
      fieldNameSize: 100,
      fieldSize: 1024 * 1024 // 1MB for field values
    }
  });
};

/**
 * Post-upload security validation middleware
 */
export const validateUploadedFile = (fileType = 'images') => {
  return async (req, res, next) => {
    try {
      if (!req.files && !req.file) {
        return next();
      }
      
      const files = req.files ? Object.values(req.files).flat() : [req.file];
      const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.images;
      
      for (const file of files) {
        if (!file) continue;
        
        // Read file for content analysis
        const fileBuffer = await fs.readFile(file.path);
        
        // Malware signature detection
        const malwareDetected = await detectMalware(fileBuffer, file);
        if (malwareDetected) {
          await cleanupFile(file.path);
          
          enhancedLogger.security('Malware detected in uploaded file', {
            filename: file.originalname,
            path: file.path,
            malwareType: malwareDetected,
            userId: req.user?._id,
            ip: req.ip,
            requestId: req.id
          });
          
          // Track malware upload attempt
          const identifier = req.user?._id || req.ip;
          securityMonitor.trackMalwareUpload(identifier, {
            filename: file.originalname,
            malwareType: malwareDetected
          });
          
          return res.status(400).json({
            success: false,
            message: 'File contains suspicious content and has been rejected',
            code: 'MALWARE_DETECTED'
          });
        }
        
        // Content validation for images
        if (config.requireImageProcessing && file.mimetype.startsWith('image/')) {
          const imageValidation = await validateImageContent(fileBuffer, file);
          if (!imageValidation.valid) {
            await cleanupFile(file.path);
            
            enhancedLogger.security('Invalid image content detected', {
              filename: file.originalname,
              path: file.path,
              reason: imageValidation.reason,
              userId: req.user?._id,
              ip: req.ip
            });
            
            return res.status(400).json({
              success: false,
              message: imageValidation.reason,
              code: 'INVALID_IMAGE_CONTENT'
            });
          }
          
          // Process and sanitize image
          const processedPath = await processImage(file.path, config);
          if (processedPath !== file.path) {
            file.path = processedPath;
            file.filename = path.basename(processedPath);
          }
        }
        
        // Log successful upload
        enhancedLogger.info('File upload completed successfully', {
          filename: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          userId: req.user?._id,
          requestId: req.id
        });
      }
      
      next();
    } catch (error) {
      enhancedLogger.error('File validation error', {
        error: error.message,
        userId: req.user?._id,
        requestId: req.id
      });
      
      // Cleanup uploaded files on error
      if (req.files || req.file) {
        const files = req.files ? Object.values(req.files).flat() : [req.file];
        for (const file of files) {
          if (file && file.path) {
            await cleanupFile(file.path);
          }
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'File validation failed',
        code: 'FILE_VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Detect malware signatures in file content
 */
const detectMalware = async (fileBuffer, file) => {
  try {
    // Check for known malicious signatures
    for (const { signature, description } of MALICIOUS_SIGNATURES) {
      if (fileBuffer.indexOf(signature) === 0) {
        return description;
      }
    }
    
    // Check for suspicious content patterns in text-based files
    if (file.mimetype.startsWith('text/') || file.mimetype.includes('xml') || file.mimetype.includes('html')) {
      const content = fileBuffer.toString('utf8');
      
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(content)) {
          return 'Suspicious script content';
        }
      }
    }
    
    // Check for embedded executables in images (steganography)
    if (file.mimetype.startsWith('image/')) {
      const content = fileBuffer.toString('binary');
      
      // Look for PE header in image files
      if (content.includes('MZ') && content.includes('PE')) {
        return 'Embedded executable in image';
      }
    }
    
    return null;
  } catch (error) {
    enhancedLogger.error('Malware detection error', {
      error: error.message,
      filename: file.originalname
    });
    return null;
  }
};

/**
 * Validate image content and structure
 */
const validateImageContent = async (fileBuffer, file) => {
  try {
    // Use Sharp to validate image structure
    const metadata = await sharp(fileBuffer).metadata();
    
    // Check for reasonable dimensions
    if (metadata.width > 10000 || metadata.height > 10000) {
      return {
        valid: false,
        reason: 'Image dimensions too large (potential DoS attack)'
      };
    }
    
    // Check for minimum dimensions
    if (metadata.width < 1 || metadata.height < 1) {
      return {
        valid: false,
        reason: 'Invalid image dimensions'
      };
    }
    
    // Validate format matches MIME type
    const expectedFormats = {
      'image/jpeg': ['jpeg', 'jpg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif']
    };
    
    const allowedFormats = expectedFormats[file.mimetype];
    if (allowedFormats && !allowedFormats.includes(metadata.format)) {
      return {
        valid: false,
        reason: 'Image format does not match MIME type'
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: 'Invalid or corrupted image file'
    };
  }
};

/**
 * Process and sanitize image
 */
const processImage = async (filePath, config) => {
  try {
    const processedPath = filePath.replace(/(\.[^.]+)$/, '_processed$1');
    
    let pipeline = sharp(filePath);
    
    // Resize if dimensions specified
    if (config.dimensions) {
      pipeline = pipeline.resize(config.dimensions.width, config.dimensions.height, {
        fit: 'cover',
        position: 'center'
      });
    }
    
    // Strip metadata for privacy and security
    pipeline = pipeline.withMetadata(false);
    
    // Convert to safe format and optimize
    const format = path.extname(filePath).toLowerCase();
    switch (format) {
      case '.jpg':
      case '.jpeg':
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
        break;
      case '.png':
        pipeline = pipeline.png({ compressionLevel: 6 });
        break;
      case '.webp':
        pipeline = pipeline.webp({ quality: 85 });
        break;
    }
    
    await pipeline.toFile(processedPath);
    
    // Remove original file
    await fs.unlink(filePath);
    
    return processedPath;
  } catch (error) {
    enhancedLogger.error('Image processing error', {
      error: error.message,
      filePath
    });
    return filePath; // Return original path if processing fails
  }
};

/**
 * Sanitize filename
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length
};

/**
 * Check if filename is secure
 */
const isSecureFilename = (filename) => {
  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\\\')) {
    return false;
  }
  
  // Check for null bytes
  if (filename.includes('\\0')) {
    return false;
  }
  
  // Check for control characters
  if (/[\\x00-\\x1f\\x7f-\\x9f]/.test(filename)) {
    return false;
  }
  
  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const nameWithoutExt = path.parse(filename).name.toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    return false;
  }
  
  return true;
};

/**
 * Cleanup uploaded file
 */
const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    enhancedLogger.error('Failed to cleanup file', {
      error: error.message,
      filePath
    });
  }
};

/**
 * File upload rate limiting
 */
export const uploadRateLimit = (req, res, next) => {
  const identifier = req.user?._id || req.ip;
  const uploads = securityMonitor.getUploadAttempts(identifier);
  
  if (uploads && uploads.count > 20) { // More than 20 uploads in window
    enhancedLogger.security('Upload rate limit exceeded', {
      identifier,
      uploadCount: uploads.count,
      userId: req.user?._id,
      ip: req.ip,
      requestId: req.id
    });
    
    return res.status(429).json({
      success: false,
      message: 'Too many file uploads. Please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    });
  }
  
  // Track upload attempt
  securityMonitor.trackUploadAttempt(identifier);
  
  next();
};

export default {
  createSecureUpload,
  validateUploadedFile,
  uploadRateLimit,
  FILE_CONFIGS
};