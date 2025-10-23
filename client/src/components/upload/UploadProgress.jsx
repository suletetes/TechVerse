import React, { useState, useEffect } from 'react';

/**
 * Upload Progress Component
 * Displays upload progress with detailed information
 */

export const UploadProgress = ({
  files = [],
  onCancel,
  onRetry,
  onComplete,
  showDetails = true,
  className = '',
}) => {
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({
    completed: 0,
    failed: 0,
    total: 0,
    totalSize: 0,
    uploadedSize: 0,
  });

  // Calculate overall progress
  useEffect(() => {
    if (files.length === 0) return;

    const stats = files.reduce(
      (acc, file) => {
        acc.total++;
        acc.totalSize += file.size || 0;
        
        if (file.status === 'completed') {
          acc.completed++;
          acc.uploadedSize += file.size || 0;
        } else if (file.status === 'failed') {
          acc.failed++;
        } else if (file.status === 'uploading' && file.progress) {
          acc.uploadedSize += (file.size || 0) * (file.progress / 100);
        }
        
        return acc;
      },
      { completed: 0, failed: 0, total: 0, totalSize: 0, uploadedSize: 0 }
    );

    setUploadStats(stats);
    
    const progress = stats.totalSize > 0 
      ? Math.round((stats.uploadedSize / stats.totalSize) * 100)
      : 0;
    
    setOverallProgress(progress);

    // Check if all uploads are complete
    if (stats.completed + stats.failed === stats.total && stats.total > 0) {
      onComplete?.(stats);
    }
  }, [files, onComplete]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format upload speed
  const formatSpeed = (bytesPerSecond) => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'uploading':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className={`upload-progress ${className}`}>
      {/* Overall Progress */}
      <div className="overall-progress mb-4 p-4 bg-white rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">
            Upload Progress
          </h3>
          <span className="text-sm text-gray-500">
            {uploadStats.completed + uploadStats.failed} / {uploadStats.total} files
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{overallProgress}% complete</span>
          <span>
            {formatFileSize(uploadStats.uploadedSize)} / {formatFileSize(uploadStats.totalSize)}
          </span>
        </div>
        
        {/* Status Summary */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex space-x-4">
            {uploadStats.completed > 0 && (
              <span className="text-green-600">
                ✓ {uploadStats.completed} completed
              </span>
            )}
            {uploadStats.failed > 0 && (
              <span className="text-red-600">
                ✗ {uploadStats.failed} failed
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2">
            {uploadStats.failed > 0 && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Retry Failed
              </button>
            )}
            {onCancel && uploadStats.completed + uploadStats.failed < uploadStats.total && (
              <button
                type="button"
                onClick={onCancel}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Cancel All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Individual File Progress */}
      {showDetails && (
        <div className="file-progress space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="file-progress-item p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(file.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size || 0)}
                      {file.speed && file.status === 'uploading' && (
                        <span className="ml-2">• {formatSpeed(file.speed)}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* File Actions */}
                <div className="flex items-center space-x-2">
                  {file.status === 'uploading' && (
                    <span className="text-xs text-gray-500">
                      {file.progress || 0}%
                    </span>
                  )}
                  
                  {file.status === 'failed' && onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(file)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Retry
                    </button>
                  )}
                  
                  {file.status === 'uploading' && onCancel && (
                    <button
                      type="button"
                      onClick={() => onCancel(file)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              
              {/* Individual Progress Bar */}
              {file.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress || 0}%` }}
                  />
                </div>
              )}
              
              {/* Error Message */}
              {file.status === 'failed' && file.error && (
                <p className="text-xs text-red-600 mt-1">
                  Error: {file.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadProgress;