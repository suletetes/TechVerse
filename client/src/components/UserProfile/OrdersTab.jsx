import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrder, useCart } from '../../context';
import { LoadingSpinner, Toast } from '../Common';
import { useDebounce } from '../../hooks/useDebounce';
import { 
    ReorderModal, 
    OrderTrackingModal, 
    OrderConfirmModal
} from './Modals';

const OrdersTab = () => {
    const { 
        orders, 
        isLoading, 
        error,
        loadOrders, 
        cancelOrder
    } = useOrder();
    
    const { addToCart } = useCart();

    const [orderFilters, setOrderFilters] = useState({
        searchTerm: '',
        status: 'all',
        dateRange: 'all'
    });

    // Debounce search term for better performance
    const debouncedSearchTerm = useDebounce(orderFilters.searchTerm, 300);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;

    // Modal states
    const [activeModal, setActiveModal] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [toast, setToast] = useState(null);

    // Load orders on component mount
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const getFilteredOrders = () => {
        const safeOrders = Array.isArray(orders) ? orders : [];
        return safeOrders.filter(order => {
            const matchesSearch = debouncedSearchTerm === '' || 
                order.orderNumber?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            const matchesStatus = orderFilters.status === 'all' || order.status === orderFilters.status;
            return matchesSearch && matchesStatus;
        });
    };

    const getPaginatedOrders = () => {
        const filtered = getFilteredOrders();
        const startIndex = (currentPage - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        return filtered.slice(startIndex, endIndex);
    };

    const totalPages = Math.ceil(getFilteredOrders().length / ordersPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [orderFilters]);

    const handleOrderAction = async (orderId, action) => {
        const order = orders.find(o => o._id === orderId);
        
        try {
            switch (action) {
                case 'cancel':
                    setSelectedOrder(order);
                    setActiveModal('cancel');
                    break;
                case 'return':
                    setSelectedOrder(order);
                    setActiveModal('return');
                    break;
                case 'reorder':
                    setSelectedOrder(order);
                    setActiveModal('reorder');
                    break;
                case 'track':
                    setSelectedOrder(order);
                    setActiveModal('track');
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Error handling order action:', error);
            setToast({
                message: `Failed to ${action} order. Please try again.`,
                type: 'error'
            });
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder) return;
        
        try {
            await cancelOrder(selectedOrder._id, 'User requested cancellation');
            setToast({
                message: 'Order cancelled successfully!',
                type: 'success'
            });
            await loadOrders();
            setActiveModal(null);
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error cancelling order:', error);
            setToast({
                message: 'Failed to cancel order. Please try again.',
                type: 'error'
            });
        }
    };

    const handleReturnOrder = async () => {
        if (!selectedOrder) return;
        
        // Implement return logic here
        setToast({
            message: 'Return request submitted successfully! Our team will contact you soon.',
            type: 'success'
        });
        setActiveModal(null);
        setSelectedOrder(null);
    };

    const handleReorder = async (selectedItems, itemQuantities) => {
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
            setActiveModal(null);
            setSelectedOrder(null);
        } catch (error) {
            setToast({
                message: 'Failed to add items to cart. Please try again.',
                type: 'error'
            });
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedOrder(null);
    };

    // Helper functions for modals
    const getTrackingTimeline = (order) => {
        const timeline = [
            {
                status: 'Order Placed',
                description: 'Your order has been received',
                date: order.createdAt,
                time: new Date(order.createdAt).toLocaleTimeString(),
                completed: true
            },
            {
                status: 'Processing',
                description: 'Your order is being prepared',
                date: order.createdAt,
                time: new Date(order.createdAt).toLocaleTimeString(),
                completed: ['processing', 'shipped', 'delivered'].includes(order.status)
            },
            {
                status: 'Shipped',
                description: 'Your order is on the way',
                date: order.updatedAt,
                time: new Date(order.updatedAt).toLocaleTimeString(),
                completed: ['shipped', 'delivered'].includes(order.status)
            },
            {
                status: 'Delivered',
                description: 'Your order has been delivered',
                date: order.updatedAt,
                time: new Date(order.updatedAt).toLocaleTimeString(),
                completed: order.status === 'delivered'
            }
        ];
        return timeline;
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'pending': 'warning',
            'confirmed': 'info',
            'processing': 'primary',
            'shipped': 'success',
            'delivered': 'success',
            'cancelled': 'danger',
            'refunded': 'secondary'
        };
        return statusColors[status?.toLowerCase()] || 'secondary';
    };

    if (isLoading && orders.length === 0) {
        return (
            <div className="store-card fill-card d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="store-card fill-card">
                <div className="alert alert-danger">
                    <h5 className="mb-3">Error Loading Orders</h5>
                    <p className="mb-3">{error}</p>
                    <button className="btn btn-primary" onClick={() => loadOrders()}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="store-card fill-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="tc-6533 bold-text mb-0">Order History</h3>
                    <span className="badge bg-secondary">{getFilteredOrders().length} orders</span>
                </div>

            {/* Order Filters */}
            <div className="order-filters mb-4">
                <div className="row align-items-center">
                    <div className="col-lg-6 mb-3 mb-lg-0">
                        <div className="order-search-container">
                            <svg width="16" height="16" viewBox="0 0 24 24" className="order-search-icon" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by order ID..."
                                value={orderFilters.searchTerm}
                                onChange={(e) => setOrderFilters({ ...orderFilters, searchTerm: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="d-flex gap-3 justify-content-lg-end">
                            <select
                                className="form-select"
                                value={orderFilters.status}
                                onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value })}
                                style={{ maxWidth: '140px' }}
                            >
                                <option value="all">All Status</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select
                                className="form-select"
                                value={orderFilters.dateRange}
                                onChange={(e) => setOrderFilters({ ...orderFilters, dateRange: e.target.value })}
                                style={{ maxWidth: '140px' }}
                            >
                                <option value="all">All Time</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="90days">Last 90 Days</option>
                                <option value="1year">Last Year</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {getFilteredOrders().length === 0 ? (
                <div className="text-center py-5">
                    <h5 className="tc-6533 mb-3">No orders yet</h5>
                    <p className="tc-6533 mb-4">Start shopping to see your orders here</p>
                    <Link to="/" className="btn btn-c-2101 btn-rd">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <>
                <div className="row">
                    {getPaginatedOrders().map((order) => {
                        const firstItem = order.items?.[0] || {};
                        const itemCount = order.items?.length || 0;
                        const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                        const canReturn = order.status === 'delivered';
                        const canReorder = true;

                        return (
                            <div key={order._id} className="col-12 mb-3">
                                <div className="border rounded p-3">
                                    <div className="row align-items-center">
                                        <div className="col-md-2 col-3 mb-3 mb-md-0">
                                            <img
                                                src={firstItem.image || '/img/placeholder.jpg'}
                                                className="img-fluid rounded"
                                                alt="Order"
                                                width="60"
                                                height="60"
                                            />
                                        </div>
                                        <div className="col-md-3 col-9 mb-3 mb-md-0">
                                            <h6 className="tc-6533 mb-1">Order #{order.orderNumber}</h6>
                                            <p className="tc-6533 sm-text mb-1">{orderDate}</p>
                                            <p className="tc-6533 sm-text mb-0">{itemCount} items</p>
                                        </div>
                                        <div className="col-md-2 col-6 mb-3 mb-md-0">
                                            <span className={`badge bg-${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="col-md-2 col-6 mb-3 mb-md-0">
                                            <p className="tc-6533 bold-text mb-0">${order.total.toFixed(2)}</p>
                                        </div>
                                        <div className="col-md-3 col-12">
                                            <div className="d-flex gap-2 flex-wrap justify-content-end">
                                                <Link 
                                                    to={`/order-confirmation/${order.orderNumber}`}
                                                    className="btn btn-sm btn-outline-success btn-rd"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                    View
                                                </Link>
                                                <Link 
                                                    to={`/user/order/${order._id}`}
                                                    className="btn btn-sm btn-outline-primary btn-rd"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                    Details
                                                </Link>
                                                <Link
                                                    to={`/user/order/${order._id}/tracking`}
                                                    className="btn btn-sm btn-outline-info btn-rd"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M16 3h5v5" />
                                                        <path d="M8 3H3v5" />
                                                        <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
                                                        <path d="M21 3l-7.828 7.828A4 4 0 0 0 12 13.657V22" />
                                                    </svg>
                                                    Track
                                                </Link>
                                                {(order.status === 'pending' || order.status === 'confirmed') && (
                                                    <button
                                                        className="btn btn-sm btn-outline-danger btn-rd"
                                                        onClick={() => handleOrderAction(order._id, 'cancel')}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="15" y1="9" x2="9" y2="15" />
                                                            <line x1="9" y1="9" x2="15" y2="15" />
                                                        </svg>
                                                        Cancel
                                                    </button>
                                                )}
                                                {canReturn && (
                                                    <button
                                                        className="btn btn-sm btn-outline-warning btn-rd"
                                                        onClick={() => handleOrderAction(order._id, 'return')}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="9 11 12 14 22 4" />
                                                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                                        </svg>
                                                        Return
                                                    </button>
                                                )}
                                                {canReorder && (
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary btn-rd"
                                                        onClick={() => handleOrderAction(order._id, 'reorder')}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="23 4 23 10 17 10" />
                                                            <polyline points="1 20 1 14 7 14" />
                                                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                                        </svg>
                                                        Reorder
                                                    </button>
                                                )}
                                                {order.status === 'delivered' && (
                                                    <Link
                                                        to={`/user/order/${order._id}/review`}
                                                        className="btn btn-sm btn-c-2101 btn-rd"
                                                        title={order.reviewedAt ? 'Edit your review' : 'Write a review'}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                        </svg>
                                                        {order.reviewedAt ? 'Edit' : 'Review'}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center mt-4">
                        <nav aria-label="Order pagination">
                            <ul className="pagination mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                </li>
                                
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNum = index + 1;
                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                <button 
                                                    className="page-link" 
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    } else if (
                                        pageNum === currentPage - 2 ||
                                        pageNum === currentPage + 2
                                    ) {
                                        return (
                                            <li key={pageNum} className="page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}
                                
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                        <span className="ms-3 text-muted small">
                            Page {currentPage} of {totalPages} ({getFilteredOrders().length} orders)
                        </span>
                    </div>
                )}
                </>
            )}
            </div>

            {/* Modals */}
            {activeModal === 'reorder' && selectedOrder && (
                <ReorderModal
                    onClose={closeModal}
                    order={selectedOrder}
                    onReorder={handleReorder}
                />
            )}

            {activeModal === 'track' && selectedOrder && (
                <OrderTrackingModal
                    onClose={closeModal}
                    order={{
                        id: selectedOrder.orderNumber,
                        date: selectedOrder.createdAt,
                        total: selectedOrder.total,
                        items: selectedOrder.items?.length || 0,
                        status: selectedOrder.status,
                        image: selectedOrder.items?.[0]?.image || '/img/placeholder.jpg',
                        trackingNumber: selectedOrder.tracking?.trackingNumber
                    }}
                    getTrackingTimeline={getTrackingTimeline}
                    getStatusColor={getStatusColor}
                />
            )}

            {activeModal === 'cancel' && selectedOrder && (
                <OrderConfirmModal
                    onClose={closeModal}
                    order={{
                        id: selectedOrder.orderNumber,
                        date: selectedOrder.createdAt,
                        total: selectedOrder.total,
                        items: selectedOrder.items?.length || 0,
                        image: selectedOrder.items?.[0]?.image || '/img/placeholder.jpg'
                    }}
                    onConfirm={handleCancelOrder}
                    title="Cancel Order"
                    message="Are you sure you want to cancel this order? This action cannot be undone."
                    confirmText="Cancel Order"
                    confirmClass="btn-danger"
                />
            )}

            {activeModal === 'return' && selectedOrder && (
                <OrderConfirmModal
                    onClose={closeModal}
                    order={{
                        id: selectedOrder.orderNumber,
                        date: selectedOrder.createdAt,
                        total: selectedOrder.total,
                        items: selectedOrder.items?.length || 0,
                        image: selectedOrder.items?.[0]?.image || '/img/placeholder.jpg'
                    }}
                    onConfirm={handleReturnOrder}
                    title="Return Order"
                    message="Request a return for this order. Our team will contact you within 24 hours."
                    confirmText="Request Return"
                    confirmClass="btn-warning"
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
        </>
    );
};

export default OrdersTab;