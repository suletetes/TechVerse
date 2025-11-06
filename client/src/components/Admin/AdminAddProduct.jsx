import React, { useState, useEffect } from 'react';
import uploadService from '../../api/services/uploadService';
import { getCategoryConfig } from '../../config/categoryConfig';
import './AdminAddProduct.css';

const AdminAddProduct = ({ onSave, onCancel, editProduct = null, categories = [] }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryConfig, setCategoryConfig] = useState(null);
    
    const [formData, setFormData] = useState({
        // Basic Information
        name: editProduct?.name || '',
        slug: editProduct?.slug || '',
        category: editProduct?.category?._id || editProduct?.category || '',
        brand: editProduct?.brand || '',
        sku: editProduct?.sku || '',
        description: editProduct?.description || '',
        shortDescription: editProduct?.shortDescription || '',

        // Pricing & Inventory
        price: editProduct?.price || '',
        comparePrice: editProduct?.comparePrice || '',
        cost: editProduct?.cost || '',
        stock: {
            quantity: editProduct?.stock?.quantity || 0,
            trackQuantity: editProduct?.stock?.trackQuantity !== false,
            lowStockThreshold: editProduct?.stock?.lowStockThreshold || 10
        },

        // Dynamic Product Options based on category
        variants: editProduct?.variants || [],
        selectedColor: '',
        selectedSecondaryOption: '',

        // Media Gallery
        images: editProduct?.images || [],

        // Dynamic Technical Specifications based on category
        specifications: editProduct?.specifications || [],

        // Key Features
        features: editProduct?.features || [],

        // Physical Properties
        weight: {
            value: editProduct?.weight?.value || '',
            unit: editProduct?.weight?.unit || 'kg'
        },
        dimensions: {
            length: editProduct?.dimensions?.length || '',
            width: editProduct?.dimensions?.width || '',
            height: editProduct?.dimensions?.height || '',
            unit: editProduct?.dimensions?.unit || 'cm'
        },

        // SEO & Marketing
        seo: {
            title: editProduct?.seo?.title || '',
            description: editProduct?.seo?.description || '',
            keywords: editProduct?.seo?.keywords || []
        },
        tags: editProduct?.tags || [],
        featured: editProduct?.featured || false,
        sections: editProduct?.sections || [],

        // Status & Shipping
        status: editProduct?.status || 'draft',
        visibility: editProduct?.visibility || 'public',
        shipping: {
            free: editProduct?.shipping?.free || false,
            weight: editProduct?.shipping?.weight || '',
            dimensions: editProduct?.shipping?.dimensions || {
                length: '',
                width: '',
                height: ''
            }
        }
    });

    const [errors, setErrors] = useState({});
    const [newFeature, setNewFeature] = useState('');
    const [newTag, setNewTag] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Generate slug from product name
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    // Auto-generate slug when name changes
    useEffect(() => {
        if (formData.name && !editProduct) {
            const newSlug = generateSlug(formData.name);
            setFormData(prev => ({
                ...prev,
                slug: newSlug
            }));
        }
    }, [formData.name, editProduct]);

    // Initialize category configuration when category changes
    useEffect(() => {
        if (formData.category && categories.length > 0) {
            const category = Array.isArray(categories) ? 
                categories.find(c => c._id === formData.category || c.id === formData.category) : null;
            setSelectedCategory(category);

            // Get category configuration
            const config = getCategoryConfig(category?.name || category?.slug);
            setCategoryConfig(config);

            if (config && !editProduct) {
                // Initialize specifications based on category
                const initialSpecs = [];
                Object.entries(config.specificationCategories || {}).forEach(([categoryName, specs]) => {
                    specs.forEach(spec => {
                        initialSpecs.push({
                            name: spec.name,
                            value: '',
                            category: categoryName
                        });
                    });
                });

                // Initialize variants if category has options
                const initialVariants = [];
                if (config.colorOptions) {
                    initialVariants.push({
                        name: 'Color',
                        options: config.colorOptions.map(color => ({
                            value: color.name,
                            priceModifier: 0,
                            stock: 0
                        }))
                    });
                }

                if (config.secondaryOptions) {
                    initialVariants.push({
                        name: config.secondaryOptions.name,
                        options: config.secondaryOptions.options.map(option => ({
                            value: option.name,
                            priceModifier: option.basePriceModifier || 0,
                            stock: 0
                        }))
                    });
                }

                setFormData(prev => ({
                    ...prev,
                    specifications: initialSpecs,
                    variants: initialVariants
                }));
            }
        }
    }, [formData.category, categories, editProduct]);

    // Validation function matching backend requirements
    const validateForm = () => {
        const newErrors = {};

        // Required fields validation
        if (!formData.name || formData.name.trim().length === 0) {
            newErrors.name = 'Product name is required';
        } else if (formData.name.trim().length > 200) {
            newErrors.name = 'Product name cannot exceed 200 characters';
        }

        if (!formData.description || formData.description.trim().length === 0) {
            newErrors.description = 'Product description is required';
        } else if (formData.description.length > 2000) {
            newErrors.description = 'Description cannot exceed 2000 characters';
        }

        if (formData.shortDescription && formData.shortDescription.length > 500) {
            newErrors.shortDescription = 'Short description cannot exceed 500 characters';
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Product price is required and must be greater than 0';
        }

        if (!formData.brand || formData.brand.trim().length === 0) {
            newErrors.brand = 'Product brand is required';
        }

        if (!formData.category) {
            newErrors.category = 'Product category is required';
        }

        // Slug validation
        if (!formData.slug || formData.slug.trim().length === 0) {
            newErrors.slug = 'Product slug is required';
        }

        // Optional field validations
        if (formData.comparePrice && parseFloat(formData.comparePrice) < 0) {
            newErrors.comparePrice = 'Compare price cannot be negative';
        }

        if (formData.cost && parseFloat(formData.cost) < 0) {
            newErrors.cost = 'Cost price cannot be negative';
        }

        if (formData.stock.quantity && parseInt(formData.stock.quantity) < 0) {
            newErrors.stockQuantity = 'Stock quantity cannot be negative';
        }

        // Weight validation
        if (formData.weight.value && parseFloat(formData.weight.value) < 0) {
            newErrors.weight = 'Weight cannot be negative';
        }

        // Dimensions validation
        if (formData.dimensions.length && parseFloat(formData.dimensions.length) < 0) {
            newErrors.dimensionsLength = 'Length cannot be negative';
        }
        if (formData.dimensions.width && parseFloat(formData.dimensions.width) < 0) {
            newErrors.dimensionsWidth = 'Width cannot be negative';
        }
        if (formData.dimensions.height && parseFloat(formData.dimensions.height) < 0) {
            newErrors.dimensionsHeight = 'Height cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };    
    
    // Handle form field changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // Handle nested field changes (like stock.quantity)
    const handleNestedInputChange = (parentField, childField, value) => {
        setFormData(prev => ({
            ...prev,
            [parentField]: {
                ...prev[parentField],
                [childField]: value
            }
        }));
    };

    // Handle specification changes
    const handleSpecificationChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.map((spec, i) => 
                i === index ? { ...spec, [field]: value } : spec
            )
        }));
    };

    // Handle variant changes
    const handleVariantChange = (variantIndex, optionIndex, field, value) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((variant, vIndex) => 
                vIndex === variantIndex ? {
                    ...variant,
                    options: variant.options.map((option, oIndex) => 
                        oIndex === optionIndex ? { ...option, [field]: value } : option
                    )
                } : variant
            )
        }));
    };

    // Handle feature changes
    const handleFeatureChange = (index, value) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.map((feature, i) => 
                i === index ? value : feature
            )
        }));
    };

    // Add new feature
    const addFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    // Remove feature
    const removeFeature = (index) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    // Handle tag changes
    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    // Remove tag
    const removeTag = (index) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index)
        }));
    };

    // Handle image upload
    const handleImageUpload = async (files) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const uploadPromises = Array.from(files).map(async (file, index) => {
                const uploadResult = await uploadService.uploadImage(file, {
                    folder: 'products',
                    onProgress: (progress) => {
                        setUploadProgress(prev => Math.max(prev, (index + progress / 100) / files.length * 100));
                    }
                });

                return {
                    url: uploadResult.secure_url || uploadResult.url,
                    alt: `${formData.name} - Image ${index + 1}`,
                    isPrimary: formData.images.length === 0 && index === 0,
                    publicId: uploadResult.public_id
                };
            });

            const uploadedImages = await Promise.all(uploadPromises);
            
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedImages]
            }));

        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload images. Please try again.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Remove image
    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // Set primary image
    const setPrimaryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => ({
                ...img,
                isPrimary: i === index
            }))
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            alert('Please fix the validation errors before submitting.');
            return;
        }

        try {
            // Prepare data for backend
            const productData = {
                ...formData,
                // Ensure category is ObjectId string
                category: formData.category,
                // Convert price fields to numbers
                price: parseFloat(formData.price),
                comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
                cost: formData.cost ? parseFloat(formData.cost) : undefined,
                // Ensure stock is properly formatted
                stock: {
                    quantity: parseInt(formData.stock.quantity) || 0,
                    trackQuantity: formData.stock.trackQuantity,
                    lowStockThreshold: parseInt(formData.stock.lowStockThreshold) || 10
                },
                // Convert weight and dimensions to numbers
                weight: {
                    value: formData.weight.value ? parseFloat(formData.weight.value) : undefined,
                    unit: formData.weight.unit
                },
                dimensions: {
                    length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : undefined,
                    width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined,
                    height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined,
                    unit: formData.dimensions.unit
                }
            };

            await onSave(productData);
        } catch (error) {
            console.error('Failed to save product:', error);
            alert('Failed to save product. Please try again.');
        }
    };

    return (
        <div className="admin-add-product">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="tc-6533 fw-bold mb-1">
                        {editProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <p className="text-muted mb-0">
                        {editProduct ? 'Update product information' : 'Create a new product with dynamic specifications'}
                    </p>
                </div>
                <div>
                    <button className="btn btn-outline-secondary me-2" onClick={onCancel}>
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSubmit}
                        disabled={isUploading}
                    >
                        {editProduct ? 'Update Product' : 'Create Product'}
                    </button>
                </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
                <div className="alert alert-info">
                    <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2"></div>
                        <span>Uploading images... {Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="progress mt-2" style={{ height: '4px' }}>
                        <div 
                            className="progress-bar" 
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row">
                    {/* Left Column - Basic Information */}
                    <div className="col-lg-8">
                        {/* Basic Information Card */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Basic Information</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Product Name *</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Enter product name"
                                        />
                                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Product Slug *</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                                            value={formData.slug}
                                            onChange={(e) => handleInputChange('slug', e.target.value)}
                                            placeholder="product-slug"
                                        />
                                        {errors.slug && <div className="invalid-feedback">{errors.slug}</div>}
                                        <div className="form-text">URL-friendly version of the product name</div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Category *</label>
                                        <select
                                            className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                            value={formData.category}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                        >
                                            <option value="">Select a category</option>
                                            {Array.isArray(categories) && categories.map(category => (
                                                <option key={category._id || category.id} value={category._id || category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                            </select>
                                        {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Brand *</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.brand ? 'is-invalid' : ''}`}
                                            value={formData.brand}
                                            onChange={(e) => handleInputChange('brand', e.target.value)}
                                            placeholder="Enter brand name"
                                        />
                                        {errors.brand && <div className="invalid-feedback">{errors.brand}</div>}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Description *</label>
                                    <textarea
                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                        rows="4"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Enter detailed product description"
                                    />
                                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Short Description</label>
                                    <textarea
                                        className={`form-control ${errors.shortDescription ? 'is-invalid' : ''}`}
                                        rows="2"
                                        value={formData.shortDescription}
                                        onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                        placeholder="Brief product summary"
                                    />
                                    {errors.shortDescription && <div className="invalid-feedback">{errors.shortDescription}</div>}
                                </div>
                            </div>
                        </div>        
                {/* Pricing & Inventory Card */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Pricing & Inventory</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Price *</label>
                                        <div className="input-group">
                                            <span className="input-group-text">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                                value={formData.price}
                                                onChange={(e) => handleInputChange('price', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Compare Price</label>
                                        <div className="input-group">
                                            <span className="input-group-text">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`form-control ${errors.comparePrice ? 'is-invalid' : ''}`}
                                                value={formData.comparePrice}
                                                onChange={(e) => handleInputChange('comparePrice', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.comparePrice && <div className="invalid-feedback">{errors.comparePrice}</div>}
                                        <div className="form-text">Original price for discount display</div>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Cost</label>
                                        <div className="input-group">
                                            <span className="input-group-text">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`form-control ${errors.cost ? 'is-invalid' : ''}`}
                                                value={formData.cost}
                                                onChange={(e) => handleInputChange('cost', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>n</div>
                     
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Stock Quantity</label>
                                        <input
                                            type="number"
                                            className={`form-control ${errors.stockQuantity ? 'is-invalid' : ''}`}
                                            value={formData.stock.quantity}
                                            onChange={(e) => handleNestedInputChange('stock', 'quantity', e.target.value)}
                                            placeholder="0"
                                        />
                                        {errors.stockQuantity && <div className="invalid-feedback">{errors.stockQuantity}</div>}
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Low Stock Threshold</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.stock.lowStockThreshold}
                                            onChange={(e) => handleNestedInputChange('stock', 'lowStockThreshold', e.target.value)}
                                            placeholder="10"
                                        />
                                        <div className="form-text">Alert when stock falls below this number</div>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Track Quantity</label>
                                        <div className="form-check mt-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={formData.stock.trackQuantity}
                                                onChange={(e) => handleNestedInputChange('stock', 'trackQuantity', e.target.checked)}
                                            />
                                            <label className="form-check-label">
                                                Track inventory for this product
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">SKU</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.sku}
                                            onChange={(e) => handleInputChange('sku', e.target.value)}
                                            placeholder="Enter SKU"
                                        />
                                        <div className="form-text">Stock Keeping Unit for inventory management</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Product Options */}
                        {categoryConfig && (
                            <div className="card mb-4">
                                <div className="card-header">
                                    <h5 className="mb-0">Product Options</h5>
                                </div>
                                <div className="card-body">
                                    {/* Color Options */}
                                    {categoryConfig.colorOptions && (
                                        <div className="mb-4">
                                            <label className="form-label">Available Colors</label>
                                            <div className="row">
                                                {categoryConfig.colorOptions.map((color, index) => (
                                                    <div key={color.id} className="col-md-3 mb-2">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`color-${color.id}`}
                                                                onChange={(e) => {
                                                                    const colorVariant = formData.variants.find(v => v.name === 'Color');
                                                                    if (colorVariant) {
                                                                        const optionIndex = colorVariant.options.findIndex(o => o.value === color.name);
                                                                        if (optionIndex >= 0) {
                                                                            handleVariantChange(0, optionIndex, 'stock', e.target.checked ? 10 : 0);
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <label className="form-check-label" htmlFor={`color-${color.id}`}>
                                                                <span className={`color-dot ${color.class} me-2`}></span>
                                                                {color.name}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Secondary Options (Storage, Configuration, etc.) */}
                                    {categoryConfig.secondaryOptions && (
                                        <div className="mb-4">
                                            <label className="form-label">{categoryConfig.secondaryOptions.name} Options</label>
                                            <div className="row">
                                                {categoryConfig.secondaryOptions.options.map((option, index) => (
                                                    <div key={option.id} className="col-md-6 mb-3">
                                                        <div className="card">
                                                            <div className="card-body p-3">
                                                                <div className="form-check">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`option-${option.id}`}
                                                                    />
                                                                    <label className="form-check-label" htmlFor={`option-${option.id}`}>
                                                                        <strong>{option.name}</strong>
                                                                        {option.basePriceModifier !== 0 && (
                                                                            <span className="badge bg-primary ms-2">
                                                                                {option.basePriceModifier > 0 ? '+' : ''}${option.basePriceModifier}
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                </div>
                                                                <div className="mt-2">
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        placeholder="Stock quantity"
                                                                        onChange={(e) => {
                                                                            const variantIndex = formData.variants.findIndex(v => v.name === categoryConfig.secondaryOptions.name);
                                                                            if (variantIndex >= 0) {
                                                                                handleVariantChange(variantIndex, index, 'stock', parseInt(e.target.value) || 0);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dynamic Technical Specifications */}
                        {categoryConfig && categoryConfig.specificationCategories && (
                            <div className="card mb-4">
                                <div className="card-header">
                                    <h5 className="mb-0">Technical Specifications</h5>
                                </div>
                                <div className="card-body">
                                    {Object.entries(categoryConfig.specificationCategories).map(([categoryName, specs]) => (
                                        <div key={categoryName} className="mb-4">
                                            <h6 className="text-primary mb-3">{categoryName}</h6>
                                            <div className="row">
                                                {specs.map((spec, specIndex) => {
                                                    const globalIndex = formData.specifications.findIndex(s => s.name === spec.name);
                                                    return (
                                                        <div key={spec.key} className="col-md-6 mb-3">
                                                            <label className="form-label">
                                                                {spec.name}
                                                                {spec.required && <span className="text-danger">*</span>}
                                                            </label>
                                                            <input
                                                                type={spec.type}
                                                                className="form-control"
                                                                placeholder={spec.placeholder}
                                                                value={globalIndex >= 0 ? formData.specifications[globalIndex].value : ''}
                                                                onChange={(e) => {
                                                                    if (globalIndex >= 0) {
                                                                        handleSpecificationChange(globalIndex, 'value', e.target.value);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Features */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Key Features</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Add a key feature"
                                            value={newFeature}
                                            onChange={(e) => setNewFeature(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={addFeature}
                                        >
                                            Add Feature
                                        </button>
                                    </div>
                                </div>
                                <div className="features-list">
                                    {formData.features.map((feature, index) => (
                                        <div key={index} className="d-flex align-items-center mb-2">
                                            <input
                                                type="text"
                                                className="form-control me-2"
                                                value={feature}
                                                onChange={(e) => handleFeatureChange(index, e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => removeFeature(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Media & Settings */}
                    <div className="col-lg-4">
                        {/* Product Images */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Product Images</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <input
                                        type="file"
                                        className="form-control"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files)}
                                        disabled={isUploading}
                                    />
                                    <div className="form-text">Upload multiple images. First image will be primary.</div>
                                </div>
                                
                                <div className="images-preview">
                                    {formData.images.map((image, index) => (
                                        <div key={index} className="image-item mb-3">
                                            <div className="position-relative">
                                                <img
                                                    src={image.url}
                                                    alt={image.alt}
                                                    className="img-thumbnail"
                                                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                                                />
                                                <div className="position-absolute top-0 end-0 p-1">
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                {image.isPrimary && (
                                                    <div className="position-absolute bottom-0 start-0 p-1">
                                                        <span className="badge bg-primary">Primary</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => setPrimaryImage(index)}
                                                    disabled={image.isPrimary}
                                                >
                                                    Set as Primary
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Product Settings */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Product Settings</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Visibility</label>
                                    <select
                                        className="form-select"
                                        value={formData.visibility}
                                        onChange={(e) => handleInputChange('visibility', e.target.value)}
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>

                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formData.featured}
                                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                                    />
                                    <label className="form-check-label">
                                        Featured Product
                                    </label>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Sections</label>
                                    <div className="form-check">
                                        {['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'].map(section => (
                                            <div key={section} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={formData.sections.includes(section)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            handleInputChange('sections', [...formData.sections, section]);
                                                        } else {
                                                            handleInputChange('sections', formData.sections.filter(s => s !== section));
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label">
                                                    {section.charAt(0).toUpperCase() + section.slice(1)}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Tags</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Add a tag"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={addTag}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                                <div className="tags-list">
                                    {formData.tags.map((tag, index) => (
                                        <span key={index} className="badge bg-secondary me-1 mb-1">
                                            {tag}
                                            <button
                                                type="button"
                                                className="btn-close btn-close-white ms-1"
                                                style={{ fontSize: '0.7em' }}
                                                onClick={() => removeTag(index)}
                                            ></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SEO */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">SEO Settings</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">SEO Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.seo.title}
                                        onChange={(e) => handleNestedInputChange('seo', 'title', e.target.value)}
                                        placeholder="SEO optimized title"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">SEO Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={formData.seo.description}
                                        onChange={(e) => handleNestedInputChange('seo', 'description', e.target.value)}
                                        placeholder="SEO meta description"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminAddProduct;