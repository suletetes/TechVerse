import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrder } from '../../context';
import { LoadingSpinner } from '../Common';

const OrdersTab = () => {
    const { 
        orders, 
        pagination,
        isLoading, 
        error,
        loadOrders, 
        cancelOrder,
        getOrderById,
        formatOrderStatus
    } = useOrder();

    const [orderFilters, setOrderFilters] = useState({
        searchTerm: '',
        status: 'all',
        dateRange: 'all'
    });

    // Load orders on component mount
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const getFilteredOrders = () => {
        return orders.filter(order => {
            const matchesSearch = orderFilters.searchTerm === '' || 
                order.orderNumber?.toLowerCase().includes(orderFilters.searchTerm.toLowerCase());
            const matchesStatus = orderFilters.status === 'all' || order.status === orderFilters.status;
            return matchesSearch && matchesStatus;
        });
    };

    const handleOrderAction = async (orderId, action) => {
        try {
            switch (action) {
                case 'cancel':
                    await cancelOrder(orderId, 'User requested cancellation');
                    break;
                case 'reorder':
                    // Handle reorder logic
                    console.log('Reorder:', orderId);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Error handling order action:', error);
        }
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
                    <div className="d-flex align-items-center mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" className="text-danger me-2">
                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <h5 className="mb-0">Error Loading Orders</h5>
                    </div>
                    <p className="mb-3">{error}</p>
                    <button className="btn btn-primary" onClick={() => loadOrders()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                        </svg>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    return (
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
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z" />
                    </svg>
                    <h5 className="tc-6533 mb-3">No orders yet</h5>
                    <p className="tc-6533 mb-4">Start shopping to see your orders here</p>
                    <Link to="/" className="btn btn-c-2101 btn-rd">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {getFilteredOrders().map((order) => (
                        <div key={order.id} className="col-12 mb-3">
                            <div className="border rounded p-3">
                                <div className="row align-items-center">
                                    <div className="col-md-2 col-3 mb-3 mb-md-0">
                                        <img
                                            src={order.image}
                                            className="img-fluid rounded"
                                            alt="Order"
                                            width="60"
                                            height="60"
                                        />
                                    </div>
                                    <div className="col-md-3 col-9 mb-3 mb-md-0">
                                        <h6 className="tc-6533 mb-1">Order #{order.id}</h6>
                                        <p className="tc-6533 sm-text mb-1">{order.date}</p>
                                        <p className="tc-6533 sm-text mb-0">{order.items} items</p>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3 mb-md-0">
                                        <span className={`badge bg-${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3 mb-md-0">
                                        <p className="tc-6533 bold-text mb-0">£{order.total.toFixed(2)}</p>
                                    </div>
                                    <div className="col-md-3 col-12">
                                        <div className="d-flex gap-2 flex-wrap justify-content-end">
                                            <Link 
                                                to={`/user/order/${order.id}`}
                                                className="btn btn-sm btn-outline-primary btn-rd"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                Details
                                            </Link>
                                            {order.trackingNumber && (
                                                <Link
                                                    to={`/user/order/${order.id}/tracking`}
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
                                            )}
                                            {order.canReturn && (
                                                <button
                                                    className="btn btn-sm btn-outline-warning btn-rd"
                                                    onClick={() => handleOrderAction(order.id, 'return')}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="9 11 12 14 22 4" />
                                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                                    </svg>
                                                    Return
                                                </button>
                                            )}
                                            {order.canReorder && (
                                                <button
                                                    className="btn btn-sm btn-outline-secondary btn-rd"
                                                    onClick={() => handleOrderAction(order.id, 'reorder')}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="23 4 23 10 17 10" />
                                                        <polyline points="1 20 1 14 7 14" />
                                                        <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                                    </svg>
                                                    Reorder
                                                </button>
                                            )}
                                            {order.status === 'Delivered' && (
                                                <Link
                                                    to={`/user/order/${order.id}/review`}
                                                    className="btn btn-sm btn-c-2101 btn-rd"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                    </svg>
                                                    Review
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersTab;