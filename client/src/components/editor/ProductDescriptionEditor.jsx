import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';

const ProductDescriptionEditor = ({ 
  initialContent = '', 
  onSave, 
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setHasChanges(newContent !== initialContent);
  };

  const handleSave = () => {
    onSave?.(content);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setContent(initialContent);
    setHasChanges(false);
    onCancel?.();
  };

  return (
    <div className={`product-description-editor ${className}`}>
      <div className="mb-3">
        <label className="form-label fw-semibold">
          Product Description
          {hasChanges && <span className="text-warning ms-2">(Unsaved changes)</span>}
        </label>
        
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Enter a detailed product description..."
          minHeight="300px"
          className="border-0"
        />
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <div className="text-muted small">
          {content ? `${content.replace(/<[^>]*>/g, '').length} characters` : '0 characters'}
        </div>
        
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleCancel}
            disabled={!hasChanges || isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              'Save Description'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDescriptionEditor;