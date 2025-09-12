import React from 'react';
import { Link } from 'react-router-dom';

const OrderConfirmation = () => {
    // Mock order data - in real app this would come from props/state/API
    const orderData = {
        orderNumber: 'TV-2024-001234',
        orderDate: new Date().toLocaleDateString('en-GB'),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
        items: [
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
        ],
        shippingAddress: {
            name: 'John Smith',
            address: '123 Tech Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom'
        },
        paymentMethod: {
            type: 'Credit Card',
            last4: '4242',
            brand: 'Visa'
        },
        pricing: {
            subtotal: 2998,
            shipping: 0,
            tax: 599.60,
            total: 3597.60
        }
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="order-confirmation-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        {/* Success Header */}
                        <div className="text-center mb-5">
                            <div className="store-card fill-card primary-gradient-bg">
                                <div className="py-4">
                                    {/* Success Icon */}
                                    <div className="mb-4">
                                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="mx-auto">
                                            <circle cx="12" cy="12" r="10" fill="#28a745"/>
                                            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    
                                    <h1 className="tc-2175 bold-text mb-3">Order Confirmed!</h1>
                                    <p className="tc-654 lg-sub-title mb-4">
                                        Thank you for your purchase. Your order has been successfully placed and is being processed.
                                    </p>
                                    
                                    <div className="row justify-content-center">
                                        <div className="col-md-8">
                                            <div className="d-flex justify-content-between align-items-center bg-white bg-opacity-20 rounded p-3">
                                                <div>
                                                    <p className="tc-2175 bold-text mb-1">Order Number</p>
                                                    <p className="tc-654 mb-0">{orderData.orderNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="tc-2175 bold-text mb-1">Estimated Delivery</p>
                                                    <p className="tc-654 mb-0">{orderData.estimatedDelivery}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            {/* Order Details */}
                            <div className="col-lg-8 mb-4 mb-lg-0">
                                <div className="store-card fill-card">
                                    <h3 className="tc-6533 bold-text mb-4">Order Details</h3>
                                    
                                    {/* Order Items */}
                                    <div className="mb-4">
                                        <h5 className="tc-6533 mb-3">Items Ordered</h5>
                                        {orderData.items.map((item, index) => (
                                            <div key={item.id}>
                                                <div className="row align-items-center py-3">
                                                    <div className="col-md-2 col-3">
                                                        <img
                                                            src={item.image}
                                                            className="img-fluid rounded"
                                                            alt={item.name}
                                                            width="60"
                                                            height="60"
                                                        />
                                                    </div>
                                                    <div className="col-md-6 col-9">
                                                        <h6 className="tc-6533 mb-1">{item.name}</h6>
                                                        <p className="tc-6533 sm-text mb-1">Color: {item.color}</p>
                                                        <p className="tc-6533 sm-text mb-0">Storage: {item.storage}</p>
                                                    </div>
                                                    <div className="col-md-2 col-6">
                                                        <p className="tc-6533 mb-0">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="col-md-2 col-6">
                                                        <p className="tc-6533 bold-text mb-0">£{item.price}</p>
                                                    </div>
                                                </div>
                                                {index < orderData.items.length - 1 && <hr />}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Shipping Address */}
                                    <div className="mb-4">
                                        <h5 className="tc-6533 mb-3">Shipping Address</h5>
                                        <div className="bg-light p-3 rounded">
                                            <p className="mb-1 bold-text">{orderData.shippingAddress.name}</p>
                                            <p className="mb-1">{orderData.shippingAddress.address}</p>
                                            <p className="mb-1">{orderData.shippingAddress.city}</p>
                                            <p className="mb-1">{orderData.shippingAddress.postcode}</p>
                                            <p className="mb-0">{orderData.shippingAddress.country}</p>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="mb-4">
                                        <h5 className="tc-6533 mb-3">Payment Method</h5>
                                        <div className="bg-light p-3 rounded">
                                            <p className="mb-1 bold-text">{orderData.paymentMethod.type}</p>
                                            <p className="mb-0">{orderData.paymentMethod.brand} ending in {orderData.paymentMethod.last4}</p>
                                        </div>
                                    </div>

                                    {/* Order Timeline */}
                                    <div>
                                        <h5 className="tc-6533 mb-3">Order Status</h5>
                                        <div className="timeline">
                                            <div className="timeline-item completed">
                                                <div className="timeline-marker bg-success"></div>
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">Order Placed</h6>
                                                    <p className="sm-text text-muted mb-0">{orderData.orderDate}</p>
                                                </div>
                                            </div>
                                            <div className="timeline-item">
                                                <div className="timeline-marker bg-secondary"></div>
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">Processing</h6>
                                                    <p className="sm-text text-muted mb-0">1-2 business days</p>
                                                </div>
                                            </div>
                                            <div className="timeline-item">
                                                <div className="timeline-marker bg-secondary"></div>
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">Shipped</h6>
                                                    <p className="sm-text text-muted mb-0">3-5 business days</p>
                                                </div>
                                            </div>
                                            <div className="timeline-item">
                                                <div className="timeline-marker bg-secondary"></div>
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">Delivered</h6>
                                                    <p className="sm-text text-muted mb-0">Est. {orderData.estimatedDelivery}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="col-lg-4">
                                <div className="store-card fill-card">
                                    <h3 className="tc-6533 bold-text mb-4">Order Summary</h3>
                                    
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="tc-6533">Subtotal:</span>
                                            <span className="tc-6533">£{orderData.pricing.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="tc-6533">Shipping:</span>
                                            <span className="tc-6533">
                                                {orderData.pricing.shipping === 0 ? 'FREE' : `£${orderData.pricing.shipping.toFixed(2)}`}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <span className="tc-6533">Tax (VAT):</span>
                                            <span className="tc-6533">£{orderData.pricing.tax.toFixed(2)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between mb-4">
                                            <span className="tc-6533 bold-text h5">Total Paid:</span>
                                            <span className="tc-2101 bold-text h5">£{orderData.pricing.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-grid gap-2">
                                        <button className="btn btn-c-2101 btn-rd">
                                            Track Your Order
                                        </button>
                                        <button className="btn btn-outline-secondary btn-rd">
                                            Download Invoice
                                        </button>
                                        <Link to="/" className="btn btn-outline-primary btn-rd">
                                            Continue Shopping
                                        </Link>
                                    </div>

                                    {/* Contact Support */}
                                    <div className="mt-4 pt-4 border-top">
                                        <h6 className="tc-6533 mb-2">Need Help?</h6>
                                        <p className="sm-text tc-6533 mb-2">
                                            Contact our customer support team if you have any questions about your order.
                                        </p>
                                        <Link to="/contact" className="btn btn-sm btn-outline-secondary btn-rd">
                                            Contact Support
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email Confirmation Notice */}
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="alert alert-info">
                                    <div className="d-flex align-items-center">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="me-3">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                        <div>
                                            <strong>Confirmation email sent!</strong>
                                            <p className="mb-0">We've sent a confirmation email with your order details and tracking information.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;