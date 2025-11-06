import React, { useState, useEffect } from 'react';
import { getCategoryConfig, generateProductSlug, validateProductSlug, mapCategoryToConfig } from '../../config/categoryConfig';
import './AdminAddProduct.css';

const AdminAddProduct = ({ onSave, onCancel, editProduct = null, categories = [] }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryConfig, setCategoryConfig] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Debug categories and handle invalid data
    const [validCategories, setValidCategories] = useState([]);
    
    useEffect(() => {
        console.log('AdminAddProduct - Categories received:', categories);
        console.log('Categories type:', typeof categories, 'isArray:', Array.isArray(categories), 'length:', categories?.length);
        
        // Check if we received valid categories or products by mistake
        if (Array.isArray(categories) && categories.length > 0) {
            const firstItem = categories[0];
            console.log('First category item:', firstItem);
            
            // More flexible validation - check for typical category properties
            const isCategory = firstItem && typeof firstItem === 'object' && 
                              (firstItem.name || firstItem.categoryName) && 
                              !firstItem.hasOwnProperty('price') && 
                              !firstItem.hasOwnProperty('stock');
            
            if (isCategory) {
                console.log('✅ Valid category data received');
                setValidCategories(categories);
            } else {
                console.warn('⚠️ Received products instead of categories! Using fallback categories.');
                console.warn('First item structure:', Object.keys(firstItem || {}));
                setValidCategories(getFallbackCategories());
            }
        } else {
            console.warn('⚠️ No valid categories received, using fallback');
            setValidCategories(getFallbackCategories());
        }
    }, [categories]);
    
    // Fallback categories for testing
    const getFallbackCategories = () => [
        { _id: '6907c4cd76b828091bdb9704', name: 'Smartphones', slug: 'phones' },
        { _id: '6907c4cd76b828091bdb9705', name: 'Tablets', slug: 'tablets' },
        { _id: '6907c4cd76b828091bdb9706', name: 'Laptops & Computers', slug: 'computers' },
        { _id: '6907c4cd76b828091bdb9707', name: 'Smart TVs', slug: 'tvs' },
        { _id: '6907c4cd76b828091bdb9708', name: 'Gaming Consoles', slug: 'gaming' },
        { _id: '6907c4cd76b828091bdb9709', name: 'Smart Watches', slug: 'watches' },
        { _id: '6907c4cd76b828091bdb970a', name: 'Audio & Headphones', slug: 'audio' },
        { _id: '6907c4cd76b828091bdb970b', name: 'Cameras', slug: 'cameras' },
        { _id: '6907c4cd76b828091bdb970c', name: 'Accessories', slug: 'accessories' },
        { _id: '6907c4cd76b828091bdb970d', name: 'Smart Home', slug: 'home-smart-devices' },
        { _id: '6907c4cd76b828091bdb970e', name: 'Fitness & Health', slug: 'fitness-health' }
    ];    
    const [formData, setFormData] = useState({
        // Basic Information
        name: editProduct?.name || '',
        slug: editProduct?.slug || '',
        category: editProduct?.category?._id || editProduct?.category || '',
        brand: editProduct?.brand || '',
        model: editProduct?.model || '',
        sku: editProduct?.sku || '',
        shortDescription: editProduct?.shortDescription || '',
        description: editProduct?.description || '',

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
        productOptions: editProduct?.productOptions || {},
        selectedColors: editProduct?.selectedColors || [],
        selectedSecondaryOptions: editProduct?.selectedSecondaryOptions || [],

        // Media Gallery
        mediaGallery: editProduct?.mediaGallery || [],
        mainImage: editProduct?.mainImage || '',
        videos: editProduct?.videos || [],

        // Dynamic Technical Specifications based on category
        specifications: editProduct?.specifications || [],
        dynamicSpecs: editProduct?.dynamicSpecs || {},

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

        // Status & Shipping
        status: editProduct?.status || 'draft',
        visibility: editProduct?.visibility || 'public',
        sections: editProduct?.sections || [],
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
    const [showPreview, setShowPreview] = useState(false);

    // Auto-generate slug from product name
    useEffect(() => {
        if (formData.name && !editProduct) {
            const newSlug = generateProductSlug(formData.name);
            setFormData(prev => ({
                ...prev,
                slug: newSlug
            }));
        }
    }, [formData.name, editProduct]);    
    // Initialize category and dynamic specs
    useEffect(() => {
        if (formData.category && validCategories.length > 0) {
            const category = Array.isArray(validCategories) ? 
                validCategories.find(c => c._id === formData.category || c.id === formData.category) : null;
            setSelectedCategory(category);

            const config = mapCategoryToConfig(category);
            setCategoryConfig(config);

            // Only initialize if not already initialized and not editing
            if (config && !editProduct && !isInitialized) {
                // Initialize dynamic specs based on category template
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

                // Initialize product options based on category template
                const initialOptions = {};
                if (config.colorOptions) {
                    initialOptions.colors = {
                        name: 'Color',
                        options: config.colorOptions.map(color => ({
                            ...color,
                            selected: false,
                            stock: 0
                        }))
                    };
                }

                if (config.secondaryOptions) {
                    initialOptions[config.secondaryOptions.key] = {
                        name: config.secondaryOptions.name,
                        options: config.secondaryOptions.options.map(option => ({
                            ...option,
                            selected: false,
                            stock: 0
                        }))
                    };
                }

                setFormData(prev => ({
                    ...prev,
                    specifications: initialSpecs,
                    productOptions: initialOptions
                }));
                
                setIsInitialized(true);
            }
        }
    }, [formData.category, validCategories, editProduct, isInitialized]);

    const steps = [
        { id: 1, title: 'Basic Info', icon: '📝' },
        { id: 2, title: 'Pricing', icon: '💰' },
        { id: 3, title: 'Options', icon: '🎨' },
        { id: 4, title: 'Media', icon: '📸' },
        { id: 5, title: 'Specs', icon: '⚙️' },
        { id: 6, title: 'SEO', icon: '🔍' },
        { id: 7, title: 'Review', icon: '✅' }
    ];    
// Validation function matching backend requirements
    const validateForm = () => {
        const newErrors = {};

        // Required fields validation
        if (!formData.name || formData.name.trim().length === 0) {
            newErrors.name = 'Product name is required';
        } else if (formData.name.trim().length > 200) {
            newErrors.name = 'Product name cannot exceed 200 characters';
        }

        if (!formData.description && !formData.shortDescription) {
            newErrors.description = 'Product description is required';
        } else if (formData.description && formData.description.length > 2000) {
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

        if (!formData.slug || !validateProductSlug(formData.slug)) {
            newErrors.slug = 'Product slug is required and must be valid (lowercase letters, numbers, hyphens only)';
        }

        // Optional field validations
        if (formData.comparePrice && parseFloat(formData.comparePrice) < 0) {
            newErrors.comparePrice = 'Compare price cannot be negative';
        }

        if (formData.cost && parseFloat(formData.cost) < 0) {
            newErrors.cost = 'Cost price cannot be negative';
        }

        if (formData.stock.quantity && parseInt(formData.stock.quantity) < 0) {
            newErrors.stock = 'Stock quantity cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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

        // Reset initialization when category changes
        if (field === 'category') {
            setIsInitialized(false);
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
    const handleSpecificationChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.map((spec, i) => 
                i === index ? { ...spec, [field]: value } : spec
            )
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

    const handleProductOptionChange = (optionType, optionId, field, value) => {
        console.log('handleProductOptionChange called:', { optionType, optionId, field, value });
        
        setFormData(prev => {
            const currentOptions = prev.productOptions || {};
            const currentOptionType = currentOptions[optionType] || { name: optionType, options: [] };
            const currentOptionsList = currentOptionType.options || [];
            
            const updatedOptions = currentOptionsList.map(option =>
                option.id === optionId ? { ...option, [field]: value } : option
            );
            
            const result = {
                ...prev,
                productOptions: {
                    ...currentOptions,
                    [optionType]: {
                        ...currentOptionType,
                        options: updatedOptions
                    }
                }
            };
            
            console.log('Updated formData.productOptions:', result.productOptions);
            return result;
        });
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    const removeFeature = (index) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
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
        
        if (isUploading) {
            console.log('Upload already in progress, skipping...');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Create preview URL for immediate display
            const previewUrl = URL.createObjectURL(file);

            if (type === 'main') {
                handleInputChange('mainImage', previewUrl);
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

                setFormData(prev => ({
                    ...prev,
                    mediaGallery: [...prev.mediaGallery, tempMedia]
                }));
            }

            // Simulate upload progress for demo
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 100);

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
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 1500);
        }
    };

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
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
                    poster: '',
                    thumbnail: '',
                    alt: formData.name || 'Product Video',
                    title: file.name,
                    fileName: file.name,
                    fileSize: file.size
                };

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
                if (!formData.slug || !validateProductSlug(formData.slug)) {
                    newErrors.slug = 'Valid product slug is required';
                }
                break;
            case 2:
                if (!formData.price) newErrors.price = 'Price is required';
                if (!formData.stock.quantity && formData.stock.quantity !== 0) newErrors.stock = 'Stock quantity is required';
                if (formData.comparePrice && parseFloat(formData.comparePrice) <= parseFloat(formData.price)) {
                    newErrors.comparePrice = 'Compare price must be higher than current price';
                }
                break;
            case 6:
                if (formData.seo.title && formData.seo.title.length > 60) {
                    newErrors.seoTitle = 'SEO title should be under 60 characters';
                }
                if (formData.seo.description && formData.seo.description.length > 160) {
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
            slug: formData.slug.trim(),
            description: formData.description || formData.shortDescription || formData.name || 'Product description',
            shortDescription: formData.shortDescription || '',
            price: parseFloat(formData.price) || 0,
            brand: formData.brand.trim(),
            category: formData.category,

            // Optional pricing fields
            comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
            cost: formData.cost ? parseFloat(formData.cost) : undefined,
            sku: formData.sku || undefined,

            // Stock information
            stock: {
                quantity: parseInt(formData.stock.quantity) || 0,
                trackQuantity: formData.stock.trackQuantity,
                lowStockThreshold: parseInt(formData.stock.lowStockThreshold) || 10
            },

            // Images
            images: formData.mediaGallery
                .filter(media => media.type === 'image')
                .map((media, index) => ({
                    url: media.src || media.url,
                    alt: media.alt || formData.name,
                    isPrimary: index === 0 || media.isPrimary || false,
                    publicId: media.publicId || null
                })),

            // Variants
            variants: Object.entries(formData.productOptions || {}).map(([key, option]) => ({
                name: option.name || key,
                options: option.options?.filter(opt => opt.selected).map(opt => ({
                    value: opt.name || opt.value,
                    priceModifier: opt.basePriceModifier || opt.priceModifier || 0,
                    stock: opt.stock || 0
                })) || []
            })).filter(variant => variant.options.length > 0),

            // Specifications
            specifications: [
                ...formData.specifications.map(spec => ({
                    name: spec.name,
                    value: spec.value.toString(),
                    category: spec.category || 'general'
                })),
                ...Object.entries(formData.dynamicSpecs || {}).map(([key, value]) => ({
                    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                    value: value.toString(),
                    category: selectedCategory?.name?.toLowerCase() || 'general'
                }))
            ].filter(spec => spec.value && spec.value.trim()),

            // Features
            features: Array.isArray(formData.features)
                ? formData.features.filter(f => f && f.trim())
                : [],

            // Tags
            tags: Array.isArray(formData.tags)
                ? formData.tags.filter(t => t && t.trim())
                : [],

            // Weight
            weight: formData.weight.value ? {
                value: parseFloat(formData.weight.value),
                unit: formData.weight.unit || 'kg'
            } : undefined,

            // Dimensions
            dimensions: (formData.dimensions?.length || formData.dimensions?.width || formData.dimensions?.height) ? {
                length: parseFloat(formData.dimensions.length) || 0,
                width: parseFloat(formData.dimensions.width) || 0,
                height: parseFloat(formData.dimensions.height) || 0,
                unit: formData.dimensions.unit || 'cm'
            } : undefined,

            // Shipping information
            shipping: {
                free: formData.shipping.free || false,
                weight: formData.shipping.weight ? parseFloat(formData.shipping.weight) : undefined
            },

            // SEO information
            seo: {
                title: formData.seo.title || formData.name,
                description: formData.seo.description || formData.shortDescription,
                keywords: Array.isArray(formData.tags) ? formData.tags : []
            },

            // Status and visibility
            status: isDraft ? 'draft' : 'active',
            visibility: formData.visibility || 'public',
            featured: Boolean(formData.featured),
            sections: formData.featured ? ['featured'] : formData.sections || []
        };

        // Remove undefined values
        Object.keys(productData).forEach(key => {
            if (productData[key] === undefined) {
                delete productData[key];
            }
        });

        onSave(productData);
    };

    const calculateProfitMargin = () => {
        const price = parseFloat(formData.price) || 0;
        const cost = parseFloat(formData.cost) || 0;
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
                                <i className="fas fa-link me-2"></i>
                                Product Slug *
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                                value={formData.slug}
                                onChange={(e) => handleInputChange('slug', e.target.value)}
                                placeholder="product-slug"
                            />
                            <div className="form-text">
                                <small className="text-muted">
                                    URL-friendly version (lowercase, hyphens only)
                                </small>
                            </div>
                            {errors.slug && <div className="invalid-feedback">{errors.slug}</div>}
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
                                {Array.isArray(validCategories) && validCategories.length > 0 ? 
                                    validCategories.filter(cat => cat.isActive !== false).map(cat => (
                                        <option key={cat._id || cat.id} value={cat._id || cat.id}>
                                            {cat.name}
                                        </option>
                                    )) : (
                                        <>
                                            <option disabled>Loading categories...</option>
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
                        <div className="col-md-6 mb-3">
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
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
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
                                <i className="fas fa-dollar-sign me-2"></i>
                                Current Price *
                            </label>
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
                            <label className="form-label">
                                <i className="fas fa-tag me-2"></i>
                                Compare Price
                            </label>
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
                            <div className="form-text">
                                <small className="text-muted">For showing discounts</small>
                            </div>
                            {errors.comparePrice && <div className="invalid-feedback">{errors.comparePrice}</div>}
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Cost Price ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={formData.cost}
                                onChange={(e) => handleInputChange('cost', e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        {formData.price && formData.cost && (
                            <div className="col-12 mb-3">
                                <div className="alert alert-info">
                                    <div className="row text-center">
                                        <div className="col-md-4">
                                            <strong>Profit Margin: {calculateProfitMargin()}%</strong>
                                        </div>
                                        <div className="col-md-4">
                                            <strong>Profit per Unit: ${(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}</strong>
                                        </div>
                                        <div className="col-md-4">
                                            <strong>Discount: {formData.comparePrice ? 
                                                Math.round(((parseFloat(formData.comparePrice) - parseFloat(formData.price)) / parseFloat(formData.comparePrice)) * 100) + '%'
                                                : '0%'
                                            }</strong>
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
                                value={formData.stock.quantity}
                                onChange={(e) => handleNestedInputChange('stock', 'quantity', e.target.value)}
                                placeholder="0"
                            />
                            {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
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
                );       
     case 3:
                return (
                    <div className="row">
                        {selectedCategory && categoryConfig && categoryConfig.colorOptions ? (
                            <>
                                <div className="col-12 mb-3">
                                    <h5>Product Options</h5>
                                    <p className="text-muted">Configure available options for {selectedCategory.name}</p>
                                </div>

                                {/* Color Options */}
                                <div className="col-12 mb-4">
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="mb-0">
                                                Available Colors
                                                <span className="text-danger ms-1">*</span>
                                            </h6>
                                            <small className="text-muted">Select which colors are available for this product</small>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                {categoryConfig.colorOptions.map((color) => (
                                                    <div key={color.id} className="col-md-3 mb-3">
                                                        <div className="card border">
                                                            <div className="card-body p-3">
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <div className="d-flex align-items-center">
                                                                        <div
                                                                            className={`me-2 border rounded-circle ${color.class}`}
                                                                            style={{
                                                                                width: '24px',
                                                                                height: '24px'
                                                                            }}
                                                                        ></div>
                                                                        <div>
                                                                            <div className="fw-medium">{color.name}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="form-check">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={formData.productOptions.colors?.options?.find(opt => opt.id === color.id)?.selected || false}
                                                                            onChange={(e) => {
                                                                                handleProductOptionChange('colors', color.id, 'selected', e.target.checked);
                                                                            }}
                                                                        />
                                                                        <label className="form-check-label">
                                                                            <small>Available</small>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2">
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        placeholder="Stock quantity"
                                                                        value={formData.productOptions.colors?.options?.find(opt => opt.id === color.id)?.stock || ''}
                                                                        onChange={(e) => {
                                                                            handleProductOptionChange('colors', color.id, 'stock', parseInt(e.target.value) || 0);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Options */}
                                {categoryConfig.secondaryOptions && (
                                    <div className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">
                                                    {categoryConfig.secondaryOptions.name} Options
                                                    <span className="text-danger ms-1">*</span>
                                                </h6>
                                                <small className="text-muted">Configure {categoryConfig.secondaryOptions.name.toLowerCase()} options for this product</small>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    {categoryConfig.secondaryOptions.options.map((option) => (
                                                        <div key={option.id} className="col-md-6 mb-3">
                                                            <div className="card">
                                                                <div className="card-body p-3">
                                                                    <div className="d-flex align-items-center justify-content-between">
                                                                        <div>
                                                                            <div className="fw-medium">{option.name}</div>
                                                                            {option.basePriceModifier !== 0 && (
                                                                                <span className="badge bg-primary">
                                                                                    {option.basePriceModifier > 0 ? '+' : ''}${option.basePriceModifier}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="form-check">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                checked={formData.productOptions[categoryConfig.secondaryOptions.key]?.options?.find(opt => opt.id === option.id)?.selected || false}
                                                                                onChange={(e) => {
                                                                                    handleProductOptionChange(categoryConfig.secondaryOptions.key, option.id, 'selected', e.target.checked);
                                                                                }}
                                                                            />
                                                                            <label className="form-check-label">
                                                                                <small>Available</small>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <input
                                                                            type="number"
                                                                            className="form-control form-control-sm"
                                                                            placeholder="Stock quantity"
                                                                            value={formData.productOptions[categoryConfig.secondaryOptions.key]?.options?.find(opt => opt.id === option.id)?.stock || ''}
                                                                            onChange={(e) => {
                                                                                handleProductOptionChange(categoryConfig.secondaryOptions.key, option.id, 'stock', parseInt(e.target.value) || 0);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                <div className="upload-zone border-dashed p-4 text-center" onClick={() => document.getElementById('mainImageInput').click()}>
                                    <div className="upload-icon">
                                        <i className="fas fa-cloud-upload-alt fa-3x text-muted"></i>
                                    </div>
                                    <div className="upload-text mt-2">Click to upload main image</div>
                                    <div className="upload-subtext text-muted">PNG, JPG, GIF up to 10MB</div>
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
                                        <div className="position-absolute top-0 end-0 p-2">
                                            <button
                                                className="btn btn-sm btn-outline-light me-1"
                                                onClick={() => document.getElementById('mainImageInput').click()}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleInputChange('mainImage', '')}
                                            >
                                                <i className="fas fa-trash"></i>
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
                            <p className="text-muted mb-3">Add multiple images and videos to showcase your product</p>
                            
                            <div className="row">
                                {Array.isArray(formData.mediaGallery) && formData.mediaGallery.map((media, index) => (
                                    <div key={media.id} className="col-md-3 mb-3">
                                        <div className="card">
                                            <div className="position-relative">
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
                                                        />
                                                        <div className="position-absolute top-50 start-50 translate-middle">
                                                            <i className="fas fa-play fa-2x text-white"></i>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="position-absolute top-0 end-0 p-1">
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => removeMediaItem(index)}
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                                {media.uploading && (
                                                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
                                                        <div className="spinner-border text-light" role="status">
                                                            <span className="visually-hidden">Uploading...</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="card-body p-2">
                                                <small className="text-muted">{media.title}</small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {(!Array.isArray(formData.mediaGallery) || formData.mediaGallery.length === 0) && (
                                <div className="text-center py-4 text-muted">
                                    <i className="fas fa-images fa-3x mb-3 d-block"></i>
                                    <p>No media uploaded yet. Add images and videos to showcase your product.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ); 
           case 5:
                return (
                    <div className="row">
                        {selectedCategory && categoryConfig && categoryConfig.specificationCategories ? (
                            <div className="col-12 mb-4">
                                <h5>Technical Specifications</h5>
                                <p className="text-muted">Fill in the specifications for {selectedCategory.name}</p>

                                {Object.entries(categoryConfig.specificationCategories).map(([groupName, specs]) => (
                                    <div key={groupName} className="card mb-3">
                                        <div className="card-header">
                                            <h6 className="mb-0">{groupName}</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                {specs.map((spec) => (
                                                    <div key={spec.key} className="col-md-6 mb-3">
                                                        <label className="form-label">
                                                            {spec.name}
                                                            {spec.required && <span className="text-danger">*</span>}
                                                        </label>
                                                        {spec.type === 'select' ? (
                                                            <select
                                                                className="form-select"
                                                                value={formData.dynamicSpecs[spec.key] || ''}
                                                                onChange={(e) => handleDynamicSpecChange(spec.key, e.target.value)}
                                                                required={spec.required}
                                                            >
                                                                <option value="">Select {spec.name}</option>
                                                                {spec.options?.map((option, index) => (
                                                                    <option key={index} value={option}>{option}</option>
                                                                ))}
                                                            </select>
                                                        ) : spec.type === 'boolean' ? (
                                                            <select
                                                                className="form-select"
                                                                value={formData.dynamicSpecs[spec.key] || ''}
                                                                onChange={(e) => handleDynamicSpecChange(spec.key, e.target.value)}
                                                                required={spec.required}
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="yes">Yes</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        ) : spec.type === 'textarea' ? (
                                                            <textarea
                                                                className="form-control"
                                                                rows="3"
                                                                value={formData.dynamicSpecs[spec.key] || ''}
                                                                onChange={(e) => handleDynamicSpecChange(spec.key, e.target.value)}
                                                                placeholder={spec.placeholder}
                                                                required={spec.required}
                                                            />
                                                        ) : (
                                                            <input
                                                                type={spec.type || 'text'}
                                                                className="form-control"
                                                                value={formData.dynamicSpecs[spec.key] || ''}
                                                                onChange={(e) => handleDynamicSpecChange(spec.key, e.target.value)}
                                                                placeholder={spec.placeholder}
                                                                required={spec.required}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                            
                            <div className="mb-3">
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
                                        Add Feature
                                    </button>
                                </div>
                            </div>
                            
                            <div className="feature-list">
                                {Array.isArray(formData.features) && formData.features.length > 0 ? 
                                    formData.features.map((feature, index) => (
                                        <div key={index} className="d-flex align-items-center mb-2 p-2 bg-light rounded">
                                            <i className="fas fa-check-circle text-success me-2"></i>
                                            <span className="flex-grow-1">{feature}</span>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeFeature(index)}
                                                title="Remove feature"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="text-center py-3 text-muted">
                                            <p>No features added yet. Add key features to highlight your product's benefits.</p>
                                        </div>
                                    )
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
                                value={formData.seo.title}
                                onChange={(e) => handleNestedInputChange('seo', 'title', e.target.value)}
                                placeholder="SEO optimized title (max 60 characters)"
                                maxLength="60"
                            />
                            <div className="form-text">{formData.seo.title.length}/60 characters</div>
                            {errors.seoTitle && <div className="invalid-feedback">{errors.seoTitle}</div>}
                        </div>
                        <div className="col-12 mb-3">
                            <label className="form-label">SEO Description</label>
                            <textarea
                                className={`form-control ${errors.seoDescription ? 'is-invalid' : ''}`}
                                rows="3"
                                value={formData.seo.description}
                                onChange={(e) => handleNestedInputChange('seo', 'description', e.target.value)}
                                placeholder="SEO meta description (max 160 characters)"
                                maxLength="160"
                            />
                            <div className="form-text">{formData.seo.description.length}/160 characters</div>
                            {errors.seoDescription && <div className="invalid-feedback">{errors.seoDescription}</div>}
                        </div>
                        <div className="col-12 mb-3">
                            <label className="form-label">
                                <i className="fas fa-tags me-2"></i>
                                Tags
                            </label>
                            <p className="text-muted mb-3">Add relevant tags to help customers find your product through search</p>
                            
                            <div className="mb-3">
                                <div className="input-group">
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
                                        Add Tag
                                    </button>
                                </div>
                            </div>
                            
                            <div className="tag-list">
                                {Array.isArray(formData.tags) && formData.tags.length > 0 ? 
                                    formData.tags.map((tag, index) => (
                                        <span key={index} className="badge bg-secondary me-1 mb-1">
                                            <i className="fas fa-tag me-1"></i>
                                            {tag}
                                            <button
                                                className="btn-close btn-close-white ms-1"
                                                style={{ fontSize: '0.7em' }}
                                                onClick={() => removeTag(index)}
                                                title="Remove tag"
                                            ></button>
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
                        <div className="col-md-6 mb-3">
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
                    </div>
                ); 
           case 7:
                return (
                    <div className="row">
                        <div className="col-12">
                            <div className="alert alert-info">
                                <h4>
                                    <i className="fas fa-clipboard-check me-2"></i>
                                    Product Review & Summary
                                </h4>
                                <p className="mb-3">Review all the information before publishing your product</p>
                            </div>

                            <div className="card">
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-4">
                                            {formData.mainImage ? (
                                                <img
                                                    src={formData.mainImage}
                                                    alt={formData.name}
                                                    className="img-fluid rounded"
                                                    style={{ maxHeight: '200px' }}
                                                />
                                            ) : (
                                                <div className="bg-light d-flex align-items-center justify-content-center rounded" style={{ height: '200px' }}>
                                                    <div className="text-center text-muted">
                                                        <i className="fas fa-image fa-3x mb-2"></i>
                                                        <p>No main image</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-8">
                                            <h3>{formData.name || 'Untitled Product'}</h3>
                                            <p className="text-muted">
                                                <i className="fas fa-folder me-1"></i>
                                                {selectedCategory?.name || 'No category'} • 
                                                <i className="fas fa-building ms-2 me-1"></i>
                                                {formData.brand || 'No brand'}
                                            </p>
                                            <p>{formData.shortDescription || 'No description provided'}</p>
                                            
                                            <div className="mb-3">
                                                <span className="h4 text-primary">${formData.price || '0.00'}</span>
                                                {formData.comparePrice && (
                                                    <span className="text-muted text-decoration-line-through ms-2">${formData.comparePrice}</span>
                                                )}
                                            </div>
                                            
                                            <div className="row mb-3">
                                                <div className="col-6">
                                                    <small className="text-muted">Stock Quantity</small>
                                                    <div className="fw-bold">{formData.stock.quantity || '0'} units</div>
                                                </div>
                                                <div className="col-6">
                                                    <small className="text-muted">SKU</small>
                                                    <div className="fw-bold">{formData.sku || 'Not set'}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-3">
                                                <span className={`badge ${formData.status === 'active' ? 'bg-success' : 'bg-secondary'} me-2`}>
                                                    <i className="fas fa-circle me-1"></i>
                                                    {formData.status || 'draft'}
                                                </span>
                                                {formData.featured && (
                                                    <span className="badge bg-warning me-2">
                                                        <i className="fas fa-star me-1"></i>
                                                        Featured
                                                    </span>
                                                )}
                                                {formData.features && formData.features.length > 0 && (
                                                    <span className="badge bg-info">
                                                        <i className="fas fa-list me-1"></i>
                                                        {formData.features.length} Features
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h6>
                                    <i className="fas fa-tasks me-2"></i>
                                    Completion Checklist
                                </h6>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="d-flex align-items-center mb-2">
                                            <i className={`fas ${formData.name ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} me-2`}></i>
                                            Product name provided
                                        </div>
                                        <div className="d-flex align-items-center mb-2">
                                            <i className={`fas ${formData.price ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} me-2`}></i>
                                            Price set
                                        </div>
                                        <div className="d-flex align-items-center mb-2">
                                            <i className={`fas ${formData.category ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} me-2`}></i>
                                            Category selected
                                        </div>
                                        <div className="d-flex align-items-center mb-2">
                                            <i className={`fas ${formData.mainImage ? 'fa-check-circle text-success' : 'fa-times-circle text-warning'} me-2`}></i>
                                            Main image uploaded
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="d-flex align-items-center mb-2">
                                            <i className={`fas ${formData.shortDescription ? 'fa-check-circle text-success' : 'fa-times-circle text-warning'} me-2`}></i>
                                            Description provided
                                        </div>
                                        <div className="d-flex align-items-center mb-2">
                                            <i className={`fas ${formData.stock.quantity !== undefined ? 'fa-check-circle text-success' : 'fa-times-circle text-warning'} me-2`}></i>
                                            Stock quantity set
                                        </div>
                                        <div className="d-flex align-items-center mb-2">
                                            <i className={`fas ${formData.features && formData.features.length > 0 ? 'fa-check-circle text-success' : 'fa-times-circle text-muted'} me-2`}></i>
                                            Key features added
                                        </div>
                                        <div className="d-flex align-items-center mb-2">
                                            <i className={`fas ${formData.seo.title || formData.seo.description ? 'fa-check-circle text-success' : 'fa-times-circle text-muted'} me-2`}></i>
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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
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
                    <p className="text-muted mb-0">
                        {editProduct ? 'Update your product information' : 'Create a new product with dynamic specifications'}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    {formData.name && (
                        <button 
                            className="btn btn-outline-info"
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

            {/* Step Navigation */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex">
                            {steps.map((step, index) => (
                                <div key={step.id} className="d-flex align-items-center">
                                    <div 
                                        className={`step-indicator ${currentStep === step.id ? 'active' : currentStep > step.id ? 'completed' : ''}`}
                                        onClick={() => setCurrentStep(step.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span className="step-icon">{step.icon}</span>
                                        <span className="step-title">{step.title}</span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`step-connector ${currentStep > step.id ? 'completed' : ''}`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="card">
                <div className="card-body">
                    {renderStepContent()}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="d-flex justify-content-between mt-4">
                <button 
                    className="btn btn-outline-secondary"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                >
                    <i className="fas fa-arrow-left me-1"></i>
                    Previous
                </button>
                
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-outline-primary"
                        onClick={() => handleSave(true)}
                    >
                        <i className="fas fa-save me-1"></i>
                        Save as Draft
                    </button>
                    
                    {currentStep === steps.length ? (
                        <button 
                            className="btn btn-success"
                            onClick={() => handleSave(false)}
                        >
                            <i className="fas fa-check me-1"></i>
                            {editProduct ? 'Update Product' : 'Create Product'}
                        </button>
                    ) : (
                        <button 
                            className="btn btn-primary"
                            onClick={nextStep}
                        >
                            Next
                            <i className="fas fa-arrow-right ms-1"></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAddProduct;