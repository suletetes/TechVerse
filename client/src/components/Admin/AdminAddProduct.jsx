import React, { useState, useEffect } from 'react';
import uploadService from '../../api/services/uploadService';
import './AdminAddProduct.css'; // We'll create this for custom styles

const AdminAddProduct = ({ onSave, onCancel, editProduct = null, categories = [] }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState(null);
    
    // Debug categories and handle invalid data
    useEffect(() => {
        console.log('AdminAddProduct - Categories received:', categories);
        console.log('Categories type:', typeof categories);
        console.log('Categories is array:', Array.isArray(categories));
        
        if (Array.isArray(categories)) {
            console.log('Categories count:', categories.length);
            if (categories.length > 0) {
                console.log('First category:', categories[0]);
                // Check if it's actually a category object
                if (categories[0] && typeof categories[0] === 'object' && categories[0].name) {
                    console.log('✅ Valid category data');
                } else {
                    console.warn('⚠️ Invalid category data structure');
                }
            }
        } else if (categories && typeof categories === 'object') {
            console.warn('⚠️ Categories is an object but not an array - might be dashboard data');
            console.log('Object keys:', Object.keys(categories));
        }
    }, [categories]);
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
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

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
        console.log('🔍 AdminAddProduct Categories Debug:', {
            categoriesLength: categories?.length || 0,
            categoriesType: typeof categories,
            isArray: Array.isArray(categories),
            firstCategory: categories?.[0],
            formDataCategory: formData.category
        });
        
        if (formData.category && categories.length > 0) {
            const category = Array.isArray(categories) ? categories.find(c => c._id === formData.category || c.id === formData.category) : null;
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
        
        // Prevent multiple simultaneous uploads
        if (isUploading) {
            console.log('Upload already in progress, skipping...');
            return;
        }

        // Validate file
        const validation = uploadService.validateFile(file);
        if (!validation.isValid) {
            // Show better error notification
            setErrors(prev => ({
                ...prev,
                upload: validation.errors.join(', ')
            }));
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

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
                        setUploadProgress(percentCompleted);
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
                        setUploadProgress(percentCompleted);
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

            // Clear any upload errors
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.upload;
                return newErrors;
            });

        } catch (error) {
            console.error('Upload failed:', error);
            setErrors(prev => ({
                ...prev,
                upload: error.message
            }));

            // Remove failed upload from gallery if it was added
            if (type !== 'main') {
                setFormData(prev => ({
                    ...prev,
                    mediaGallery: prev.mediaGallery.filter(media => !media.uploading)
                }));
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
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
            description: formData.longDescription || formData.shortDescription || formData.name || 'Product description',
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

            // Stock information - send as object with quantity as expected by backend
            stock: {
                quantity: parseInt(formData.stock) || 0,
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
                            <label className="form-label">
                                <i className="fas fa-tag me-2"></i>
                                Product Name *
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter a compelling product name"
                            />
                            <div className="form-text">
                                <small className="text-muted">
                                    {formData.name.length}/200 characters
                                </small>
                            </div>
                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">
                                <i className="fas fa-folder me-2"></i>
                                Category *
                            </label>
                            <select
                                className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                            >
                                <option value="">Choose a category...</option>
                                {Array.isArray(categories) && categories.length > 0 ? 
                                    categories.filter(cat => cat.isActive !== false).map(cat => (
                                        <option key={cat._id || cat.id} value={cat._id || cat.id}>
                                            {cat.name}
                                        </option>
                                    )) : (
                                        <>
                                            {/* Fallback categories if API fails */}
                                            <option value="6907c4cd76b828091bdb9704">Smartphones</option>
                                            <option value="6907c4cd76b828091bdb9705">Tablets</option>
                                            <option value="6907c4cd76b828091bdb9706">Laptops & Computers</option>
                                            <option value="6907c4cd76b828091bdb9707">Smart TVs</option>
                                            <option value="6907c4cd76b828091bdb9708">Gaming Consoles</option>
                                            <option value="6907c4cd76b828091bdb9709">Smart Watches</option>
                                            <option value="6907c4cd76b828091bdb970a">Audio & Headphones</option>
                                            <option value="6907c4cd76b828091bdb970b">Cameras</option>
                                            <option value="6907c4cd76b828091bdb970c">Accessories</option>
                                            <option value="6907c4cd76b828091bdb970d">Smart Home</option>
                                            <option value="6907c4cd76b828091bdb970e">Fitness & Health</option>
                                        </>
                                    )
                                }
                            </select>
                            {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                            {selectedCategory && selectedCategory.description && (
                                <div className="alert alert-info mt-2 py-2">
                                    <small>
                                        <i className="fas fa-info-circle me-1"></i>
                                        {selectedCategory.description}
                                    </small>
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
                            <label className="form-label">
                                <i className="fas fa-pound-sign me-2"></i>
                                Current Price *
                            </label>
                            <div className="input-group">
                                <span className="input-group-text">£</span>
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
                            <label className="form-label">
                                <i className="fas fa-tag me-2"></i>
                                Original Price
                            </label>
                            <div className="input-group">
                                <span className="input-group-text">£</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`form-control ${errors.originalPrice ? 'is-invalid' : ''}`}
                                    value={formData.originalPrice}
                                    onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-text">
                                <small className="text-muted">For showing discounts</small>
                            </div>
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
                                <div className="profit-analysis-card">
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="metric-card">
                                                <div className="metric-icon">
                                                    <i className="fas fa-chart-line"></i>
                                                </div>
                                                <div className="metric-content">
                                                    <div className="metric-value">{calculateProfitMargin()}%</div>
                                                    <div className="metric-label">Profit Margin</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="metric-card">
                                                <div className="metric-icon">
                                                    <i className="fas fa-coins"></i>
                                                </div>
                                                <div className="metric-content">
                                                    <div className="metric-value">£{(parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(2)}</div>
                                                    <div className="metric-label">Profit per Unit</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="metric-card">
                                                <div className="metric-icon">
                                                    <i className="fas fa-percentage"></i>
                                                </div>
                                                <div className="metric-content">
                                                    <div className="metric-value">
                                                        {formData.originalPrice ? 
                                                            Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100) + '%'
                                                            : '0%'
                                                        }
                                                    </div>
                                                    <div className="metric-label">Discount</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                            <h5>
                                <i className="fas fa-image me-2"></i>
                                Main Product Image
                            </h5>
                            <p className="text-muted mb-3">Upload the primary image that will represent your product</p>
                            
                            {!formData.mainImage ? (
                                <div className="upload-zone" onClick={() => document.getElementById('mainImageInput').click()}>
                                    <div className="upload-icon">
                                        <i className="fas fa-cloud-upload-alt"></i>
                                    </div>
                                    <div className="upload-text">Click to upload main image</div>
                                    <div className="upload-subtext">PNG, JPG, GIF up to 10MB</div>
                                    <input
                                        id="mainImageInput"
                                        type="file"
                                        className="d-none"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'main')}
                                    />
                                </div>
                            ) : (
                                <div className="main-image-preview">
                                    <div className="position-relative d-inline-block">
                                        <img
                                            src={formData.mainImage}
                                            alt="Main product"
                                            className="img-thumbnail"
                                            style={{ maxWidth: '300px', maxHeight: '300px' }}
                                        />
                                        <div className="image-overlay">
                                            <button
                                                className="btn btn-sm btn-outline-light me-2"
                                                onClick={() => document.getElementById('mainImageInput').click()}
                                            >
                                                <i className="fas fa-edit"></i> Change
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleInputChange('mainImage', '')}
                                            >
                                                <i className="fas fa-trash"></i> Remove
                                            </button>
                                        </div>
                                        <input
                                            id="mainImageInput"
                                            type="file"
                                            className="d-none"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'main')}
                                        />
                                    </div>
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
                            <h5>
                                <i className="fas fa-images me-2"></i>
                                Media Gallery
                            </h5>
                            <p className="text-muted mb-3">Add multiple images and videos to showcase your product from different angles</p>
                            
                            <div className="media-gallery-grid">
                                {Array.isArray(formData.mediaGallery) ? formData.mediaGallery.map((media, index) => (
                                    <div key={media.id} className="media-item">
                                        {media.type === 'image' ? (
                                            <img
                                                src={media.src}
                                                alt={media.alt}
                                                className="media-content"
                                            />
                                        ) : (
                                            <div className="position-relative">
                                                <video
                                                    src={media.src}
                                                    className="media-content"
                                                    controls={false}
                                                />
                                                <div className="position-absolute top-50 start-50 translate-middle">
                                                    <div className="bg-dark bg-opacity-75 rounded-circle p-2">
                                                        <i className="fas fa-play text-white"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="media-overlay">
                                            <div className="media-actions">
                                                <button
                                                    className="btn btn-sm btn-outline-light"
                                                    onClick={() => {
                                                        // Preview functionality
                                                        window.open(media.src, '_blank');
                                                    }}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => removeMediaItem(index)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        {media.uploading && (
                                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
                                                <div className="spinner-border text-light" role="status">
                                                    <span className="visually-hidden">Uploading...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )) : null}
                                
                                {/* Add more media button */}
                                <div className="upload-zone" onClick={() => document.getElementById('additionalImageInput').click()}>
                                    <div className="upload-icon">
                                        <i className="fas fa-plus"></i>
                                    </div>
                                    <div className="upload-text">Add Image</div>
                                    <input
                                        id="additionalImageInput"
                                        type="file"
                                        className="d-none"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'additional')}
                                    />
                                </div>
                                
                                <div className="upload-zone" onClick={() => document.getElementById('videoInput').click()}>
                                    <div className="upload-icon">
                                        <i className="fas fa-video"></i>
                                    </div>
                                    <div className="upload-text">Add Video</div>
                                    <input
                                        id="videoInput"
                                        type="file"
                                        className="d-none"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                    />
                                </div>
                            </div>
                            
                            {(!Array.isArray(formData.mediaGallery) || formData.mediaGallery.length === 0) && (
                                <div className="text-center py-4 text-muted">
                                    <i className="fas fa-images fa-3x mb-3 d-block"></i>
                                    <p>No media uploaded yet. Add images and videos to showcase your product.</p>
                                    <small>Tip: High-quality images increase conversion rates by up to 30%</small>
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
                            <h5>
                                <i className="fas fa-star me-2"></i>
                                Key Features
                            </h5>
                            <p className="text-muted mb-3">Highlight the most important features that make your product stand out</p>
                            
                            <div className="feature-input-group">
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="fas fa-plus"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        placeholder="e.g., Wireless charging, Water resistant, 5-year warranty"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addFeature();
                                            }
                                        }}
                                    />
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={addFeature}
                                        disabled={!newFeature.trim()}
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Add Feature
                                    </button>
                                </div>
                                <div className="form-text">
                                    <small className="text-muted">
                                        <i className="fas fa-lightbulb me-1"></i>
                                        Tip: Focus on benefits that solve customer problems
                                    </small>
                                </div>
                            </div>
                            
                            <div className="feature-list">
                                {Array.isArray(formData.keyFeatures) && formData.keyFeatures.length > 0 ? 
                                    formData.keyFeatures.map((feature, index) => (
                                        <span key={index} className="feature-badge">
                                            <i className="fas fa-check-circle me-2"></i>
                                            {feature}
                                            <button
                                                className="badge-remove"
                                                onClick={() => removeFeature(index)}
                                                title="Remove feature"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </span>
                                    )) : null
                                }
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
                            <label className="form-label">
                                <i className="fas fa-tags me-2"></i>
                                Tags
                            </label>
                            <p className="text-muted mb-3">Add relevant tags to help customers find your product through search</p>
                            
                            <div className="tag-input-group">
                                <div className="input-group mb-2">
                                    <span className="input-group-text">
                                        <i className="fas fa-hashtag"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="e.g., electronics, smartphone, android, gaming"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                    />
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={addTag}
                                        disabled={!newTag.trim() || formData.tags.includes(newTag.trim())}
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Add Tag
                                    </button>
                                </div>
                                <div className="form-text">
                                    <small className="text-muted">
                                        <i className="fas fa-search me-1"></i>
                                        Tags improve SEO and help customers discover your products
                                    </small>
                                </div>
                            </div>
                            
                            <div className="tag-list">
                                {Array.isArray(formData.tags) && formData.tags.length > 0 ? 
                                    formData.tags.map((tag, index) => (
                                        <span key={index} className="tag-badge">
                                            <i className="fas fa-tag me-2"></i>
                                            {tag}
                                            <button
                                                className="badge-remove"
                                                onClick={() => removeTag(index)}
                                                title="Remove tag"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </span>
                                    )) : null
                                }
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
                            {/* Summary Header */}
                            <div className="review-summary">
                                <h4>
                                    <i className="fas fa-clipboard-check me-2"></i>
                                    Product Review & Summary
                                </h4>
                                <p className="mb-3">Review all the information before publishing your product</p>
                                
                                <div className="review-stats">
                                    <div className="review-stat">
                                        <div className="review-stat-value">
                                            {formData.mediaGallery ? formData.mediaGallery.length + (formData.mainImage ? 1 : 0) : (formData.mainImage ? 1 : 0)}
                                        </div>
                                        <div className="review-stat-label">Media Files</div>
                                    </div>
                                    <div className="review-stat">
                                        <div className="review-stat-value">{formData.keyFeatures ? formData.keyFeatures.length : 0}</div>
                                        <div className="review-stat-label">Key Features</div>
                                    </div>
                                    <div className="review-stat">
                                        <div className="review-stat-value">{formData.tags ? formData.tags.length : 0}</div>
                                        <div className="review-stat-label">Tags</div>
                                    </div>
                                    <div className="review-stat">
                                        <div className="review-stat-value">
                                            {Object.keys(formData.dynamicSpecs || {}).filter(key => formData.dynamicSpecs[key]).length}
                                        </div>
                                        <div className="review-stat-label">Specifications</div>
                                    </div>
                                </div>
                            </div>

                            {/* Product Preview */}
                            <div className="review-card">
                                <div className="row">
                                    <div className="col-md-5">
                                        {formData.mainImage ? (
                                            <img
                                                src={formData.mainImage}
                                                alt={formData.name}
                                                className="review-image"
                                            />
                                        ) : (
                                            <div className="review-image d-flex align-items-center justify-content-center bg-light">
                                                <div className="text-center text-muted">
                                                    <i className="fas fa-image fa-3x mb-2"></i>
                                                    <p>No main image</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-7">
                                        <div className="review-content">
                                            <div className="review-title">{formData.name || 'Untitled Product'}</div>
                                            <div className="review-meta">
                                                <i className="fas fa-folder me-1"></i>
                                                {formData.category || 'No category'} • 
                                                <i className="fas fa-building ms-2 me-1"></i>
                                                {formData.brand || 'No brand'}
                                            </div>
                                            <div className="review-description">
                                                {formData.shortDescription || 'No description provided'}
                                            </div>
                                            
                                            <div className="review-pricing">
                                                <div className="review-current-price">£{formData.price || '0.00'}</div>
                                                {formData.originalPrice && (
                                                    <div className="review-original-price">£{formData.originalPrice}</div>
                                                )}
                                            </div>
                                            
                                            <div className="row mb-3">
                                                <div className="col-6">
                                                    <small className="text-muted">Stock Quantity</small>
                                                    <div className="fw-bold">{formData.stock || '0'} units</div>
                                                </div>
                                                <div className="col-6">
                                                    <small className="text-muted">SKU</small>
                                                    <div className="fw-bold">{formData.sku || 'Not set'}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="review-badges">
                                                <span className={`review-badge ${formData.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                                    <i className="fas fa-circle me-1"></i>
                                                    {formData.status || 'draft'}
                                                </span>
                                                {formData.featured && (
                                                    <span className="review-badge bg-warning">
                                                        <i className="fas fa-star me-1"></i>
                                                        Featured
                                                    </span>
                                                )}
                                                {formData.keyFeatures && formData.keyFeatures.length > 0 && (
                                                    <span className="review-badge bg-info">
                                                        <i className="fas fa-list me-1"></i>
                                                        {formData.keyFeatures.length} Features
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Completion Checklist */}
                            <div className="completion-checklist mt-4">
                                <h6>
                                    <i className="fas fa-tasks me-2"></i>
                                    Completion Checklist
                                </h6>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="checklist-item">
                                            <i className={`fas ${formData.name ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} me-2`}></i>
                                            Product name provided
                                        </div>
                                        <div className="checklist-item">
                                            <i className={`fas ${formData.price ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} me-2`}></i>
                                            Price set
                                        </div>
                                        <div className="checklist-item">
                                            <i className={`fas ${formData.category ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} me-2`}></i>
                                            Category selected
                                        </div>
                                        <div className="checklist-item">
                                            <i className={`fas ${formData.mainImage ? 'fa-check-circle text-success' : 'fa-times-circle text-warning'} me-2`}></i>
                                            Main image uploaded
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="checklist-item">
                                            <i className={`fas ${formData.shortDescription ? 'fa-check-circle text-success' : 'fa-times-circle text-warning'} me-2`}></i>
                                            Description provided
                                        </div>
                                        <div className="checklist-item">
                                            <i className={`fas ${formData.stock ? 'fa-check-circle text-success' : 'fa-times-circle text-warning'} me-2`}></i>
                                            Stock quantity set
                                        </div>
                                        <div className="checklist-item">
                                            <i className={`fas ${formData.keyFeatures && formData.keyFeatures.length > 0 ? 'fa-check-circle text-success' : 'fa-times-circle text-muted'} me-2`}></i>
                                            Key features added
                                        </div>
                                        <div className="checklist-item">
                                            <i className={`fas ${formData.seoTitle || formData.seoDescription ? 'fa-check-circle text-success' : 'fa-times-circle text-muted'} me-2`}></i>
                                            SEO information provided
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
        <div className="admin-add-product">
            {/* Enhanced Header */}
            <div className="product-header">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="product-title">
                            {editProduct ? (
                                <>
                                    <i className="fas fa-edit me-2"></i>
                                    Edit Product
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus-circle me-2"></i>
                                    Add New Product
                                </>
                            )}
                        </h2>
                        <p className="product-subtitle text-muted mb-0">
                            {editProduct ? 'Update your product information' : 'Create a new product for your store'}
                        </p>
                    </div>
                    <div className="header-actions">
                        {formData.name && (
                            <button 
                                className="btn btn-outline-info me-2"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <i className="fas fa-eye me-1"></i>
                                {showPreview ? 'Hide Preview' : 'Preview'}
                            </button>
                        )}
                        <button className="btn btn-outline-secondary" onClick={onCancel}>
                            <i className="fas fa-times me-1"></i>
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Show upload progress */}
                {isUploading && (
                    <div className="upload-progress mb-3">
                        <div className="d-flex align-items-center">
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Uploading...</span>
                            </div>
                            <span className="me-2">Uploading... {uploadProgress}%</span>
                        </div>
                        <div className="progress mt-1" style={{ height: '4px' }}>
                            <div 
                                className="progress-bar progress-bar-striped progress-bar-animated" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Show upload errors */}
                {errors.upload && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {errors.upload}
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.upload;
                                return newErrors;
                            })}
                        ></button>
                    </div>
                )}
            </div>

            {/* Enhanced Progress Steps */}
            <div className="product-steps mb-4">
                <div className="steps-container">
                    {steps.map((step, index) => (
                        <div key={step.id} className="step-item">
                            <div className="step-connector">
                                {index < steps.length - 1 && (
                                    <div 
                                        className={`connector-line ${step.id < currentStep ? 'completed' : ''}`}
                                    ></div>
                                )}
                            </div>
                            <div
                                className={`step-circle ${
                                    step.id === currentStep ? 'current' :
                                    step.id < currentStep ? 'completed' : 'pending'
                                }`}
                                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                                style={{ cursor: step.id < currentStep ? 'pointer' : 'default' }}
                            >
                                <div className="step-icon">
                                    {step.id < currentStep ? (
                                        <i className="fas fa-check"></i>
                                    ) : step.id === currentStep ? (
                                        <i className="fas fa-edit"></i>
                                    ) : (
                                        <span>{step.icon}</span>
                                    )}
                                </div>
                            </div>
                            <div className="step-label">
                                <div className="step-title">{step.title}</div>
                                <div className="step-subtitle">
                                    {step.id === 1 && 'Basic information'}
                                    {step.id === 2 && 'Price & inventory'}
                                    {step.id === 3 && 'Product variants'}
                                    {step.id === 4 && 'Images & videos'}
                                    {step.id === 5 && 'Technical details'}
                                    {step.id === 6 && 'SEO & marketing'}
                                    {step.id === 7 && 'Final review'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="progress-bar-container mt-3">
                    <div className="progress" style={{ height: '6px' }}>
                        <div
                            className="progress-bar progress-bar-striped"
                            style={{ 
                                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                                transition: 'width 0.3s ease'
                            }}
                        ></div>
                    </div>
                    <div className="progress-text mt-2 text-center">
                        <small className="text-muted">
                            Step {currentStep} of {steps.length} - {Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}% Complete
                        </small>
                    </div>
                </div>
            </div>

            {/* Enhanced Step Content */}
            <div className="step-content-container mb-4">
                <div className="step-content-card">
                    <div className="step-content-header">
                        <h4 className="step-content-title">
                            <span className="step-number">{currentStep}</span>
                            {steps.find(s => s.id === currentStep)?.title}
                        </h4>
                        <div className="step-content-actions">
                            {currentStep > 1 && (
                                <button 
                                    className="btn btn-sm btn-outline-secondary me-2"
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                >
                                    <i className="fas fa-arrow-left me-1"></i>
                                    Back
                                </button>
                            )}
                            {currentStep < steps.length && (
                                <button 
                                    className="btn btn-sm btn-primary"
                                    onClick={nextStep}
                                >
                                    Next
                                    <i className="fas fa-arrow-right ms-1"></i>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="step-content-body">
                        {renderStepContent()}
                    </div>
                </div>

                {/* Quick Preview Sidebar */}
                {showPreview && formData.name && (
                    <div className="preview-sidebar">
                        <div className="preview-card">
                            <div className="preview-header">
                                <h6 className="mb-0">
                                    <i className="fas fa-eye me-2"></i>
                                    Live Preview
                                </h6>
                                <button 
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setShowPreview(false)}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="preview-body">
                                {formData.mainImage && (
                                    <img 
                                        src={formData.mainImage} 
                                        alt={formData.name}
                                        className="preview-image"
                                    />
                                )}
                                <h6 className="preview-title">{formData.name}</h6>
                                <p className="preview-brand text-muted">{formData.brand}</p>
                                <div className="preview-price">
                                    <span className="current-price">£{formData.price}</span>
                                    {formData.originalPrice && (
                                        <span className="original-price">£{formData.originalPrice}</span>
                                    )}
                                </div>
                                <p className="preview-description">{formData.shortDescription}</p>
                                <div className="preview-badges">
                                    {formData.featured && (
                                        <span className="badge bg-warning">Featured</span>
                                    )}
                                    <span className={`badge bg-${formData.status === 'active' ? 'success' : 'secondary'}`}>
                                        {formData.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Navigation Footer */}
            <div className="product-footer">
                <div className="footer-actions">
                    <div className="left-actions">
                        <button
                            className="btn btn-outline-secondary btn-lg"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                        >
                            <i className="fas fa-chevron-left me-2"></i>
                            Previous
                        </button>
                    </div>

                    <div className="center-info">
                        <div className="completion-info">
                            <div className="completion-circle">
                                <span>{Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}%</span>
                            </div>
                            <div className="completion-text">
                                <small className="text-muted">Complete</small>
                            </div>
                        </div>
                    </div>

                    <div className="right-actions">
                        {currentStep === steps.length ? (
                            <div className="final-actions">
                                <button
                                    className="btn btn-outline-primary btn-lg me-2"
                                    onClick={() => handleSave(true)}
                                    disabled={isUploading}
                                >
                                    <i className="fas fa-save me-2"></i>
                                    Save as Draft
                                </button>
                                <button
                                    className="btn btn-success btn-lg"
                                    onClick={() => handleSave(false)}
                                    disabled={isUploading}
                                >
                                    <i className="fas fa-rocket me-2"></i>
                                    Publish Product
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={nextStep}
                                disabled={isUploading}
                            >
                                Next
                                <i className="fas fa-chevron-right ms-2"></i>
                            </button>
                        )}
                    </div>
                </div>

                {/* Save Progress Indicator */}
                <div className="save-indicator mt-2 text-center">
                    <small className="text-muted">
                        <i className="fas fa-cloud me-1"></i>
                        Changes are automatically saved as you progress
                    </small>
                </div>
            </div>
        </div>
    );
};

export default AdminAddProduct;