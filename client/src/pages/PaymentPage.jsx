import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StripeProvider from '../components/Payment/StripeProvider';
import StripeCheckout from '../components/Payment/StripeCheckout';
import stripePaymentService from '../api/services/stripePaymentService';

const PaymentPage = () => {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('stripe');
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [clientSecret, setClientSecret] = useState('');
    const [isCreatingIntent, setIsCreatingIntent] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState('');
    const [showStripeForm, setShowStripeForm] = useState(false);
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

    // Mock user data (in real app, this would come from user context/API)
    const userData = {
        profile: {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@email.com',
            phone: '+44 7700 900123'
        },
        addresses: [
            {
                id: 1,
                type: 'Home',
                name: 'John Smith',
                address: '123 Tech Street',
                city: 'London',
                postcode: 'SW1A 1AA',
                country: 'United Kingdom',
                isDefault: true
            },
            {
                id: 2,
                type: 'Work',
                name: 'John Smith',
                address: '456 Business Ave',
                city: 'Manchester',
                postcode: 'M1 1AA',
                country: 'United Kingdom',
                isDefault: false
            }
        ],
        paymentMethods: [
            {
                id: 1,
                type: 'card',
                brand: 'visa',
                last4: '4242',
                expiryMonth: 12,
                expiryYear: 2025,
                isDefault: true,
                holderName: 'John Smith'
            },
            {
                id: 2,
                type: 'card',
                brand: 'mastercard',
                last4: '8888',
                expiryMonth: 8,
                expiryYear: 2026,
                isDefault: false,
                holderName: 'John Smith'
            }
        ]
    };

    // Mock cart data
    const cartItems = [
        {
            id: 1,
            name: 'Tablet Air',
            color: 'Silver',
            storage: '128GB',
            price: 1999,
            quantity: 1,
            image: 'img/tablet-product.jpg'
        },
        {
            id: 2,
            name: 'Phone Pro',
            color: 'Black',
            storage: '256GB',
            price: 999,
            quantity: 1,
            image: 'img/phone-product.jpg'
        }
    ];

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 0; // Free shipping
    const tax = subtotal * 0.2; // 20% VAT
    const total = subtotal + shipping + tax;

    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000);
    };

    // Import user profile data
    const importProfileData = () => {
        setFormData(prev => ({
            ...prev,
            firstName: userData.profile.firstName,
            lastName: userData.profile.lastName,
            email: userData.profile.email,
            phone: userData.profile.phone
        }));
        showNotification('Profile information imported successfully!');
        setShowImportOptions(false);
    };

    // Import selected address
    const importAddress = (addressId) => {
        const address = userData.addresses.find(addr => addr.id === parseInt(addressId));
        if (address) {
            setFormData(prev => ({
                ...prev,
                address: address.address,
                city: address.city,
                postcode: address.postcode,
                country: address.country
            }));
            showNotification(`${address.type} address imported successfully!`);
        }
        setSelectedAddress('');
    };

    // Import selected payment method
    const importPaymentMethod = (methodId) => {
        const method = userData.paymentMethods.find(pm => pm.id === parseInt(methodId));
        if (method) {
            setFormData(prev => ({
                ...prev,
                cardNumber: `•••• •••• •••• ${method.last4}`,
                expiryDate: `${method.expiryMonth.toString().padStart(2, '0')}/${method.expiryYear.toString().slice(-2)}`,
                cardName: method.holderName,
                cvv: '' // CVV should always be re-entered for security
            }));
            showNotification(`${method.brand.toUpperCase()} card imported successfully! Please re-enter CVV for security.`, 'info');
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
        showNotification('All form data cleared!', 'info');
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Create payment intent when ready to pay
    const createPaymentIntent = async () => {
        setIsCreatingIntent(true);
        try {
            const response = await stripePaymentService.createPaymentIntent({
                amount: total,
                currency: 'gbp',
                metadata: {
                    orderType: 'product_purchase',
                    itemCount: cartItems.length
                }
            });
            
            setClientSecret(response.data.clientSecret);
            setPaymentIntentId(response.data.paymentIntentId);
            setShowStripeForm(true);
            console.log('✅ Payment intent created:', response.data.paymentIntentId);
            showNotification('Payment form ready!', 'success');
        } catch (error) {
            console.error('❌ Failed to create payment intent:', error);
            showNotification('Failed to initialize payment. Please try again.', 'error');
        } finally {
            setIsCreatingIntent(false);
        }
    };

    const handlePaymentSuccess = async (paymentIntent) => {
        console.log('✅ Payment succeeded:', paymentIntent);
        
        try {
            // Create order after successful payment
            const orderData = {
                paymentIntentId: paymentIntent.id,
                items: cartItems,
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.address,
                    city: formData.city,
                    postcode: formData.postcode,
                    country: formData.country
                },
                contactInfo: {
                    email: formData.email,
                    phone: formData.phone
                },
                totals: {
                    subtotal,
                    shipping,
                    tax,
                    total
                }
            };
            
            const orderResponse = await stripePaymentService.processOrder(orderData);
            console.log('✅ Order created:', orderResponse);
            
            showNotification('Order placed successfully!', 'success');
            
            // Redirect to success page
            setTimeout(() => {
                navigate(`/order-confirmation/${orderResponse.data.orderId || 'success'}`);
            }, 1500);
        } catch (error) {
            console.error('❌ Failed to create order:', error);
            showNotification('Payment succeeded but failed to create order. Please contact support.', 'error');
        }
    };

    const handlePaymentError = (error) => {
        console.error('❌ Payment failed:', error);
        showNotification(`Payment failed: ${error.message}`, 'error');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate form data
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            showNotification('Please fill in all contact information', 'error');
            return;
        }
        
        if (!formData.address || !formData.city || !formData.postcode) {
            showNotification('Please fill in all shipping address fields', 'error');
            return;
        }
        
        // Create payment intent and show Stripe form
        createPaymentIntent();
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

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="payment-bloc">
            {/* Notification Toast */}
            {notification.show && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
                    <div className={`alert alert-${notification.type === 'success' ? 'success' : notification.type === 'info' ? 'info' : 'warning'} alert-dismissible fade show`} role="alert">
                        <div className="d-flex align-items-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="currentColor">
                                {notification.type === 'success' ? (
                                    <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                                ) : (
                                    <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                )}
                            </svg>
                            {notification.message}
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setNotification({ show: false, message: '', type: '' })}
                        ></button>
                    </div>
                </div>
            )}

            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Page Header */}
                    <div className="col-12 mb-4">
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/cart">Cart</Link></li>
                                <li className="breadcrumb-item active" aria-current="page">Checkout</li>
                            </ol>
                        </nav>
                        <div className="d-flex justify-content-between align-items-center">
                            <h1 className="tc-6533 bold-text mb-0">Secure Checkout</h1>
                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => setShowImportOptions(!showImportOptions)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    Import Data
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={clearFormData}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>

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
                                                    <option key={address.id} value={address.id}>
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
                                                    <option key={method.id} value={method.id}>
                                                        {method.brand.toUpperCase()} •••• {method.last4}
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
                                                    <option key={address.id} value={address.id}>
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

                                {/* Payment Method - Stripe Integration */}
                                <div className="store-card fill-card mb-4">
                                    <h3 className="tc-6533 bold-text mb-4">Payment Method</h3>
                                    
                                    {!showStripeForm ? (
                                        <div className="text-center py-4">
                                            <p className="tc-6533 mb-3">
                                                Complete your shipping information above, then proceed to payment.
                                            </p>
                                            <div className="d-flex align-items-center justify-content-center mb-3">
                                                <svg width="24" height="24" viewBox="0 0 24 24" className="me-2" fill="currentColor">
                                                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                                                </svg>
                                                <span className="tc-6533">Secured by Stripe</span>
                                            </div>
                                            <small className="text-muted">
                                                We accept all major credit and debit cards
                                            </small>
                                        </div>
                                    ) : (
                                        <StripeProvider>
                                            <StripeCheckout
                                                clientSecret={clientSecret}
                                                onSuccess={handlePaymentSuccess}
                                                onError={handlePaymentError}
                                                amount={total}
                                                currency="gbp"
                                                returnUrl={`${window.location.origin}/order-confirmation`}
                                            />
                                        </StripeProvider>
                                    )}
                                </div>

                                {/* Order Options */}
                                <div className="store-card fill-card mb-4">
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
                            </form>
                        </div>

                        {/* Order Summary */}
                        <div className="col-lg-4">
                            <div className="store-card fill-card">
                                <h3 className="tc-6533 bold-text mb-4">Order Summary</h3>
                                
                                {/* Order Items */}
                                <div className="mb-4">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="d-flex align-items-center mb-3">
                                            <img
                                                src={item.image}
                                                className="rounded me-3"
                                                alt={item.name}
                                                width="50"
                                                height="50"
                                            />
                                            <div className="flex-grow-1">
                                                <h6 className="tc-6533 mb-1">{item.name}</h6>
                                                <small className="tc-6533">{item.color}, {item.storage}</small>
                                            </div>
                                            <span className="tc-6533 bold-text">£{item.price}</span>
                                        </div>
                                    ))}
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
                                {!showStripeForm ? (
                                    <button
                                        type="submit"
                                        className="btn btn-c-2101 btn-rd btn-lg w-100 mb-3"
                                        onClick={handleSubmit}
                                        disabled={isCreatingIntent}
                                    >
                                        {isCreatingIntent ? (
                                            <div className="d-flex align-items-center justify-content-center">
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Preparing Payment...
                                            </div>
                                        ) : (
                                            'Proceed to Payment'
                                        )}
                                    </button>
                                ) : (
                                    <div className="alert alert-info">
                                        <small>Complete payment using the form above</small>
                                    </div>
                                )}

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