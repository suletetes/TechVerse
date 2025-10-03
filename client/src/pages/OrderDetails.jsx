import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReorderModal } from '../components/UserProfile/Modals';

const OrderDetails = () => {
    const { orderId } = useParams();
    const [showReorderModal, setShowReorderModal] = useState(false);

    // Mock order data - in real app, fetch based on orderId
    const order = {
        id: orderId || 'TV-2024-001234',
        date: '2024-01-15',
        status: 'Delivered',
        total: 3597.60,
        subtotal: 2998.00,
        shipping: 0,
        tax: 599.60,
        trackingNumber: 'TRK123456789',
        shippingAddress: {
            name: 'John Smith',
            address: '123 Tech Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom'
        },
        billingAddress: {
            name: 'John Smith',
            address: '123 Tech Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom'
        },
        paymentMethod: {
            type: 'Visa',
            last4: '4242'
        },
        items: [
            {
                id: 1,
                name: 'Tablet Air',
                color: 'Silver',
                storage: '128GB',
                price: 1999,
                quantity: 1,
                image: '/img/tablet-product.jpg'
            },
            {
                id: 2,
                name: 'Phone Pro',
                color: 'Black',
                storage: '256GB',
                price: 999,
                quantity: 1,
                image: '/img/phone-product.jpg'
            }
        ]
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'success';
            case 'shipped': return 'info';
            case 'processing': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="order-details-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Page Header */}
                    <div className="col-12 mb-4">
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/user">My Account</Link></li>
                                <li className="breadcrumb-item"><Link to="/user?tab=orders">Orders</Link></li>
                                <li className="breadcrumb-item active" aria-current="page">Order Details</li>
                            </ol>
                        </nav>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="tc-6533 bold-text mb-1">Order #{order.id}</h1>
                                <p className="tc-6533 mb-0">Placed on {new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`badge bg-${getStatusColor(order.status)} fs-6`}>
                                {order.status}
                            </span>
                        </div>
                    </div>

                    <div className="row">
                        {/* Order Items */}
                        <div className="col-lg-8 mb-4">
                            <div className="store-card fill-card mb-4">
                                <h3 className="tc-6533 bold-text mb-4">Order Items</h3>
                                {order.items.map((item) => (
                                    <div key={item.id} className="d-flex align-items-center p-3 border-bottom">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="rounded me-3"
                                            width="80"
                                            height="80"
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <div className="flex-grow-1">
                                            <h5 className="tc-6533 mb-1">{item.name}</h5>
                                            <p className="tc-6533 mb-1">{item.color}, {item.storage}</p>
                                            <p className="tc-6533 mb-0">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="text-end">
                                            <p className="tc-6533 bold-text h5 mb-0">£{item.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Shipping & Billing */}
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <div className="store-card fill-card h-100">
                                        <h5 className="tc-6533 bold-text mb-3">Shipping Address</h5>
                                        <p className="tc-6533 mb-1">{order.shippingAddress.name}</p>
                                        <p className="tc-6533 mb-1">{order.shippingAddress.address}</p>
                                        <p className="tc-6533 mb-1">{order.shippingAddress.city}</p>
                                        <p className="tc-6533 mb-1">{order.shippingAddress.postcode}</p>
                                        <p className="tc-6533 mb-0">{order.shippingAddress.country}</p>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="store-card fill-card h-100">
                                        <h5 className="tc-6533 bold-text mb-3">Billing Address</h5>
                                        <p className="tc-6533 mb-1">{order.billingAddress.name}</p>
                                        <p className="tc-6533 mb-1">{order.billingAddress.address}</p>
                                        <p className="tc-6533 mb-1">{order.billingAddress.city}</p>
                                        <p className="tc-6533 mb-1">{order.billingAddress.postcode}</p>
                                        <p className="tc-6533 mb-0">{order.billingAddress.country}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="col-lg-4">
                            <div className="store-card fill-card mb-4">
                                <h3 className="tc-6533 bold-text mb-4">Order Summary</h3>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="tc-6533">Subtotal:</span>
                                    <span className="tc-6533">£{order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="tc-6533">Shipping:</span>
                                    <span className="tc-6533">FREE</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3">
                                    <span className="tc-6533">Tax (VAT):</span>
                                    <span className="tc-6533">£{order.tax.toFixed(2)}</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between mb-4">
                                    <span className="tc-6533 bold-text h5">Total:</span>
                                    <span className="tc-2101 bold-text h5">£{order.total.toFixed(2)}</span>
                                </div>

                                <h5 className="tc-6533 bold-text mb-3">Payment Method</h5>
                                <div className="d-flex align-items-center mb-4">
                                    <div className="bg-primary text-white px-2 py-1 rounded small fw-bold me-3">
                                        {order.paymentMethod.type.toUpperCase()}
                                    </div>
                                    <span className="tc-6533">•••• •••• •••• {order.paymentMethod.last4}</span>
                                </div>

                                {order.trackingNumber && (
                                    <>
                                        <h5 className="tc-6533 bold-text mb-3">Tracking</h5>
                                        <div className="mb-4">
                                            <p className="tc-6533 mb-2">Tracking Number:</p>
                                            <code className="bg-light p-2 rounded d-block">{order.trackingNumber}</code>
                                        </div>
                                    </>
                                )}

                                {/* Action Buttons */}
                                <div className="d-grid gap-2">
                                    {order.trackingNumber && (
                                        <Link
                                            to={`/user/order/${order.id}/tracking`}
                                            className="btn btn-outline-info btn-rd"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M16 3h5v5" />
                                                <path d="M8 3H3v5" />
                                                <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
                                                <path d="M21 3l-7.828 7.828A4 4 0 0 0 12 13.657V22" />
                                            </svg>
                                            Track Order
                                        </Link>
                                    )}
                                    {order.status === 'Delivered' && (
                                        <Link
                                            to={`/user/order/${order.id}/review`}
                                            className="btn btn-c-2101 btn-rd"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                            Write Review
                                        </Link>
                                    )}
                                    <button 
                                        className="btn btn-outline-secondary btn-rd"
                                        onClick={() => setShowReorderModal(true)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="23 4 23 10 17 10" />
                                            <polyline points="1 20 1 14 7 14" />
                                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        Reorder Items
                                    </button>
                                </div>
                            </div>

                            {/* Help Section */}
                            <div className="store-card fill-card">
                                <h5 className="tc-6533 bold-text mb-3">Need Help?</h5>
                                <div className="d-grid gap-2">
                                    <Link to="/contact" className="btn btn-outline-secondary btn-sm">
                                        Contact Support
                                    </Link>
                                    <Link to="/ReturnsPolicy" className="btn btn-outline-secondary btn-sm">
                                        Return Policy
                                    </Link>
                                    <Link to="/faq" className="btn btn-outline-secondary btn-sm">
                                        FAQ
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reorder Modal */}
            {showReorderModal && (
                <ReorderModal 
                    onClose={() => setShowReorderModal(false)}
                    order={order}
                    onReorder={(selectedItems, quantities) => {
                        console.log('Reorder completed:', selectedItems, quantities);
                        // In real app: Add items to cart and show success message
                        alert('Items added to cart successfully!');
                        setShowReorderModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default OrderDetails;