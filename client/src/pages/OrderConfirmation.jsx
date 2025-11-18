import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import orderService from '../api/services/orderService';
import { LoadingSpinner } from '../components/Common';

const OrderConfirmation = () => {
    const { orderNumber } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderNumber) {
                setError('No order number provided');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const response = await orderService.getOrderByNumber(orderNumber);
                
                if (response.success && response.data?.order) {
                    setOrder(response.data.order);
                } else {
                    setError('Order not found');
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setError(err.message || 'Failed to load order details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [orderNumber]);

    if (isLoading) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc" style={{ minHeight: '60vh' }}>
                <div className="container bloc-md">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc">
                <div className="container bloc-md">
                    <div className="row justify-content-center">
                        <div className="col-lg-6 text-center">
                            <div className="store-card fill-card">
                                <h2 className="tc-6533 mb-3">Order Not Found</h2>
                                <p className="tc-6533 mb-4">{error || 'Unable to load order details'}</p>
                                <Link to="/" className="btn btn-c-2101 btn-rd">
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
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
                                            <div className="d-flex justify-content-center align-items-center bg-opacity-20 rounded p-3">
                                                <div className="text-center">
                                                    <p className="tc-2175 bold-text mb-1">Order Number</p>
                                                    <p className="tc-654 mb-0 h4">{order.orderNumber}</p>
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
                                        {order.items.map((item, index) => (
                                            <div key={item._id || index}>
                                                <div className="row align-items-center py-3">
                                                    <div className="col-md-2 col-3">
                                                        <img
                                                            src={item.image || '/img/placeholder.jpg'}
                                                            className="img-fluid rounded"
                                                            alt={item.name}
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div className="col-md-6 col-9">
                                                        <h6 className="tc-6533 mb-1">{item.name}</h6>
                                                        {item.variants && item.variants.length > 0 && (
                                                            <div>
                                                                {item.variants.map((variant, idx) => (
                                                                    <p key={idx} className="tc-6533 sm-text mb-1">
                                                                        {variant.name}: {variant.value}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="col-md-2 col-6">
                                                        <p className="tc-6533 mb-0">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="col-md-2 col-6">
                                                        <p className="tc-6533 bold-text mb-0">${item.price.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                {index < order.items.length - 1 && <hr />}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Shipping Address */}
                                    <div className="mb-4">
                                        <h5 className="tc-6533 mb-3">Shipping Address</h5>
                                        <div className="bg-light p-3 rounded">
                                            <p className="mb-1 bold-text">
                                                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                                            </p>
                                            <p className="mb-1">{order.shippingAddress.address}</p>
                                            <p className="mb-1">{order.shippingAddress.city}</p>
                                            <p className="mb-1">{order.shippingAddress.postcode}</p>
                                            <p className="mb-0">{order.shippingAddress.country}</p>
                                            {order.shippingAddress.phone && (
                                                <p className="mb-0 mt-2">Phone: {order.shippingAddress.phone}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="mb-4">
                                        <h5 className="tc-6533 mb-3">Payment Method</h5>
                                        <div className="bg-light p-3 rounded">
                                            <p className="mb-1 bold-text">
                                                {order.payment?.method === 'stripe' ? 'Credit/Debit Card' : order.payment?.method}
                                            </p>
                                            <p className="mb-0 text-success">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="me-1">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                </svg>
                                                Payment Successful
                                            </p>
                                        </div>
                                    </div>

                                    {/* Order Status */}
                                    <div>
                                        <h5 className="tc-6533 mb-3">Order Status</h5>
                                        <div className="bg-light p-3 rounded">
                                            <div className="d-flex align-items-center">
                                                <div className="me-3">
                                                    <div className="bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                                                </div>
                                                <div>
                                                    <p className="mb-1 bold-text text-capitalize">{order.status}</p>
                                                    <p className="sm-text text-muted mb-0">
                                                        Order placed on {formatDate(order.createdAt)}
                                                    </p>
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
                                            <span className="tc-6533">${order.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="tc-6533">Shipping:</span>
                                            <span className="tc-6533">
                                                {order.shipping?.cost === 0 ? 'FREE' : `$${order.shipping?.cost.toFixed(2)}`}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <span className="tc-6533">Tax:</span>
                                            <span className="tc-6533">${order.tax.toFixed(2)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between mb-4">
                                            <span className="tc-6533 bold-text h5">Total Paid:</span>
                                            <span className="tc-2101 bold-text h5">${order.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-grid gap-2">
                                        <Link to={`/user/order/${order._id}`} className="btn btn-c-2101 btn-rd">
                                            View Order Details
                                        </Link>
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
                                            <p className="mb-0">We've sent a confirmation email with your order details to your registered email address.</p>
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
