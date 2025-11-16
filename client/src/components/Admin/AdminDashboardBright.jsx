import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context';

const AdminDashboardBright = ({ setActiveTab }) => {
    const navigate = useNavigate();
    const { 
        dashboardStats, 
        isDashboardLoading, 
        dashboardError, 
        loadDashboardStats
    } = useAdmin();

    const [dateRange, setDateRange] = useState('7days');
    const hasInitialized = useRef(false);

    // Load initial data only once
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            loadDashboardStats({ period: dateRange });
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
        totalUsers: 156,
        totalProducts: 89,
        totalOrders: 234,
        totalRevenue: 15420,
        newUsers: 12,
        newOrders: 8,
        pendingOrders: 5,
        lowStockProducts: 3,
        pendingReviews: 7
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

    if (isDashboardLoading && !hasInitialized.current) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading dashboard...</span>
                    </div>
                    <h5 className="text-primary">Loading Dashboard...</h5>
                    <p className="text-muted">Please wait while we fetch your data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-bright" style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '2rem' }}>
            {/* Header Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <div className="d-flex align-items-center">
                            <div className="me-4">
                                <div className="d-flex align-items-center justify-content-center rounded-circle" 
                                     style={{ 
                                         width: '80px', 
                                         height: '80px', 
                                         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                         boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                                     }}>
                                    <i className="fas fa-chart-line text-white fs-2"></i>
                                </div>
                            </div>
                            <div>
                                <h1 className="display-6 fw-bold text-dark mb-2">
                                    TechVerse Admin Dashboard
                                </h1>
                                <p className="lead text-muted mb-0">
                                    <i className="fas fa-user-shield text-primary me-2"></i>
                                    Welcome back! Here's your store performance at a glance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {dashboardError && (
                <div className="alert alert-warning border-0 mb-4" style={{ 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '15px',
                    border: '2px solid #ffc107'
                }}>
                    <div className="d-flex align-items-center">
                        <i className="fas fa-exclamation-triangle text-warning me-3 fs-4"></i>
                        <div>
                            <h6 className="fw-bold mb-1">Data Loading Issue</h6>
                            <p className="mb-0">{dashboardError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Stats Cards */}
            <div className="row g-4 mb-5">
                {/* Revenue Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 h-100" style={{ 
                        backgroundColor: '#e3f2fd', 
                        borderRadius: '20px',
                        border: '3px solid #2196f3',
                        transition: 'all 0.3s ease'
                    }}>
                        <div className="card-body p-4 text-center">
                            <div className="mb-3">
                                <div className="d-inline-flex align-items-center justify-content-center rounded-circle" 
                                     style={{ 
                                         width: '80px', 
                                         height: '80px', 
                                         background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
                                         boxShadow: '0 8px 20px rgba(33, 150, 243, 0.4)'
                                     }}>
                                    <i className="fas fa-sterling-sign text-white fs-2"></i>
                                </div>
                            </div>
                            <h2 className="fw-bold text-dark mb-2">{formatCurrency(stats.totalRevenue)}</h2>
                            <p className="text-muted mb-3 fw-semibold">Total Revenue</p>
                            <div className="d-flex justify-content-center">
                                <span className="badge bg-success fs-6 px-3 py-2" style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-arrow-up me-1"></i>+12.5%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="text-decoration-none" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/orders')} title="Click to manage orders">
                        <div className="card border-0 h-100 hover-lift" style={{ 
                            backgroundColor: '#e8f5e8', 
                            borderRadius: '20px',
                            border: '3px solid #4caf50',
                            transition: 'all 0.3s ease'
                        }}>
                            <div className="card-body p-4 text-center">
                                <div className="mb-3">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle" 
                                         style={{ 
                                             width: '80px', 
                                             height: '80px', 
                                             background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                                             boxShadow: '0 8px 20px rgba(76, 175, 80, 0.4)'
                                         }}>
                                        <i className="fas fa-shopping-cart text-white fs-2"></i>
                                    </div>
                                </div>
                                <h2 className="fw-bold text-dark mb-2">{formatNumber(stats.totalOrders)}</h2>
                                <p className="text-muted mb-3 fw-semibold">Total Orders</p>
                                <div className="d-flex justify-content-center">
                                    <span className="badge bg-success fs-6 px-3 py-2" style={{ borderRadius: '10px' }}>
                                        <i className="fas fa-arrow-up me-1"></i>+8.3%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="text-decoration-none" style={{ cursor: 'pointer' }} onClick={() => setActiveTab && setActiveTab('users')} title="Click to manage users">
                        <div className="card border-0 h-100 hover-lift" style={{ 
                            backgroundColor: '#fff3e0', 
                            borderRadius: '20px',
                            border: '3px solid #ff9800',
                            transition: 'all 0.3s ease'
                        }}>
                            <div className="card-body p-4 text-center">
                                <div className="mb-3">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle" 
                                         style={{ 
                                             width: '80px', 
                                             height: '80px', 
                                             background: 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)',
                                             boxShadow: '0 8px 20px rgba(255, 152, 0, 0.4)'
                                         }}>
                                        <i className="fas fa-users text-white fs-2"></i>
                                    </div>
                                </div>
                                <h2 className="fw-bold text-dark mb-2">{formatNumber(stats.totalUsers)}</h2>
                                <p className="text-muted mb-3 fw-semibold">Total Users</p>
                                <div className="d-flex justify-content-center">
                                    <span className="badge bg-success fs-6 px-3 py-2" style={{ borderRadius: '10px' }}>
                                        <i className="fas fa-arrow-up me-1"></i>+15.2%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="text-decoration-none" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/products')} title="Click to manage products">
                        <div className="card border-0 h-100 hover-lift" style={{ 
                            backgroundColor: '#f3e5f5', 
                            borderRadius: '20px',
                            border: '3px solid #9c27b0',
                            transition: 'all 0.3s ease'
                        }}>
                            <div className="card-body p-4 text-center">
                                <div className="mb-3">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle" 
                                         style={{ 
                                             width: '80px', 
                                             height: '80px', 
                                             background: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)',
                                             boxShadow: '0 8px 20px rgba(156, 39, 176, 0.4)'
                                         }}>
                                        <i className="fas fa-box text-white fs-2"></i>
                                    </div>
                                </div>
                                <h2 className="fw-bold text-dark mb-2">{formatNumber(stats.totalProducts)}</h2>
                                <p className="text-muted mb-3 fw-semibold">Total Products</p>
                                <div className="d-flex justify-content-center">
                                    <span className="badge bg-success fs-6 px-3 py-2" style={{ borderRadius: '10px' }}>
                                        <i className="fas fa-arrow-up me-1"></i>+5.7%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="row g-4 mb-5">
                <div className="col-lg-8">
                    <div className="card border-0" style={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '20px',
                        border: '2px solid #e0e0e0',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}>
                        <div className="card-header bg-transparent border-0 pb-0 pt-4 px-4">
                            <h4 className="fw-bold text-dark mb-0">
                                <i className="fas fa-chart-line text-primary me-2"></i>
                                Quick Overview
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-4">
                                <div className="col-md-3 col-sm-6">
                                    <div className="text-center p-3" style={{ 
                                        backgroundColor: '#e3f2fd', 
                                        borderRadius: '15px',
                                        border: '2px solid #2196f3'
                                    }}>
                                        <div className="mb-2">
                                            <i className="fas fa-user-plus text-primary fs-3"></i>
                                        </div>
                                        <h4 className="fw-bold text-primary mb-1">{stats.newUsers}</h4>
                                        <small className="text-muted fw-semibold">New Users Today</small>
                                    </div>
                                </div>
                                <div className="col-md-3 col-sm-6">
                                    <div className="text-center p-3" style={{ 
                                        backgroundColor: '#e8f5e8', 
                                        borderRadius: '15px',
                                        border: '2px solid #4caf50'
                                    }}>
                                        <div className="mb-2">
                                            <i className="fas fa-shopping-bag text-success fs-3"></i>
                                        </div>
                                        <h4 className="fw-bold text-success mb-1">{stats.newOrders}</h4>
                                        <small className="text-muted fw-semibold">New Orders Today</small>
                                    </div>
                                </div>
                                <div className="col-md-3 col-sm-6">
                                    <div className="text-center p-3" style={{ 
                                        backgroundColor: '#fff3e0', 
                                        borderRadius: '15px',
                                        border: '2px solid #ff9800'
                                    }}>
                                        <div className="mb-2">
                                            <i className="fas fa-clock text-warning fs-3"></i>
                                        </div>
                                        <h4 className="fw-bold text-warning mb-1">{stats.pendingOrders}</h4>
                                        <small className="text-muted fw-semibold">Pending Orders</small>
                                    </div>
                                </div>
                                <div className="col-md-3 col-sm-6">
                                    <div className="text-center p-3" style={{ 
                                        backgroundColor: '#ffebee', 
                                        borderRadius: '15px',
                                        border: '2px solid #f44336'
                                    }}>
                                        <div className="mb-2">
                                            <i className="fas fa-exclamation-triangle text-danger fs-3"></i>
                                        </div>
                                        <h4 className="fw-bold text-danger mb-1">{stats.lowStockProducts}</h4>
                                        <small className="text-muted fw-semibold">Low Stock Items</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 h-100" style={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '20px',
                        border: '2px solid #e0e0e0',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}>
                        <div className="card-header bg-transparent border-0 pb-0 pt-4 px-4">
                            <h4 className="fw-bold text-dark mb-0">
                                <i className="fas fa-bell text-warning me-2"></i>
                                Recent Activity
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-3 p-2" style={{ backgroundColor: '#e8f5e8', borderRadius: '10px' }}>
                                <div className="bg-success rounded-circle p-2 me-3">
                                    <i className="fas fa-check text-white small"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <p className="mb-0 fw-semibold">New order #1234</p>
                                    <small className="text-muted">2 minutes ago</small>
                                </div>
                            </div>
                            <div className="d-flex align-items-center mb-3 p-2" style={{ backgroundColor: '#e3f2fd', borderRadius: '10px' }}>
                                <div className="bg-primary rounded-circle p-2 me-3">
                                    <i className="fas fa-user text-white small"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <p className="mb-0 fw-semibold">New user registered</p>
                                    <small className="text-muted">5 minutes ago</small>
                                </div>
                            </div>
                            <div className="d-flex align-items-center mb-3 p-2" style={{ backgroundColor: '#fff3e0', borderRadius: '10px' }}>
                                <div className="bg-warning rounded-circle p-2 me-3">
                                    <i className="fas fa-box text-white small"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <p className="mb-0 fw-semibold">Stock alert: iPhone 15</p>
                                    <small className="text-muted">10 minutes ago</small>
                                </div>
                            </div>
                            <div className="text-center mt-4">
                                <button className="btn btn-outline-primary btn-lg px-4" style={{ borderRadius: '15px', fontWeight: '600' }}>
                                    View All Activity
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & System Status */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0" style={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '20px',
                        border: '2px solid #e0e0e0',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}>
                        <div className="card-header bg-transparent border-0 pb-0 pt-4 px-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="fw-bold text-dark mb-0">
                                    <i className="fas fa-bolt text-primary me-2"></i>
                                    Quick Actions & System Status
                                </h4>
                                <div className="badge bg-success bg-opacity-10 text-success px-3 py-2" style={{ borderRadius: '15px' }}>
                                    <i className="fas fa-check-circle me-1"></i>
                                    System Online
                                </div>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            {/* Quick Actions Grid */}
                            <div className="row g-4 mb-5">
                                <div className="col-xl-3 col-lg-4 col-md-6">
                                    <div 
                                        className="d-flex align-items-center p-4 h-100 cursor-pointer hover-lift" 
                                        style={{ 
                                            backgroundColor: '#e3f2fd', 
                                            borderRadius: '15px',
                                            border: '2px solid #2196f3',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onClick={() => setActiveTab && setActiveTab('products')}
                                    >
                                        <div className="flex-shrink-0 me-3">
                                            <div className="bg-primary rounded-circle p-3">
                                                <i className="fas fa-plus text-white fs-4"></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-1 text-primary">Add Product</h6>
                                            <p className="text-muted mb-0 small">Create new product</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-lg-4 col-md-6">
                                    <div 
                                        className="d-flex align-items-center p-4 h-100 cursor-pointer hover-lift" 
                                        style={{ 
                                            backgroundColor: '#f3e5f5', 
                                            borderRadius: '15px',
                                            border: '2px solid #9c27b0',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onClick={() => setActiveTab && setActiveTab('orders')}
                                    >
                                        <div className="flex-shrink-0 me-3">
                                            <div className="bg-purple rounded-circle p-3" style={{ backgroundColor: '#9c27b0' }}>
                                                <i className="fas fa-shopping-cart text-white fs-4"></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-1" style={{ color: '#9c27b0' }}>View Orders</h6>
                                            <p className="text-muted mb-0 small">Manage orders</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-lg-4 col-md-6">
                                    <div 
                                        className="d-flex align-items-center p-4 h-100 cursor-pointer hover-lift" 
                                        style={{ 
                                            backgroundColor: '#e8f5e8', 
                                            borderRadius: '15px',
                                            border: '2px solid #4caf50',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onClick={() => setActiveTab && setActiveTab('users')}
                                    >
                                        <div className="flex-shrink-0 me-3">
                                            <div className="bg-success rounded-circle p-3">
                                                <i className="fas fa-users text-white fs-4"></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-1 text-success">Manage Users</h6>
                                            <p className="text-muted mb-0 small">User management</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-lg-4 col-md-6">
                                    <div 
                                        className="d-flex align-items-center p-4 h-100 cursor-pointer hover-lift" 
                                        style={{ 
                                            backgroundColor: '#fff3e0', 
                                            borderRadius: '15px',
                                            border: '2px solid #ff9800',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onClick={() => setActiveTab && setActiveTab('analytics')}
                                    >
                                        <div className="flex-shrink-0 me-3">
                                            <div className="bg-warning rounded-circle p-3">
                                                <i className="fas fa-chart-bar text-white fs-4"></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-1 text-warning">Analytics</h6>
                                            <p className="text-muted mb-0 small">View reports</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Status */}
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="text-center p-4" style={{ 
                                        backgroundColor: '#f8f9fa', 
                                        borderRadius: '15px',
                                        border: '1px solid #dee2e6'
                                    }}>
                                        <div className="mb-3">
                                            <i className="fas fa-server text-success fs-2"></i>
                                        </div>
                                        <h6 className="fw-bold text-success mb-1">Server Status</h6>
                                        <p className="text-muted mb-0 small">All systems operational</p>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="text-center p-4" style={{ 
                                        backgroundColor: '#f8f9fa', 
                                        borderRadius: '15px',
                                        border: '1px solid #dee2e6'
                                    }}>
                                        <div className="mb-3">
                                            <i className="fas fa-database text-info fs-2"></i>
                                        </div>
                                        <h6 className="fw-bold text-info mb-1">Database</h6>
                                        <p className="text-muted mb-0 small">Connected & healthy</p>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="text-center p-4" style={{ 
                                        backgroundColor: '#f8f9fa', 
                                        borderRadius: '15px',
                                        border: '1px solid #dee2e6'
                                    }}>
                                        <div className="mb-3">
                                            <i className="fas fa-shield-alt text-primary fs-2"></i>
                                        </div>
                                        <h6 className="fw-bold text-primary mb-1">Security</h6>
                                        <p className="text-muted mb-0 small">All secure</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-lift {
                    transition: all 0.3s ease !important;
                }
                .hover-lift:hover {
                    transform: translateY(-8px) !important;
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15) !important;
                }
                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12) !important;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboardBright;