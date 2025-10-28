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
        email: '',
        phone: '',
        gender: 'prefer-not-to-say',
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
                email: userData.email || '',
                phone: userData.phone || '',
                gender: userData.gender || 'prefer-not-to-say',
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
                    const currentValue = formData[key] || '';
                    const originalValue = originalData[key] || '';
                    
                    // Compare trimmed values to avoid whitespace issues
                    if (currentValue.toString().trim() !== originalValue.toString().trim()) {
                        changedFields[key] = currentValue;
                    }
                });
                
                // Always include required fields even if they haven't changed
                if (Object.keys(changedFields).length === 0) {
                    // If no changes detected, still send core profile fields to ensure update works
                    changedFields.firstName = formData.firstName;
                    changedFields.lastName = formData.lastName;
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
                <label htmlFor="email" className="form-label tc-6533">Email Address *</label>
                <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    title="Email cannot be changed for security reasons"
                />
                <div className="form-text">
                    <i className="fas fa-info-circle me-1"></i>
                    Email cannot be changed for security reasons
                </div>
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
                <label htmlFor="gender" className="form-label tc-6533">Gender</label>
                <select
                    className="form-select"
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                >
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
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
        <div className="address-section">
            <div className="row">
                {addresses.map((address, index) => (
                    <div key={address.id} className="col-12 mb-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="d-flex align-items-center">
                                        <div className={`bg-${address.type === 'home' ? 'primary' : address.type === 'work' ? 'info' : 'success'} bg-opacity-10 rounded-circle p-2 me-3`}>
                                            <i className={`fas ${address.type === 'home' ? 'fa-home' : 
                                                               address.type === 'work' ? 'fa-building' : 
                                                               'fa-map-marker-alt'} text-${address.type === 'home' ? 'primary' : address.type === 'work' ? 'info' : 'success'}`}></i>
                                        </div>
                                        <div>
                                            <h6 className="tc-6533 mb-0">
                                                {address.type === 'home' ? 'Home Address' : 
                                                 address.type === 'work' ? 'Work Address' : 
                                                 'Other Address'}
                                            </h6>
                                            <small className="text-muted">Address {index + 1}</small>
                                        </div>
                                    </div>
                                    {addresses.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => removeAddress(index)}
                                        >
                                            <i className="fas fa-trash me-1"></i>Remove
                                        </button>
                                    )}
                                </div>
                                
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-road me-2"></i>Street Address *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${validationErrors[`address_${index}_street`] ? 'is-invalid' : ''}`}
                                            value={address.street}
                                            onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                                            placeholder="123 Main Street, Apt 4B"
                                        />
                                        {validationErrors[`address_${index}_street`] && (
                                            <div className="invalid-feedback">{validationErrors[`address_${index}_street`]}</div>
                                        )}
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-city me-2"></i>City *
                                        </label>
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
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-map me-2"></i>State
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={address.state}
                                            onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
                                            placeholder="NY"
                                        />
                                    </div>
                                    
                                    <div className="col-md-3 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-mail-bulk me-2"></i>ZIP Code
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={address.zipCode}
                                            onChange={(e) => handleAddressChange(index, 'zipCode', e.target.value)}
                                            placeholder="10001"
                                        />
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-globe me-2"></i>Country
                                        </label>
                                        <select
                                            className="form-select"
                                            value={address.country}
                                            onChange={(e) => handleAddressChange(index, 'country', e.target.value)}
                                        >
                                            <option value="">Select Country</option>
                                            <option value="United States">United States</option>
                                            <option value="Canada">Canada</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                            <option value="Australia">Australia</option>
                                            <option value="Germany">Germany</option>
                                            <option value="France">France</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-tag me-2"></i>Address Type
                                        </label>
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
                                    
                                    <div className="col-12">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`default_${index}`}
                                                checked={address.isDefault}
                                                onChange={(e) => {
                                                    // Set this as default and unset others
                                                    if (e.target.checked) {
                                                        setAddresses(prev => prev.map((addr, i) => ({
                                                            ...addr,
                                                            isDefault: i === index
                                                        })));
                                                    }
                                                }}
                                            />
                                            <label className="form-check-label" htmlFor={`default_${index}`}>
                                                <i className="fas fa-star me-1"></i>Set as default address
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="text-center mt-3">
                <button
                    type="button"
                    className="btn btn-outline-primary btn-lg"
                    onClick={addAddress}
                >
                    <i className="fas fa-plus me-2"></i>Add Another Address
                </button>
            </div>
        </div>
    );

    const renderPaymentSection = () => (
        <div className="payment-section">
            <div className="row">
                {paymentMethods.map((payment, index) => (
                    <div key={payment.id} className="col-12 mb-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-success bg-opacity-10 rounded p-2 me-3">
                                            <i className="fas fa-credit-card text-success fs-4"></i>
                                        </div>
                                        <div>
                                            <h6 className="tc-6533 mb-0">Payment Method {index + 1}</h6>
                                            <small className="text-muted">Credit/Debit Card</small>
                                        </div>
                                    </div>
                                    {paymentMethods.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => removePaymentMethod(index)}
                                        >
                                            <i className="fas fa-trash me-1"></i>Remove
                                        </button>
                                    )}
                                </div>
                                
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-user me-2"></i>Cardholder Name *
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={payment.cardholderName}
                                            onChange={(e) => handlePaymentChange(index, 'cardholderName', e.target.value)}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    
                                    <div className="col-md-8 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-credit-card me-2"></i>Card Number *
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={payment.cardNumber}
                                            onChange={(e) => {
                                                // Format card number with spaces
                                                let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                                                value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                                                if (value.length <= 19) {
                                                    handlePaymentChange(index, 'cardNumber', value);
                                                }
                                            }}
                                            placeholder="1234 5678 9012 3456"
                                            maxLength="19"
                                        />
                                    </div>
                                    
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-calendar-alt me-2"></i>Expiry Date *
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={payment.expiryDate}
                                            onChange={(e) => {
                                                // Format expiry date MM/YY
                                                let value = e.target.value.replace(/\D/g, '');
                                                if (value.length >= 2) {
                                                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                                }
                                                handlePaymentChange(index, 'expiryDate', value);
                                            }}
                                            placeholder="MM/YY"
                                            maxLength="5"
                                        />
                                    </div>
                                    
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-lock me-2"></i>CVV *
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={payment.cvv || ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                if (value.length <= 4) {
                                                    handlePaymentChange(index, 'cvv', value);
                                                }
                                            }}
                                            placeholder="123"
                                            maxLength="4"
                                        />
                                    </div>
                                    
                                    <div className="col-md-8 mb-3">
                                        <label className="form-label tc-6533">
                                            <i className="fas fa-map-marker-alt me-2"></i>Billing Address
                                        </label>
                                        <select
                                            className="form-select"
                                            value={payment.billingAddress || ''}
                                            onChange={(e) => handlePaymentChange(index, 'billingAddress', e.target.value)}
                                        >
                                            <option value="">Same as shipping address</option>
                                            {addresses.map((addr, addrIndex) => (
                                                <option key={addrIndex} value={addrIndex}>
                                                    {addr.type === 'home' ? 'Home' : addr.type === 'work' ? 'Work' : 'Other'} - {addr.street}, {addr.city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="col-12">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`defaultPayment_${index}`}
                                                checked={payment.isDefault}
                                                onChange={(e) => {
                                                    // Set this as default and unset others
                                                    if (e.target.checked) {
                                                        setPaymentMethods(prev => prev.map((pm, i) => ({
                                                            ...pm,
                                                            isDefault: i === index
                                                        })));
                                                    }
                                                }}
                                            />
                                            <label className="form-check-label" htmlFor={`defaultPayment_${index}`}>
                                                <i className="fas fa-star me-1"></i>Set as default payment method
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-3 p-3 bg-light rounded">
                                    <div className="d-flex align-items-center text-muted small">
                                        <i className="fas fa-shield-alt me-2 text-success"></i>
                                        Your payment information is encrypted and secure
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="text-center mt-3">
                <button
                    type="button"
                    className="btn btn-outline-primary btn-lg me-3"
                    onClick={addPaymentMethod}
                >
                    <i className="fas fa-plus me-2"></i>Add Credit/Debit Card
                </button>
                <button
                    type="button"
                    className="btn btn-outline-info btn-lg"
                    onClick={() => {
                        // Add PayPal integration here
                        alert('PayPal integration coming soon!');
                    }}
                >
                    <i className="fab fa-paypal me-2"></i>Add PayPal
                </button>
            </div>
            
            <div className="row mt-4">
                <div className="col-12">
                    <div className="alert alert-info border-0">
                        <div className="d-flex align-items-center">
                            <i className="fas fa-info-circle me-3 fs-5"></i>
                            <div>
                                <h6 className="alert-heading mb-1">Payment Security</h6>
                                <p className="mb-0 small">We use industry-standard encryption to protect your payment details. Your card information is never stored on our servers and is processed securely through our payment partners.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
                                <i className="fas fa-user me-2"></i>Personal Info
                            </button>
                            <button
                                className={`nav-link ${activeSection === 'address' ? 'active' : ''}`}
                                onClick={() => navigate('/profile/edit?section=address')}
                            >
                                <i className="fas fa-map-marker-alt me-2"></i>Addresses
                            </button>
                            <button
                                className={`nav-link ${activeSection === 'payment' ? 'active' : ''}`}
                                onClick={() => navigate('/profile/edit?section=payment')}
                            >
                                <i className="fas fa-credit-card me-2"></i>Payment Methods
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