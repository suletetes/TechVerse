import React, { useState } from 'react';

const AdminSpecificationManager = ({ 
    categories = [],
    specifications = {},
    onSaveSpecifications,
    onUpdateCategory
}) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [activeSpecGroup, setActiveSpecGroup] = useState('');
    const [showAddGroup, setShowAddGroup] = useState(false);
    const [showAddSpec, setShowAddSpec] = useState(false);

    // Default specification template
    const defaultSpecGroups = {
        "Display & Design": [
            { id: 'display_size', label: 'Display Size', type: 'text', required: true, highlight: true },
            { id: 'resolution', label: 'Resolution', type: 'text', required: true },
            { id: 'display_tech', label: 'Display Technology', type: 'text', required: false },
            { id: 'brightness', label: 'Brightness', type: 'text', required: false },
            { id: 'dimensions', label: 'Dimensions', type: 'text', required: true },
            { id: 'weight', label: 'Weight', type: 'text', required: true },
            { id: 'colors', label: 'Available Colors', type: 'text', required: false }
        ],
        "Performance": [
            { id: 'processor', label: 'Processor', type: 'text', required: true, highlight: true },
            { id: 'cpu', label: 'CPU', type: 'text', required: false },
            { id: 'gpu', label: 'GPU', type: 'text', required: false },
            { id: 'memory', label: 'Memory/RAM', type: 'text', required: true },
            { id: 'storage', label: 'Storage Options', type: 'text', required: true }
        ],
        "Connectivity": [
            { id: 'wifi', label: 'Wi-Fi', type: 'text', required: true, highlight: true },
            { id: 'bluetooth', label: 'Bluetooth', type: 'text', required: false },
            { id: 'cellular', label: 'Cellular', type: 'text', required: false },
            { id: 'ports', label: 'Ports & Connectors', type: 'text', required: false }
        ],
        "Battery & Power": [
            { id: 'battery_life', label: 'Battery Life', type: 'text', required: true, highlight: true },
            { id: 'charging', label: 'Charging', type: 'text', required: false },
            { id: 'power_adapter', label: 'Power Adapter', type: 'text', required: false }
        ]
    };

    const [newSpecGroup, setNewSpecGroup] = useState({
        name: '',
        specifications: []
    });

    const [newSpecification, setNewSpecification] = useState({
        id: '',
        label: '',
        type: 'text',
        required: false,
        highlight: false,
        options: []
    });

    const getCurrentSpecs = () => {
        if (!selectedCategory) return {};
        return specifications[selectedCategory] || defaultSpecGroups;
    };

    const handleAddSpecGroup = () => {
        if (!newSpecGroup.name || !selectedCategory) return;
        
        const currentSpecs = getCurrentSpecs();
        const updatedSpecs = {
            ...currentSpecs,
            [newSpecGroup.name]: newSpecGroup.specifications
        };

        onSaveSpecifications(selectedCategory, updatedSpecs);
        setNewSpecGroup({ name: '', specifications: [] });
        setShowAddGroup(false);
    };

    const handleAddSpecification = () => {
        if (!newSpecification.label || !activeSpecGroup) return;

        const currentSpecs = getCurrentSpecs();
        const updatedSpecs = {
            ...currentSpecs,
            [activeSpecGroup]: [
                ...(currentSpecs[activeSpecGroup] || []),
                {
                    ...newSpecification,
                    id: newSpecification.id || newSpecification.label.toLowerCase().replace(/\s+/g, '_')
                }
            ]
        };

        onSaveSpecifications(selectedCategory, updatedSpecs);
        setNewSpecification({
            id: '',
            label: '',
            type: 'text',
            required: false,
            highlight: false,
            options: []
        });
        setShowAddSpec(false);
    };

    const handleDeleteSpecGroup = (groupName) => {
        if (!window.confirm(`Are you sure you want to delete the "${groupName}" specification group?`)) return;

        const currentSpecs = getCurrentSpecs();
        const updatedSpecs = { ...currentSpecs };
        delete updatedSpecs[groupName];

        onSaveSpecifications(selectedCategory, updatedSpecs);
    };

    const handleDeleteSpecification = (groupName, specIndex) => {
        const currentSpecs = getCurrentSpecs();
        const updatedSpecs = {
            ...currentSpecs,
            [groupName]: currentSpecs[groupName].filter((_, index) => index !== specIndex)
        };

        onSaveSpecifications(selectedCategory, updatedSpecs);
    };

    return (
        <div className="specification-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="tc-6533 fw-bold mb-0">Specification Manager</h4>
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setShowAddGroup(true)}
                        disabled={!selectedCategory}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        Add Spec Group
                    </button>
                </div>
            </div>

            {/* Category Selection */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <label className="form-label fw-semibold">Select Category</label>
                    <select 
                        className="form-select"
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setActiveSpecGroup('');
                        }}
                    >
                        <option value="">Choose a category...</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.name}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedCategory && (
                <div className="specifications-content">
                    <div className="row">
                        {/* Specification Groups List */}
                        <div className="col-md-4">
                            <div className="card">
                                <div className="card-header">
                                    <h6 className="mb-0">Specification Groups</h6>
                                </div>
                                <div className="card-body p-0">
                                    <div className="list-group list-group-flush">
                                        {Object.keys(getCurrentSpecs()).map(groupName => (
                                            <div 
                                                key={groupName}
                                                className={`list-group-item d-flex justify-content-between align-items-center ${
                                                    activeSpecGroup === groupName ? 'active' : ''
                                                }`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setActiveSpecGroup(groupName)}
                                            >
                                                <div>
                                                    <div className="fw-medium">{groupName}</div>
                                                    <small className="text-muted">
                                                        {getCurrentSpecs()[groupName]?.length || 0} specifications
                                                    </small>
                                                </div>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSpecGroup(groupName);
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Specifications Detail */}
                        <div className="col-md-8">
                            {activeSpecGroup ? (
                                <div className="card">
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">{activeSpecGroup} Specifications</h6>
                                        <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={() => setShowAddSpec(true)}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                            </svg>
                                            Add Specification
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Label</th>
                                                        <th>Type</th>
                                                        <th>Required</th>
                                                        <th>Highlight</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(getCurrentSpecs()[activeSpecGroup] || []).map((spec, index) => (
                                                        <tr key={spec.id}>
                                                            <td>
                                                                <div className="fw-medium">{spec.label}</div>
                                                                <small className="text-muted">ID: {spec.id}</small>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-secondary">{spec.type}</span>
                                                            </td>
                                                            <td>
                                                                {spec.required ? (
                                                                    <span className="badge bg-warning">Required</span>
                                                                ) : (
                                                                    <span className="badge bg-light text-dark">Optional</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {spec.highlight ? (
                                                                    <span className="badge bg-primary">Highlighted</span>
                                                                ) : (
                                                                    <span className="badge bg-light text-dark">Normal</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleDeleteSpecification(activeSpecGroup, index)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card">
                                    <div className="card-body text-center text-muted">
                                        <svg width="48" height="48" viewBox="0 0 24 24" className="mb-3">
                                            <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                                        </svg>
                                        <p>Select a specification group to view and edit specifications</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Specification Group Modal */}
            {showAddGroup && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Specification Group</h5>
                                <button 
                                    className="btn-close"
                                    onClick={() => setShowAddGroup(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Group Name</label>
                                    <input 
                                        type="text"
                                        className="form-control"
                                        value={newSpecGroup.name}
                                        onChange={(e) => setNewSpecGroup({
                                            ...newSpecGroup,
                                            name: e.target.value
                                        })}
                                        placeholder="e.g., Camera & Audio"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddGroup(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleAddSpecGroup}
                                >
                                    Add Group
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Specification Modal */}
            {showAddSpec && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Specification</h5>
                                <button 
                                    className="btn-close"
                                    onClick={() => setShowAddSpec(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Specification Label</label>
                                    <input 
                                        type="text"
                                        className="form-control"
                                        value={newSpecification.label}
                                        onChange={(e) => setNewSpecification({
                                            ...newSpecification,
                                            label: e.target.value,
                                            id: e.target.value.toLowerCase().replace(/\s+/g, '_')
                                        })}
                                        placeholder="e.g., Display Size"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Field ID</label>
                                    <input 
                                        type="text"
                                        className="form-control"
                                        value={newSpecification.id}
                                        onChange={(e) => setNewSpecification({
                                            ...newSpecification,
                                            id: e.target.value
                                        })}
                                        placeholder="e.g., display_size"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Field Type</label>
                                    <select 
                                        className="form-select"
                                        value={newSpecification.type}
                                        onChange={(e) => setNewSpecification({
                                            ...newSpecification,
                                            type: e.target.value
                                        })}
                                    >
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="select">Select</option>
                                        <option value="textarea">Textarea</option>
                                    </select>
                                </div>
                                <div className="row">
                                    <div className="col-6">
                                        <div className="form-check">
                                            <input 
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={newSpecification.required}
                                                onChange={(e) => setNewSpecification({
                                                    ...newSpecification,
                                                    required: e.target.checked
                                                })}
                                            />
                                            <label className="form-check-label">Required</label>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-check">
                                            <input 
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={newSpecification.highlight}
                                                onChange={(e) => setNewSpecification({
                                                    ...newSpecification,
                                                    highlight: e.target.checked
                                                })}
                                            />
                                            <label className="form-check-label">Highlight</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddSpec(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleAddSpecification}
                                >
                                    Add Specification
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSpecificationManager;