import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context';
import { LoadingSpinner } from '../../components/Common';

const CategoryManagement = () => {
    const { categories, isLoading, error, loadCategories, updateCategory, createCategory } = useAdmin();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        image: '',
        featured: false,
        isActive: true,
        displayOrder: 0,
        specifications: []
    });

    // Default specifications template for each category
    const defaultSpecifications = {
        phones: [
            { category: 'Display & Design', fields: ['Display Size', 'Resolution', 'Display Technology', 'Brightness', 'Dimensions', 'Weight', 'Materials'] },
            { category: 'Performance', fields: ['Processor', 'CPU cores', 'GPU cores', 'RAM', 'Storage type'] },
            { category: 'Camera System', fields: ['Main camera', 'Ultra Wide camera', 'Telephoto camera', 'Front camera', 'Video recording'] },
            { category: 'Battery & Connectivity', fields: ['Battery life', 'Charging', '5G support', 'Wi-Fi', 'Bluetooth', 'NFC'] }
        ],
        tablets: [
            { category: 'Display & Design', fields: ['Display Size', 'Resolution', 'Display Technology', 'Brightness', 'Dimensions', 'Weight'] },
            { category: 'Performance', fields: ['Processor', 'CPU cores', 'GPU cores', 'Memory', 'Storage'] },
            { category: 'Camera & Audio', fields: ['Rear camera', 'Front camera', 'Video recording', 'Audio system'] },
            { category: 'Connectivity & Accessories', fields: ['Wi-Fi', 'Bluetooth', 'Cellular', 'Ports', 'Accessory support'] }
        ],
        computers: [
            { category: 'Display & Design', fields: ['Display size', 'Resolution', 'Display technology', 'Build materials', 'Weight'] },
            { category: 'Performance', fields: ['Processor', 'Graphics', 'Memory', 'Storage', 'Thermal management'] },
            { category: 'Ports & Connectivity', fields: ['Thunderbolt ports', 'USB ports', 'HDMI', 'Wi-Fi', 'Bluetooth'] },
            { category: 'Battery & Power', fields: ['Battery life', 'Power consumption', 'Charging', 'Power adapter'] }
        ],
        tvs: [
            { category: 'Display Technology', fields: ['Display type', 'Resolution', 'HDR support', 'Refresh rate', 'Peak brightness'] },
            { category: 'Smart Features & OS', fields: ['Operating system', 'Voice control', 'Streaming apps', 'Gaming features'] },
            { category: 'Audio System', fields: ['Speaker configuration', 'Audio technologies', 'Sound output', 'External audio'] },
            { category: 'Connectivity & Ports', fields: ['HDMI ports', 'USB ports', 'Wi-Fi', 'Bluetooth', 'Ethernet'] }
        ],
        gaming: [
            { category: 'Performance', fields: ['Processor', 'Graphics', 'Memory', 'Performance targets', 'Loading times'] },
            { category: 'Storage & Media', fields: ['Internal storage', 'Expandable storage', 'Optical drive', 'Media playback'] },
            { category: 'Gaming Features', fields: ['Exclusive games', 'Online services', 'Cross-platform', 'VR support'] },
            { category: 'Connectivity & I/O', fields: ['HDMI output', 'USB ports', 'Ethernet', 'Wi-Fi', 'Bluetooth'] }
        ],
        watches: [
            { category: 'Display & Design', fields: ['Display type', 'Screen size', 'Case materials', 'Water resistance'] },
            { category: 'Health & Fitness', fields: ['Heart rate', 'ECG', 'Sleep tracking', 'Fitness tracking', 'GPS'] },
            { category: 'Smart Features', fields: ['Operating system', 'Voice assistant', 'Notifications', 'Payment support'] },
            { category: 'Performance & Battery', fields: ['Processor', 'Storage', 'Battery life', 'Charging', 'Connectivity'] }
        ],
        audio: [
            { category: 'Audio Technology', fields: ['Driver size', 'Frequency response', 'Noise cancellation', 'Spatial audio'] },
            { category: 'Features & Controls', fields: ['Touch controls', 'Voice assistant', 'Device switching', 'EQ settings'] },
            { category: 'Design & Comfort', fields: ['Weight', 'Materials', 'Comfort features', 'Portability'] },
            { category: 'Battery & Connectivity', fields: ['Battery life', 'Charging', 'Bluetooth', 'Wired options'] }
        ],
        cameras: [
            { category: 'Image Sensor', fields: ['Sensor type', 'Resolution', 'ISO range', 'Image processor', 'Stabilization'] },
            { category: 'Autofocus & Performance', fields: ['Autofocus system', 'Shooting speed', 'Buffer capacity', 'Tracking'] },
            { category: 'Video Capabilities', fields: ['Video resolution', 'Frame rates', 'Video formats', 'Stabilization'] },
            { category: 'Build & Connectivity', fields: ['Weather sealing', 'Memory cards', 'Wi-Fi', 'Battery life'] }
        ],
        accessories: [
            { category: 'Protection & Durability', fields: ['Drop protection', 'Material', 'Water resistance', 'Scratch resistance'] },
            { category: 'Compatibility', fields: ['Device compatibility', 'Wireless charging', 'Port access', 'Case compatibility'] },
            { category: 'Features & Functionality', fields: ['Special features', 'Charging capabilities', 'Mounting options'] },
            { category: 'Design & Materials', fields: ['Color options', 'Weight', 'Premium materials', 'Ergonomic design'] }
        ]
    };

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setFormData({
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || '',
            image: category.image || '',
            featured: category.featured || false,
            isActive: category.isActive !== false,
            displayOrder: category.displayOrder || 0,
            specifications: category.specifications || defaultSpecifications[category.slug] || []
        });
        setIsEditing(true);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSpecificationChange = (specIndex, fieldIndex, value) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.map((spec, sIndex) => 
                sIndex === specIndex 
                    ? {
                        ...spec,
                        fields: spec.fields.map((field, fIndex) => 
                            fIndex === fieldIndex ? value : field
                        )
                    }
                    : spec
            )
        }));
    };

    const addSpecificationField = (specIndex) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.map((spec, sIndex) => 
                sIndex === specIndex 
                    ? { ...spec, fields: [...spec.fields, ''] }
                    : spec
            )
        }));
    };

    const removeSpecificationField = (specIndex, fieldIndex) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.map((spec, sIndex) => 
                sIndex === specIndex 
                    ? {
                        ...spec,
                        fields: spec.fields.filter((_, fIndex) => fIndex !== fieldIndex)
                    }
                    : spec
            )
        }));
    };

    const handleSave = async () => {
        try {
            if (selectedCategory) {
                await updateCategory(selectedCategory._id, formData);
            } else {
                await createCategory(formData);
            }
            setIsEditing(false);
            setSelectedCategory(null);
            loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSelectedCategory(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            image: '',
            featured: false,
            isActive: true,
            displayOrder: 0,
            specifications: []
        });
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="row">
                <div className="col-12">
                    <h2 className="mb-4">Category Management</h2>
                </div>
            </div>

            <div className="row">
                {/* Categories List */}
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Categories</h5>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setIsEditing(true);
                                    setFormData({
                                        name: '',
                                        slug: '',
                                        description: '',
                                        image: '',
                                        featured: false,
                                        isActive: true,
                                        displayOrder: 0,
                                        specifications: []
                                    });
                                }}
                            >
                                Add New
                            </button>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {Array.isArray(categories) && categories.map(category => (
                                    <div 
                                        key={category._id}
                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedCategory?._id === category._id ? 'active' : ''}`}
                                        onClick={() => handleCategorySelect(category)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div>
                                            <h6 className="mb-1">{category.name}</h6>
                                            <small className="text-muted">{category.slug}</small>
                                        </div>
                                        <div>
                                            {category.featured && <span className="badge bg-warning me-1">Featured</span>}
                                            {!category.isActive && <span className="badge bg-secondary">Inactive</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Editor */}
                <div className="col-md-8">
                    {isEditing ? (
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    {selectedCategory ? `Edit ${selectedCategory.name}` : 'Add New Category'}
                                </h5>
                            </div>
                            <div className="card-body">
                                <form>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Category Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                placeholder="e.g., Phones"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Slug</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.slug}
                                                onChange={(e) => handleInputChange('slug', e.target.value)}
                                                placeholder="e.g., phones"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="Category description..."
                                        />
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Image URL</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.image}
                                                onChange={(e) => handleInputChange('image', e.target.value)}
                                                placeholder="Image URL"
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Display Order</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={formData.displayOrder}
                                                onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Status</label>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={formData.featured}
                                                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                                                />
                                                <label className="form-check-label">Featured</label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={formData.isActive}
                                                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                                />
                                                <label className="form-check-label">Active</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Specifications */}
                                    <div className="mb-4">
                                        <h6>Technical Specifications</h6>
                                        {formData.specifications.map((spec, specIndex) => (
                                            <div key={specIndex} className="card mb-3">
                                                <div className="card-header">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={spec.category}
                                                        onChange={(e) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                specifications: prev.specifications.map((s, sIndex) => 
                                                                    sIndex === specIndex 
                                                                        ? { ...s, category: e.target.value }
                                                                        : s
                                                                )
                                                            }));
                                                        }}
                                                        placeholder="Specification category (e.g., Display & Design)"
                                                    />
                                                </div>
                                                <div className="card-body">
                                                    {spec.fields.map((field, fieldIndex) => (
                                                        <div key={fieldIndex} className="input-group mb-2">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={field}
                                                                onChange={(e) => handleSpecificationChange(specIndex, fieldIndex, e.target.value)}
                                                                placeholder="Specification field (e.g., Display Size)"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger"
                                                                onClick={() => removeSpecificationField(specIndex, fieldIndex)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => addSpecificationField(specIndex)}
                                                    >
                                                        Add Field
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className="btn btn-outline-success"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    specifications: [...prev.specifications, { category: '', fields: [''] }]
                                                }));
                                            }}
                                        >
                                            Add Specification Category
                                        </button>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleSave}
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-body text-center">
                                <h5>Select a category to edit or add a new one</h5>
                                <p className="text-muted">
                                    Manage category information, specifications, and display settings.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryManagement;