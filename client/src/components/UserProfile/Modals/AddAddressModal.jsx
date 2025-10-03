import React, { useState } from 'react';

const AddAddressModal = ({ onClose, onSave, editingAddress = null }) => {
    const [formData, setFormData] = useState({
        type: editingAddress?.type || 'Home',
        name: editingAddress?.name || '',
        address: editingAddress?.address || '',
        city: editingAddress?.city || '',
        postcode: editingAddress?.postcode || '',
        country: editingAddress?.country || 'United Kingdom',
        isDefault: editingAddress?.isDefault || false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addressTypes = ['Home', 'Work', 'Office', 'Other'];
    const countries = [
        'United Kingdom',
        'United States',
        'Canada',
        'Australia',
        'Germany',
        'France',
        'Spain',
        'Italy',
        'Netherlands',
        'Ireland'
    ];

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!formData.postcode.trim()) {
            newErrors.postcode = 'Postcode is required';
        } else if (formData.country === 'United Kingdom') {
            // Basic UK postcode validation
            const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
            if (!ukPostcodeRegex.test(formData.postcode)) {
                newErrors.postcode = 'Please enter a valid UK postcode';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const addressData = {
                ...formData,
                id: editingAddress?.id || Date.now(), // In real app, this would come from API
                name: formData.name.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                postcode: formData.postcode.trim().toUpperCase()
            };

            onSave(addressData);
            onClose();
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Failed to save address. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-0 pb-0">
                        <div>
                            <h5 className="modal-title fw-bold">
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h5>
                            <p className="text-muted mb-0">
                                {editingAddress ? 'Update your address details' : 'Add a new delivery address to your account'}
                            </p>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="row">
                                {/* Address Type */}
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="type" className="form-label fw-bold">Address Type</label>
                                    <select
                                        id="type"
                                        name="type"
                                        className="form-select"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                    >
                                        {addressTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Full Name */}
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="name" className="form-label fw-bold">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>

                                {/* Address */}
                                <div className="col-12 mb-3">
                                    <label htmlFor="address" className="form-label fw-bold">Street Address *</label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Enter street address"
                                    />
                                    {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                                </div>

                                {/* City */}
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="city" className="form-label fw-bold">City *</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Enter city"
                                    />
                                    {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                                </div>

                                {/* Postcode */}
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="postcode" className="form-label fw-bold">Postcode *</label>
                                    <input
                                        type="text"
                                        id="postcode"
                                        name="postcode"
                                        className={`form-control ${errors.postcode ? 'is-invalid' : ''}`}
                                        value={formData.postcode}
                                        onChange={handleInputChange}
                                        placeholder="Enter postcode"
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                    {errors.postcode && <div className="invalid-feedback">{errors.postcode}</div>}
                                </div>

                                {/* Country */}
                                <div className="col-12 mb-3">
                                    <label htmlFor="country" className="form-label fw-bold">Country</label>
                                    <select
                                        id="country"
                                        name="country"
                                        className="form-select"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                    >
                                        {countries.map(country => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Default Address */}
                                <div className="col-12">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            name="isDefault"
                                            className="form-check-input"
                                            checked={formData.isDefault}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="isDefault" className="form-check-label">
                                            Set as default address
                                        </label>
                                    </div>
                                    <small className="text-muted">
                                        This address will be used as your default delivery address
                                    </small>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer border-0 pt-0">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {editingAddress ? 'Updating...' : 'Adding...'}
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17,21 17,13 7,13 7,21" />
                                            <polyline points="7,3 7,8 15,8" />
                                        </svg>
                                        {editingAddress ? 'Update Address' : 'Save Address'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddAddressModal;