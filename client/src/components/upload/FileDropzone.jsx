import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNotifications } from '../../stores/uiStore.js';

/**
 * Enhanced File Dropzone Component
 * Drag-and-drop file upload with preview and validation
 */

export const FileDropzone = ({
  onFilesAccepted,
  onFilesRejected,
  accept = {},
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB
  minSize = 0,
  multiple = false,
  disabled = false,
  className = '',
  children,
  showPreview = true,
  showProgress = true,
  allowedTypes = [],
  ...props
}) => {
  const [uploadProgress, setUploadProgress] = useState({});
  const [previews, setPreviews] = useState([]);
  const { showError, showSuccess } = useNotifications();

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(({ file, errors }) => ({
          fileName: file.name,
          errors: errors.map(error => error.message),
        }));
        
        onFilesRejected?.(errors);
        
        // Show error notification
        const errorMessage = `${rejectedFiles.length} file(s) rejected: ${
          errors[0].errors[0]
        }`;
        showError(errorMessage);
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        // Create previews for images
        if (showPreview) {
          const newPreviews = acceptedFiles.map(file => {
            const preview = {
              file,
              id: `${file.name}-${Date.now()}`,
              name: file.name,
              size: file.size,
              type: file.type,
              url: null,
            };

            // Create preview URL for images
            if (file.type.startsWith('image/')) {
              preview.url = URL.createObjectURL(file);
            }

            return preview;
          });

          setPreviews(prev => multiple ? [...prev, ...newPreviews] : newPreviews);
        }

        onFilesAccepted?.(acceptedFiles);
        showSuccess(`${acceptedFiles.length} file(s) selected successfully`);
      }
    },
    [onFilesAccepted, onFilesRejected, showError, showSuccess, showPreview, multiple]
  );

  // Validate file type
  const validator = useCallback((file) => {
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        code: 'file-invalid-type',
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }
    return null;
  }, [allowedTypes]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    isFocused,
  } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    minSize,
    multiple,
    disabled,
    validator,
    ...props,
  });

  // Remove preview
  const removePreview = useCallback((previewId) => {
    setPreviews(prev => {
      const updated = prev.filter(p => p.id !== previewId);
      // Revoke object URL to prevent memory leaks
      const removed = prev.find(p => p.id === previewId);
      if (removed?.url) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });
  }, []);

  // Clear all previews
  const clearPreviews = useCallback(() => {
    previews.forEach(preview => {
      if (preview.url) {
        URL.revokeObjectURL(preview.url);
      }
    });
    setPreviews([]);
  }, [previews]);

  // Upload progress handler
  const updateProgress = useCallback((fileId, progress) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: progress,
    }));
  }, []);

  // Get dropzone classes
  const getDropzoneClasses = () => {
    const baseClasses = [
      'file-dropzone',
      'border-2',
      'border-dashed',
      'rounded-lg',
      'p-6',
      'text-center',
      'transition-colors',
      'cursor-pointer',
    ];

    if (disabled) {
      baseClasses.push('opacity-50', 'cursor-not-allowed', 'bg-gray-50');
    } else if (isDragAccept) {
      baseClasses.push('border-green-400', 'bg-green-50');
    } else if (isDragReject) {
      baseClasses.push('border-red-400', 'bg-red-50');
    } else if (isDragActive) {
      baseClasses.push('border-blue-400', 'bg-blue-50');
    } else if (isFocused) {
      baseClasses.push('border-blue-300', 'bg-blue-25');
    } else {
      baseClasses.push('border-gray-300', 'hover:border-gray-400');
    }

    return [...baseClasses, className].join(' ');
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  return (
    <div className="file-dropzone-container">
      <div {...getRootProps({ className: getDropzoneClasses() })}>
        <input {...getInputProps()} />
        
        {children ? (
          children
        ) : (
          <div className="dropzone-content">
            <div className="dropzone-icon mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <div className="dropzone-text">
              {isDragActive ? (
                <p className="text-lg font-medium text-blue-600">
                  Drop the files here...
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-900">
                    Drag & drop files here, or{' '}
                    <span className="text-blue-600 underline">browse</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {multiple ? `Up to ${maxFiles} files` : 'Single file'} •{' '}
                    Max {formatFileSize(maxSize)} each
                  </p>
                  {allowedTypes.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Supported: {allowedTypes.join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File Previews */}
      {showPreview && previews.length > 0 && (
        <div className="file-previews mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({previews.length})
            </h4>
            <button
              type="button"
              onClick={clearPreviews}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2">
            {previews.map((preview) => (
              <FilePreview
                key={preview.id}
                preview={preview}
                progress={uploadProgress[preview.id]}
                onRemove={() => removePreview(preview.id)}
                showProgress={showProgress}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// File Preview Component
const FilePreview = ({ preview, progress, onRemove, showProgress }) => {
  const isImage = preview.type.startsWith('image/');
  const isUploading = progress !== undefined && progress < 100;

  return (
    <div className="file-preview flex items-center p-3 bg-gray-50 rounded-lg">
      {/* File Icon/Thumbnail */}
      <div className="flex-shrink-0 mr-3">
        {isImage && preview.url ? (
          <img
            src={preview.url}
            alt={preview.name}
            className="h-12 w-12 object-cover rounded"
          />
        ) : (
          <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {preview.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(preview.size)} • {preview.type}
        </p>
        
        {/* Progress Bar */}
        {showProgress && isUploading && (
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
          </div>
        )}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 ml-3 text-gray-400 hover:text-red-500 transition-colors"
        disabled={isUploading}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileDropzone;