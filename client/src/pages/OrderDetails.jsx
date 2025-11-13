import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useOrder, useCart } from '../context';
import { LoadingSpinner, Toast } from '../components/Common';
import { ReorderModal } from '../components/UserProfile/Modals';

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { loadOrder, currentOrder, isLoading, error } = useOrder();
    const { addToCart } = useCart();
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (orderId) {
            loadOrder(orderId);
        }
    }, [orderId, loadOrder]);

    if (isLoading) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc" style={{ minHeight: '60vh' }}>
                <div className="container bloc-md">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error || !currentOrder) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc">
                <div className="container bloc-md">
                    <div className="alert alert-danger">
                        <h4>Order Not Found</h4>
                        <p>{error || 'Unable to load order details'}</p>
                        <Link to="/profile?tab=orders" className="btn btn-primary">
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const order = currentOrder;

    const getStatusColor = (status) => {
        if (!status) return 'secondary';
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
                  

                    <div className="row">
                        {/* Order Items */}
                        <div className="col-lg-8 mb-4">
                            <div className="store-card fill-card mb-4">
                                <h3 className="tc-6533 bold-text mb-4">Order Items</h3>
                                {Array.isArray(order.items) ? order.items.map((item, index) => (
                                    <div key={item._id || index} className="d-flex align-items-center p-3 border-bottom">
                                        <img
                                            src={item.image || '/img/placeholder.jpg'}
                                            alt={item.name}
                                            className="rounded me-3"
                                            width="80"
                                            height="80"
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <div className="flex-grow-1">
                                            <h5 className="tc-6533 mb-1">{item.name}</h5>
                                            {item.variants && item.variants.length > 0 && (
                                                <p className="tc-6533 mb-1">
                                                    {item.variants.map(v => `${v.name}: ${v.value}`).join(', ')}
                                                </p>
                                            )}
                                            <p className="tc-6533 mb-0">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="text-end">
                                            <p className="tc-6533 bold-text h5 mb-0">${(item.price || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                )) : []}
                            </div>

                            {/* Shipping Address */}
                            <div className="store-card fill-card mb-4">
                                <h5 className="tc-6533 bold-text mb-3">Shipping Address</h5>
                                {order.shippingAddress ? (
                                    <>
                                        <p className="tc-6533 mb-1">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                                        <p className="tc-6533 mb-1">{order.shippingAddress.address}</p>
                                        <p className="tc-6533 mb-1">{order.shippingAddress.city}</p>
                                        <p className="tc-6533 mb-1">{order.shippingAddress.postcode}</p>
                                        <p className="tc-6533 mb-0">{order.shippingAddress.country}</p>
                                        {order.shippingAddress.phone && (
                                            <p className="tc-6533 mb-0 mt-2">Phone: {order.shippingAddress.phone}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="tc-6533 text-muted">No shipping address available</p>
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="col-lg-4">
                            <div className="store-card fill-card mb-4">
                                <h3 className="tc-6533 bold-text mb-4">Order Summary</h3>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="tc-6533">Subtotal:</span>
                                    <span className="tc-6533">${(order.subtotal || 0).toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="tc-6533">Shipping:</span>
                                    <span className="tc-6533">
                                        {order.shipping?.cost === 0 ? 'FREE' : `$${(order.shipping?.cost || 0).toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between mb-3">
                                    <span className="tc-6533">Tax (VAT):</span>
                                    <span className="tc-6533">${(order.tax || 0).toFixed(2)}</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between mb-4">
                                    <span className="tc-6533 bold-text h5">Total:</span>
                                    <span className="tc-2101 bold-text h5">${(order.total || 0).toFixed(2)}</span>
                                </div>

                                {/* Payment Method */}
                                {order.payment && (
                                    <>
                                        <h5 className="tc-6533 bold-text mb-3">Payment</h5>
                                        <div className="mb-4">
                                            <p className="tc-6533 mb-1">Method: {order.payment.method}</p>
                                            <p className="tc-6533 mb-1">Status: <span className="text-success">{order.payment.status}</span></p>
                                        </div>
                                    </>
                                )}

                                {order.tracking?.trackingNumber && (
                                    <>
                                        <h5 className="tc-6533 bold-text mb-3">Tracking</h5>
                                        <div className="mb-4">
                                            <p className="tc-6533 mb-2">Tracking Number:</p>
                                            <code className="bg-light p-2 rounded d-block">{order.tracking.trackingNumber}</code>
                                        </div>
                                    </>
                                )}

                                {/* Action Buttons */}
                                <div className="d-grid gap-2">
                                    {order.tracking?.trackingNumber && (
                                        <Link
                                            to={`/user/order/${order._id}/tracking`}
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
                                    {order.status === 'delivered' && (
                                        <Link
                                            to={`/user/order/${order._id}/review`}
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
                    onReorder={async (selectedItems, itemQuantities) => {
                        try {
                            for (const item of selectedItems) {
                                const quantity = itemQuantities[item.id]?.quantity || 1;
                                const productId = item.id;
                                
                                const options = {};
                                if (item.variants && Array.isArray(item.variants)) {
                                    item.variants.forEach(variant => {
                                        if (variant.name && variant.value) {
                                            options[variant.name] = variant.value;
                                        }
                                    });
                                }
                                
                                await addToCart(productId, quantity, options);
                            }
                            
                            setToast({
                                message: 'Items added to cart successfully!',
                                type: 'success',
                                action: {
                                    label: 'View Cart',
                                    path: '/cart'
                                }
                            });
                            setShowReorderModal(false);
                        } catch (error) {
                            setToast({
                                message: 'Failed to add items to cart. Please try again.',
                                type: 'error'
                            });
                        }
                    }}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    action={toast.action}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default OrderDetails;
