import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAdmin } from '../../context';
import '../../assets/css/admin-dashboard-modern.css';

const AdminDashboardModern = () => {
    const { 
        dashboardStats, 
        isDashboardLoading, 
        dashboardError, 
        loadDashboardStats,
        categories,
        isCategoriesLoading,
        categoriesError,
        loadCategories
    } = useAdmin();

    const [dateRange, setDateRange] = useState('7days');
    const hasInitialized = useRef(false);

    // Load initial data only once
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            loadDashboardStats({ period: dateRange });
            loadCategories();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle date range changes separately
    useEffect(() => {
        if (hasInitialized.current) {
            loadDashboardStats({ period: dateRange });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    // Handle date range changes separately
    const handleDateRangeChange = useCallback((newRange) => {
        setDateRange(newRange);
    }, []);

    // Safe data extraction with fallbacks
    const stats = useMemo(() => dashboardStats?.overview || {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        newUsers: 0,
        newOrders: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
        pendingReviews: 0
    }, [dashboardStats]);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount || 0);
    }, []);

    const formatNumber = useCallback((num) => {
        return new Intl.NumberFormat('en-GB').format(num || 0);
    }, []);

    // Calculate growth percentages (mock data for now)
    const growthData = useMemo(() => ({
        revenue: { value: stats.totalRevenue, growth: 12.5, trend: 'up' },
        orders: { value: stats.totalOrders, growth: 8.3, trend: 'up' },
        users: { value: stats.totalUsers, growth: 15.2, trend: 'up' },
        products: { value: stats.totalProducts, growth: 5.7, trend: 'up' }
    }), [stats]);

    if (isDashboardLoading && !isInitialized) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading dashboard...</span>
                    </div>
                    <p className="text-muted">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-modern">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1 fw-bold text-dark">Dashboard Overview</h1>
                    <p className="text-muted mb-0">Welcome back! Here's what's happening with your store.</p>
                </div>
                <div className="d-flex gap-3 align-items-center">
                    <select 
                        className="form-select form-select-sm border-0 shadow-sm" 
                        value={dateRange} 
                        onChange={(e) => handleDateRangeChange(e.target.value)}
                        style={{ width: '140px' }}
                    >
                        <option value="7days">Last 7 days</option>
                        <option value="30days">Last 30 days</option>
                        <option value="90days">Last 90 days</option>
                    </select>
                    <button className="btn btn-primary btn-sm shadow-sm">
                        <i className="fas fa-download me-2"></i>Export
                    </button>
                </div>
            </div>

            {dashboardError && (
                <div className="alert alert-warning border-0 shadow-sm mb-4">
                    <div className="d-flex align-items-center">
                        <i className="fas fa-exclamation-triangle text-warning me-3 fs-5"></i>
                        <div>
                            <strong>Data Loading Issue</strong>
                            <p className="mb-0 small">Dashboard data could not be loaded: {dashboardError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Stats Cards */}
            <div className="row g-4 mb-5">
                {/* Revenue Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm h-100 overflow-hidden position-relative">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                                    <i className="fas fa-pound-sign text-primary fs-4"></i>
                                </div>
                                <span className="badge bg-success bg-opacity-10 text-success border-0">
                                    <i className="fas fa-arrow-up me-1"></i>+{growthData.revenue.growth}%
                                </span>
                            </div>
                            <h3 className="fw-bold mb-1">{formatCurrency(growthData.revenue.value)}</h3>
                            <p className="text-muted mb-0 small">Total Revenue</p>
                        </div>
                        <div className="position-absolute bottom-0 start-0 w-100 bg-primary" style={{ height: '3px' }}></div>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm h-100 overflow-hidden position-relative">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="bg-success bg-opacity-10 rounded-3 p-3">
                                    <i className="fas fa-shopping-cart text-success fs-4"></i>
                                </div>
                                <span className="badge bg-success bg-opacity-10 text-success border-0">
                                    <i className="fas fa-arrow-up me-1"></i>+{growthData.orders.growth}%
                                </span>
                            </div>
                            <h3 className="fw-bold mb-1">{formatNumber(growthData.orders.value)}</h3>
                            <p className="text-muted mb-0 small">Total Orders</p>
                        </div>
                        <div className="position-absolute bottom-0 start-0 w-100 bg-success" style={{ height: '3px' }}></div>
                    </div>
                </div>

                {/* Users Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm h-100 overflow-hidden position-relative">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="bg-info bg-opacity-10 rounded-3 p-3">
                                    <i className="fas fa-users text-info fs-4"></i>
                                </div>
                                <span className="badge bg-success bg-opacity-10 text-success border-0">
                                    <i className="fas fa-arrow-up me-1"></i>+{growthData.users.growth}%
                                </span>
                            </div>
                            <h3 className="fw-bold mb-1">{formatNumber(growthData.users.value)}</h3>
                            <p className="text-muted mb-0 small">Total Users</p>
                        </div>
                        <div className="position-absolute bottom-0 start-0 w-100 bg-info" style={{ height: '3px' }}></div>
                    </div>
                </div>

                {/* Products Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm h-100 overflow-hidden position-relative">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                                    <i className="fas fa-box text-warning fs-4"></i>
                                </div>
                                <span className="badge bg-success bg-opacity-10 text-success border-0">
                                    <i className="fas fa-arrow-up me-1"></i>+{growthData.products.growth}%
                                </span>
                            </div>
                            <h3 className="fw-bold mb-1">{formatNumber(growthData.products.value)}</h3>
                            <p className="text-muted mb-0 small">Total Products</p>
                        </div>
                        <div className="position-absolute bottom-0 start-0 w-100 bg-warning" style={{ height: '3px' }}></div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="row g-4 mb-5">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pb-0">
                            <h5 className="card-title mb-0 fw-semibold">Quick Actions</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-3 col-sm-6">
                                    <div className="text-center p-3 bg-light rounded-3 h-100">
                                        <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                                            <i className="fas fa-user-plus text-primary"></i>
                                        </div>
                                        <h6 className="fw-bold text-primary mb-1">{stats.newUsers}</h6>
                                        <small className="text-muted">New Users</small>
                                    </div>
                                </div>
                                <div className="col-md-3 col-sm-6">
                                    <div className="text-center p-3 bg-light rounded-3 h-100">
                                        <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                                            <i className="fas fa-shopping-bag text-success"></i>
                                        </div>
                                        <h6 className="fw-bold text-success mb-1">{stats.newOrders}</h6>
                                        <small className="text-muted">New Orders</small>
                                    </div>
                                </div>
                                <div className="col-md-3 col-sm-6">
                                    <div className="text-center p-3 bg-light rounded-3 h-100">
                                        <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                                            <i className="fas fa-clock text-warning"></i>
                                        </div>
                                        <h6 className="fw-bold text-warning mb-1">{stats.pendingOrders}</h6>
                                        <small className="text-muted">Pending Orders</small>
                                    </div>
                                </div>
                                <div className="col-md-3 col-sm-6">
                                    <div className="text-center p-3 bg-light rounded-3 h-100">
                                        <div className="bg-danger bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                                            <i className="fas fa-exclamation-triangle text-danger"></i>
                                        </div>
                                        <h6 className="fw-bold text-danger mb-1">{stats.lowStockProducts}</h6>
                                        <small className="text-muted">Low Stock</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pb-0">
                            <h5 className="card-title mb-0 fw-semibold">Recent Activity</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="fas fa-check text-success small"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <p className="mb-0 small fw-medium">New order received</p>
                                    <small className="text-muted">2 minutes ago</small>
                                </div>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="fas fa-user text-primary small"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <p className="mb-0 small fw-medium">New user registered</p>
                                    <small className="text-muted">5 minutes ago</small>
                                </div>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                                    <i className="fas fa-box text-warning small"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <p className="mb-0 small fw-medium">Product stock low</p>
                                    <small className="text-muted">10 minutes ago</small>
                                </div>
                            </div>
                            <div className="text-center mt-3">
                                <button className="btn btn-outline-primary btn-sm">View All Activity</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Overview */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pb-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0 fw-semibold">Categories Overview</h5>
                                <button className="btn btn-outline-primary btn-sm">
                                    <i className="fas fa-plus me-2"></i>Add Category
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {isCategoriesLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary mb-3" role="status">
                                        <span className="visually-hidden">Loading categories...</span>
                                    </div>
                                    <p className="text-muted mb-0">Loading categories...</p>
                                </div>
                            ) : categoriesError ? (
                                <div className="alert alert-warning border-0 bg-warning bg-opacity-10">
                                    <div className="d-flex align-items-center">
                                        <i className="fas fa-exclamation-triangle text-warning me-3"></i>
                                        <div>
                                            <strong>Categories Error</strong>
                                            <p className="mb-0 small">Categories could not be loaded: {categoriesError}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : Array.isArray(categories) && categories.length > 0 ? (
                                <div className="row g-3">
                                    {categories.slice(0, 8).map(category => (
                                        category && typeof category === 'object' && category.name ? (
                                            <div key={category._id || category.name} className="col-xl-3 col-lg-4 col-md-6">
                                                <div className="d-flex align-items-center p-3 bg-light rounded-3 h-100 hover-shadow transition-all">
                                                    <div className="flex-shrink-0 me-3">
                                                        <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                                            <i className={`fas fa-${category.icon || 'tag'} text-primary`}></i>
                                                        </div>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h6 className="fw-semibold mb-1">{category.name}</h6>
                                                        <small className="text-muted">{category.productCount || 0} products</small>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <div className="bg-light rounded-circle p-4 d-inline-flex mb-3">
                                        <i className="fas fa-tags text-muted fs-1"></i>
                                    </div>
                                    <h6 className="fw-semibold mb-2">No Categories Found</h6>
                                    <p className="text-muted mb-3">Start by creating your first product category.</p>
                                    <button className="btn btn-primary">
                                        <i className="fas fa-plus me-2"></i>Create Category
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hover-shadow {
                    transition: all 0.2s ease-in-out;
                }
                .hover-shadow:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                    transform: translateY(-2px);
                }
                .transition-all {
                    transition: all 0.2s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboardModern;