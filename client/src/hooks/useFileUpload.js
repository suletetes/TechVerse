import { useState, useCallback, useRef } from 'react';
import { useNotifications } from '../stores/uiStore.js';
import { api } from '../lib/apiClient.js';

/**
 * File Upload Hook
 * Handles file uploads with progress tracking and error handling
 */

export const useFileUpload = ({
  endpoint = '/api/upload',
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = [],
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  autoUpload = false,
} = {}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    completed: 0,
    failed: 0,
    total: 0,
  });
  
  const { showError, showSuccess } = useNotifications();
  const abortControllers = useRef(new Map());

  // Add files to upload queue
  const addFiles = useCallback((newFiles) => {
    const validFiles = [];
    
    for (const file of newFiles) {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        showError(`${file.name}: ${validation.error}`);
        continue;
      }
      
      // Check if file already exists
      const exists = files.some(f => f.name === file.name && f.size === file.size);
      if (exists) {
        showError(`${file.name} is already in the upload queue`);
        continue;
      }
      
      validFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        error: null,
        url: null,
      });
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => {
        const updated = [...prev, ...validFiles];
        
        // Check max files limit
        if (updated.length > maxFiles) {
          showError(`Maximum ${maxFiles} files allowed`);
          return updated.slice(0, maxFiles);
        }
        
        return updated;
      });
      
      // Auto-upload if enabled
      if (autoUpload) {
        setTimeout(() => uploadFiles(validFiles), 100);
      }
    }
  }, [files, maxFiles, autoUpload, showError]);

  // Validate file
  const validateFile = useCallback((file) => {
    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size: ${formatFileSize(maxSize)}`,
      };
    }
    
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }
    
    return { isValid: true };
  }, [maxSize, allowedTypes]);

  // Upload files
  const uploadFiles = useCallback(async (filesToUpload = null) => {
    const targetFiles = filesToUpload || files.filter(f => f.status === 'pending');
    
    if (targetFiles.length === 0) {
      return;
    }
    
    setUploading(true);
    onUploadStart?.(targetFiles);
    
    const uploadPromises = targetFiles.map(fileItem => uploadSingleFile(fileItem));
    
    try {
      await Promise.allSettled(uploadPromises);
    } finally {
      setUploading(false);
      
      // Update stats
      const stats = files.reduce((acc, file) => {
        acc.total++;
        if (file.status === 'completed') acc.completed++;
        if (file.status === 'failed') acc.failed++;
        return acc;
      }, { completed: 0, failed: 0, total: 0 });
      
      setUploadStats(stats);
      onUploadComplete?.(stats);
    }
  }, [files, onUploadStart, onUploadComplete]);

  // Upload single file
  const uploadSingleFile = useCallback(async (fileItem) => {
    const abortController = new AbortController();
    abortControllers.current.set(fileItem.id, abortController);
    
    // Update file status
    setFiles(prev => prev.map(f => 
      f.id === fileItem.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ));
    
    try {
      const formData = new FormData();
      formData.append('file', fileItem.file);
      
      // Add metadata
      formData.append('metadata', JSON.stringify({
        originalName: fileItem.name,
        size: fileItem.size,
        type: fileItem.type,
      }));
      
      const response = await api.upload(endpoint, formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, progress }
            : f
        ));
        
        onUploadProgress?.(fileItem.id, progress);
      });
      
      // Update file with success
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              url: response.url,
              error: null,
            }
          : f
      ));
      
      showSuccess(`${fileItem.name} uploaded successfully`);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        // Upload was cancelled
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'cancelled', error: 'Upload cancelled' }
            : f
        ));
      } else {
        // Upload failed
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                status: 'failed', 
                error: error.message || 'Upload failed',
              }
            : f
        ));
        
        showError(`Failed to upload ${fileItem.name}: ${error.message}`);
        onUploadError?.(error, fileItem);
      }
    } finally {
      abortControllers.current.delete(fileItem.id);
    }
  }, [endpoint, onUploadProgress, onUploadError, showError, showSuccess]);

  // Cancel upload
  const cancelUpload = useCallback((fileId) => {
    const controller = abortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
    }
  }, []);

  // Cancel all uploads
  const cancelAllUploads = useCallback(() => {
    abortControllers.current.forEach(controller => {
      controller.abort();
    });
    abortControllers.current.clear();
  }, []);

  // Remove file from queue
  const removeFile = useCallback((fileId) => {
    // Cancel upload if in progress
    cancelUpload(fileId);
    
    // Remove from files list
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, [cancelUpload]);

  // Clear all files
  const clearFiles = useCallback(() => {
    cancelAllUploads();
    setFiles([]);
    setUploadStats({ completed: 0, failed: 0, total: 0 });
  }, [cancelAllUploads]);

  // Retry failed uploads
  const retryFailedUploads = useCallback(() => {
    const failedFiles = files.filter(f => f.status === 'failed');
    
    // Reset failed files to pending
    setFiles(prev => prev.map(f => 
      f.status === 'failed' 
        ? { ...f, status: 'pending', progress: 0, error: null }
        : f
    ));
    
    // Upload failed files
    if (failedFiles.length > 0) {
      setTimeout(() => uploadFiles(failedFiles), 100);
    }
  }, [files, uploadFiles]);

  // Retry specific file
  const retryFile = useCallback((fileId) => {
    const fileToRetry = files.find(f => f.id === fileId);
    if (!fileToRetry) return;
    
    // Reset file status
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'pending', progress: 0, error: null }
        : f
    ));
    
    // Upload the file
    setTimeout(() => uploadFiles([fileToRetry]), 100);
  }, [files, uploadFiles]);

  // Get upload statistics
  const getUploadStats = useCallback(() => {
    return files.reduce((stats, file) => {
      stats.total++;
      
      switch (file.status) {
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'uploading':
          stats.uploading++;
          break;
        case 'pending':
          stats.pending++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
      
      return stats;
    }, {
      total: 0,
      completed: 0,
      failed: 0,
      uploading: 0,
      pending: 0,
      cancelled: 0,
    });
  }, [files]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    // State
    files,
    uploading,
    uploadStats,
    
    // Actions
    addFiles,
    uploadFiles,
    cancelUpload,
    cancelAllUploads,
    removeFile,
    clearFiles,
    retryFailedUploads,
    retryFile,
    
    // Utilities
    validateFile,
    getUploadStats,
    formatFileSize,
  };
};

export default useFileUpload;