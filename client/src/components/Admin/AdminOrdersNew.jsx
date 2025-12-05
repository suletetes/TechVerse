import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../api/services/index.js';
import { adminDataStore } from '../../utils/AdminDataStore';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api.js';

const AdminOrdersNew = () => {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        dateRange: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10
    });
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Load orders only once on mount or when data is stale
    useEffect(() => {
        if (!adminDataStore.isDataFresh('orders')) {
            loadOrders();
        } else {
            setAllOrders(adminDataStore.getData('orders'));
            setLoading(false);
        }

        // Listen for data updates
        const unsubscribe = adminDataStore.addListener('orders', (data) => {
            setAllOrders(data.data || []);
            setLoading(data.loading || false);
            setError(data.error);
        });

        return unsubscribe;
    }, []);
    
    // Reset to page 1 when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [filters, sortBy, sortOrder]);

    const loadOrders = async () => {
        try {
            adminDataStore.setLoading('orders', true);
            adminDataStore.setError('orders', null);
            const response = await adminService.getAdminOrders({ limit: 1000 });
            
            let backendOrders = [];
            if (response?.data?.orders) {
                backendOrders = response.data.orders;
            } else if (response?.orders) {
                backendOrders = response.orders;
            } else if (Array.isArray(response)) {
                backendOrders = response;
            }
            
            adminDataStore.setData('orders', backendOrders);
            
        } catch (err) {
            console.error('Error loading orders:', err);
            adminDataStore.setError('orders', err.message);
            
            // Try direct API call as fallback
            try {
                const token = localStorage.getItem('token');
                const directResponse = await fetch(`${API_BASE_URL}/api/admin/orders?limit=1000`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (directResponse.ok) {
                    const directData = await directResponse.json();
                    const directOrders = directData?.data?.orders || directData?.orders || directData || [];
                    console.log(`🎉 Found ${directOrders.length} orders via direct API`);
                    adminDataStore.setData('orders', directOrders);
                } else {
                    throw new Error(`API returned ${directResponse.status}`);
                }
            } catch (directErr) {
                console.error('❌ Direct API call also failed:', directErr);
                adminDataStore.setError('orders', `Failed to load orders: ${err.message}`);
            }
        } finally {
            adminDataStore.setLoading('orders', false);
        }
    };

    // Computed filtered and paginated orders
    const { filteredOrders, paginatedOrders, totalPages } = useMemo(() => {
        let filtered = [...allOrders];
        
        // Apply search filter
        if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase().trim();
            filtered = filtered.filter(order =>
                order._id?.toLowerCase().includes(searchTerm) ||
                order.orderNumber?.toLowerCase().includes(searchTerm) ||
                order.user?.email?.toLowerCase().includes(searchTerm) ||
                order.user?.firstName?.toLowerCase().includes(searchTerm) ||
                order.user?.lastName?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply status filter
        if (filters.status) {
            filtered = filtered.filter(order => {
                const orderStatus = order.status || 'pending';
                return orderStatus === filters.status;
            });
        }
        
        // Apply date range filter
        if (filters.dateRange) {
            const now = new Date();
            let cutoffDate;
            
            switch (filters.dateRange) {
                case 'today':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'year':
                    cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    cutoffDate = null;
            }
            
            if (cutoffDate) {
                filtered = filtered.filter(order => {
                    const orderDate = new Date(order.createdAt || order.dateCreated);
                    return orderDate >= cutoffDate;
                });
            }
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'createdAt':
                    aValue = new Date(a.createdAt || 0);
                    bValue = new Date(b.createdAt || 0);
                    break;
                case 'total':
                    aValue = a.total || 0;
                    bValue = b.total || 0;
                    break;
                case 'status':
                    aValue = (a.status || 'pending').toLowerCase();
                    bValue = (b.status || 'pending').toLowerCase();
                    break;
                default:
                    aValue = new Date(a.createdAt || 0);
                    bValue = new Date(b.createdAt || 0);
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Calculate pagination
        const totalPages = Math.ceil(filtered.length / pagination.limit);
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginated = filtered.slice(startIndex, endIndex);
        
        return {
            filteredOrders: filtered,
            paginatedOrders: paginated,
            totalPages
        };
    }, [allOrders, filters, sortBy, sortOrder, pagination.page, pagination.limit]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            status: '',
            search: '',
            dateRange: ''
        });
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(price || 0);
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
            'processing': 'info',
            'shipped': 'primary',
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
                    <p className="text-muted mb-0">Manage customer orders and fulfillment</p>
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
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <label className="form-label">Date Range</label>
                    <select 
                        className="form-select"
                        value={filters.dateRange}
                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    >
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label">Search</label>
                    <input 
                        type="text"
                        className="form-control"
                        placeholder="Order ID, customer name, email..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <label className="form-label">&nbsp;</label>
                    <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={handleClearFilters}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Order Stats */}
            <div className="row g-3 mb-4">
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-primary mb-1">{allOrders.length}</h3>
                            <p className="text-muted mb-0">Total Orders</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-warning mb-1">
                                {allOrders.filter(o => (o.status || 'pending') === 'pending').length}
                            </h3>
                            <p className="text-muted mb-0">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-info bg-opacity-10 border-info border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-info mb-1">
                                {allOrders.filter(o => (o.status || 'pending') === 'processing').length}
                            </h3>
                            <p className="text-muted mb-0">Processing</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-success mb-1">
                                {allOrders.filter(o => (o.status || 'pending') === 'delivered').length}
                            </h3>
                            <p className="text-muted mb-0">Delivered</p>
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
                            <th 
                                className="border-0 fw-semibold cursor-pointer"
                                onClick={() => handleSortChange('total')}
                            >
                                Total {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="border-0 fw-semibold cursor-pointer"
                                onClick={() => handleSortChange('status')}
                            >
                                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="border-0 fw-semibold cursor-pointer"
                                onClick={() => handleSortChange('createdAt')}
                            >
                                Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="border-0 fw-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.map((order) => (
                            <tr key={order._id || order.id}>
                                <td>
                                    <div className="fw-medium">
                                        #{order.orderNumber || order._id?.slice(-8) || 'N/A'}
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <div className="fw-medium">
                                            {order.user?.firstName && order.user?.lastName 
                                                ? `${order.user.firstName} ${order.user.lastName}`
                                                : order.user?.email?.split('@')[0] || 'Unknown Customer'
                                            }
                                        </div>
                                        <small className="text-muted">
                                            {order.user?.email || 'No email'}
                                        </small>
                                    </div>
                                </td>
                                <td>
                                    <span className="fw-medium">{formatPrice(order.total)}</span>
                                </td>
                                <td>
                                    <span className={`badge bg-${getStatusColor(order.status)} bg-opacity-15 text-${getStatusColor(order.status)} border border-${getStatusColor(order.status)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                        {order.status || 'pending'}
                                    </span>
                                </td>
                                <td>
                                    <span className="text-muted">
                                        {formatDate(order.createdAt)}
                                    </span>
                                </td>
                                <td>
                                    <div className="btn-group btn-group-sm">
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            title="View Order"
                                            onClick={() => window.open(`/user/order/${order._id || order.id}`, '_blank')}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                            </svg>
                                        </button>
                                        <select
                                            className="form-select form-select-sm"
                                            value={order.status || 'pending'}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value;
                                                if (window.confirm(`Update order status to "${newStatus}"?`)) {
                                                    try {
                                                        await adminService.updateOrderStatus(order._id || order.id, newStatus);
                                                        // Refresh orders list
                                                        loadOrders();
                                                    } catch (error) {
                                                        console.error('Error updating order status:', error);
                                                        alert('Failed to update order status: ' + error.message);
                                                    }
                                                }
                                            }}
                                            style={{ minWidth: '120px' }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="refunded">Refunded</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, filteredOrders.length)} of {filteredOrders.length} orders
                    </div>
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    Previous
                                </button>
                            </li>
                            {[...Array(totalPages)].map((_, index) => {
                                const pageNum = index + 1;
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                                ) {
                                    return (
                                        <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                                            <button 
                                                className="page-link"
                                                onClick={() => handlePageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                } else if (
                                    pageNum === pagination.page - 3 ||
                                    pageNum === pagination.page + 3
                                ) {
                                    return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                                }
                                return null;
                            })}
                            <li className={`page-item ${pagination.page === totalPages ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === totalPages}
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* Empty State */}
            {paginatedOrders.length === 0 && !loading && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M7,4V2A1,1 0 0,1 8,1A1,1 0 0,1 9,2V4H15V2A1,1 0 0,1 16,1A1,1 0 0,1 17,2V4H20A2,2 0 0,1 22,6V8H2V6A2,2 0 0,1 4,4H7M2,10H22V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V10M4,12V14H6V12H4M8,12V14H10V12H8M12,12V14H14V12H12Z" />
                    </svg>
                    <h5 className="text-muted">No Orders Found</h5>
                    <p className="text-muted mb-0">
                        {allOrders.length === 0 ? 'No orders in database.' : 'No orders match your current filters.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminOrdersNew;