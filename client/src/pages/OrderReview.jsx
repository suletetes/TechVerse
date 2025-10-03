import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReviewsSection } from '../components';

const OrderReview = () => {
    const { orderId } = useParams();

    // Mock order data - in real app, fetch based on orderId
    const order = {
        id: orderId || 'TV-2024-001234',
        date: '2024-01-15',
        status: 'Delivered',
        total: 3597.60,
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
        ]
    };

    const handleReviewSubmit = (reviewData) => {
        console.log('Review submitted for order:', order.id, reviewData);
        alert('Thank you for your review! Your feedback helps other customers make informed decisions.');
        // In real app, redirect to order details or orders list
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="order-review-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Page Header */}
                    <div className="col-12 mb-4">
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/user">My Account</Link></li>
                                <li className="breadcrumb-item"><Link to="/user?tab=orders">Orders</Link></li>
                                <li className="breadcrumb-item"><Link to={`/user/order/${order.id}`}>Order Details</Link></li>
                                <li className="breadcrumb-item active" aria-current="page">Write Review</li>
                            </ol>
                        </nav>
                        <h1 className="tc-6533 bold-text">Write Review for Order #{order.id}</h1>
                        <p className="tc-6533">Share your experience with the products from this order</p>
                    </div>

                    <div className="row">
                        {/* Review Form */}
                        <div className="col-lg-8 mb-4">
                            <div className="store-card fill-card">
                                <h3 className="tc-6533 bold-text mb-4">Product Reviews</h3>
                                
                                {/* Order Items to Review */}
                                <div className="mb-4">
                                    <h5 className="tc-6533 mb-3">Items in this order:</h5>
                                    {order.items.map((item) => (
                                        <div key={item.id} className="d-flex align-items-center p-3 border rounded mb-3">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="rounded me-3"
                                                width="60"
                                                height="60"
                                                style={{ objectFit: 'cover' }}
                                            />
                                            <div className="flex-grow-1">
                                                <h6 className="tc-6533 mb-1">{item.name}</h6>
                                                <p className="tc-6533 mb-0 small">{item.color}, {item.storage}</p>
                                            </div>
                                            <div className="text-end">
                                                <p className="tc-6533 bold-text mb-0">£{item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Review Form */}
                                <ReviewsSection
                                    showHeader={false}
                                    showDividers={false}
                                    onSubmitReview={handleReviewSubmit}
                                    showSummary={false}
                                    showReviews={false}
                                    showLoadMore={false}
                                    showWriteReview={true}
                                    customTitle="Rate Your Purchase"
                                    customDescription="Help other customers by sharing your honest feedback about these products."
                                />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="col-lg-4">
                            {/* Order Summary */}
                            <div className="store-card fill-card mb-4">
                                <h5 className="tc-6533 bold-text mb-3">Order Summary</h5>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Order ID:</small>
                                    <span className="tc-6533">{order.id}</span>
                                </div>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Order Date:</small>
                                    <span className="tc-6533">{new Date(order.date).toLocaleDateString()}</span>
                                </div>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Total Amount:</small>
                                    <span className="tc-6533 bold-text">£{order.total.toFixed(2)}</span>
                                </div>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Status:</small>
                                    <span className="badge bg-success">{order.status}</span>
                                </div>
                            </div>

                            {/* Review Guidelines */}
                            <div className="store-card fill-card mb-4">
                                <h5 className="tc-6533 bold-text mb-3">Review Guidelines</h5>
                                <ul className="small tc-6533 mb-0">
                                    <li className="mb-2">Be honest and helpful in your review</li>
                                    <li className="mb-2">Focus on the product's features and performance</li>
                                    <li className="mb-2">Mention both pros and cons if applicable</li>
                                    <li className="mb-2">Keep your review relevant to the product</li>
                                    <li className="mb-0">Avoid personal information in your review</li>
                                </ul>
                            </div>

                            {/* Quick Actions */}
                            <div className="store-card fill-card">
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
                                    <button className="btn btn-outline-secondary btn-rd">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="23 4 23 10 17 10" />
                                            <polyline points="1 20 1 14 7 14" />
                                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        Reorder Items
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderReview;