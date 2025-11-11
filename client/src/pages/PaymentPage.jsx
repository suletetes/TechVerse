import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../context';
import userService from '../api/services/userService';
import orderService from '../api/services/orderService';
import stripeService from '../api/services/stripeService';
import { LoadingSpinner, Toast } from '../components/Common';
import StripeProvider from '../components/Payment/StripeProvider';
import StripeCheckoutForm from '../components/Payment/StripeCheckoutForm';

const PaymentPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { items: cartItems, total: cartTotal, itemCount, clearCart } = useCart();
    
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [toast, setToast] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [showStripeForm, setShowStripeForm] = useState(false);
    
    // User data from database
    const [userData, setUserData] = useState({
        profile: null,
        addresses: []
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
        
        // Options
        sameAsBilling: true,
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
                
                // Load user profile and addresses
                const [profileResponse, addressesResponse] = await Promise.all([
                    userService.getProfile(),
                    userService.getAddresses()
                ]);

                console.log('Profile response:', profileResponse);
                console.log('Addresses response:', addressesResponse);

                // Extract data from responses (handle nested data structure)
                // Profile: {success: true, data: {user: {...}}}
                // Addresses: {success: true, data: {addresses: [...]}}
                const profile = profileResponse?.data?.user || profileResponse?.data;
                const addresses = addressesResponse?.data?.addresses || [];

                console.log('Extracted profile:', profile);
                console.log('Extracted addresses:', addresses);

                setUserData({
                    profile: profile,
                    addresses: Array.isArray(addresses) ? addresses : []
                });

                // Show import options if user has saved data
                if (Array.isArray(addresses) && addresses.length > 0) {
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
            sameAsBilling: true,
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

        try {
            setIsProcessing(true);

            // Create payment intent with Stripe
            const paymentIntentData = {
                amount: total,
                currency: 'usd',
                metadata: {
                    customerEmail: formData.email,
                    customerName: `${formData.firstName} ${formData.lastName}`,
                }
            };

            const response = await stripeService.createPaymentIntent(paymentIntentData);

            if (response.success && response.data.clientSecret) {
                setClientSecret(response.data.clientSecret);
                setShowStripeForm(true);
                setToast({
                    message: 'Please complete payment below',
                    type: 'info'
                });
            }
        } catch (error) {
            console.error('Error creating payment intent:', error);
            setToast({
                message: error.message || 'Failed to initialize payment. Please try again.',
                type: 'error'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = async (paymentIntent) => {
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
                    method: 'stripe',
                    amount: total,
                    paymentIntentId: paymentIntent.id
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
            console.error('Error creating order:', error);
            setToast({
                message: error.message || 'Payment successful but order creation failed. Please contact support.',
                type: 'error'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentError = (error) => {
        setToast({
            message: error.message || 'Payment failed. Please try again.',
            type: 'error'
        });
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
                                    <div className="col-md-6 mb-3">
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
                                    <div className="col-md-6 mb-3">
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
                            {userData.addresses.length > 0 && (
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

                                {/* Payment Method - Stripe Integration */}
                                <div className="store-card fill-card mb-4">
                                    <h3 className="tc-6533 bold-text mb-4">Payment Method</h3>
                                    
                                    {!showStripeForm ? (
                                        <div className="alert alert-info border-0 d-flex align-items-start">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="me-2 mt-1">
                                                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                                            </svg>
                                            <div>
                                                <strong>Secure Payment with Stripe</strong>
                                                <p className="mb-0 small">
                                                    Click "Proceed to Payment" below to securely enter your payment details. We accept all major credit and debit cards.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {clientSecret && (
                                                <StripeProvider clientSecret={clientSecret}>
                                                    <StripeCheckoutForm
                                                        amount={total}
                                                        currency="usd"
                                                        onSuccess={handlePaymentSuccess}
                                                        onError={handlePaymentError}
                                                    />
                                                </StripeProvider>
                                            )}
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
                                                <span className="tc-6533 bold-text">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pricing */}
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="tc-6533">Subtotal:</span>
                                        <span className="tc-6533">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="tc-6533">Shipping:</span>
                                        <span className="tc-6533">FREE</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-3">
                                        <span className="tc-6533">Tax (VAT):</span>
                                        <span className="tc-6533">${tax.toFixed(2)}</span>
                                    </div>
                                    <hr />
                                    <div className="d-flex justify-content-between mb-4">
                                        <span className="tc-6533 bold-text h5">Total:</span>
                                        <span className="tc-2101 bold-text h5">${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Proceed to Payment Button (only show if Stripe form not visible) */}
                                {!showStripeForm && (
                                    <button
                                        type="submit"
                                        className="btn btn-c-2101 btn-rd btn-lg w-100 mb-3"
                                        onClick={handleSubmit}
                                        disabled={isProcessing || cartItems.length === 0}
                                    >
                                        {isProcessing ? 'Initializing Payment...' : `Proceed to Payment - $${total.toFixed(2)}`}
                                    </button>
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