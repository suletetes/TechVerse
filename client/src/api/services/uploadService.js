/**
 * Upload Service for handling file uploads
 * Implements requirements for admin image upload functionality
 */

import BaseApiService from '../core/BaseApiService.js';
import { API_ENDPOINTS } from '../config.js';

class UploadService extends BaseApiService {
  constructor() {
    super({
      serviceName: 'UploadService',
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      endpoints: {
        SINGLE: API_ENDPOINTS.UPLOAD?.IMAGE || '/upload/image',
        MULTIPLE: API_ENDPOINTS.UPLOAD?.IMAGES || '/upload/images',
        DELETE: API_ENDPOINTS.UPLOAD?.IMAGE || '/upload/image',
        INFO: '/upload/image/info',
        PRODUCT_IMAGES: API_ENDPOINTS.UPLOAD?.PRODUCT_IMAGES || '/upload/product-images'
      },
      defaultOptions: {
        timeout: 30000 // Longer timeout for file uploads
      }
    });
  }

  // Upload single image
  async uploadSingleImage(file, options = {}) {
    if (!file) {
      throw new Error('File is required');
    }

    const formData = new FormData();
    formData.append('image', file);
    
    // Add optional metadata
    if (options.alt) formData.append('alt', options.alt);
    if (options.category) formData.append('category', options.category);
    if (options.isPrimary) formData.append('isPrimary', options.isPrimary);

    return this.httpClient.post(this.endpoints.SINGLE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: options.onProgress
    });
  }

  // Upload multiple images
  async uploadMultipleImages(files, options = {}) {
    if (!files || files.length === 0) {
      throw new Error('At least one file is required');
    }

    if (files.length > 10) {
      throw new Error('Maximum 10 files allowed per upload');
    }

    const formData = new FormData();
    
    // Add files to form data
    Array.from(files).forEach((file, index) => {
      formData.append('images', file);
    });
    
    // Add optional metadata
    if (options.category) formData.append('category', options.category);

    return this.httpClient.post(this.endpoints.MULTIPLE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: options.onProgress
    });
  }

  // Delete uploaded image
  async deleteImage(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    return this.httpClient.delete(this.endpoints.DELETE, {
      data: { filename }
    });
  }

  // Get image information
  async getImageInfo(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    return this.httpClient.get(this.endpoints.INFO, {
      params: { filename }
    });
  }

  // Test image accessibility
  async testImageAccess() {
    return this.httpClient.get(`${this.endpoints.BASE}/test`);
  }

  // Validate file before upload
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push('File name must be less than 255 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create image preview URL
  createPreviewUrl(file) {
    if (!file) return null;
    
    try {
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Failed to create preview URL:', error);
      return null;
    }
  }

  // Cleanup preview URL
  cleanupPreviewUrl(url) {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to cleanup preview URL:', error);
      }
    }
  }

  // Upload with progress tracking
  async uploadWithProgress(files, options = {}) {
    const {
      onProgress,
      onSuccess,
      onError,
      category = 'products'
    } = options;

    try {
      // Validate files
      const fileArray = Array.isArray(files) ? files : [files];
      const validationErrors = [];

      fileArray.forEach((file, index) => {
        const validation = this.validateFile(file);
        if (!validation.isValid) {
          validationErrors.push(`File ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      // Upload files
      const uploadMethod = fileArray.length === 1 
        ? this.uploadSingleImage(fileArray[0], { ...options, category })
        : this.uploadMultipleImages(fileArray, { ...options, category });

      const response = await uploadMethod;

      if (onSuccess) {
        onSuccess(response);
      }

      return response;

    } catch (error) {
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }
}

export default new UploadService();