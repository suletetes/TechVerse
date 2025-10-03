import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReorderModal } from '../components/UserProfile/Modals';

const OrderTracking = () => {
    const { orderId } = useParams();
    const [showReorderModal, setShowReorderModal] = useState(false);

    // Mock order data - in real app, fetch based on orderId
    const order = {
        id: orderId || 'TV-2024-001234',
        date: '2024-01-15',
        status: 'Delivered',
        total: 3597.60,
        items: 3,
        image: '/img/tablet-product.jpg',
        trackingNumber: 'TRK123456789'
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

    const getTrackingTimeline = () => {
        const timeline = [
            {
                status: 'Order Placed',
                date: order.date,
                time: '14:30',
                completed: true,
                current: false,
                description: 'Your order has been confirmed and is being prepared'
            },
            {
                status: 'Payment Confirmed',
                date: order.date,
                time: '14:32',
                completed: true,
                current: false,
                description: 'Payment has been successfully processed'
            },
            {
                status: 'Processing',
                date: order.date,
                time: '15:45',
                completed: order.status !== 'Processing',
                current: order.status === 'Processing',
                description: 'Your items are being picked and packed'
            },
            {
                status: 'Shipped',
                date: new Date(new Date(order.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: '09:15',
                completed: order.status === 'Shipped' || order.status === 'Delivered',
                current: order.status === 'Shipped',
                description: `Package dispatched via courier. Tracking: ${order.trackingNumber}`
            },
            {
                status: 'Out for Delivery',
                date: new Date(new Date(order.date).getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: '08:30',
                completed: order.status === 'Delivered',
                current: order.status === 'Out for Delivery',
                description: 'Package is out for delivery in your area'
            },
            {
                status: 'Delivered',
                date: new Date(new Date(order.date).getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: '16:45',
                completed: order.status === 'Delivered',
                current: false,
                description: 'Package delivered successfully'
            }
        ];

        return timeline;
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="order-tracking-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Page Header */}
                    <div className="col-12 mb-4">
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/user">My Account</Link></li>
                                <li className="breadcrumb-item"><Link to="/user?tab=orders">Orders</Link></li>
                                <li className="breadcrumb-item"><Link to={`/user/order/${order.id}`}>Order Details</Link></li>
                                <li className="breadcrumb-item active" aria-current="page">Tracking</li>
                            </ol>
                        </nav>
                        <h1 className="tc-6533 bold-text">Track Order #{order.id}</h1>
                    </div>

                    <div className="row">
                        {/* Tracking Timeline */}
                        <div className="col-lg-8 mb-4">
                            <div className="store-card fill-card">
                                {/* Order Summary */}
                                <div className="order-status-header mb-4">
                                    <div className="col-md-8">
                                        <h5 className="tc-6533 mb-2">Order Details</h5>
                                        <p className="mb-1"><strong>Order ID:</strong> {order.id}</p>
                                        <p className="mb-1"><strong>Order Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                                        <p className="mb-1"><strong>Total:</strong> £{order.total.toFixed(2)}</p>
                                        <p className="mb-1"><strong>Items:</strong> {order.items} item(s)</p>
                                        <p className="mb-1"><strong>Tracking Number:</strong></p>
                                        <div className="tracking-number-display">{order.trackingNumber}</div>
                                    </div>
                                    <div className="col-md-4 text-center">
                                        <img
                                            src={order.image}
                                            alt="Order"
                                            className="img-fluid rounded mb-2"
                                            style={{ maxHeight: '100px', objectFit: 'cover' }}
                                        />
                                        <span className={`badge bg-${getStatusColor(order.status)} fs-6`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Tracking Timeline */}
                                <h5 className="tc-6533 mb-4">Tracking Timeline</h5>
                                <div className="tracking-timeline">
                                    {getTrackingTimeline().map((event, index) => (
                                        <div key={index} className={`tracking-step ${event.completed ? 'completed' : 'pending'} ${event.current ? 'current' : ''}`}>
                                            <div className="tracking-step-indicator">
                                                <div className="tracking-step-icon">
                                                    {event.completed ? (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="20,6 9,17 4,12" />
                                                        </svg>
                                                    ) : (
                                                        <div className="tracking-step-number">{index + 1}</div>
                                                    )}
                                                </div>
                                                {index < getTrackingTimeline().length - 1 && (
                                                    <div className="tracking-step-connector"></div>
                                                )}
                                            </div>
                                            <div className="tracking-step-content">
                                                <div className="tracking-step-header">
                                                    <h6 className="tracking-step-title">{event.status}</h6>
                                                    <span className="tracking-step-time">
                                                        {new Date(event.date).toLocaleDateString()} • {event.time}
                                                    </span>
                                                </div>
                                                <p className="tracking-step-description">{event.description}</p>
                                                {event.completed && (
                                                    <div className="tracking-step-badge">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                        </svg>
                                                        Completed
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Estimated Delivery */}
                                {order.status !== 'Delivered' && (
                                    <div className="delivery-estimate-card mt-4">
                                        <div className="d-flex align-items-center">
                                            <div className="delivery-estimate-icon">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="1" y="3" width="15" height="13" />
                                                    <polygon points="16,6 16,16 21,16 21,11" />
                                                    <circle cx="5.5" cy="18.5" r="2.5" />
                                                    <circle cx="18.5" cy="18.5" r="2.5" />
                                                </svg>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="delivery-estimate-title">Estimated Delivery</h6>
                                                <p className="delivery-estimate-text mb-0">
                                                    {order.status === 'Processing' ?
                                                        'Your order will be shipped within 1-2 business days' :
                                                        order.status === 'Shipped' ?
                                                        'Expected delivery by tomorrow, 6:00 PM' :
                                                        'Your package is on the way!'
                                                    }
                                                </p>
                                            </div>
                                            <div className="delivery-estimate-badge">
                                                {order.status === 'Processing' ? '1-2 Days' : 
                                                 order.status === 'Shipped' ? 'Tomorrow' : 'Today'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="col-lg-4">
                            {/* Quick Actions */}
                            <div className="tracking-sidebar-card mb-4">
                                <h5 className="tc-6533 bold-text mb-3">Quick Actions</h5>
                                <div className="d-grid gap-2">
                                    <Link
                                        to={`/user/order/${order.id}`}
                                        className="btn btn-outline-primary btn-rd"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        View Order Details
                                    </Link>
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

                            {/* Delivery Information */}
                            <div className="tracking-sidebar-card mb-4">
                                <h5 className="tc-6533 bold-text mb-3">Delivery Information</h5>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Courier:</small>
                                    <span className="tc-6533">Royal Mail</span>
                                </div>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Service:</small>
                                    <span className="tc-6533">Next Day Delivery</span>
                                </div>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Tracking Number:</small>
                                    <code className="bg-light p-1 rounded">{order.trackingNumber}</code>
                                </div>
                            </div>

                            {/* Contact Support */}
                            <div className="tracking-sidebar-card support-card">
                                <h5 className="tc-6533 bold-text mb-3">Need Help?</h5>
                                <p className="text-muted mb-3 small">
                                    Having issues with your delivery? Our support team is here to help.
                                </p>
                                <div className="d-grid gap-2">
                                    <Link to="/contact" className="btn btn-outline-primary btn-sm">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        Contact Support
                                    </Link>
                                    <button className="btn btn-outline-secondary btn-sm">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                                        </svg>
                                        Call Us
                                    </button>
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
                        alert('Items added to cart successfully!');
                        setShowReorderModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default OrderTracking;