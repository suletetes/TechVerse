import React, { useState, useCallback } from 'react';
import { FileDropzone } from './FileDropzone.jsx';
import { useNotifications } from '../../stores/uiStore.js';

/**
 * Document Upload Component
 * Specialized for document uploads with validation and preview
 */

export const DocumentUpload = ({
  onDocumentsSelected,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedFormats = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  uploadEndpoint = '/api/upload/documents',
  className = '',
  disabled = false,
  showMetadata = true,
  extractText = false,
  ...props
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const { showError, showSuccess } = useNotifications();

  // File type icons mapping
  const getFileIcon = (mimeType) => {
    const iconMap = {
      'application/pdf': '📄',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'text/plain': '📄',
      'text/csv': '📊',
    };
    return iconMap[mimeType] || '📎';
  };

  // Get file type name
  const getFileTypeName = (mimeType) => {
    const typeMap = {
      'application/pdf': 'PDF',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'text/plain': 'Text File',
      'text/csv': 'CSV File',
    };
    return typeMap[mimeType] || 'Document';
  };

  // Handle file selection
  const handleFilesAccepted = useCallback(async (files) => {
    const validDocuments = [];
    
    for (const file of files) {
      try {
        const metadata = await extractDocumentMetadata(file);
        validDocuments.push({
          file,
          metadata,
          icon: getFileIcon(file.type),
          typeName: getFileTypeName(file.type),
        });
      } catch (error) {
        showError(`Failed to process ${file.name}: ${error.message}`);
      }
    }

    if (validDocuments.length > 0) {
      onDocumentsSelected?.(validDocuments);
      
      // Auto-upload if endpoint provided
      if (uploadEndpoint) {
        await uploadDocuments(validDocuments);
      }
    }
  }, [onDocumentsSelected, uploadEndpoint, showError]);

  // Extract document metadata
  const extractDocumentMetadata = async (file) => {
    const metadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      extension: file.name.split('.').pop()?.toLowerCase(),
    };

    // Extract additional metadata for specific file types
    if (file.type === 'application/pdf') {
      // For PDF files, we could extract page count, title, etc.
      // This would require a PDF parsing library
      metadata.isPDF = true;
    }

    if (file.type.includes('text/')) {
      // For text files, we can read the content
      try {
        const text = await file.text();
        metadata.textContent = text.substring(0, 1000); // First 1000 chars
        metadata.lineCount = text.split('\n').length;
        metadata.wordCount = text.split(/\s+/).length;
      } catch (error) {
        console.warn('Failed to extract text content:', error);
      }
    }

    return metadata;
  };

  // Upload documents to server
  const uploadDocuments = async (documents) => {
    setUploading(true);
    const uploadResults = [];

    try {
      for (const document of documents) {
        const formData = new FormData();
        formData.append('document', document.file);
        
        // Add metadata
        formData.append('metadata', JSON.stringify({
          originalName: document.file.name,
          ...document.metadata,
        }));

        // Add text extraction flag
        if (extractText) {
          formData.append('extractText', 'true');
        }

        try {
          const response = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          uploadResults.push({
            ...result,
            originalFile: document.file,
            metadata: document.metadata,
            icon: document.icon,
            typeName: document.typeName,
          });

        } catch (error) {
          showError(`Failed to upload ${document.file.name}: ${error.message}`);
          onUploadError?.(error, document.file);
        }
      }

      if (uploadResults.length > 0) {
        setUploadedDocuments(prev => [...prev, ...uploadResults]);
        onUploadComplete?.(uploadResults);
        showSuccess(`${uploadResults.length} document(s) uploaded successfully`);
      }

    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded document
  const removeDocument = useCallback((documentId) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  }, []);

  // Download document
  const downloadDocument = useCallback((document) => {
    if (document.url) {
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.originalName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Validate document file
  const validateDocument = useCallback((file) => {
    // Check file type
    if (!allowedFormats.includes(file.type)) {
      return {
        code: 'invalid-document-type',
        message: `Invalid document format. Allowed: ${allowedFormats.map(f => getFileTypeName(f)).join(', ')}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        code: 'document-too-large',
        message: `Document too large. Maximum size: ${formatFileSize(maxSize)}`,
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
    <div className={`document-upload ${className}`}>
      <FileDropzone
        onFilesAccepted={handleFilesAccepted}
        accept={{
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'application/vnd.ms-excel': ['.xls'],
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          'text/plain': ['.txt'],
          'text/csv': ['.csv'],
        }}
        maxFiles={maxFiles}
        maxSize={maxSize}
        multiple={maxFiles > 1}
        disabled={disabled || uploading}
        validator={validateDocument}
        allowedTypes={allowedFormats}
        {...props}
      >
        <div className="document-dropzone-content">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          
          <div className="dropzone-text">
            <p className="text-lg font-medium text-gray-900">
              Drop documents here, or{' '}
              <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {maxFiles > 1 ? `Up to ${maxFiles} documents` : 'Single document'} •{' '}
              Max {formatFileSize(maxSize)} each
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supported: PDF, Word, Excel, Text, CSV
            </p>
          </div>
        </div>
      </FileDropzone>

      {/* Upload Progress */}
      {uploading && (
        <div className="upload-progress mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-blue-800">Uploading documents...</span>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      {uploadedDocuments.length > 0 && (
        <div className="uploaded-documents mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Uploaded Documents ({uploadedDocuments.length})
          </h4>
          
          <div className="space-y-3">
            {uploadedDocuments.map((document) => (
              <div
                key={document.id}
                className="document-item flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Document Icon */}
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl border">
                    {document.icon}
                  </div>
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 truncate">
                    {document.originalName || document.name}
                  </h5>
                  <p className="text-xs text-gray-500">
                    {document.typeName} • {formatFileSize(document.metadata?.size || 0)}
                  </p>
                  
                  {showMetadata && document.metadata && (
                    <div className="mt-2 text-xs text-gray-400">
                      {document.metadata.lastModified && (
                        <span>Modified: {new Date(document.metadata.lastModified).toLocaleDateString()}</span>
                      )}
                      {document.metadata.wordCount && (
                        <span className="ml-3">Words: {document.metadata.wordCount}</span>
                      )}
                      {document.metadata.lineCount && (
                        <span className="ml-3">Lines: {document.metadata.lineCount}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 ml-4 flex space-x-2">
                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={() => downloadDocument(document)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Download document"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeDocument(document.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove document"
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;