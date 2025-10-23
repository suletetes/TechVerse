import React, { useState, useEffect } from 'react';
import uploadService from '../../api/services/uploadService';

const AdminAddProduct = ({ onSave, onCancel, editProduct = null, categories = [] }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        // Basic Information
        name: editProduct?.name || '',
        category: editProduct?.category || '',
        brand: editProduct?.brand || '',
        model: editProduct?.model || '',
        sku: editProduct?.sku || '',
        shortDescription: editProduct?.shortDescription || '',
        longDescription: editProduct?.longDescription || '',

        // Pricing & Inventory
        price: editProduct?.price || '',
        originalPrice: editProduct?.originalPrice || '',
        costPrice: editProduct?.costPrice || '',
        stock: editProduct?.stock || '',
        minOrderQuantity: editProduct?.minOrderQuantity || 1,
        maxOrderQuantity: editProduct?.maxOrderQuantity || 10,

        // Dynamic Product Options based on category
        productOptions: editProduct?.productOptions || {},

        // Media Gallery (matching Product.jsx structure) - now supports videos
        mediaGallery: editProduct?.mediaGallery || [],
        mainImage: editProduct?.mainImage || '',
        videos: editProduct?.videos || [], // New video support

        // Dynamic Technical Specifications based on category
        technicalSpecs: editProduct?.technicalSpecs || {},
        dynamicSpecs: editProduct?.dynamicSpecs || {}, // New dynamic specs based on category template

        // Key Features
        keyFeatures: editProduct?.keyFeatures || [],

        // Physical Properties
        weight: editProduct?.weight || '',
        dimensions: editProduct?.dimensions || {
            length: '',
            width: '',
            height: ''
        },

        // SEO & Marketing
        seoTitle: editProduct?.seoTitle || '',
        seoDescription: editProduct?.seoDescription || '',
        tags: editProduct?.tags || [],
        featured: editProduct?.featured || false,

        // Status & Shipping
        status: editProduct?.status || 'draft',
        shippingRequired: editProduct?.shippingRequired || true,
        shippingWeight: editProduct?.shippingWeight || '',
        shippingClass: editProduct?.shippingClass || 'standard'
    });

    const [errors, setErrors] = useState({});
    const [newFeature, setNewFeature] = useState('');
    const [newTag, setNewTag] = useState('');

    // Validation function matching backend requirements
    const validateForm = () => {
        const newErrors = {};

        // Required fields validation
        if (!formData.name || formData.name.trim().length === 0) {
            newErrors.name = 'Product name is required';
        } else if (formData.name.trim().length > 200) {
            newErrors.name = 'Product name cannot exceed 200 characters';
        }

        if (!formData.longDescription && !formData.shortDescription) {
            newErrors.description = 'Product description is required';
        } else if (formData.longDescription && formData.longDescription.length > 2000) {
            newErrors.longDescription = 'Description cannot exceed 2000 characters';
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

        // Optional field validations
        if (formData.originalPrice && parseFloat(formData.originalPrice) < 0) {
            newErrors.originalPrice = 'Compare price cannot be negative';
        }

        if (formData.costPrice && parseFloat(formData.costPrice) < 0) {
            newErrors.costPrice = 'Cost price cannot be negative';
        }

        if (formData.stock && parseInt(formData.stock) < 0) {
            newErrors.stock = 'Stock quantity cannot be negative';
        }

        // Weight validation
        if (formData.weight && parseFloat(formData.weight) < 0) {
            newErrors.weight = 'Weight cannot be negative';
        }

        // Dimensions validation
        if (formData.dimensions) {
            if (formData.dimensions.length && parseFloat(formData.dimensions.length) < 0) {
                newErrors.dimensionsLength = 'Length cannot be negative';
            }
            if (formData.dimensions.width && parseFloat(formData.dimensions.width) < 0) {
                newErrors.dimensionsWidth = 'Width cannot be negative';
            }
            if (formData.dimensions.height && parseFloat(formData.dimensions.height) < 0) {
                newErrors.dimensionsHeight = 'Height cannot be negative';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Initialize category and dynamic specs
    useEffect(() => {
        if (formData.category && categories.length > 0) {
            const category = Array.isArray(categories) ? categories.find(c => c.slug === formData.category || c.name === formData.category) : null;
            setSelectedCategory(category);

            if (category && !editProduct) {
                // Initialize dynamic specs based on category template
                const initialSpecs = {};
                category.specificationTemplate?.groups?.forEach(group => {
                    group.fields.forEach(field => {
                        initialSpecs[field.id] = '';
                    });
                });

                // Initialize product options based on category template
                const initialOptions = {};
                category.optionsTemplate?.forEach(optionGroup => {
                    if (optionGroup.enabled) {
                        initialOptions[optionGroup.id] = {
                            ...optionGroup,
                            selectedValue: optionGroup.required ? optionGroup.options[0]?.id : null,
                            availableOptions: optionGroup.options.map(opt => ({
                                ...opt,
                                available: true
                            }))
                        };
                    }
                });

                setFormData(prev => ({
                    ...prev,
                    dynamicSpecs: initialSpecs,
                    productOptions: initialOptions
                }));
            }
        }
    }, [formData.category, categories, editProduct]);

    const steps = [
        { id: 1, title: 'Basic Info', icon: '📝' },
        { id: 2, title: 'Pricing', icon: '💰' },
        { id: 3, title: 'Options', icon: '🎨' },
        { id: 4, title: 'Media', icon: '📸' },
        { id: 5, title: 'Specs', icon: '⚙️' },
        { id: 6, title: 'SEO', icon: '🔍' },
        { id: 7, title: 'Review', icon: '✅' }
    ];

    // Categories are now passed as props and dynamic

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

    const handleNestedInputChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    const handleSpecChange = (category, field, value) => {
        setFormData(prev => ({
            ...prev,
            technicalSpecs: {
                ...prev.technicalSpecs,
                [category]: {
                    ...prev.technicalSpecs[category],
                    [field]: value
                }
            }
        }));
    };

    const handleDynamicSpecChange = (fieldId, value) => {
        setFormData(prev => ({
            ...prev,
            dynamicSpecs: {
                ...prev.dynamicSpecs,
                [fieldId]: value
            }
        }));
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                keyFeatures: [...prev.keyFeatures, newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    const removeFeature = (index) => {
        setFormData(prev => ({
            ...prev,
            keyFeatures: prev.keyFeatures.filter((_, i) => i !== index)
        }));
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const removeTag = (index) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index)
        }));
    };

    const handleImageUpload = async (e, type = 'main') => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const validation = uploadService.validateFile(file);
        if (!validation.isValid) {
            alert(`Upload failed: ${validation.errors.join(', ')}`);
            return;
        }

        try {
            // Create preview URL for immediate display
            const previewUrl = uploadService.createPreviewUrl(file);

            if (type === 'main') {
                // Set preview immediately
                handleInputChange('mainImage', previewUrl);

                // Upload to backend
                const response = await uploadService.uploadSingleImage(file, {
                    alt: formData.name || 'Product Image',
                    category: 'products',
                    isPrimary: true,
                    onProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        console.log(`Upload progress: ${percentCompleted}%`);
                    }
                });

                // Update with backend URL
                const uploadedImage = response.data?.image || response.image;
                if (uploadedImage?.url) {
                    handleInputChange('mainImage', uploadedImage.url);
                    // Cleanup preview URL
                    uploadService.cleanupPreviewUrl(previewUrl);
                }
            } else {
                // Handle additional images for media gallery
                const tempMedia = {
                    id: `temp-${Date.now()}`,
                    type: 'image',
                    src: previewUrl,
                    thumbnail: previewUrl,
                    alt: formData.name || 'Product Image',
                    title: file.name,
                    uploading: true
                };

                // Add to gallery immediately with preview
                setFormData(prev => ({
                    ...prev,
                    mediaGallery: [...prev.mediaGallery, tempMedia]
                }));

                // Upload to backend
                const response = await uploadService.uploadSingleImage(file, {
                    alt: formData.name || 'Product Image',
                    category: 'products',
                    onProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        console.log(`Upload progress: ${percentCompleted}%`);
                    }
                });

                // Update with backend URL
                const uploadedImage = response.data?.image || response.image;
                if (uploadedImage?.url) {
                    setFormData(prev => ({
                        ...prev,
                        mediaGallery: prev.mediaGallery.map(media =>
                            media.id === tempMedia.id
                                ? {
                                    ...media,
                                    id: `image-${Date.now()}`,
                                    src: uploadedImage.url,
                                    thumbnail: uploadedImage.url,
                                    uploading: false,
                                    publicId: uploadedImage.publicId
                                }
                                : media
                        )
                    }));
                    // Cleanup preview URL
                    uploadService.cleanupPreviewUrl(previewUrl);
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message}`);

            // Remove failed upload from gallery if it was added
            if (type !== 'main') {
                setFormData(prev => ({
                    ...prev,
                    mediaGallery: prev.mediaGallery.filter(media => !media.uploading)
                }));
            }
        }
    };

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check if it's a video file
            if (!file.type.startsWith('video/')) {
                alert('Please select a video file');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const newVideo = {
                    id: `video-${Date.now()}`,
                    type: 'video',
                    src: event.target.result,
                    poster: '', // Can be set later
                    thumbnail: '', // Can be generated
                    alt: formData.name || 'Product Video',
                    title: file.name,
                    fileName: file.name,
                    fileSize: file.size
                };

                // Add to both videos array and media gallery
                setFormData(prev => ({
                    ...prev,
                    videos: [...prev.videos, newVideo],
                    mediaGallery: [...prev.mediaGallery, newVideo]
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeMediaItem = (index) => {
        setFormData(prev => ({
            ...prev,
            mediaGallery: prev.mediaGallery.filter((_, i) => i !== index)
        }));
    };

    const validateStep = (step) => {
        const newErrors = {};

        switch (step) {
            case 1:
                if (!formData.name) newErrors.name = 'Product name is required';
                if (!formData.category) newErrors.category = 'Category is required';
                if (!formData.shortDescription) newErrors.shortDescription = 'Short description is required';
                break;
            case 2:
                if (!formData.price) newErrors.price = 'Price is required';
                if (!formData.stock) newErrors.stock = 'Stock quantity is required';
                if (formData.originalPrice && parseFloat(formData.originalPrice) <= parseFloat(formData.price)) {
                    newErrors.originalPrice = 'Original price must be higher than current price';
                }
                break;
            case 6:
                if (formData.seoTitle && formData.seoTitle.length > 60) {
                    newErrors.seoTitle = 'SEO title should be under 60 characters';
                }
                if (formData.seoDescription && formData.seoDescription.length > 160) {
                    newErrors.seoDescription = 'SEO description should be under 160 characters';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSave = (isDraft = false) => {
        // Validate form before saving (skip validation for drafts)
        if (!isDraft && !validateForm()) {
            return;
        }

        // Transform frontend form data to backend expected structure
        const productData = {
            // Basic required fields
            name: formData.name.trim(),
            description: formData.longDescription || formData.shortDescription || '',
            shortDescription: formData.shortDescription || '',
            price: parseFloat(formData.price) || 0,
            brand: formData.brand.trim(),
            category: formData.category, // Should be ObjectId

            // Optional pricing fields
            comparePrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
            cost: formData.costPrice ? parseFloat(formData.costPrice) : undefined,

            // SKU and barcode
            sku: formData.sku || undefined,
            barcode: formData.barcode || undefined,

            // Stock information - transform to backend structure
            stock: {
                quantity: parseInt(formData.stock) || 0,
                lowStockThreshold: 10, // Default value
                trackQuantity: true
            },

            // Images - transform mediaGallery to backend images structure
            images: formData.mediaGallery
                .filter(media => media.type === 'image')
                .map((media, index) => ({
                    url: media.src || media.url,
                    alt: media.alt || formData.name,
                    isPrimary: index === 0 || media.isPrimary || false,
                    publicId: media.publicId || null
                })),

            // Variants - transform productOptions to backend variants structure
            variants: Object.entries(formData.productOptions || {}).map(([key, option]) => ({
                name: option.name || key,
                options: option.availableOptions?.map(opt => ({
                    value: opt.name || opt.value,
                    priceModifier: opt.priceModifier || 0,
                    stock: opt.stock || 0
                })) || []
            })).filter(variant => variant.options.length > 0),

            // Specifications - transform technicalSpecs and dynamicSpecs
            specifications: [
                // Transform technicalSpecs
                ...Object.entries(formData.technicalSpecs || {}).map(([key, value]) => ({
                    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                    value: value.toString(),
                    category: 'technical'
                })),
                // Transform dynamicSpecs
                ...Object.entries(formData.dynamicSpecs || {}).map(([key, value]) => ({
                    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                    value: value.toString(),
                    category: selectedCategory?.name?.toLowerCase() || 'general'
                }))
            ].filter(spec => spec.value && spec.value.trim()),

            // Features - ensure it's an array of strings
            features: Array.isArray(formData.keyFeatures)
                ? formData.keyFeatures.filter(f => f && f.trim())
                : [],

            // Tags - ensure it's an array of strings
            tags: Array.isArray(formData.tags)
                ? formData.tags.filter(t => t && t.trim())
                : [],

            // Weight - transform to backend structure
            weight: formData.weight ? {
                value: parseFloat(formData.weight),
                unit: 'g' // Default unit
            } : undefined,

            // Dimensions - transform to backend structure
            dimensions: (formData.dimensions?.length || formData.dimensions?.width || formData.dimensions?.height) ? {
                length: parseFloat(formData.dimensions.length) || 0,
                width: parseFloat(formData.dimensions.width) || 0,
                height: parseFloat(formData.dimensions.height) || 0,
                unit: 'cm' // Default unit
            } : undefined,

            // Shipping information
            shipping: {
                free: formData.shippingRequired === false || formData.shippingClass === 'free',
                weight: formData.shippingWeight ? parseFloat(formData.shippingWeight) : undefined,
                dimensions: formData.dimensions ? {
                    length: parseFloat(formData.dimensions.length) || 0,
                    width: parseFloat(formData.dimensions.width) || 0,
                    height: parseFloat(formData.dimensions.height) || 0
                } : undefined
            },

            // SEO information
            seo: {
                title: formData.seoTitle || formData.name,
                description: formData.seoDescription || formData.shortDescription,
                keywords: Array.isArray(formData.tags) ? formData.tags : []
            },

            // Status and visibility
            status: isDraft ? 'draft' : 'active',
            visibility: 'public', // Default visibility
            featured: Boolean(formData.featured),

            // Sections - if featured, add to featured section
            sections: formData.featured ? ['featured'] : [],

            // Remove frontend-specific fields that don't exist in backend
            // id, createdAt, updatedAt will be handled by backend
        };

        // Remove undefined values to avoid sending unnecessary data
        Object.keys(productData).forEach(key => {
            if (productData[key] === undefined) {
                delete productData[key];
            }
        });

        onSave(productData);
    };

    const calculateProfitMargin = () => {
        const price = parseFloat(formData.price) || 0;
        const cost = parseFloat(formData.costPrice) || 0;
        if (price && cost) {
            return (((price - cost) / price) * 100).toFixed(1);
        }
        return 0;
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
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
                            <label className="form-label">Category *</label>
                            <select
                                className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                            >
                                <option value="">Select category</option>
                                {Array.isArray(categories) ? categories.filter(cat => cat.isActive).map(cat => (
                                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                )) : null}
                            </select>
                            {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                            {selectedCategory && (
                                <div className="form-text">
                                    {selectedCategory.description}
                                </div>
                            )}
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Brand</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.brand}
                                onChange={(e) => handleInputChange('brand', e.target.value)}
                                placeholder="Enter brand name"
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Model</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.model}
                                onChange={(e) => handleInputChange('model', e.target.value)}
                                placeholder="Enter model number"
                            />
                        </div>
                        <div className="col-12 mb-3">
                            <label className="form-label">SKU</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.sku}
                                onChange={(e) => handleInputChange('sku', e.target.value)}
                                placeholder="Enter SKU (Stock Keeping Unit)"
                            />
                        </div>
                        <div className="col-12 mb-3">
                            <label className="form-label">Short Description *</label>
                            <textarea
                                className={`form-control ${errors.shortDescription ? 'is-invalid' : ''}`}
                                rows="3"
                                value={formData.shortDescription}
                                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                placeholder="Brief product description for listings"
                            />
                            {errors.shortDescription && <div className="invalid-feedback">{errors.shortDescription}</div>}
                        </div>
                        <div className="col-12 mb-3">
                            <label className="form-label">Long Description</label>
                            <textarea
                                className="form-control"
                                rows="5"
                                value={formData.longDescription}
                                onChange={(e) => handleInputChange('longDescription', e.target.value)}
                                placeholder="Detailed product description"
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Current Price * (£)</label>
                            <input
                                type="number"
                                step="0.01"
                                className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Original Price (£)</label>
                            <input
                                type="number"
                                step="0.01"
                                className={`form-control ${errors.originalPrice ? 'is-invalid' : ''}`}
                                value={formData.originalPrice}
                                onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.originalPrice && <div className="invalid-feedback">{errors.originalPrice}</div>}
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Cost Price (£)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={formData.costPrice}
                                onChange={(e) => handleInputChange('costPrice', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        {formData.price && formData.costPrice && (
                            <div className="col-12 mb-3">
                                <div className="alert alert-info">
                                    <strong>Profit Margin: {calculateProfitMargin()}%</strong>
                                    <br />
                                    Profit per unit: £{(parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(2)}
                                </div>
                            </div>
                        )}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Stock Quantity *</label>
                            <input
                                type="number"
                                className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
                                value={formData.stock}
                                onChange={(e) => handleInputChange('stock', e.target.value)}
                                placeholder="0"
                            />
                            {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Min Order Quantity</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formData.minOrderQuantity}
                                onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                                placeholder="1"
                            />
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Max Order Quantity</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formData.maxOrderQuantity}
                                onChange={(e) => handleInputChange('maxOrderQuantity', e.target.value)}
                                placeholder="10"
                            />
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="row">
                        {selectedCategory && selectedCategory.optionsTemplate && selectedCategory.optionsTemplate.length > 0 ? (
                            <>
                                <div className="col-12 mb-3">
                                    <h5>Product Options</h5>
                                    <p className="text-muted">Configure available options for {selectedCategory.name}</p>
                                </div>

                                {Array.isArray(selectedCategory?.optionsTemplate) ? selectedCategory.optionsTemplate.filter(opt => opt.enabled).map((optionGroup) => (
                                    <div key={optionGroup.id} className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">
                                                    {optionGroup.name}
                                                    {optionGroup.required && <span className="text-danger ms-1">*</span>}
                                                </h6>
                                                <small className="text-muted">
                                                    {optionGroup.type === 'color' && 'Color variants for this product'}
                                                    {optionGroup.type === 'select' && 'Selection options for this product'}
                                                    {optionGroup.type === 'size' && 'Size variants for this product'}
                                                    {optionGroup.type === 'text' && 'Custom text option'}
                                                </small>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    {Array.isArray(optionGroup.options) ? optionGroup.options.map((option, optionIndex) => (
                                                        <div key={option.id} className="col-md-6 col-lg-4 mb-3">
                                                            <div className="card border">
                                                                <div className="card-body p-3">
                                                                    <div className="d-flex align-items-center justify-content-between">
                                                                        <div className="d-flex align-items-center">
                                                                            {optionGroup.type === 'color' && (
                                                                                <div
                                                                                    className="me-2 border rounded-circle"
                                                                                    style={{
                                                                                        width: '24px',
                                                                                        height: '24px',
                                                                                        backgroundColor: option.value
                                                                                    }}
                                                                                ></div>
                                                                            )}
                                                                            <div>
                                                                                <div className="fw-medium">{option.name}</div>
                                                                                {optionGroup.type !== 'color' && (
                                                                                    <small className="text-muted">{option.value}</small>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-check">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                checked={formData.productOptions[optionGroup.id]?.availableOptions?.find(opt => opt.id === option.id)?.available || false}
                                                                                onChange={(e) => {
                                                                                    const newOptions = { ...formData.productOptions };
                                                                                    if (!newOptions[optionGroup.id]) {
                                                                                        newOptions[optionGroup.id] = {
                                                                                            ...optionGroup,
                                                                                            availableOptions: optionGroup.options.map(opt => ({
                                                                                                ...opt,
                                                                                                available: opt.id === option.id ? e.target.checked : false
                                                                                            }))
                                                                                        };
                                                                                    } else {
                                                                                        newOptions[optionGroup.id].availableOptions = newOptions[optionGroup.id].availableOptions.map(opt =>
                                                                                            opt.id === option.id ? { ...opt, available: e.target.checked } : opt
                                                                                        );
                                                                                    }
                                                                                    handleInputChange('productOptions', newOptions);
                                                                                }}
                                                                            />
                                                                            <label className="form-check-label">
                                                                                <small>Available</small>
                                                                            </label>
                                                                        </div>
                                                                    </div>

                                                                    {optionGroup.type === 'select' && optionGroup.id === 'storage' && (
                                                                        <div className="mt-2">
                                                                            <label className="form-label">
                                                                                <small>Price Difference (£)</small>
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                className="form-control form-control-sm"
                                                                                placeholder="0.00"
                                                                                onChange={(e) => {
                                                                                    const newOptions = { ...formData.productOptions };
                                                                                    if (newOptions[optionGroup.id]) {
                                                                                        newOptions[optionGroup.id].availableOptions = newOptions[optionGroup.id].availableOptions.map(opt =>
                                                                                            opt.id === option.id ? { ...opt, priceDifference: parseFloat(e.target.value) || 0 } : opt
                                                                                        );
                                                                                        handleInputChange('productOptions', newOptions);
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )) : null}
                                                </div>

                                                {optionGroup.options.length === 0 && (
                                                    <div className="text-center py-3 text-muted">
                                                        <p>No {optionGroup.name.toLowerCase()} defined for this category.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : null}
                            </>
                        ) : (
                            <div className="col-12">
                                <div className="alert alert-info">
                                    <h6>No Product Options</h6>
                                    <p className="mb-0">
                                        {selectedCategory
                                            ? `The ${selectedCategory.name} category doesn't have any product options configured.`
                                            : 'Please select a category in step 1 to see available product options.'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 4:
                return (
                    <div className="row">
                        <div className="col-12 mb-4">
                            <h5>Main Product Image</h5>
                            <div className="mb-3">
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'main')}
                                />
                            </div>
                            {formData.mainImage && (
                                <div className="mb-3">
                                    <img
                                        src={formData.mainImage}
                                        alt="Main product"
                                        className="img-thumbnail"
                                        style={{ maxWidth: '200px', maxHeight: '200px' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="col-md-6 mb-4">
                            <h5>Additional Images</h5>
                            <div className="mb-3">
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'additional')}
                                />
                            </div>
                        </div>

                        <div className="col-md-6 mb-4">
                            <h5>Product Videos</h5>
                            <div className="mb-3">
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                />
                                <div className="form-text">
                                    Supported formats: MP4, WebM, AVI (Max 50MB)
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <h5>Media Gallery</h5>
                            <div className="row">
                                {Array.isArray(formData.mediaGallery) ? formData.mediaGallery.map((media, index) => (
                                    <div key={media.id} className="col-md-3 mb-3">
                                        <div className="card">
                                            {media.type === 'image' ? (
                                                <img
                                                    src={media.src}
                                                    alt={media.alt}
                                                    className="card-img-top"
                                                    style={{ height: '150px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="position-relative">
                                                    <video
                                                        src={media.src}
                                                        className="card-img-top"
                                                        style={{ height: '150px', objectFit: 'cover' }}
                                                        controls={false}
                                                    />
                                                    <div className="position-absolute top-50 start-50 translate-middle">
                                                        <div className="bg-dark bg-opacity-75 rounded-circle p-2">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                                                <path d="M8 5v14l11-7z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="card-body p-2">
                                                <small className="text-muted d-block mb-1">
                                                    {media.type === 'video' ? '🎥 Video' : '🖼️ Image'}
                                                </small>
                                                <button
                                                    className="btn btn-danger btn-sm w-100"
                                                    onClick={() => removeMediaItem(index)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )) : null}
                            </div>
                            {(!Array.isArray(formData.mediaGallery) || formData.mediaGallery.length === 0) && (
                                <div className="text-center py-4 text-muted">
                                    <p>No media uploaded yet. Add images and videos to showcase your product.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="row">
                        {selectedCategory && selectedCategory.specificationTemplate ? (
                            <div className="col-12 mb-4">
                                <h5>Product Specifications</h5>
                                <p className="text-muted">Fill in the specifications for {selectedCategory.name}</p>

                                {Array.isArray(selectedCategory?.specificationTemplate?.groups) ? selectedCategory.specificationTemplate.groups.map((group) => (
                                    <div key={group.id} className="card mb-3">
                                        <div className="card-header">
                                            <h6 className="mb-0">{group.name}</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                {Array.isArray(group.fields) ? group.fields.map((field) => (
                                                    <div key={field.id} className="col-md-6 mb-3">
                                                        <label className="form-label">
                                                            {field.name}
                                                            {field.required && <span className="text-danger">*</span>}
                                                        </label>
                                                        {field.type === 'text' && (
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={formData.dynamicSpecs[field.id] || ''}
                                                                onChange={(e) => handleDynamicSpecChange(field.id, e.target.value)}
                                                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                                                required={field.required}
                                                            />
                                                        )}
                                                        {field.type === 'number' && (
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                value={formData.dynamicSpecs[field.id] || ''}
                                                                onChange={(e) => handleDynamicSpecChange(field.id, e.target.value)}
                                                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                                                required={field.required}
                                                            />
                                                        )}
                                                        {field.type === 'select' && (
                                                            <select
                                                                className="form-select"
                                                                value={formData.dynamicSpecs[field.id] || ''}
                                                                onChange={(e) => handleDynamicSpecChange(field.id, e.target.value)}
                                                                required={field.required}
                                                            >
                                                                <option value="">Select {field.name}</option>
                                                                {Array.isArray(field.options) ? field.options.map((option, index) => (
                                                                    <option key={index} value={option}>{option}</option>
                                                                )) : null}
                                                            </select>
                                                        )}
                                                        {field.type === 'textarea' && (
                                                            <textarea
                                                                className="form-control"
                                                                rows="3"
                                                                value={formData.dynamicSpecs[field.id] || ''}
                                                                onChange={(e) => handleDynamicSpecChange(field.id, e.target.value)}
                                                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                                                required={field.required}
                                                            />
                                                        )}
                                                        {field.type === 'boolean' && (
                                                            <select
                                                                className="form-select"
                                                                value={formData.dynamicSpecs[field.id] || ''}
                                                                onChange={(e) => handleDynamicSpecChange(field.id, e.target.value)}
                                                                required={field.required}
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="yes">Yes</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                )) : null}
                                            </div>
                                        </div>
                                    </div>
                                )) : null}
                            </div>
                        ) : (
                            <div className="col-12 mb-4">
                                <div className="alert alert-info">
                                    <h6>No Category Selected</h6>
                                    <p className="mb-0">Please select a category in step 1 to see the specification fields for this product type.</p>
                                </div>
                            </div>
                        )}

                        <div className="col-12">
                            <h5>Key Features</h5>
                            <div className="mb-3">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        placeholder="Add a key feature"
                                        onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                                    />
                                    <button className="btn btn-outline-secondary" onClick={addFeature}>
                                        Add
                                    </button>
                                </div>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                {Array.isArray(formData.keyFeatures) ? formData.keyFeatures.map((feature, index) => (
                                    <span key={index} className="badge bg-primary d-flex align-items-center">
                                        {feature}
                                        <button
                                            className="btn-close btn-close-white ms-2"
                                            onClick={() => removeFeature(index)}
                                        ></button>
                                    </span>
                                )) : null}
                            </div>
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="row">
                        <div className="col-12 mb-3">
                            <label className="form-label">SEO Title</label>
                            <input
                                type="text"
                                className={`form-control ${errors.seoTitle ? 'is-invalid' : ''}`}
                                value={formData.seoTitle}
                                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                                placeholder="SEO optimized title (max 60 characters)"
                                maxLength="60"
                            />
                            <div className="form-text">{formData.seoTitle.length}/60 characters</div>
                            {errors.seoTitle && <div className="invalid-feedback">{errors.seoTitle}</div>}
                        </div>
                        <div className="col-12 mb-3">
                            <label className="form-label">SEO Description</label>
                            <textarea
                                className={`form-control ${errors.seoDescription ? 'is-invalid' : ''}`}
                                rows="3"
                                value={formData.seoDescription}
                                onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                                placeholder="SEO meta description (max 160 characters)"
                                maxLength="160"
                            />
                            <div className="form-text">{formData.seoDescription.length}/160 characters</div>
                            {errors.seoDescription && <div className="invalid-feedback">{errors.seoDescription}</div>}
                        </div>
                        <div className="col-12 mb-3">
                            <label className="form-label">Tags</label>
                            <div className="input-group mb-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add a tag"
                                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                />
                                <button className="btn btn-outline-secondary" onClick={addTag}>
                                    Add Tag
                                </button>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                {Array.isArray(formData.tags) ? formData.tags.map((tag, index) => (
                                    <span key={index} className="badge bg-secondary d-flex align-items-center">
                                        {tag}
                                        <button
                                            className="btn-close btn-close-white ms-2"
                                            onClick={() => removeTag(index)}
                                        ></button>
                                    </span>
                                )) : null}
                            </div>
                        </div>
                        <div className="col-12 mb-3">
                            <div className="form-check">
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
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                );

            case 7:
                return (
                    <div className="row">
                        <div className="col-12">
                            <h5>Product Review</h5>
                            <div className="card">
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-4">
                                            {formData.mainImage && (
                                                <img
                                                    src={formData.mainImage}
                                                    alt={formData.name}
                                                    className="img-fluid rounded"
                                                />
                                            )}
                                        </div>
                                        <div className="col-md-8">
                                            <h4>{formData.name}</h4>
                                            <p className="text-muted">{formData.category} • {formData.brand}</p>
                                            <p>{formData.shortDescription}</p>
                                            <div className="row">
                                                <div className="col-6">
                                                    <strong>Price: £{formData.price}</strong>
                                                    {formData.originalPrice && (
                                                        <span className="text-muted text-decoration-line-through ms-2">
                                                            £{formData.originalPrice}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="col-6">
                                                    <strong>Stock: {formData.stock}</strong>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <span className={`badge bg-${formData.status === 'active' ? 'success' : 'secondary'}`}>
                                                    {formData.status}
                                                </span>
                                                {formData.featured && (
                                                    <span className="badge bg-warning ms-2">Featured</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="store-card fill-card">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">
                    {editProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button className="btn btn-outline-secondary" onClick={onCancel}>
                    Cancel
                </button>
            </div>

            {/* Progress Steps */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className={`d-flex flex-column align-items-center ${step.id === currentStep ? 'text-primary' :
                                step.id < currentStep ? 'text-success' : 'text-muted'
                                }`}
                        >
                            <div
                                className={`rounded-circle d-flex align-items-center justify-content-center mb-2 ${step.id === currentStep ? 'bg-primary text-white' :
                                    step.id < currentStep ? 'bg-success text-white' : 'bg-light'
                                    }`}
                                style={{ width: '40px', height: '40px' }}
                            >
                                {step.id < currentStep ? '✓' : step.icon}
                            </div>
                            <small className="text-center">{step.title}</small>
                        </div>
                    ))}
                </div>
                <div className="progress mt-3" style={{ height: '4px' }}>
                    <div
                        className="progress-bar"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Step Content */}
            <div className="mb-4">
                {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="d-flex justify-content-between">
                <button
                    className="btn btn-outline-secondary"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                >
                    Previous
                </button>

                <div className="d-flex gap-2">
                    {currentStep === steps.length ? (
                        <>
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => handleSave(true)}
                            >
                                Save as Draft
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={() => handleSave(false)}
                            >
                                Publish Product
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={nextStep}
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAddProduct;