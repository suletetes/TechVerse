import React, { useState, useEffect } from 'react';
import { adminDataManager } from '../../utils/AdminDataManager.js';

const AdminOrdersNew = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        dateFrom: '',
        dateTo: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    // Load orders
    useEffect(() => {
        loadOrders();
    }, [filters]);

    // Set up data manager listener
    useEffect(() => {
        const unsubscribe = adminDataManager.addListener('orders', (data) => {
            setLoading(data.loading);
            setError(data.error);
            if (data.data) {
                setOrders(data.data);
            }
            if (data.pagination) {
                setPagination(data.pagination);
            }
        });

        return unsubscribe;
    }, []);

    const loadOrders = async () => {
        try {
            await adminDataManager.loadOrders(filters);
        } catch (err) {
            console.error('Failed to load orders:', err);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            // Update order status via API
            console.log(`Updating order ${orderId} to status: ${newStatus}`);
            // Reload orders after update
            await loadOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'warning',
            'confirmed': 'info',
            'processing': 'primary',
            'shipped': 'success',
            'delivered': 'success',
            'cancelled': 'danger',
            'refunded': 'secondary'
        };
        return colors[status?.toLowerCase()] || 'secondary';
    };

    if (loading) {
        return (
            <div className="store-card fill-card">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading orders...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading orders from database...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="store-card fill-card">
                <div className="text-center py-5">
                    <div className="alert alert-danger mx-4">
                        <h5 className="alert-heading">Error Loading Orders</h5>
                        <p className="mb-0">{error}</p>
                        <hr />
                        <div className="d-flex gap-2 justify-content-center">
                            <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => window.resetTechVerseAuth?.()}
                            >
                                Reset Auth
                            </button>
                            <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={loadOrders}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="store-card fill-card">
            {/* Header */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
                <div>
                    <h3 className="tc-6533 bold-text mb-1">Order Management</h3>
                    <p className="text-muted mb-0">Manage and track customer orders</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-secondary btn-rd"
                        onClick={loadOrders}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <label className="form-label">Status</label>
                    <select 
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <label className="form-label">Search</label>
                    <input 
                        type="text"
                        className="form-control"
                        placeholder="Order ID, customer name..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                <div className="col-md-2">
                    <label className="form-label">From Date</label>
                    <input 
                        type="date"
                        className="form-control"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    />
                </div>
                <div className="col-md-2">
                    <label className="form-label">To Date</label>
                    <input 
                        type="date"
                        className="form-control"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    />
                </div>
                <div className="col-md-2">
                    <label className="form-label">&nbsp;</label>
                    <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={() => setFilters({status: '', search: '', dateFrom: '', dateTo: ''})}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Orders Stats */}
            <div className="row g-3 mb-4">
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-primary mb-1">{orders.length}</h3>
                            <p className="text-muted mb-0">Total Orders</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-warning mb-1">
                                {orders.filter(o => o.status === 'pending').length}
                            </h3>
                            <p className="text-muted mb-0">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-info bg-opacity-10 border-info border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-info mb-1">
                                {orders.filter(o => o.status === 'processing').length}
                            </h3>
                            <p className="text-muted mb-0">Processing</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-success mb-1">
                                {orders.filter(o => ['shipped', 'delivered'].includes(o.status)).length}
                            </h3>
                            <p className="text-muted mb-0">Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th className="border-0 fw-semibold">Order ID</th>
                            <th className="border-0 fw-semibold">Customer</th>
                            <th className="border-0 fw-semibold">Date</th>
                            <th className="border-0 fw-semibold">Total</th>
                            <th className="border-0 fw-semibold">Status</th>
                            <th className="border-0 fw-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order._id || order.id}>
                                <td>
                                    <span className="fw-semibold text-primary">
                                        {order.orderNumber || order._id?.slice(-8) || 'N/A'}
                                    </span>
                                </td>
                                <td>
                                    <div>
                                        <div className="fw-medium">
                                            {order.user?.firstName && order.user?.lastName 
                                                ? `${order.user.firstName} ${order.user.lastName}`
                                                : order.user?.email || 'Unknown Customer'
                                            }
                                        </div>
                                        <small className="text-muted">{order.user?.email}</small>
                                    </div>
                                </td>
                                <td>
                                    <span className="text-muted">
                                        {formatDate(order.createdAt)}
                                    </span>
                                </td>
                                <td>
                                    <span className="fw-semibold">
                                        {formatCurrency(order.total)}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge bg-${getStatusColor(order.status)} bg-opacity-15 text-${getStatusColor(order.status)} border border-${getStatusColor(order.status)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="btn-group btn-group-sm">
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            title="View Order"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                            </svg>
                                        </button>
                                        <select
                                            className="form-select form-select-sm"
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order._id || order.id, e.target.value)}
                                            style={{ minWidth: '120px' }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {orders.length === 0 && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z" />
                    </svg>
                    <h5 className="text-muted">No Orders Found</h5>
                    <p className="text-muted mb-0">No orders match your current filters.</p>
                </div>
            )}
        </div>
    );
};

export default AdminOrdersNew;