import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../context';
import userService from '../api/services/userService';
import orderService from '../api/services/orderService';
import { LoadingSpinner, Toast } from '../components/Common';

const PaymentPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { items: cartItems, total: cartTotal, itemCount, clearCart } = useCart();
    
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [toast, setToast] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // User data from database
    const [userData, setUserData] = useState({
        profile: null,
        addresses: [],
        paymentMethods: []
    });
    
    const [formData, setFormData] = useState({
        // Billing Info
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        
        // Shipping Address
        address: '',
        city: '',
        postcode: '',
        country: 'United Kingdom',
        
        // Payment Info
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardName: '',
        
        // Options
        sameAsBilling: true,
        savePayment: false,
        newsletter: false
    });

    // Load user data from database
    useEffect(() => {
        const loadUserData = async () => {
            if (!isAuthenticated) {
                navigate('/login', {
                    state: {
                        from: { pathname: '/payment' },
                        message: 'Please login to proceed with checkout'
                    }
                });
                return;
            }

            // Check if cart is empty
            if (!cartItems || cartItems.length === 0) {
                setToast({
                    message: 'Your cart is empty',
                    type: 'warning'
                });
                setTimeout(() => navigate('/cart'), 2000);
                return;
            }

            try {
                setIsLoading(true);
                
                // Load user profile, addresses, and payment methods
                const [profileResponse, addressesResponse, paymentMethodsResponse] = await Promise.all([
                    userService.getProfile(),
                    userService.getAddresses(),
                    userService.getPaymentMethods()
                ]);

                console.log('Profile response:', profileResponse);
                console.log('Addresses response:', addressesResponse);
                console.log('Payment methods response:', paymentMethodsResponse);

                // Extract data from responses (handle nested data structure)
                // Profile: {success: true, data: {user: {...}}}
                // Addresses: {success: true, data: {addresses: [...]}}
                // Payment Methods: {success: true, data: {paymentMethods: [...]}}
                const profile = profileResponse?.data?.user || profileResponse?.data;
                const addresses = addressesResponse?.data?.addresses || [];
                const paymentMethods = paymentMethodsResponse?.data?.paymentMethods || [];

                console.log('Extracted profile:', profile);
                console.log('Extracted addresses:', addresses);
                console.log('Extracted payment methods:', paymentMethods);

                setUserData({
                    profile: profile,
                    addresses: Array.isArray(addresses) ? addresses : [],
                    paymentMethods: Array.isArray(paymentMethods) ? paymentMethods : []
                });

                // Show import options if user has saved data
                if ((Array.isArray(addresses) && addresses.length > 0) || 
                    (Array.isArray(paymentMethods) && paymentMethods.length > 0)) {
                    setShowImportOptions(true);
                }

                // Don't auto-fill - let user click import button
                console.log('User data loaded. Click import to fill fields.');

            } catch (error) {
                console.error('Error loading user data:', error);
                setToast({
                    message: 'Failed to load user data. Please try again.',
                    type: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [isAuthenticated, navigate, cartItems]);

    // Calculate totals from cart
    const subtotal = cartTotal || 0;
    const shipping = 0; // Free shipping
    const tax = subtotal * 0.2; // 20% VAT
    const total = subtotal + shipping + tax;

    // Import user profile data
    const importProfileData = () => {
        if (userData.profile) {
            setFormData(prev => ({
                ...prev,
                firstName: userData.profile.firstName || '',
                lastName: userData.profile.lastName || '',
                email: userData.profile.email || '',
                phone: userData.profile.phone || ''
            }));
            setToast({
                message: 'Profile information imported successfully!',
                type: 'success'
            });
            setShowImportOptions(false);
        }
    };

    // Import selected address
    const importAddress = (addressId) => {
        const address = userData.addresses.find(addr => addr._id === addressId);
        if (address) {
            setFormData(prev => ({
                ...prev,
                address: address.address || '',
                city: address.city || '',
                postcode: address.postcode || '',
                country: address.country || 'United Kingdom'
            }));
            setToast({
                message: `${address.type} address imported successfully!`,
                type: 'success'
            });
        }
        setSelectedAddress('');
    };

    // Import selected payment method
    const importPaymentMethod = (methodId) => {
        const method = userData.paymentMethods.find(pm => pm._id === methodId);
        if (method) {
            setFormData(prev => ({
                ...prev,
                cardNumber: `•••• •••• •••• ${method.cardLast4}`,
                expiryDate: `${method.expiryMonth.toString().padStart(2, '0')}/${method.expiryYear.toString().slice(-2)}`,
                cardName: method.cardholderName || '',
                cvv: '' // CVV should always be re-entered for security
            }));
            setToast({
                message: `${method.cardBrand?.toUpperCase() || 'Card'} imported successfully! Please re-enter CVV for security.`,
                type: 'info'
            });
        }
        setSelectedPaymentMethod('');
    };

    // Clear all form data
    const clearFormData = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            postcode: '',
            country: 'United Kingdom',
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            cardName: '',
            sameAsBilling: true,
            savePayment: false,
            newsletter: false
        });
        setToast({
            message: 'All form data cleared!',
            type: 'info'
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            setToast({
                message: 'Please fill in all contact information',
                type: 'error'
            });
            return;
        }

        if (!formData.address || !formData.city || !formData.postcode || !formData.country) {
            setToast({
                message: 'Please fill in all shipping address fields',
                type: 'error'
            });
            return;
        }

        if (paymentMethod === 'card') {
            if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardName) {
                setToast({
                    message: 'Please fill in all payment details',
                    type: 'error'
                });
                return;
            }
        }

        try {
            setIsProcessing(true);

            // Prepare order data
            const orderData = {
                items: cartItems.map(item => ({
                    productId: item.product?._id || item._id,
                    name: item.product?.name || item.name,
                    price: item.price,
                    quantity: item.quantity,
                    variants: item.options ? Object.entries(item.options).map(([name, value]) => ({ name, value })) : [],
                    image: item.product?.primaryImage?.url || item.product?.images?.[0]?.url || item.image
                })),
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.address,
                    city: formData.city,
                    postcode: formData.postcode,
                    country: formData.country,
                    phone: formData.phone
                },
                billingAddress: formData.sameAsBilling ? {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.address,
                    city: formData.city,
                    postcode: formData.postcode,
                    country: formData.country,
                    phone: formData.phone
                } : null,
                paymentMethod: {
                    method: paymentMethod,
                    amount: total
                },
                subtotal,
                tax,
                shipping: {
                    cost: shipping,
                    method: 'Standard Delivery'
                },
                total
            };

            // Create order
            const response = await orderService.createOrder(orderData);

            if (response.success) {
                // Clear cart
                await clearCart();

                setToast({
                    message: 'Order placed successfully!',
                    type: 'success'
                });

                // Redirect to order confirmation
                setTimeout(() => {
                    navigate(`/order-confirmation/${response.data.orderNumber}`);
                }, 1500);
            }
        } catch (error) {
            console.error('Error processing order:', error);
            setToast({
                message: error.message || 'Failed to process order. Please try again.',
                type: 'error'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc" id="payment-loading">
                <div className="container bloc-md bloc-lg-md">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <LoadingSpinner size="lg" />
                        <div className="ms-3">
                            <p className="tc-6533">Loading checkout...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="payment-bloc">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    action={toast.action}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 2000 }}>
                    <div className="bg-white rounded p-4 text-center">
                        <LoadingSpinner size="lg" />
                        <p className="tc-6533 mt-3 mb-0">Processing your order...</p>
                    </div>
                </div>
            )}

            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Import Options Panel */}
                    {showImportOptions && (
                        <div className="col-12 mb-4">
                            <div className="store-card fill-card border-primary">
                                <h5 className="tc-6533 bold-text mb-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                    </svg>
                                    Import Your Saved Information
                                </h5>
                                
                                <div className="row">
                                    {/* Import Profile */}
                                    <div className="col-md-4 mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <h6 className="tc-6533 mb-2">Profile Information</h6>
                                            <p className="small text-muted mb-3">
                                                Import your name, email, and phone number
                                            </p>
                                            <div className="mb-3">
                                                <small className="text-muted d-block">Preview:</small>
                                                <small className="tc-6533">
                                                    {userData.profile.firstName} {userData.profile.lastName}<br />
                                                    {userData.profile.email}
                                                </small>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm w-100"
                                                onClick={importProfileData}
                                            >
                                                Import Profile
                                            </button>
                                        </div>
                                    </div>

                                    {/* Import Address */}
                                    <div className="col-md-4 mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <h6 className="tc-6533 mb-2">Saved Addresses</h6>
                                            <p className="small text-muted mb-3">
                                                Choose from your saved addresses
                                            </p>
                                            <select
                                                className="form-select form-select-sm mb-3"
                                                value={selectedAddress}
                                                onChange={(e) => setSelectedAddress(e.target.value)}
                                            >
                                                <option value="">Select an address...</option>
                                                {userData.addresses.map((address) => (
                                                    <option key={address._id} value={address._id}>
                                                        {address.type} - {address.city}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm w-100"
                                                onClick={() => importAddress(selectedAddress)}
                                                disabled={!selectedAddress}
                                            >
                                                Import Address
                                            </button>
                                        </div>
                                    </div>

                                    {/* Import Payment Method */}
                                    <div className="col-md-4 mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <h6 className="tc-6533 mb-2">Saved Payment Methods</h6>
                                            <p className="small text-muted mb-3">
                                                Use a saved payment method
                                            </p>
                                            <select
                                                className="form-select form-select-sm mb-3"
                                                value={selectedPaymentMethod}
                                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                            >
                                                <option value="">Select a payment method...</option>
                                                {userData.paymentMethods.map((method) => (
                                                    <option key={method._id} value={method._id}>
                                                        {method.cardBrand?.toUpperCase() || 'Card'} •••• {method.cardLast4}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm w-100"
                                                onClick={() => importPaymentMethod(selectedPaymentMethod)}
                                                disabled={!selectedPaymentMethod}
                                            >
                                                Import Payment
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => setShowImportOptions(false)}
                                    >
                                        Close Import Options
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        {/* Checkout Form */}
                        <div className="col-lg-8 mb-4 mb-lg-0">
                            {/* Quick Import Button */}
                            {(userData.addresses.length > 0 || userData.paymentMethods.length > 0) && (
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        className={`btn ${showImportOptions ? 'btn-outline-primary' : 'btn-primary'} btn-rd w-100`}
                                        onClick={() => setShowImportOptions(!showImportOptions)}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                        </svg>
                                        {showImportOptions ? 'Hide' : 'Use'} Saved Information
                                        {userData.addresses.length > 0 && ` (${userData.addresses.length} address${userData.addresses.length > 1 ? 'es' : ''})`}
                                        {userData.paymentMethods.length > 0 && ` (${userData.paymentMethods.length} payment method${userData.paymentMethods.length > 1 ? 's' : ''})`}
                                    </button>
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                {/* Contact Information */}
                                <div className="store-card fill-card mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h3 className="tc-6533 bold-text mb-0">Contact Information</h3>
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={importProfileData}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                            </svg>
                                            Use Profile Data
                                        </button>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label tc-6533 bold-text">First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                className="form-control"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label tc-6533 bold-text">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                className="form-control"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label tc-6533 bold-text">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label tc-6533 bold-text">Phone</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                className="form-control"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="store-card fill-card mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h3 className="tc-6533 bold-text mb-0">Shipping Address</h3>
                                        <div className="d-flex gap-2">
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: 'auto' }}
                                                value={selectedAddress}
                                                onChange={(e) => {
                                                    setSelectedAddress(e.target.value);
                                                    if (e.target.value) importAddress(e.target.value);
                                                }}
                                            >
                                                <option value="">Use saved address...</option>
                                                {userData.addresses.map((address) => (
                                                    <option key={address._id} value={address._id}>
                                                        {address.type} - {address.city}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-12 mb-3">
                                            <label className="form-label tc-6533 bold-text">Address</label>
                                            <input
                                                type="text"
                                                name="address"
                                                className="form-control"
                                                placeholder="Street address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label tc-6533 bold-text">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                className="form-control"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <label className="form-label tc-6533 bold-text">Postcode</label>
                                            <input
                                                type="text"
                                                name="postcode"
                                                className="form-control"
                                                value={formData.postcode}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <label className="form-label tc-6533 bold-text">Country</label>
                                            <select
                                                name="country"
                                                className="form-select"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="United Kingdom">United Kingdom</option>
                                                <option value="Ireland">Ireland</option>
                                                <option value="France">France</option>
                                                <option value="Germany">Germany</option>
                                                <option value="Spain">Spain</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="store-card fill-card mb-4">
                                    <h3 className="tc-6533 bold-text mb-4">Payment Method</h3>
                                    
                                    {/* Payment Options */}
                                    <div className="row mb-4">
                                        <div className="col-md-4 mb-3">
                                            <div className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                                                <input
                                                    type="radio"
                                                    id="card"
                                                    name="paymentMethod"
                                                    value="card"
                                                    checked={paymentMethod === 'card'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="form-check-input"
                                                />
                                                <label htmlFor="card" className="form-check-label w-100">
                                                    <div className="d-flex align-items-center">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" className="me-2">
                                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" fill="#007bff"/>
                                                            <line x1="1" y1="10" x2="23" y2="10" stroke="white" strokeWidth="2"/>
                                                        </svg>
                                                        Credit/Debit Card
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <div className={`payment-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}>
                                                <input
                                                    type="radio"
                                                    id="paypal"
                                                    name="paymentMethod"
                                                    value="paypal"
                                                    checked={paymentMethod === 'paypal'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="form-check-input"
                                                />
                                                <label htmlFor="paypal" className="form-check-label w-100">
                                                    <div className="d-flex align-items-center">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" className="me-2">
                                                            <path fill="#0070ba" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                                                        </svg>
                                                        PayPal
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <div className={`payment-option ${paymentMethod === 'apple' ? 'selected' : ''}`}>
                                                <input
                                                    type="radio"
                                                    id="apple"
                                                    name="paymentMethod"
                                                    value="apple"
                                                    checked={paymentMethod === 'apple'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="form-check-input"
                                                />
                                                <label htmlFor="apple" className="form-check-label w-100">
                                                    <div className="d-flex align-items-center">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" className="me-2">
                                                            <path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                                        </svg>
                                                        Apple Pay
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Details */}
                                    {paymentMethod === 'card' && (
                                        <>
                                            {/* Quick Import for Payment Methods */}
                                            {userData.paymentMethods.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <small className="tc-6533 bold-text">Use Saved Payment Method:</small>
                                                    </div>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={selectedPaymentMethod}
                                                        onChange={(e) => {
                                                            setSelectedPaymentMethod(e.target.value);
                                                            if (e.target.value) importPaymentMethod(e.target.value);
                                                        }}
                                                    >
                                                        <option value="">Select saved payment method...</option>
                                                        {userData.paymentMethods.map((method) => (
                                                            <option key={method._id} value={method._id}>
                                                                {method.cardBrand?.toUpperCase() || 'Card'} •••• {method.cardLast4} - {method.cardholderName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <hr className="my-3" />
                                                </div>
                                            )}

                                            <div className="row">
                                                <div className="col-12 mb-3">
                                                    <label className="form-label tc-6533 bold-text">
                                                        Card Number
                                                        {selectedPaymentMethod && (
                                                            <span className="badge bg-success ms-2">Using Saved Card</span>
                                                        )}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="cardNumber"
                                                        className="form-control"
                                                        placeholder="1234 5678 9012 3456"
                                                        value={formatCardNumber(formData.cardNumber)}
                                                        onChange={(e) => setFormData(prev => ({...prev, cardNumber: e.target.value}))}
                                                        maxLength="19"
                                                        required
                                                        disabled={!!selectedPaymentMethod}
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label tc-6533 bold-text">Expiry Date</label>
                                                    <input
                                                        type="text"
                                                        name="expiryDate"
                                                        className="form-control"
                                                        placeholder="MM/YY"
                                                        value={formData.expiryDate}
                                                        onChange={handleInputChange}
                                                        maxLength="5"
                                                        required
                                                        disabled={!!selectedPaymentMethod}
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label tc-6533 bold-text">
                                                        CVV
                                                        <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="password"
                                                        name="cvv"
                                                        className="form-control"
                                                        placeholder="123"
                                                        value={formData.cvv}
                                                        onChange={handleInputChange}
                                                        maxLength="4"
                                                        required
                                                        autoComplete="off"
                                                    />
                                                    <small className="text-muted">
                                                        <i className="fas fa-shield-alt me-1"></i>
                                                        CVV is required for security and is never stored
                                                    </small>
                                                </div>
                                                <div className="col-12 mb-3">
                                                    <label className="form-label tc-6533 bold-text">Name on Card</label>
                                                    <input
                                                        type="text"
                                                        name="cardName"
                                                        className="form-control"
                                                        value={formData.cardName}
                                                        onChange={handleInputChange}
                                                        required
                                                        disabled={!!selectedPaymentMethod}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Security Notice */}
                                            <div className="alert alert-info border-0 d-flex align-items-start">
                                                <i className="fas fa-lock me-2 mt-1"></i>
                                                <div>
                                                    <strong>Secure Payment</strong>
                                                    <p className="mb-0 small">
                                                        Your payment information is encrypted and secure. CVV is required for every transaction and is never stored on our servers.
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* PayPal */}
                                    {paymentMethod === 'paypal' && (
                                        <div className="text-center py-4">
                                            <p className="tc-6533 mb-3">You will be redirected to PayPal to complete your payment.</p>
                                            <button type="button" className="btn btn-warning btn-lg">
                                                Continue with PayPal
                                            </button>
                                        </div>
                                    )}

                                    {/* Apple Pay */}
                                    {paymentMethod === 'apple' && (
                                        <div className="text-center py-4">
                                            <p className="tc-6533 mb-3">Use Touch ID or Face ID to pay with Apple Pay.</p>
                                            <button type="button" className="btn btn-dark btn-lg">
                                                Pay with Apple Pay
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Order Options 
                                <div className="store-card fill-card mb-4">
                                    <div className="form-check mb-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="savePayment"
                                            id="savePayment"
                                            checked={formData.savePayment}
                                            onChange={handleInputChange}
                                        />
                                        <label className="form-check-label tc-6533" htmlFor="savePayment">
                                            Save payment information for faster checkout
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="newsletter"
                                            id="newsletter"
                                            checked={formData.newsletter}
                                            onChange={handleInputChange}
                                        />
                                        <label className="form-check-label tc-6533" htmlFor="newsletter">
                                            Subscribe to our newsletter for exclusive deals
                                        </label>
                                    </div>
                                </div>
                                */}
                            </form>
                        </div>

                        {/* Order Summary */}
                        <div className="col-lg-4">
                            <div className="store-card fill-card">
                                <h3 className="tc-6533 bold-text mb-4">Order Summary</h3>
                                
                                {/* Order Items */}
                                <div className="mb-4">
                                    {cartItems.map((item) => {
                                        const product = item.product || {};
                                        const options = item.options || {};
                                        const optionsText = Object.entries(options).map(([key, value]) => value).join(', ');
                                        
                                        return (
                                            <div key={item._id} className="d-flex align-items-center mb-3">
                                                <img
                                                    src={product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder.jpg'}
                                                    className="rounded me-3"
                                                    alt={product.name || 'Product'}
                                                    width="50"
                                                    height="50"
                                                />
                                                <div className="flex-grow-1">
                                                    <h6 className="tc-6533 mb-1">{product.name}</h6>
                                                    {optionsText && <small className="tc-6533">{optionsText}</small>}
                                                    <small className="tc-6533 d-block">Qty: {item.quantity}</small>
                                                </div>
                                                <span className="tc-6533 bold-text">£{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pricing */}
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="tc-6533">Subtotal:</span>
                                        <span className="tc-6533">£{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="tc-6533">Shipping:</span>
                                        <span className="tc-6533">FREE</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-3">
                                        <span className="tc-6533">Tax (VAT):</span>
                                        <span className="tc-6533">£{tax.toFixed(2)}</span>
                                    </div>
                                    <hr />
                                    <div className="d-flex justify-content-between mb-4">
                                        <span className="tc-6533 bold-text h5">Total:</span>
                                        <span className="tc-2101 bold-text h5">£{total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Complete Order Button */}
                                <button
                                    type="submit"
                                    className="btn btn-c-2101 btn-rd btn-lg w-100 mb-3"
                                    onClick={handleSubmit}
                                    disabled={isProcessing || cartItems.length === 0}
                                >
                                    {isProcessing ? 'Processing...' : `Complete Order - £${total.toFixed(2)}`}
                                </button>

                                {/* Security Notice */}
                                <div className="text-center">
                                    <div className="d-flex align-items-center justify-content-center mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="green" className="me-2">
                                            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                                        </svg>
                                        <small className="tc-6533">Secure SSL Encryption</small>
                                    </div>
                                    <small className="tc-6533 text-muted">
                                        Your payment information is encrypted and secure
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;