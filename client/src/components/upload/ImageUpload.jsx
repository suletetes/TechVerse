import React, { useState, useCallback } from 'react';
import { FileDropzone } from './FileDropzone.jsx';
import { useNotifications } from '../../stores/uiStore.js';

/**
 * Specialized Image Upload Component
 * Optimized for image uploads with cropping and validation
 */

export const ImageUpload = ({
  onImagesSelected,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  showCrop = false,
  cropAspectRatio = 1,
  uploadEndpoint = '/api/upload/images',
  className = '',
  disabled = false,
  ...props
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const { showError, showSuccess } = useNotifications();

  // Handle file selection
  const handleFilesAccepted = useCallback(async (files) => {
    const validImages = [];
    
    for (const file of files) {
      // Validate image dimensions if needed
      try {
        const dimensions = await getImageDimensions(file);
        validImages.push({
          file,
          dimensions,
          preview: URL.createObjectURL(file),
        });
      } catch (error) {
        showError(`Failed to process ${file.name}: ${error.message}`);
      }
    }

    if (validImages.length > 0) {
      onImagesSelected?.(validImages);
      
      // Auto-upload if endpoint provided
      if (uploadEndpoint) {
        await uploadImages(validImages);
      }
    }
  }, [onImagesSelected, uploadEndpoint, showError]);

  // Upload images to server
  const uploadImages = async (images) => {
    setUploading(true);
    const uploadResults = [];

    try {
      for (const image of images) {
        const formData = new FormData();
        formData.append('image', image.file);
        
        // Add metadata
        formData.append('metadata', JSON.stringify({
          originalName: image.file.name,
          dimensions: image.dimensions,
        }));

        try {
          const response = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
            // Add auth headers if needed
            headers: {
              // Authorization will be added by axios interceptor
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          uploadResults.push({
            ...result,
            originalFile: image.file,
            preview: image.preview,
          });

        } catch (error) {
          showError(`Failed to upload ${image.file.name}: ${error.message}`);
          onUploadError?.(error, image.file);
        }
      }

      if (uploadResults.length > 0) {
        setUploadedImages(prev => [...prev, ...uploadResults]);
        onUploadComplete?.(uploadResults);
        showSuccess(`${uploadResults.length} image(s) uploaded successfully`);
      }

    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded image
  const removeImage = useCallback((imageId) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Revoke preview URL
      const removed = prev.find(img => img.id === imageId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  }, []);

  // Get image dimensions
  const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Validate image file
  const validateImage = useCallback((file) => {
    // Check file type
    if (!allowedFormats.includes(file.type)) {
      return {
        code: 'invalid-image-type',
        message: `Invalid image format. Allowed: ${allowedFormats.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        code: 'image-too-large',
        message: `Image too large. Maximum size: ${formatFileSize(maxSize)}`,
      };
    }

    return null;
  }, [allowedFormats, maxSize]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`image-upload ${className}`}>
      <FileDropzone
        onFilesAccepted={handleFilesAccepted}
        accept={{
          'image/*': allowedFormats.map(format => format.split('/')[1]),
        }}
        maxFiles={maxFiles}
        maxSize={maxSize}
        multiple={maxFiles > 1}
        disabled={disabled || uploading}
        validator={validateImage}
        allowedTypes={allowedFormats}
        {...props}
      >
        <div className="image-dropzone-content">
          <div className="dropzone-icon mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          
          <div className="dropzone-text">
            <p className="text-lg font-medium text-gray-900">
              Drop images here, or{' '}
              <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {maxFiles > 1 ? `Up to ${maxFiles} images` : 'Single image'} •{' '}
              Max {formatFileSize(maxSize)} each
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supported: JPEG, PNG, GIF, WebP
            </p>
          </div>
        </div>
      </FileDropzone>

      {/* Upload Progress */}
      {uploading && (
        <div className="upload-progress mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-blue-800">Uploading images...</span>
          </div>
        </div>
      )}

      {/* Uploaded Images Gallery */}
      {uploadedImages.length > 0 && (
        <div className="uploaded-images mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Uploaded Images ({uploadedImages.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={image.url || image.preview}
                  alt={image.originalName || 'Uploaded image'}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    {/* View Button */}
                    <button
                      type="button"
                      onClick={() => window.open(image.url || image.preview, '_blank')}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 transition-colors"
                      title="View full size"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                      title="Remove image"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    {image.originalName || 'Untitled'}
                  </p>
                  {image.dimensions && (
                    <p className="text-white text-xs opacity-75">
                      {image.dimensions.width} × {image.dimensions.height}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;