import React, { useState } from 'react';

const AdminCategories = ({ categories = [], setActiveTab, onSave, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [newCategory, setNewCategory] = useState({
        name: '',
        slug: '',
        description: '',
        image: '',
        parentId: null,
        isActive: true,
        sortOrder: 0,
        seoTitle: '',
        seoDescription: '',
        // Dynamic specifications template for this category
        specificationTemplate: {
            groups: [
                {
                    id: 'general',
                    name: 'General',
                    fields: [
                        { id: 'brand', name: 'Brand', type: 'text', required: true },
                        { id: 'model', name: 'Model', type: 'text', required: true }
                    ]
                }
            ]
        },
        // Dynamic options template - completely customizable per category
        optionsTemplate: [
            {
                id: 'colors',
                name: 'Colors',
                type: 'color',
                enabled: true,
                required: false,
                options: [
                    { id: 'black', name: 'Black', value: '#000000' },
                    { id: 'white', name: 'White', value: '#ffffff' },
                    { id: 'silver', name: 'Silver', value: '#c0c0c0' }
                ]
            }
        ]
    });

    // Ensure categories is an array
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filteredCategories = safeCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddCategory = () => {
        setNewCategory({
            name: '',
            slug: '',
            description: '',
            image: '',
            parentId: null,
            isActive: true,
            sortOrder: 0,
            seoTitle: '',
            seoDescription: '',
            specificationTemplate: {
                groups: [
                    {
                        id: 'general',
                        name: 'General',
                        fields: [
                            { id: 'brand', name: 'Brand', type: 'text', required: true },
                            { id: 'model', name: 'Model', type: 'text', required: true }
                        ]
                    }
                ]
            },
            optionsTemplate: [
                {
                    id: 'colors',
                    name: 'Colors',
                    type: 'color',
                    enabled: true,
                    required: false,
                    options: [
                        { id: 'black', name: 'Black', value: '#000000' },
                        { id: 'white', name: 'White', value: '#ffffff' },
                        { id: 'silver', name: 'Silver', value: '#c0c0c0' }
                    ]
                }
            ]
        });
        setShowAddForm(true);
        setEditingCategory(null);
    };

    const handleEditCategory = (category) => {
        setNewCategory({ ...category });
        setEditingCategory(category.id);
        setShowAddForm(true);
    };

    const handleSaveCategory = () => {
        if (!newCategory.name.trim()) {
            alert('Category name is required');
            return;
        }

        // Generate slug if not provided
        if (!newCategory.slug) {
            newCategory.slug = newCategory.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }

        const categoryData = {
            ...newCategory,
            id: editingCategory || Date.now(),
            createdAt: editingCategory ? categories.find(c => c.id === editingCategory)?.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        onSave(categoryData, editingCategory ? 'update' : 'create');
        setShowAddForm(false);
        setEditingCategory(null);
    };

    const addSpecificationGroup = () => {
        const newGroup = {
            id: `group_${Date.now()}`,
            name: 'New Group',
            fields: []
        };
        setNewCategory(prev => ({
            ...prev,
            specificationTemplate: {
                ...prev.specificationTemplate,
                groups: [...prev.specificationTemplate.groups, newGroup]
            }
        }));
    };

    const addSpecificationField = (groupId) => {
        const newField = {
            id: `field_${Date.now()}`,
            name: 'New Field',
            type: 'text',
            required: false,
            options: []
        };

        setNewCategory(prev => ({
            ...prev,
            specificationTemplate: {
                ...prev.specificationTemplate,
                groups: prev.specificationTemplate.groups.map(group =>
                    group.id === groupId
                        ? { ...group, fields: [...group.fields, newField] }
                        : group
                )
            }
        }));
    };

    const updateSpecificationGroup = (groupId, field, value) => {
        setNewCategory(prev => ({
            ...prev,
            specificationTemplate: {
                ...prev.specificationTemplate,
                groups: prev.specificationTemplate.groups.map(group =>
                    group.id === groupId ? { ...group, [field]: value } : group
                )
            }
        }));
    };

    const updateSpecificationField = (groupId, fieldId, field, value) => {
        setNewCategory(prev => ({
            ...prev,
            specificationTemplate: {
                ...prev.specificationTemplate,
                groups: prev.specificationTemplate.groups.map(group =>
                    group.id === groupId
                        ? {
                            ...group,
                            fields: group.fields.map(f =>
                                f.id === fieldId ? { ...f, [field]: value } : f
                            )
                        }
                        : group
                )
            }
        }));
    };

    const removeSpecificationGroup = (groupId) => {
        setNewCategory(prev => ({
            ...prev,
            specificationTemplate: {
                ...prev.specificationTemplate,
                groups: prev.specificationTemplate.groups.filter(group => group.id !== groupId)
            }
        }));
    };

    const removeSpecificationField = (groupId, fieldId) => {
        setNewCategory(prev => ({
            ...prev,
            specificationTemplate: {
                ...prev.specificationTemplate,
                groups: prev.specificationTemplate.groups.map(group =>
                    group.id === groupId
                        ? { ...group, fields: group.fields.filter(f => f.id !== fieldId) }
                        : group
                )
            }
        }));
    };

    const addOptionGroup = () => {
        const newOptionGroup = {
            id: `option_${Date.now()}`,
            name: 'New Option',
            type: 'select', // color, select, size, text
            enabled: true,
            required: false,
            options: []
        };
        setNewCategory(prev => ({
            ...prev,
            optionsTemplate: [...prev.optionsTemplate, newOptionGroup]
        }));
    };

    const updateOptionGroup = (optionId, field, value) => {
        setNewCategory(prev => ({
            ...prev,
            optionsTemplate: prev.optionsTemplate.map(option =>
                option.id === optionId ? { ...option, [field]: value } : option
            )
        }));
    };

    const removeOptionGroup = (optionId) => {
        setNewCategory(prev => ({
            ...prev,
            optionsTemplate: prev.optionsTemplate.filter(option => option.id !== optionId)
        }));
    };

    const addOptionValue = (optionId) => {
        const newValue = {
            id: `value_${Date.now()}`,
            name: 'New Value',
            value: ''
        };
        setNewCategory(prev => ({
            ...prev,
            optionsTemplate: prev.optionsTemplate.map(option =>
                option.id === optionId
                    ? { ...option, options: [...option.options, newValue] }
                    : option
            )
        }));
    };

    const updateOptionValue = (optionId, valueId, field, value) => {
        setNewCategory(prev => ({
            ...prev,
            optionsTemplate: prev.optionsTemplate.map(option =>
                option.id === optionId
                    ? {
                        ...option,
                        options: option.options.map(opt =>
                            opt.id === valueId ? { ...opt, [field]: value } : opt
                        )
                    }
                    : option
            )
        }));
    };

    const removeOptionValue = (optionId, valueId) => {
        setNewCategory(prev => ({
            ...prev,
            optionsTemplate: prev.optionsTemplate.map(option =>
                option.id === optionId
                    ? { ...option, options: option.options.filter(opt => opt.id !== valueId) }
                    : option
            )
        }));
    };

    if (showAddForm) {
        return (
            <div className="store-card fill-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="tc-6533 bold-text mb-0">
                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setShowAddForm(false)}
                    >
                        Back to Categories
                    </button>
                </div>

                <div className="row">
                    {/* Basic Information */}
                    <div className="col-12 mb-4">
                        <h5>Basic Information</h5>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Category Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter category name"
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Slug</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newCategory.slug}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                                    placeholder="category-slug (auto-generated if empty)"
                                />
                            </div>
                            <div className="col-12 mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Category description"
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Parent Category</label>
                                <select
                                    className="form-select"
                                    value={newCategory.parentId || ''}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, parentId: e.target.value || null }))}
                                >
                                    <option value="">No Parent (Top Level)</option>
                                    {safeCategories.filter(c => c.id !== editingCategory).map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Sort Order</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={newCategory.sortOrder}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Specification Template */}
                    <div className="col-12 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Specification Template</h5>
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={addSpecificationGroup}
                            >
                                Add Group
                            </button>
                        </div>

                        {newCategory.specificationTemplate.groups.map((group, groupIndex) => (
                            <div key={group.id} className="card mb-3">
                                <div className="card-header">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm w-auto"
                                            value={group.name}
                                            onChange={(e) => updateSpecificationGroup(group.id, 'name', e.target.value)}
                                        />
                                        <div>
                                            <button
                                                className="btn btn-outline-success btn-sm me-2"
                                                onClick={() => addSpecificationField(group.id)}
                                            >
                                                Add Field
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => removeSpecificationGroup(group.id)}
                                            >
                                                Remove Group
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {group.fields.map((field) => (
                                        <div key={field.id} className="row mb-2 align-items-center">
                                            <div className="col-md-3">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={field.name}
                                                    onChange={(e) => updateSpecificationField(group.id, field.id, 'name', e.target.value)}
                                                    placeholder="Field name"
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={field.type}
                                                    onChange={(e) => updateSpecificationField(group.id, field.id, 'type', e.target.value)}
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="select">Select</option>
                                                    <option value="textarea">Textarea</option>
                                                    <option value="boolean">Yes/No</option>
                                                </select>
                                            </div>
                                            <div className="col-md-2">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={field.required}
                                                        onChange={(e) => updateSpecificationField(group.id, field.id, 'required', e.target.checked)}
                                                    />
                                                    <label className="form-check-label">Required</label>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                {field.type === 'select' && (
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="Options (comma separated)"
                                                        value={field.options?.join(', ') || ''}
                                                        onChange={(e) => updateSpecificationField(group.id, field.id, 'options', e.target.value.split(',').map(o => o.trim()).filter(o => o))}
                                                    />
                                                )}
                                            </div>
                                            <div className="col-md-1">
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => removeSpecificationField(group.id, field.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Options Template */}
                    <div className="col-12 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Product Options Template</h5>
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={addOptionGroup}
                            >
                                Add Option Group
                            </button>
                        </div>

                        {newCategory.optionsTemplate.map((optionGroup) => (
                            <div key={optionGroup.id} className="card mb-3">
                                <div className="card-header">
                                    <div className="row align-items-center">
                                        <div className="col-md-3">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={optionGroup.name}
                                                onChange={(e) => updateOptionGroup(optionGroup.id, 'name', e.target.value)}
                                                placeholder="Option name (e.g., Colors, Sizes)"
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select form-select-sm"
                                                value={optionGroup.type}
                                                onChange={(e) => updateOptionGroup(optionGroup.id, 'type', e.target.value)}
                                            >
                                                <option value="color">Color Picker</option>
                                                <option value="select">Dropdown</option>
                                                <option value="size">Size Options</option>
                                                <option value="text">Text Input</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={optionGroup.enabled}
                                                    onChange={(e) => updateOptionGroup(optionGroup.id, 'enabled', e.target.checked)}
                                                />
                                                <label className="form-check-label">Enabled</label>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={optionGroup.required}
                                                    onChange={(e) => updateOptionGroup(optionGroup.id, 'required', e.target.checked)}
                                                />
                                                <label className="form-check-label">Required</label>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-outline-success btn-sm"
                                                    onClick={() => addOptionValue(optionGroup.id)}
                                                >
                                                    Add Value
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => removeOptionGroup(optionGroup.id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {optionGroup.enabled && (
                                    <div className="card-body">
                                        <div className="mb-2">
                                            <small className="text-muted">
                                                {optionGroup.type === 'color' && 'Color options with hex values'}
                                                {optionGroup.type === 'select' && 'Dropdown selection options'}
                                                {optionGroup.type === 'size' && 'Size variants (XS, S, M, L, XL, etc.)'}
                                                {optionGroup.type === 'text' && 'Custom text input field'}
                                            </small>
                                        </div>
                                        {optionGroup.options.map((option) => (
                                            <div key={option.id} className="row mb-2 align-items-center">
                                                <div className="col-md-4">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={option.name}
                                                        onChange={(e) => updateOptionValue(optionGroup.id, option.id, 'name', e.target.value)}
                                                        placeholder={
                                                            optionGroup.type === 'color' ? 'Color name (e.g., Black)' :
                                                                optionGroup.type === 'size' ? 'Size (e.g., Large)' :
                                                                    'Option name'
                                                        }
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    {optionGroup.type === 'color' ? (
                                                        <input
                                                            type="color"
                                                            className="form-control form-control-color form-control-sm"
                                                            value={option.value || '#000000'}
                                                            onChange={(e) => updateOptionValue(optionGroup.id, option.id, 'value', e.target.value)}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            value={option.value}
                                                            onChange={(e) => updateOptionValue(optionGroup.id, option.id, 'value', e.target.value)}
                                                            placeholder={
                                                                optionGroup.type === 'size' ? 'Size code (e.g., L, XL)' :
                                                                    optionGroup.type === 'select' ? 'Option value' :
                                                                        'Value'
                                                            }
                                                        />
                                                    )}
                                                </div>
                                                <div className="col-md-2">
                                                    {optionGroup.type === 'color' && (
                                                        <span className="text-muted">{option.value}</span>
                                                    )}
                                                </div>
                                                <div className="col-md-2">
                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => removeOptionValue(optionGroup.id, option.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {optionGroup.options.length === 0 && (
                                            <div className="text-center py-3 text-muted">
                                                <p>No options added yet. Click "Add Value" to create options for this group.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {newCategory.optionsTemplate.length === 0 && (
                            <div className="alert alert-info">
                                <h6>No Product Options</h6>
                                <p className="mb-0">Click "Add Option Group" to create product options like colors, sizes, storage, etc.</p>
                            </div>
                        )}
                    </div>

                    {/* SEO Settings */}
                    <div className="col-12 mb-4">
                        <h5>SEO Settings</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <label className="form-label">SEO Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newCategory.seoTitle}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, seoTitle: e.target.value }))}
                                    placeholder="SEO title for this category"
                                />
                            </div>
                            <div className="col-12 mb-3">
                                <label className="form-label">SEO Description</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={newCategory.seoDescription}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, seoDescription: e.target.value }))}
                                    placeholder="SEO meta description"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setShowAddForm(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={handleSaveCategory}
                    >
                        {editingCategory ? 'Update Category' : 'Create Category'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="store-card fill-card">
            {/* Header */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
                <div>
                    <h3 className="tc-6533 bold-text mb-1">Category Management</h3>
                    <p className="text-muted mb-0">Manage product categories and their specifications</p>
                </div>
                <button
                    className="btn btn-success btn-rd d-flex align-items-center"
                    onClick={handleAddCategory}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" className="me-2" fill="white">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add New Category
                </button>
            </div>

            {/* Search */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
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

            {/* Categories Grid */}
            <div className="row">
                {filteredCategories.map((category) => (
                    <div key={category.id} className="col-md-6 col-lg-4 mb-4">
                        <div className="card h-100">
                            {category.image && (
                                <img
                                    src={category.image}
                                    className="card-img-top"
                                    alt={category.name}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                            )}
                            <div className="card-body d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h5 className="card-title mb-0">{category.name}</h5>
                                    <span className={`badge ${category.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                        {category.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="card-text text-muted small mb-2">/{category.slug}</p>
                                <p className="card-text flex-grow-1">{category.description}</p>

                                <div className="mb-3">
                                    <small className="text-muted">
                                        Spec Groups: {category.specificationTemplate?.groups?.length || 0} |
                                        Option Groups: {category.optionsTemplate?.length || 0}
                                    </small>
                                    {category.optionsTemplate && category.optionsTemplate.length > 0 && (
                                        <div className="mt-1">
                                            {category.optionsTemplate.filter(opt => opt.enabled).map(option => (
                                                <span key={option.id} className="badge bg-light text-dark me-1">
                                                    {option.name} ({option.options?.length || 0})
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-outline-primary btn-sm flex-fill"
                                        onClick={() => handleEditCategory(category)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => onDelete(category.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCategories.length === 0 && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" />
                    </svg>
                    <h5 className="text-muted">No categories found</h5>
                    <p className="text-muted">Create your first category to get started</p>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;