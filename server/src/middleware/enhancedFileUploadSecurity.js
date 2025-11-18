import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import enhancedLogger from '../utils/enhancedLogger.js';
import { validateImage } from '../utils/imageOptimizer.js';

/**
 * Enhanced File Upload Security Middleware
 * Provides additional security layers on top of existing upload functionality
 */

/**
 * Advanced file validation middleware
 */
export const advancedFileValidation = (options = {}) => {
  const {
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    scanForMalware = false,
    checkFileSignature = true
  } = options;

  return async (req, res, next) => {
    try {
      // Skip if no files uploaded
      if (!req.files && !req.file) {
        return next();
      }

      const files = req.files || [req.file];
      const validationResults = [];

      for (const file of files) {
        if (!file) continue;

        const validation = {
          filename: file.originalname,
          valid: true,
          errors: [],
          warnings: []
        };

        // 1. File size validation
        if (file.size > maxFileSize) {
          validation.valid = false;
          validation.errors.push(`File size ${file.size} exceeds maximum allowed size ${maxFileSize}`);
        }

        // 2. MIME type validation
        if (!allowedMimeTypes.includes(file.mimetype)) {
          validation.valid = false;
          validation.errors.push(`MIME type ${file.mimetype} is not allowed`);
        }

        // 3. File extension validation
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          validation.valid = false;
          validation.errors.push(`File extension ${ext} is not allowed`);
        }

        // 4. File signature validation (magic bytes)
        if (checkFileSignature && file.buffer) {
          try {
            const fileType = await fileTypeFromBuffer(file.buffer);
            if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
              validation.valid = false;
              validation.errors.push('File signature does not match declared MIME type');
            }
          } catch (error) {
            validation.warnings.push('Could not verify file signature');
          }
        }

        // 5. Filename security check
        const suspiciousPatterns = [
          /\.\./,           // Path traversal
          /[<>:"|?*]/,      // Invalid filename characters
          /\.(exe|bat|cmd|scr|pif|com)$/i, // Executable extensions
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i // Reserved names
        ];

        for (const pattern of suspiciousPatterns) {
          if (pattern.test(file.originalname)) {
            validation.valid = false;
            validation.errors.push('Filename contains suspicious patterns');
            break;
          }
        }

        // 6. Image-specific validation
        if (file.mimetype.startsWith('image/') && file.path) {
          try {
            const imageValidation = await validateImage(file.path);
            if (!imageValidation.valid) {
              validation.valid = false;
              validation.errors.push(`Image validation failed: ${imageValidation.error}`);
            }
          } catch (error) {
            validation.warnings.push('Could not perform image validation');
          }
        }

        validationResults.push(validation);

        // Log security events
        if (!validation.valid) {
          enhancedLogger.security('File upload security violation', {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            errors: validation.errors,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?._id,
            requestId: req.id
          });
        }
      }

      // Check if any files failed validation
      const failedFiles = validationResults.filter(v => !v.valid);
      if (failedFiles.length > 0) {
        // Clean up uploaded files
        await cleanupUploadedFiles(files);

        return res.status(400).json({
          success: false,
          message: 'File validation failed',
          code: 'FILE_VALIDATION_ERROR',
          errors: failedFiles.map(f => ({
            filename: f.filename,
            errors: f.errors
          }))
        });
      }

      // Log successful validation
      enhancedLogger.info('File upload validation passed', {
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + (f?.size || 0), 0),
        userId: req.user?._id,
        requestId: req.id
      });

      next();
    } catch (error) {
      enhancedLogger.error('File validation middleware error', {
        error: error.message,
        stack: error.stack,
        requestId: req.id
      });

      // Clean up files on error
      if (req.files || req.file) {
        await cleanupUploadedFiles(req.files || [req.file]);
      }

      res.status(500).json({
        success: false,
        message: 'File validation error',
        code: 'FILE_VALIDATION_ERROR'
      });
    }
  };
};

/**
 * File quarantine middleware for suspicious files
 */
export const fileQuarantine = (req, res, next) => {
  const originalEnd = res.end;
  
  res.end = function(...args) {
    // If response indicates an error, quarantine the files
    if (res.statusCode >= 400 && (req.files || req.file)) {
      const files = req.files || [req.file];
      quarantineFiles(files, req);
    }
    
    return originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Upload rate limiting per user
 */
export const uploadRateLimit = (options = {}) => {
  const {
    maxUploadsPerHour = 50,
    maxSizePerHour = 100 * 1024 * 1024 // 100MB per hour
  } = options;

  const userUploads = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    // Clean old entries
    if (userUploads.has(userId)) {
      const uploads = userUploads.get(userId);
      userUploads.set(userId, uploads.filter(u => u.timestamp > hourAgo));
    }

    const userUploadHistory = userUploads.get(userId) || [];
    const uploadsInLastHour = userUploadHistory.length;
    const sizeInLastHour = userUploadHistory.reduce((sum, u) => sum + u.size, 0);

    // Check limits
    if (uploadsInLastHour >= maxUploadsPerHour) {
      enhancedLogger.security('Upload rate limit exceeded - count', {
        userId,
        uploadsInLastHour,
        maxUploadsPerHour,
        ip: req.ip,
        requestId: req.id
      });

      return res.status(429).json({
        success: false,
        message: 'Upload rate limit exceeded. Please try again later.',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
      });
    }

    const files = req.files || [req.file];
    const currentUploadSize = files.reduce((sum, f) => sum + (f?.size || 0), 0);

    if (sizeInLastHour + currentUploadSize > maxSizePerHour) {
      enhancedLogger.security('Upload rate limit exceeded - size', {
        userId,
        sizeInLastHour,
        currentUploadSize,
        maxSizePerHour,
        ip: req.ip,
        requestId: req.id
      });

      return res.status(429).json({
        success: false,
        message: 'Upload size limit exceeded. Please try again later.',
        code: 'UPLOAD_SIZE_LIMIT_EXCEEDED'
      });
    }

    // Track this upload
    userUploadHistory.push({
      timestamp: now,
      size: currentUploadSize,
      fileCount: files.length
    });
    userUploads.set(userId, userUploadHistory);

    next();
  };
};

/**
 * Virus scanning placeholder (would integrate with actual antivirus)
 */
export const virusScanning = (req, res, next) => {
  // This is a placeholder for virus scanning integration
  // In production, you would integrate with services like:
  // - ClamAV
  // - VirusTotal API
  // - AWS GuardDuty
  // - Azure Defender

  const files = req.files || [req.file];
  
  if (files && files.length > 0) {
    enhancedLogger.info('Virus scanning placeholder executed', {
      fileCount: files.length,
      userId: req.user?._id,
      requestId: req.id
    });
  }

  next();
};

/**
 * File integrity verification
 */
export const fileIntegrityCheck = async (req, res, next) => {
  try {
    const files = req.files || [req.file];
    
    for (const file of files) {
      if (!file || !file.path) continue;

      // Generate file hash for integrity verification
      const fileBuffer = await fs.readFile(file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      // Store hash in file metadata
      file.integrity = {
        sha256: hash,
        size: file.size,
        timestamp: Date.now()
      };

      enhancedLogger.debug('File integrity hash generated', {
        filename: file.originalname,
        hash: hash.substring(0, 16) + '...',
        size: file.size,
        requestId: req.id
      });
    }

    next();
  } catch (error) {
    enhancedLogger.error('File integrity check failed', {
      error: error.message,
      requestId: req.id
    });

    // Continue without integrity check rather than failing
    next();
  }
};

/**
 * Secure file cleanup utility
 */
const cleanupUploadedFiles = async (files) => {
  if (!files) return;

  for (const file of files) {
    if (file && file.path) {
      try {
        await fs.unlink(file.path);
        enhancedLogger.debug('Cleaned up uploaded file', {
          filename: file.originalname,
          path: file.path
        });
      } catch (error) {
        enhancedLogger.warn('Failed to cleanup uploaded file', {
          filename: file.originalname,
          path: file.path,
          error: error.message
        });
      }
    }
  }
};

/**
 * Quarantine suspicious files
 */
const quarantineFiles = async (files, req) => {
  const quarantineDir = path.join(process.cwd(), 'quarantine');
  
  try {
    await fs.mkdir(quarantineDir, { recursive: true });
    
    for (const file of files) {
      if (file && file.path) {
        const quarantinePath = path.join(quarantineDir, `${Date.now()}-${file.originalname}`);
        
        try {
          await fs.rename(file.path, quarantinePath);
          
          enhancedLogger.security('File quarantined', {
            originalPath: file.path,
            quarantinePath,
            filename: file.originalname,
            reason: 'Security validation failed',
            userId: req.user?._id,
            ip: req.ip,
            requestId: req.id
          });
        } catch (error) {
          enhancedLogger.error('Failed to quarantine file', {
            filename: file.originalname,
            error: error.message
          });
        }
      }
    }
  } catch (error) {
    enhancedLogger.error('Failed to create quarantine directory', {
      error: error.message
    });
  }
};

/**
 * Security audit for file operations
 */
export const auditFileOperation = (operation) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log operation start
    enhancedLogger.audit('File operation started', {
      operation,
      userId: req.user?._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      requestId: req.id
    });

    // Override response to log completion
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      enhancedLogger.audit('File operation completed', {
        operation,
        success: res.statusCode < 400,
        statusCode: res.statusCode,
        duration,
        userId: req.user?._id,
        ip: req.ip,
        requestId: req.id
      });

      return originalJson.call(this, data);
    };

    next();
  };
};

export default {
  advancedFileValidation,
  fileQuarantine,
  uploadRateLimit,
  virusScanning,
  fileIntegrityCheck,
  auditFileOperation
};