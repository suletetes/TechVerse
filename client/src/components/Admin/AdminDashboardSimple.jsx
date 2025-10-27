import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../context';

const AdminDashboardSimple = () => {
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

    useEffect(() => {
        loadDashboardStats({ period: dateRange });
        loadCategories();
    }, [dateRange, loadDashboardStats, loadCategories]);

    // Safe data extraction with fallbacks
    const stats = dashboardStats?.overview || {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        newUsers: 0,
        newOrders: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
        pendingReviews: 0
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount || 0);
    };

    if (isDashboardLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Dashboard</h2>
                <div className="d-flex gap-2">
                    <select 
                        className="form-select form-select-sm" 
                        value={dateRange} 
                        onChange={(e) => setDateRange(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="7days">Last 7 days</option>
                        <option value="30days">Last 30 days</option>
                        <option value="90days">Last 90 days</option>
                    </select>
                </div>
            </div>

            {dashboardError && (
                <div className="alert alert-warning mb-4">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Dashboard data could not be loaded: {dashboardError}
                </div>
            )}

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                                        <i className="fas fa-dollar-sign text-primary fs-4"></i>
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="text-muted mb-1">Total Revenue</h6>
                                    <h4 className="mb-0">{formatCurrency(stats.totalRevenue)}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-success bg-opacity-10 rounded-3 p-3">
                                        <i className="fas fa-shopping-cart text-success fs-4"></i>
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="text-muted mb-1">Total Orders</h6>
                                    <h4 className="mb-0">{stats.totalOrders}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-info bg-opacity-10 rounded-3 p-3">
                                        <i className="fas fa-users text-info fs-4"></i>
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="text-muted mb-1">Total Users</h6>
                                    <h4 className="mb-0">{stats.totalUsers}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                                        <i className="fas fa-box text-warning fs-4"></i>
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="text-muted mb-1">Total Products</h6>
                                    <h4 className="mb-0">{stats.totalProducts}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="row g-3 mb-4">
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <h5 className="text-primary mb-1">{stats.newUsers}</h5>
                            <small className="text-muted">New Users</small>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <h5 className="text-success mb-1">{stats.newOrders}</h5>
                            <small className="text-muted">New Orders</small>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <h5 className="text-warning mb-1">{stats.pendingOrders}</h5>
                            <small className="text-muted">Pending Orders</small>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <h5 className="text-danger mb-1">{stats.lowStockProducts}</h5>
                            <small className="text-muted">Low Stock</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Status */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pb-0">
                            <h5 className="card-title mb-0">Categories Status</h5>
                        </div>
                        <div className="card-body">
                            {isCategoriesLoading ? (
                                <div className="text-center py-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Loading categories...</span>
                                    </div>
                                </div>
                            ) : categoriesError ? (
                                <div className="alert alert-warning mb-0">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Categories could not be loaded: {categoriesError}
                                </div>
                            ) : Array.isArray(categories) && categories.length > 0 ? (
                                <div className="row g-2">
                                    {Array.isArray(categories) && categories.slice(0, 6).map(category => (
                                        category && typeof category === 'object' && category.name ? (
                                            <div key={category._id || category.name} className="col-md-4 col-sm-6">
                                                <div className="d-flex align-items-center p-2 bg-light rounded">
                                                    <div className="flex-shrink-0">
                                                        <i className={`fas fa-${category.icon || 'tag'} text-primary me-2`}></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <small className="fw-medium">{category.name}</small>
                                                        <br />
                                                        <small className="text-muted">{category.productCount || 0} products</small>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-3 text-muted">
                                    <i className="fas fa-tags fs-1 mb-2 opacity-50"></i>
                                    <p className="mb-0">No categories found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardSimple;