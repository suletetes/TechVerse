import { useState } from 'react';
import { Toast } from '../Common';
import uploadService from '../../api/services/uploadService';
import { useNotification } from '../../context';

const AdminCategoryManager = ({ 
    categories = [],
    onSaveCategory,
    onDeleteCategory
}) => {
    const { showSuccess, showError, showWarning } = useNotification();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [toast, setToast] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: '',
        image: '',
        isFeatured: false,
        isActive: true,
        displayOrder: 0
    });

    // Separate featured and regular categories
    const featuredCategories = categories.filter(cat => cat.isFeatured);
    const regularCategories = categories.filter(cat => !cat.isFeatured);

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCategoryForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file using uploadService
            const validation = uploadService.validateFile(file, {
                maxSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
            });

            if (!validation.isValid) {
                showError(validation.errors.join(', '));
                return;
            }

            // Store file for upload and create preview
            setSelectedFile(file);
            const previewUrl = uploadService.createPreviewUrl(file);
            setImagePreview(previewUrl);
        }
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name.trim()) {
            showError('Category name is required');
            return;
        }

        try {
            setIsUploading(true);
            
            const categoryData = {
                ...categoryForm,
                name: categoryForm.name.trim(),
                description: categoryForm.description.trim()
            };

            // Upload image if a new file was selected
            if (selectedFile) {
                try {
                    const uploadResult = await uploadService.uploadSingleImage(selectedFile, {
                        alt: categoryForm.name,
                        category: 'categories',
                        isPrimary: true
                    });

                    const uploadedImageUrl = uploadResult.data?.image?.url || uploadResult.data?.url;
                    const publicId = uploadResult.data?.image?.publicId || null;

                    categoryData.image = {
                        url: uploadedImageUrl,
                        publicId: publicId,
                        alt: categoryForm.name
                    };
                } catch (uploadError) {
                    showError('Failed to upload image: ' + uploadError.message);
                    setIsUploading(false);
                    return;
                }
            } else if (imagePreview && !imagePreview.startsWith('blob:')) {
                // Keep existing image if no new file selected
                if (editingCategory && editingCategory.image) {
                    // Preserve the full image object from the original category
                    categoryData.image = editingCategory.image;
                } else if (categoryForm.image) {
                    categoryData.image = categoryForm.image;
                }
            }

            // Add ID for updates (use 'id' not '_id' for AdminProfile compatibility)
            if (editingCategory) {
                categoryData.id = editingCategory._id || editingCategory.id;
            }

            await onSaveCategory(categoryData);
            handleCancelEdit();
            showSuccess(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
        } catch (error) {
            // Check for specific error messages
            if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
                showError('A category with this name already exists. Please use a unique name.');
            } else {
                showError(error.message || 'Failed to save category');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name || '',
            description: category.description || '',
            image: category.image?.url || category.image || '',
            isFeatured: category.isFeatured || false,
            isActive: category.isActive !== false,
            displayOrder: category.displayOrder || 0
        });
        setImagePreview(category.image?.url || category.image || '');
        setShowAddForm(true);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            try {
                await onDeleteCategory(categoryId);
                showSuccess('Category deleted successfully!');
            } catch (error) {
                showError(error.message || 'Failed to delete category');
            }
        }
    };

    const handleCancelEdit = () => {
        // Cleanup preview URL if it's a blob
        if (imagePreview && imagePreview.startsWith('blob:')) {
            uploadService.cleanupPreviewUrl(imagePreview);
        }
        
        setEditingCategory(null);
        setShowAddForm(false);
        setImagePreview('');
        setSelectedFile(null);
        setCategoryForm({
            name: '',
            description: '',
            image: '',
            isFeatured: false,
            isActive: true,
            displayOrder: 0
        });
    };

    return (
        <div className="category-manager">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1">Category Management</h4>
                    <p className="text-muted small mb-0">
                        Manage your product categories. Featured categories appear at the top.
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    {showAddForm ? 'Cancel' : 'Add Category'}
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="card-title mb-4">
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h5>

                        <div className="row">
                            {/* Basic Info */}
                            <div className="col-md-8">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Category Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={categoryForm.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Smartphones, Laptops, Tablets"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Description</label>
                                    <textarea
                                        className="form-control"
                                        name="description"
                                        value={categoryForm.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Brief description of this category"
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Display Order</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="displayOrder"
                                                value={categoryForm.displayOrder}
                                                onChange={handleInputChange}
                                                min="0"
                                            />
                                            <small className="text-muted">Lower numbers appear first</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Status</label>
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isActive"
                                                    name="isActive"
                                                    checked={categoryForm.isActive}
                                                    onChange={handleInputChange}
                                                />
                                                <label className="form-check-label" htmlFor="isActive">
                                                    {categoryForm.isActive ? 'Active' : 'Inactive'}
                                                </label>
                                            </div>
                                            <div className="form-check form-switch mt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isFeatured"
                                                    name="isFeatured"
                                                    checked={categoryForm.isFeatured}
                                                    onChange={handleInputChange}
                                                />
                                                <label className="form-check-label" htmlFor="isFeatured">
                                                    Featured Category
                                                </label>
                                            </div>
                                            <small className="text-muted d-block mt-1">
                                                Featured categories appear at the top
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Category Image</label>
                                <div className="border rounded p-3 text-center">
                                    {imagePreview ? (
                                        <div className="position-relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="img-fluid rounded mb-2"
                                                style={{ maxHeight: '200px', objectFit: 'cover' }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                                                onClick={() => {
                                                    // Cleanup blob URL if exists
                                                    if (imagePreview && imagePreview.startsWith('blob:')) {
                                                        uploadService.cleanupPreviewUrl(imagePreview);
                                                    }
                                                    setImagePreview('');
                                                    setSelectedFile(null);
                                                    setCategoryForm(prev => ({ ...prev, image: '' }));
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-4">
                                            <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-2">
                                                <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                            </svg>
                                            <p className="text-muted small mb-2">No image selected</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="form-control form-control-sm"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    <small className="text-muted d-block mt-2">
                                        Max 5MB • JPG, PNG, WebP
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex gap-2 mt-4">
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveCategory}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                                        </svg>
                                        {editingCategory ? 'Update Category' : 'Save Category'}
                                    </>
                                )}
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={handleCancelEdit}
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-4">
                <div className="input-group">
                    <span className="input-group-text">
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
                        </svg>
                    </span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Featured Categories Section */}
            {featuredCategories.length > 0 && (
                <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-warning me-2">
                            <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        <h5 className="mb-0">Featured Categories</h5>
                        <span className="badge bg-warning ms-2">{featuredCategories.length}</span>
                    </div>
                    <div className="row">
                        {featuredCategories.map((category) => (
                            <div key={category._id || category.id} className="col-md-4 mb-3">
                                <CategoryCard
                                    category={category}
                                    onEdit={handleEditCategory}
                                    onDelete={handleDeleteCategory}
                                    isFeatured={true}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Categories Section */}
            <div>
                <h5 className="mb-3">
                    All Categories
                    <span className="badge bg-primary ms-2">{filteredCategories.length}</span>
                </h5>
                {filteredCategories.length === 0 ? (
                    <div className="alert alert-info">
                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/>
                        </svg>
                        No categories found. Click "Add Category" to create your first category.
                    </div>
                ) : (
                    <div className="row">
                        {filteredCategories.map((category) => (
                            <div key={category._id || category.id} className="col-md-4 mb-3">
                                <CategoryCard
                                    category={category}
                                    onEdit={handleEditCategory}
                                    onDelete={handleDeleteCategory}
                                    isFeatured={category.isFeatured}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Category Card Component
const CategoryCard = ({ category, onEdit, onDelete, isFeatured }) => {
    return (
        <div className="card h-100">
            {category.image && (
                <img
                    src={category.image?.url || category.image}
                    alt={category.name}
                    className="card-img-top"
                    style={{ height: '150px', objectFit: 'cover' }}
                />
            )}
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">{category.name}</h6>
                    {isFeatured && (
                        <svg width="16" height="16" viewBox="0 0 24 24" className="text-warning">
                            <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                    )}
                </div>
                <p className="card-text small text-muted mb-2">
                    {category.description || 'No description'}
                </p>
                <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                        {category.productCount || 0} products
                    </small>
                    <span className={`badge ${category.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
            <div className="card-footer bg-transparent border-top-0">
                <div className="btn-group w-100">
                    <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onEdit(category)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
                        </svg>
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDelete(category._id || category.id)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminCategoryManager;
