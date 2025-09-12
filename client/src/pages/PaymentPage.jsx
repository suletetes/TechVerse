import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PaymentPage = () => {
    const [paymentMethod, setPaymentMethod] = useState('card');
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

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Processing payment:', { paymentMethod, formData });
        // Handle payment processing
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
                        <h1 className="tc-6533 bold-text">Secure Checkout</h1>
                    </div>

                    <div className="row">
                        {/* Checkout Form */}
                        <div className="col-lg-8 mb-4 mb-lg-0">
                            <form onSubmit={handleSubmit}>
                                {/* Contact Information */}
                                <div className="store-card fill-card mb-4">
                                    <h3 className="tc-6533 bold-text mb-4">Contact Information</h3>
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
                                    <h3 className="tc-6533 bold-text mb-4">Shipping Address</h3>
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
                                        <div className="row">
                                            <div className="col-12 mb-3">
                                                <label className="form-label tc-6533 bold-text">Card Number</label>
                                                <input
                                                    type="text"
                                                    name="cardNumber"
                                                    className="form-control"
                                                    placeholder="1234 5678 9012 3456"
                                                    value={formatCardNumber(formData.cardNumber)}
                                                    onChange={(e) => setFormData(prev => ({...prev, cardNumber: e.target.value}))}
                                                    maxLength="19"
                                                    required
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
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label tc-6533 bold-text">CVV</label>
                                                <input
                                                    type="text"
                                                    name="cvv"
                                                    className="form-control"
                                                    placeholder="123"
                                                    value={formData.cvv}
                                                    onChange={handleInputChange}
                                                    maxLength="4"
                                                    required
                                                />
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
                                                />
                                            </div>
                                        </div>
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

                                {/* Order Options */}
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
                                <button
                                    type="submit"
                                    className="btn btn-c-2101 btn-rd btn-lg w-100 mb-3"
                                    onClick={handleSubmit}
                                >
                                    Complete Order
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