import React, { useState } from 'react';

const AdminCategoryManager = ({ 
    categories = [],
    onSaveCategory,
    onDeleteCategory,
    onUpdateCategorySpecs
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('basic');

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        slug: '',
        description: '',
        image: '',
        parentId: null,
        isActive: true,
        sortOrder: 0,
        seoTitle: '',
        seoDescription: '',
        breadcrumbPath: [],
        relatedCategories: [],
        categoryFeatures: {
            freeShipping: false,
            warranty: '',
            returnPolicy: '',
            specialOffers: []
        }
    });

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveCategory = () => {
        const categoryData = {
            ...categoryForm,
            id: editingCategory?.id || Date.now(),
            slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
            updatedAt: new Date().toISOString()
        };

        onSaveCategory(categoryData);
        resetForm();
    };

    const resetForm = () => {
        setCategoryForm({
            name: '',
            slug: '',
            description: '',
            image: '',
            parentId: null,
            isActive: true,
            sortOrder: 0,
            seoTitle: '',
            seoDescription: '',
            breadcrumbPath: [],
            relatedCategories: [],
            categoryFeatures: {
                freeShipping: false,
                warranty: '',
                returnPolicy: '',
                specialOffers: []
            }
        });
        setEditingCategory(null);
        setShowAddForm(false);
        setSelectedCategory(null);
    };

    const handleEditCategory = (category) => {
        setCategoryForm({
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || '',
            image: category.image || '',
            parentId: category.parentId || null,
            isActive: category.isActive !== undefined ? category.isActive : true,
            sortOrder: category.sortOrder || 0,
            seoTitle: category.seoTitle || '',
            seoDescription: category.seoDescription || '',
            breadcrumbPath: category.breadcrumbPath || [],
            relatedCategories: category.relatedCategories || [],
            categoryFeatures: category.categoryFeatures || {
                freeShipping: false,
                warranty: '',
                returnPolicy: '',
                specialOffers: []
            }
        });
        setEditingCategory(category);
        setSelectedCategory(category);
        setShowAddForm(true);
    };

    const handleDeleteCategory = (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            onDeleteCategory(categoryId);
        }
    };

    const addRelatedCategory = () => {
        setCategoryForm({
            ...categoryForm,
            relatedCategories: [
                ...categoryForm.relatedCategories,
                { name: '', path: '', count: 0 }
            ]
        });
    };

    const updateRelatedCategory = (index, field, value) => {
        const updated = [...categoryForm.relatedCategories];
        updated[index] = { ...updated[index], [field]: value };
        setCategoryForm({
            ...categoryForm,
            relatedCategories: updated
        });
    };

    const removeRelatedCategory = (index) => {
        setCategoryForm({
            ...categoryForm,
            relatedCategories: categoryForm.relatedCategories.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="category-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="tc-6533 fw-bold mb-0">Category Manager</h4>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(true)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add Category
                </button>
            </div>

            {!showAddForm ? (
                <>
                    {/* Search and Filters */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text">
                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
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
                    </div>

                    {/* Categories List */}
                    <div className="row">
                        {filteredCategories.map(category => (
                            <div key={category.id} className="col-md-6 col-lg-4 mb-4">
                                <div className="card h-100">
                                    {category.image && (
                                        <img 
                                            src={category.image} 
                                            className="card-img-top" 
                                            alt={category.name}
                                            style={{ height: '150px', objectFit: 'cover' }}
                                        />
                                    )}
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="card-title mb-0">{category.name}</h6>
                                            <div className="d-flex gap-1">
                                                <span className={`badge ${category.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                                    {category.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="card-text text-muted small flex-grow-1">
                                            {category.description || 'No description available'}
                                        </p>
                                        
                                        <div className="category-meta mb-3">
                                            <div className="row text-center">
                                                <div className="col-4">
                                                    <div className="small text-muted">Products</div>
                                                    <div className="fw-bold">{category.productCount || 0}</div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="small text-muted">Order</div>
                                                    <div className="fw-bold">{category.sortOrder || 0}</div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="small text-muted">Parent</div>
                                                    <div className="fw-bold">{category.parentId ? 'Yes' : 'No'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex gap-2 mt-auto">
                                            <button 
                                                className="btn btn-outline-primary btn-sm flex-fill"
                                                onClick={() => handleEditCategory(category)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                                    <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                                                </svg>
                                                Edit
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleDeleteCategory(category.id)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                /* Category Form */
                <div className="category-form">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">
                            {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
                        </h5>
                        <button 
                            className="btn btn-outline-secondary"
                            onClick={resetForm}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                            </svg>
                            Cancel
                        </button>
                    </div>

                    {/* Form Tabs */}
                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                                onClick={() => setActiveTab('basic')}
                            >
                                Basic Info
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'navigation' ? 'active' : ''}`}
                                onClick={() => setActiveTab('navigation')}
                            >
                                Navigation
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'features' ? 'active' : ''}`}
                                onClick={() => setActiveTab('features')}
                            >
                                Features
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'seo' ? 'active' : ''}`}
                                onClick={() => setActiveTab('seo')}
                            >
                                SEO
                            </button>
                        </li>
                    </ul>

                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Category Name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            name: e.target.value,
                                            slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                                        })}
                                        placeholder="e.g., Tablets"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Slug</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={categoryForm.slug}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            slug: e.target.value
                                        })}
                                        placeholder="e.g., tablets"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Parent Category</label>
                                    <select
                                        className="form-select"
                                        value={categoryForm.parentId || ''}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            parentId: e.target.value || null
                                        })}
                                    >
                                        <option value="">No Parent (Top Level)</option>
                                        {categories.filter(cat => cat.id !== editingCategory?.id).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Sort Order</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={categoryForm.sortOrder}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            sortOrder: parseInt(e.target.value) || 0
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            description: e.target.value
                                        })}
                                        placeholder="Category description..."
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Category Image URL</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={categoryForm.image}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            image: e.target.value
                                        })}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={categoryForm.isActive}
                                            onChange={(e) => setCategoryForm({
                                                ...categoryForm,
                                                isActive: e.target.checked
                                            })}
                                        />
                                        <label className="form-check-label">
                                            Active Category
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Tab */}
                    {activeTab === 'navigation' && (
                        <div>
                            <h6 className="mb-3">Related Categories</h6>
                            {categoryForm.relatedCategories.map((related, index) => (
                                <div key={index} className="row mb-3 align-items-end">
                                    <div className="col-md-4">
                                        <label className="form-label">Category Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={related.name}
                                            onChange={(e) => updateRelatedCategory(index, 'name', e.target.value)}
                                            placeholder="e.g., iPad Pro"
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Path</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={related.path}
                                            onChange={(e) => updateRelatedCategory(index, 'path', e.target.value)}
                                            placeholder="e.g., /category/tablets/ipad-pro"
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label">Count</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={related.count}
                                            onChange={(e) => updateRelatedCategory(index, 'count', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger"
                                            onClick={() => removeRelatedCategory(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={addRelatedCategory}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                Add Related Category
                            </button>
                        </div>
                    )}

                    {/* Features Tab */}
                    {activeTab === 'features' && (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={categoryForm.categoryFeatures.freeShipping}
                                            onChange={(e) => setCategoryForm({
                                                ...categoryForm,
                                                categoryFeatures: {
                                                    ...categoryForm.categoryFeatures,
                                                    freeShipping: e.target.checked
                                                }
                                            })}
                                        />
                                        <label className="form-check-label">
                                            Free Shipping Available
                                        </label>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Warranty Information</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={categoryForm.categoryFeatures.warranty}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            categoryFeatures: {
                                                ...categoryForm.categoryFeatures,
                                                warranty: e.target.value
                                            }
                                        })}
                                        placeholder="e.g., 2 Year Warranty"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Return Policy</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={categoryForm.categoryFeatures.returnPolicy}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            categoryFeatures: {
                                                ...categoryForm.categoryFeatures,
                                                returnPolicy: e.target.value
                                            }
                                        })}
                                        placeholder="Return policy details..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SEO Tab */}
                    {activeTab === 'seo' && (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">SEO Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={categoryForm.seoTitle}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            seoTitle: e.target.value
                                        })}
                                        placeholder="SEO optimized title"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">SEO Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={categoryForm.seoDescription}
                                        onChange={(e) => setCategoryForm({
                                            ...categoryForm,
                                            seoDescription: e.target.value
                                        })}
                                        placeholder="SEO meta description"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="d-flex gap-2 mt-4">
                        <button 
                            className="btn btn-primary"
                            onClick={handleSaveCategory}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor" d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"/>
                            </svg>
                            {editingCategory ? 'Update Category' : 'Save Category'}
                        </button>
                        <button 
                            className="btn btn-outline-secondary"
                            onClick={resetForm}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategoryManager;