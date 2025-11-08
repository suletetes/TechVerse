import React, { useState, useEffect } from 'react';
import adminService from '../../api/services/adminService';

const AdminActivityLog = () => {
    const [activityLog, setActivityLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        type: 'all',
        dateRange: 'week',
        user: 'all',
        page: 1,
        limit: 20
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasMore: false
    });

    // Load activity log from database
    const loadActivityLog = async (newFilters = filters) => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page: newFilters.page,
                limit: newFilters.limit
            };
            
            // Add type filter
            if (newFilters.type !== 'all') {
                params.type = newFilters.type;
            }
            
            // Add user filter
            if (newFilters.user !== 'all') {
                params.user = newFilters.user;
            }
            
            // Add date range filter
            const now = new Date();
            switch (newFilters.dateRange) {
                case 'today':
                    params.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    params.startDate = weekAgo.toISOString();
                    break;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    params.startDate = monthAgo.toISOString();
                    break;
            }
            
            const response = await adminService.getActivityLog(params);
            console.log('📥 Raw API Response:', response);
            
            const data = response.data || response;
            console.log('📦 Extracted Data:', data);
            
            // Ensure we always set an array
            const activities = data.activities || data.logs || [];
            console.log('📋 Activities Array:', activities, 'Length:', activities.length);
            
            setActivityLog(Array.isArray(activities) ? activities : []);
            
            // Update pagination info
            if (data.pagination) {
                setPagination({
                    currentPage: data.pagination.currentPage || 1,
                    totalPages: data.pagination.totalPages || 1,
                    totalItems: data.pagination.totalItems || 0,
                    hasMore: data.pagination.hasMore || false
                });
            }
            
        } catch (err) {
            console.error('Failed to load activity log:', err);
            setError('Failed to load activity log. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load on mount
    useEffect(() => {
        loadActivityLog();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle filter changes - always reset to page 1
    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value, page: 1 };
        setFilters(newFilters);
        loadActivityLog(newFilters);
    };

    // Handle pagination - navigate to specific page
    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        const newFilters = { ...filters, page: newPage };
        setFilters(newFilters);
        loadActivityLog(newFilters);
    };

    // Format timestamp to relative time
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleString();
    };

    // Get icon for activity type
    const getActivityIcon = (type) => {
        switch (type) {
            case 'login':
                return <path fill="currentColor" d="M10 17v-3H3v-4h7V7l5 5-5 5m0-15h9a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-2h2v2h9V4h-9v2H8V4a2 2 0 0 1 2-2z"/>;
            case 'product_view':
            case 'product_search':
                return <path fill="currentColor" d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>;
            case 'cart_add':
            case 'cart_remove':
                return <path fill="currentColor" d="M17 18c-1.11 0-2 .89-2 2a2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2M1 2v2h2l3.6 7.59-1.36 2.45c-.15.28-.24.61-.24.96a2 2 0 0 0 2 2h12v-2H7.42a.25.25 0 0 1-.25-.25c0-.05.01-.09.03-.12L8.1 13h7.45c.75 0 1.41-.42 1.75-1.03l3.58-6.47c.07-.16.12-.33.12-.5a1 1 0 0 0-1-1H5.21l-.94-2M7 18c-1.11 0-2 .89-2 2a2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2z"/>;
            case 'wishlist_add':
            case 'wishlist_remove':
                return <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>;
            case 'profile_update':
                return <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>;
            default:
                return <path fill="currentColor" d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/>;
        }
    };

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <h2>Activity Log</h2>
                <p className="text-muted">Recent system activities and changes</p>
            </div>
            
            {/* Activity Filters */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Activity Type</label>
                                <select 
                                    className="form-select"
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="all">All Activities</option>
                                    <option value="login">Login</option>
                                    <option value="profile_update">Profile Updates</option>
                                    <option value="product_view">Product Views</option>
                                    <option value="product_search">Product Searches</option>
                                    <option value="cart_add">Cart Additions</option>
                                    <option value="cart_remove">Cart Removals</option>
                                    <option value="wishlist_add">Wishlist Additions</option>
                                    <option value="wishlist_remove">Wishlist Removals</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Date Range</label>
                                <select 
                                    className="form-select"
                                    value={filters.dateRange}
                                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="all">All Time</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Items per page</label>
                                <select 
                                    className="form-select"
                                    value={filters.limit}
                                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                    disabled={loading}
                                >
                                    <option value="10">10 per page</option>
                                    <option value="20">20 per page</option>
                                    <option value="50">50 per page</option>
                                    <option value="100">100 per page</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">&nbsp;</label>
                                <button 
                                    className="btn btn-outline-secondary w-100"
                                    onClick={() => {
                                        const resetFilters = {
                                            type: 'all',
                                            dateRange: 'week',
                                            user: 'all',
                                            page: 1,
                                            limit: 20
                                        };
                                        setFilters(resetFilters);
                                        loadActivityLog(resetFilters);
                                    }}
                                    disabled={loading}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Recent Activities</h5>
                        <div className="d-flex gap-2 align-items-center">
                            {pagination.totalItems > 0 && (
                                <span className="badge bg-primary">
                                    {pagination.totalItems} Total
                                </span>
                            )}
                            <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => loadActivityLog()}
                                disabled={loading}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                                </svg>
                                {loading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted">Loading activity log...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-5">
                                <svg width="48" height="48" viewBox="0 0 24 24" className="text-danger mb-3">
                                    <path fill="currentColor" d="M13 13h-2V7h2m0 10h-2v-2h2M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/>
                                </svg>
                                <p className="text-danger mb-3">{error}</p>
                                <button className="btn btn-outline-primary" onClick={() => loadActivityLog()}>
                                    Try Again
                                </button>
                            </div>
                        ) : activityLog.length === 0 ? (
                            <div className="text-center py-5">
                                <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                <p className="text-muted">No activity found for the selected filters</p>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {activityLog.map((activity, index) => (
                                    <div key={activity._id || activity.id || index} className="list-group-item border-start-0 border-end-0">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="d-flex align-items-start">
                                                <div className={`rounded-circle p-2 me-3 ${
                                                    activity.type === 'login' ? 'bg-info bg-opacity-10 text-info' :
                                                    (activity.type === 'product_view' || activity.type === 'product_search') ? 'bg-success bg-opacity-10 text-success' :
                                                    (activity.type === 'cart_add' || activity.type === 'cart_remove') ? 'bg-warning bg-opacity-10 text-warning' :
                                                    (activity.type === 'wishlist_add' || activity.type === 'wishlist_remove') ? 'bg-danger bg-opacity-10 text-danger' :
                                                    activity.type === 'profile_update' ? 'bg-secondary bg-opacity-10 text-secondary' :
                                                    'bg-dark bg-opacity-10 text-dark'
                                                }`}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                                        {getActivityIcon(activity.type)}
                                                    </svg>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-1">
                                                        <h6 className="mb-0 me-2">{activity.action || activity.description}</h6>
                                                        <span className={`badge badge-sm ${
                                                            activity.type === 'login' ? 'bg-info' :
                                                            (activity.type === 'product_view' || activity.type === 'product_search') ? 'bg-success' :
                                                            (activity.type === 'cart_add' || activity.type === 'cart_remove') ? 'bg-warning' :
                                                            (activity.type === 'wishlist_add' || activity.type === 'wishlist_remove') ? 'bg-danger' :
                                                            activity.type === 'profile_update' ? 'bg-secondary' :
                                                            'bg-dark'
                                                        }`}>
                                                            {activity.type.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    {activity.details && (
                                                        <p className="mb-1 text-muted small">{activity.details}</p>
                                                    )}
                                                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                                        <div className="mb-1">
                                                            {activity.metadata.orderId && (
                                                                <span className="badge bg-light text-dark me-2">
                                                                    Order: {activity.metadata.orderId}
                                                                </span>
                                                            )}
                                                            {activity.metadata.productId && (
                                                                <span className="badge bg-light text-dark me-2">
                                                                    Product: {activity.metadata.productId}
                                                                </span>
                                                            )}
                                                            {activity.metadata.userId && (
                                                                <span className="badge bg-light text-dark me-2">
                                                                    User: {activity.metadata.userId}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="d-flex align-items-center text-muted small">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                        </svg>
                                                        <span className="me-3">
                                                            {activity.user?.name || activity.user?.email || activity.performedBy?.name || activity.performedBy?.email || 'System'}
                                                        </span>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 17.5L8.5 15 12 12.5 15.5 15 12 17.5z"/>
                                                        </svg>
                                                        <span>{formatTimestamp(activity.timestamp || activity.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {activity.ipAddress && (
                                                <div className="text-end">
                                                    <small className="text-muted d-block">{activity.ipAddress}</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {activityLog.length > 0 && !loading && (
                        <div className="card-footer bg-light">
                            <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                    Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.totalItems)} of {pagination.totalItems} activities
                                </small>
                                <div className="d-flex gap-2">
                                    <button 
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1 || loading}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                                        </svg>
                                        Previous
                                    </button>
                                    <span className="btn btn-sm btn-light disabled">
                                        Page {pagination.currentPage} of {pagination.totalPages}
                                    </span>
                                    <button 
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={!pagination.hasMore || loading}
                                    >
                                        Next
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="ms-1">
                                            <path fill="currentColor" d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminActivityLog;
