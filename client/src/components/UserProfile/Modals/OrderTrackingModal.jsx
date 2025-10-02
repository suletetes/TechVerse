import React from 'react';

const OrderTrackingModal = ({ onClose, order, getTrackingTimeline, getStatusColor }) => {
    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title tc-6533 fw-bold">
                            Track Order #{order.id}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {/* Order Summary */}
                        <div className="row mb-4">
                            <div className="col-md-8">
                                <h6 className="tc-6533 mb-2">Order Details</h6>
                                <p className="mb-1"><strong>Order ID:</strong> {order.id}</p>
                                <p className="mb-1"><strong>Order Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                                <p className="mb-1"><strong>Total:</strong> £{order.total.toFixed(2)}</p>
                                <p className="mb-1"><strong>Items:</strong> {order.items} item(s)</p>
                                {order.trackingNumber && (
                                    <p className="mb-1"><strong>Tracking Number:</strong>
                                        <span className="badge bg-info ms-2">{order.trackingNumber}</span>
                                    </p>
                                )}
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
                        <div className="mb-4">
                            <h6 className="tc-6533 mb-3">Tracking Timeline</h6>
                            <div className="timeline">
                                {getTrackingTimeline(order).map((event, index) => (
                                    <div key={index} className={`timeline-item ${event.completed ? 'completed' : 'pending'}`}>
                                        <div className="timeline-marker">
                                            <div className={`timeline-dot ${event.completed ? 'bg-success' : 'bg-secondary'}`}>
                                                {event.completed ? (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                    </svg>
                                                ) : (
                                                    <div className="timeline-pending"></div>
                                                )}
                                            </div>
                                            {index < getTrackingTimeline(order).length - 1 && (
                                                <div className={`timeline-line ${event.completed ? 'bg-success' : 'bg-light'}`}></div>
                                            )}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <h6 className={`mb-0 ${event.completed ? 'tc-6533' : 'text-muted'}`}>
                                                    {event.status}
                                                </h6>
                                                <small className="text-muted">
                                                    {new Date(event.date).toLocaleDateString()} at {event.time}
                                                </small>
                                            </div>
                                            <p className={`mb-0 small ${event.completed ? 'tc-6533' : 'text-muted'}`}>
                                                {event.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Estimated Delivery */}
                        {order.status !== 'Delivered' && (
                            <div className="alert alert-info">
                                <div className="d-flex align-items-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                    </svg>
                                    <div>
                                        <h6 className="alert-heading mb-1">Estimated Delivery</h6>
                                        <small className="mb-0">
                                            {order.status === 'Processing' ?
                                                'Your order will be shipped within 1-2 business days' :
                                                'Expected delivery by tomorrow, 6:00 PM'
                                            }
                                        </small>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contact Support */}
                        <div className="text-center">
                            <p className="text-muted mb-2">Need help with your order?</p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-outline-primary btn-sm">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                        <path fill="currentColor" d="M20,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6A2,2 0 0,0 20,4M20,18H4V8L12,13L20,8V18M20,6L12,11L4,6V6H20V6Z" />
                                    </svg>
                                    Contact Support
                                </button>
                                <button className="btn btn-outline-secondary btn-sm">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                        <path fill="currentColor" d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                                    </svg>
                                    Call Us
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingModal;