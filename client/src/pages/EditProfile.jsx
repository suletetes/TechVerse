import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserProfile } from '../context/UserProfileContext';
import { useAuth } from '../context';
import { LoadingSpinner } from '../components/Common';

// Simple debugger for development
const debugLog = (action, data, error) => {
    if (import.meta.env.DEV) {
        const emoji = error ? '❌' : '✅';
        console.log(`${emoji} EDIT_PROFILE - ${action}:`, data, error || '');
    }
};

const EditProfile = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { profile, updateProfile, loading, error } = useUserProfile();
    
    // Get section from URL params (profile, address, payment)
    const activeSection = searchParams.get('section') || 'profile';
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: ''
    });
    
    const [addresses, setAddresses] = useState([
        {
            id: 1,
            type: 'home',
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            isDefault: true
        }
    ]);
    
    const [paymentMethods, setPaymentMethods] = useState([
        {
            id: 1,
            type: 'card',
            cardNumber: '',
            expiryDate: '',
            cardholderName: '',
            isDefault: true
        }
    ]);
    
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Load initial data
    useEffect(() => {
        const userData = profile || user;
        if (userData) {
            debugLog('LOADING_INITIAL_DATA', userData);
            
            let formattedDate = '';
            if (userData.dateOfBirth) {
                try {
                    const date = new Date(userData.dateOfBirth);
                    formattedDate = date.toISOString().split('T')[0];
                } catch (error) {
                    console.warn('Invalid date format:', userData.dateOfBirth);
                }
            }
            
            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                phone: userData.phone || '',
                dateOfBirth: formattedDate
            });
            
            // Load addresses if available
            if (userData.addresses && userData.addresses.length > 0) {
                setAddresses(userData.addresses);
            }
            
            // Load payment methods if available
            if (userData.paymentMethods && userData.paymentMethods.length > 0) {
                setPaymentMethods(userData.paymentMethods);
            }
        }
    }, [user, profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };
    
    const handleAddressChange = (index, field, value) => {
        setAddresses(prev => prev.map((addr, i) => 
            i === index ? { ...addr, [field]: value } : addr
        ));
    };
    
    const handlePaymentChange = (index, field, value) => {
        setPaymentMethods(prev => prev.map((payment, i) => 
            i === index ? { ...payment, [field]: value } : payment
        ));
    };
    
    const addAddress = () => {
        setAddresses(prev => [...prev, {
            id: Date.now(),
            type: 'other',
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            isDefault: false
        }]);
    };
    
    const removeAddress = (index) => {
        if (addresses.length > 1) {
            setAddresses(prev => prev.filter((_, i) => i !== index));
        }
    };
    
    const addPaymentMethod = () => {
        setPaymentMethods(prev => [...prev, {
            id: Date.now(),
            type: 'card',
            cardNumber: '',
            expiryDate: '',
            cardholderName: '',
            isDefault: false
        }]);
    };
    
    const removePaymentMethod = (index) => {
        if (paymentMethods.length > 1) {
            setPaymentMethods(prev => prev.filter((_, i) => i !== index));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (activeSection === 'profile') {
            if (!formData.firstName.trim()) {
                errors.firstName = 'First name is required';
            }
            if (!formData.lastName.trim()) {
                errors.lastName = 'Last name is required';
            }
            if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
                errors.phone = 'Please enter a valid phone number';
            }
        }
        
        if (activeSection === 'address') {
            addresses.forEach((addr, index) => {
                if (!addr.street.trim()) {
                    errors[`address_${index}_street`] = 'Street address is required';
                }
                if (!addr.city.trim()) {
                    errors[`address_${index}_city`] = 'City is required';
                }
            });
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            debugLog('VALIDATION_FAILED', validationErrors, new Error('Form validation failed'));
            return;
        }

        setIsSubmitting(true);
        setSuccessMessage('');
        
        try {
            debugLog('SUBMIT_START', { formData, addresses, paymentMethods });
            
            let updateData = {};
            
            if (activeSection === 'profile') {
                // Only send changed profile fields
                const originalData = profile || user || {};
                const changedFields = {};
                
                Object.keys(formData).forEach(key => {
                    if (formData[key] !== (originalData[key] || '')) {
                        changedFields[key] = formData[key];
                    }
                });
                
                if (Object.keys(changedFields).length === 0) {
                    setSuccessMessage('No changes detected');
                    debugLog('NO_CHANGES', formData);
                    return;
                }
                
                updateData = changedFields;
            } else if (activeSection === 'address') {
                updateData = { addresses };
            } else if (activeSection === 'payment') {
                updateData = { paymentMethods };
            }
            
            debugLog('CHANGED_FIELDS', updateData);
            
            await updateProfile(updateData);
            
            setSuccessMessage(`${activeSection === 'profile' ? 'Profile' : activeSection === 'address' ? 'Addresses' : 'Payment methods'} updated successfully!`);
            debugLog('UPDATE_SUCCESS', updateData);
            
            // Redirect back to profile after 2 seconds
            setTimeout(() => {
                navigate('/profile');
            }, 2000);
            
        } catch (error) {
            debugLog('UPDATE_ERROR', { formData, addresses, paymentMethods }, error);
            console.error('Failed to update:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const renderProfileSection = () => (
        <div className="row">
            <div className="col-md-6 mb-3">
                <label htmlFor="firstName" className="form-label tc-6533">First Name *</label>
                <input
                    type="text"
                    className={`form-control ${validationErrors.firstName ? 'is-invalid' : ''}`}
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                />
                {validationErrors.firstName && (
                    <div className="invalid-feedback">{validationErrors.firstName}</div>
                )}
            </div>
            
            <div className="col-md-6 mb-3">
                <label htmlFor="lastName" className="form-label tc-6533">Last Name *</label>
                <input
                    type="text"
                    className={`form-control ${validationErrors.lastName ? 'is-invalid' : ''}`}
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                />
                {validationErrors.lastName && (
                    <div className="invalid-feedback">{validationErrors.lastName}</div>
                )}
            </div>
            
            <div className="col-md-6 mb-3">
                <label htmlFor="phone" className="form-label tc-6533">Phone Number</label>
                <input
                    type="tel"
                    className={`form-control ${validationErrors.phone ? 'is-invalid' : ''}`}
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                />
                {validationErrors.phone && (
                    <div className="invalid-feedback">{validationErrors.phone}</div>
                )}
            </div>
            
            <div className="col-md-6 mb-3">
                <label htmlFor="dateOfBirth" className="form-label tc-6533">Date of Birth</label>
                <input
                    type="date"
                    className="form-control"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                />
            </div>
        </div>
    );

    const renderAddressSection = () => (
        <div>
            {addresses.map((address, index) => (
                <div key={address.id} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="tc-6533 mb-0">
                            {address.type === 'home' ? '🏠 Home Address' : 
                             address.type === 'work' ? '🏢 Work Address' : 
                             '📍 Other Address'}
                        </h6>
                        {addresses.length > 1 && (
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => removeAddress(index)}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    
                    <div className="row">
                        <div className="col-12 mb-3">
                            <label className="form-label tc-6533">Street Address *</label>
                            <input
                                type="text"
                                className={`form-control ${validationErrors[`address_${index}_street`] ? 'is-invalid' : ''}`}
                                value={address.street}
                                onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                                placeholder="123 Main Street"
                            />
                            {validationErrors[`address_${index}_street`] && (
                                <div className="invalid-feedback">{validationErrors[`address_${index}_street`]}</div>
                            )}
                        </div>
                        
                        <div className="col-md-6 mb-3">
                            <label className="form-label tc-6533">City *</label>
                            <input
                                type="text"
                                className={`form-control ${validationErrors[`address_${index}_city`] ? 'is-invalid' : ''}`}
                                value={address.city}
                                onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                                placeholder="New York"
                            />
                            {validationErrors[`address_${index}_city`] && (
                                <div className="invalid-feedback">{validationErrors[`address_${index}_city`]}</div>
                            )}
                        </div>
                        
                        <div className="col-md-3 mb-3">
                            <label className="form-label tc-6533">State</label>
                            <input
                                type="text"
                                className="form-control"
                                value={address.state}
                                onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
                                placeholder="NY"
                            />
                        </div>
                        
                        <div className="col-md-3 mb-3">
                            <label className="form-label tc-6533">ZIP Code</label>
                            <input
                                type="text"
                                className="form-control"
                                value={address.zipCode}
                                onChange={(e) => handleAddressChange(index, 'zipCode', e.target.value)}
                                placeholder="10001"
                            />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                            <label className="form-label tc-6533">Country</label>
                            <input
                                type="text"
                                className="form-control"
                                value={address.country}
                                onChange={(e) => handleAddressChange(index, 'country', e.target.value)}
                                placeholder="United States"
                            />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                            <label className="form-label tc-6533">Address Type</label>
                            <select
                                className="form-select"
                                value={address.type}
                                onChange={(e) => handleAddressChange(index, 'type', e.target.value)}
                            >
                                <option value="home">Home</option>
                                <option value="work">Work</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>
            ))}
            
            <button
                type="button"
                className="btn btn-outline-primary"
                onClick={addAddress}
            >
                + Add Another Address
            </button>
        </div>
    );

    const renderPaymentSection = () => (
        <div>
            {paymentMethods.map((payment, index) => (
                <div key={payment.id} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="tc-6533 mb-0">💳 Payment Method {index + 1}</h6>
                        {paymentMethods.length > 1 && (
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => removePaymentMethod(index)}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    
                    <div className="row">
                        <div className="col-12 mb-3">
                            <label className="form-label tc-6533">Cardholder Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={payment.cardholderName}
                                onChange={(e) => handlePaymentChange(index, 'cardholderName', e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        
                        <div className="col-md-8 mb-3">
                            <label className="form-label tc-6533">Card Number</label>
                            <input
                                type="text"
                                className="form-control"
                                value={payment.cardNumber}
                                onChange={(e) => handlePaymentChange(index, 'cardNumber', e.target.value)}
                                placeholder="**** **** **** 1234"
                                maxLength="19"
                            />
                        </div>
                        
                        <div className="col-md-4 mb-3">
                            <label className="form-label tc-6533">Expiry Date</label>
                            <input
                                type="text"
                                className="form-control"
                                value={payment.expiryDate}
                                onChange={(e) => handlePaymentChange(index, 'expiryDate', e.target.value)}
                                placeholder="MM/YY"
                                maxLength="5"
                            />
                        </div>
                    </div>
                </div>
            ))}
            
            <button
                type="button"
                className="btn btn-outline-primary"
                onClick={addPaymentMethod}
            >
                + Add Another Payment Method
            </button>
        </div>
    );

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="edit-profile-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    <div className="col-12 mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="tc-6533 bold-text">
                                    Edit {activeSection === 'profile' ? 'Profile' : 
                                          activeSection === 'address' ? 'Addresses' : 
                                          'Payment Methods'}
                                </h1>
                                <p className="tc-6533">Update your {activeSection} information</p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => navigate('/profile')}
                            >
                                ← Back to Profile
                            </button>
                        </div>
                    </div>
                    
                    {/* Section Navigation */}
                    <div className="col-12 mb-4">
                        <div className="nav nav-pills justify-content-center">
                            <button
                                className={`nav-link ${activeSection === 'profile' ? 'active' : ''}`}
                                onClick={() => navigate('/profile/edit?section=profile')}
                            >
                                👤 Personal Info
                            </button>
                            <button
                                className={`nav-link ${activeSection === 'address' ? 'active' : ''}`}
                                onClick={() => navigate('/profile/edit?section=address')}
                            >
                                📍 Addresses
                            </button>
                            <button
                                className={`nav-link ${activeSection === 'payment' ? 'active' : ''}`}
                                onClick={() => navigate('/profile/edit?section=payment')}
                            >
                                💳 Payment Methods
                            </button>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="store-card fill-card">
                            {error && (
                                <div className="alert alert-danger">
                                    <strong>Error:</strong> {error}
                                </div>
                            )}
                            
                            {successMessage && (
                                <div className="alert alert-success">
                                    <strong>Success:</strong> {successMessage}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {activeSection === 'profile' && renderProfileSection()}
                                {activeSection === 'address' && renderAddressSection()}
                                {activeSection === 'payment' && renderPaymentSection()}

                                <div className="d-flex justify-content-between mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => navigate('/profile')}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-c-2101 btn-rd"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <LoadingSpinner size="sm" className="me-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            `Save ${activeSection === 'profile' ? 'Profile' : 
                                                   activeSection === 'address' ? 'Addresses' : 
                                                   'Payment Methods'}`
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;