import React, { useState, useRef } from 'react';

const ImageUploadModal = ({ isOpen, onClose, onImageInsert }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'upload'
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setPreview(url);
  };

  const handleInsert = async () => {
    setIsUploading(true);
    
    try {
      let finalUrl = '';
      
      if (uploadMethod === 'url') {
        finalUrl = imageUrl;
      } else if (uploadMethod === 'upload' && imageFile) {
        // In a real app, you would upload the file to your server/cloud storage
        // For demo purposes, we'll use a data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          finalUrl = e.target.result;
          onImageInsert(finalUrl);
          handleClose();
        };
        reader.readAsDataURL(imageFile);
        setIsUploading(false);
        return;
      }
      
      if (finalUrl) {
        onImageInsert(finalUrl);
        handleClose();
      }
    } catch (error) {
      console.error('Error inserting image:', error);
      alert('Failed to insert image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setImageUrl('');
    setImageFile(null);
    setPreview('');
    setUploadMethod('url');
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Insert Image</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Upload Method Selection */}
            <div className="mb-3">
              <div className="btn-group w-100" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="uploadMethod"
                  id="url-method"
                  checked={uploadMethod === 'url'}
                  onChange={() => setUploadMethod('url')}
                />
                <label className="btn btn-outline-primary" htmlFor="url-method">
                  Image URL
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="uploadMethod"
                  id="upload-method"
                  checked={uploadMethod === 'upload'}
                  onChange={() => setUploadMethod('upload')}
                />
                <label className="btn btn-outline-primary" htmlFor="upload-method">
                  Upload File
                </label>
              </div>
            </div>

            {/* URL Input */}
            {uploadMethod === 'url' && (
              <div className="mb-3">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={handleUrlChange}
                />
              </div>
            )}

            {/* File Upload */}
            {uploadMethod === 'upload' && (
              <div className="mb-3">
                <label className="form-label">Select Image File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                <div className="form-text">
                  Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
                </div>
              </div>
            )}

            {/* Image Preview */}
            {preview && (
              <div className="mb-3">
                <label className="form-label">Preview</label>
                <div className="border rounded p-3 text-center bg-light">
                  <img
                    src={preview}
                    alt="Preview"
                    className="img-fluid"
                    style={{ maxHeight: '200px', maxWidth: '100%' }}
                    onError={() => setPreview('')}
                  />
                </div>
              </div>
            )}

            {/* Image Properties */}
            <div className="row">
              <div className="col-md-6">
                <label className="form-label">Alt Text</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Describe the image..."
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Title (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Image title..."
                />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleInsert}
              disabled={!preview || isUploading}
            >
              {isUploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Inserting...
                </>
              ) : (
                'Insert Image'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;