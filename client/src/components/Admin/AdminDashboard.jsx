import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = ({ dashboardStats, dateRange, setDateRange, recentOrders, setActiveTab, getStatusColor, formatCurrency }) => {
    // Provide default values and handle null dashboardStats
    const stats = dashboardStats?.overview || {};
    const defaultStats = {
        totalRevenue: 0,
        revenueGrowth: 0,
        totalOrders: 0,
        ordersGrowth: 0,
        totalUsers: 0,
        usersGrowth: 0,
        totalProducts: 0,
        productsGrowth: 0,
        newUsers: 0,
        newOrders: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
        ...stats
    };

    // Calculate growth percentages and overview metrics
    const growthStats = {
        revenueGrowth: defaultStats.revenueGrowth || 12.5,
        ordersGrowth: defaultStats.ordersGrowth || 8.3,
        usersGrowth: defaultStats.usersGrowth || 15.2,
        productsGrowth: defaultStats.productsGrowth || 5.7,
        newUsers: defaultStats.newUsers || 0,
        newOrders: defaultStats.newOrders || 0,
        pendingOrders: defaultStats.pendingOrders || 0,
        lowStockProducts: defaultStats.lowStockProducts || 0
    };

    const finalStats = { ...defaultStats, ...growthStats };

    return (
    <div>
        {/* Stats Cards */}
        <div className="row g-3 g-md-4 mb-4">
            <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6">
                <div className="dashboard-stats-card revenue-card">
                    <div className="stats-card-header">
                        <div className="stats-icon-container">
                            <div className="stats-icon bg-success">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                                </svg>
                            </div>
                        </div>
                        <div className="stats-growth">
                            <span className="growth-badge positive">
                                <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                </svg>
                                +{finalStats.revenueGrowth}%
                            </span>
                        </div>
                    </div>
                    <div className="stats-content">
                        <h2 className="stats-value">{formatCurrency(finalStats.totalRevenue)}</h2>
                        <p className="stats-label">Total Revenue</p>
                        <small className="stats-period">vs last period</small>
                    </div>
                </div>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6">
                <Link to="/admin/orders" className="text-decoration-none">
                    <div className="dashboard-stats-card orders-card">
                        <div className="stats-card-header">
                            <div className="stats-icon-container">
                                <div className="stats-icon bg-primary">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                        <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="stats-growth">
                                <span className="growth-badge positive">
                                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                        <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                    </svg>
                                    +{finalStats.ordersGrowth}%
                                </span>
                            </div>
                        </div>
                        <div className="stats-content">
                            <h2 className="stats-value">{finalStats.totalOrders.toLocaleString()}</h2>
                            <p className="stats-label">Total Orders</p>
                            <small className="stats-period">vs last period</small>
                        </div>
                    </div>
                </Link>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6">
                <div className="dashboard-stats-card users-card">
                    <div className="stats-card-header">
                        <div className="stats-icon-container">
                            <div className="stats-icon bg-info">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                        </div>
                        <div className="stats-growth">
                            <span className="growth-badge positive">
                                <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                </svg>
                                +{finalStats.usersGrowth}%
                            </span>
                        </div>
                    </div>
                    <div className="stats-content">
                        <h2 className="stats-value">{finalStats.totalUsers.toLocaleString()}</h2>
                        <p className="stats-label">Total Users</p>
                        <small className="stats-period">vs last period</small>
                    </div>
                </div>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6">
                <Link to="/admin/products" className="text-decoration-none">
                    <div className="dashboard-stats-card products-card">
                        <div className="stats-card-header">
                            <div className="stats-icon-container">
                                <div className="stats-icon bg-warning">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="stats-growth">
                                <span className="growth-badge positive">
                                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                        <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                    </svg>
                                    +{finalStats.productsGrowth}%
                                </span>
                            </div>
                        </div>
                        <div className="stats-content">
                            <h2 className="stats-value">{finalStats.totalProducts}</h2>
                            <p className="stats-label">Total Products</p>
                            <small className="stats-period">vs last period</small>
                        </div>
                    </div>
                </Link>
            </div>
        </div>

        {/* Charts and Recent Activity */}
        <div className="row g-3 mb-4">
            <div className="col-lg-8">
                <div className="store-card fill-card h-100">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
                        <h5 className="tc-6533 fw-bold mb-2 mb-sm-0">Revenue Overview</h5>
                        <select
                            className="form-select w-auto"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="7days">Last 7 days</option>
                            <option value="30days">Last 30 days</option>
                            <option value="90days">Last 90 days</option>
                            <option value="1year">Last year</option>
                        </select>
                    </div>
                    <div className="chart-placeholder bg-light rounded-3 d-flex align-items-center justify-content-center border" style={{ height: '320px' }}>
                        <div className="text-center p-4">
                            <div className="mb-3">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="#6c757d" className="opacity-50">
                                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                                </svg>
                            </div>
                            <h6 className="tc-6533 mb-2">Revenue Chart</h6>
                            <p className="text-muted small mb-0">Chart integration would go here</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-lg-4">
                <div className="store-card fill-card h-100">
                    <h5 className="tc-6533 fw-bold mb-4">Quick Overview</h5>
                    <div className="d-flex flex-column gap-3">
                        <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                            <div className="d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="mb-0 small text-muted">New Users</p>
                                    <h6 className="mb-0 fw-bold">{finalStats.newUsers || 0}</h6>
                                </div>
                            </div>
                        </div>
                        
                        <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                            <div className="d-flex align-items-center">
                                <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-success">
                                        <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="mb-0 small text-muted">New Orders</p>
                                    <h6 className="mb-0 fw-bold">{finalStats.newOrders || 0}</h6>
                                </div>
                            </div>
                        </div>
                        
                        <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                            <div className="d-flex align-items-center">
                                <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-warning">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="mb-0 small text-muted">Pending Orders</p>
                                    <h6 className="mb-0 fw-bold">{finalStats.pendingOrders || 0}</h6>
                                </div>
                            </div>
                        </div>
                        
                        <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                            <div className="d-flex align-items-center">
                                <div className="bg-danger bg-opacity-10 rounded-circle p-2 me-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-danger">
                                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="mb-0 small text-muted">Low Stock</p>
                                    <h6 className="mb-0 fw-bold">{finalStats.lowStockProducts || 0}</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Recent Orders */}
        <div className="row">
            <div className="col-12">
                <div className="store-card fill-card">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
                        <h5 className="tc-6533 fw-bold mb-2 mb-sm-0">Recent Orders</h5>
                        <Link to="/admin/orders" className="btn btn-outline-primary btn-rd btn-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor" d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z" />
                            </svg>
                            View All Orders
                        </Link>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                            <tr>
                                <th className="border-0 fw-semibold">Order ID</th>
                                <th className="border-0 fw-semibold">Customer</th>
                                <th className="border-0 fw-semibold">Date</th>
                                <th className="border-0 fw-semibold">Status</th>
                                <th className="border-0 fw-semibold text-center">Items</th>
                                <th className="border-0 fw-semibold text-end">Total</th>
                                <th className="border-0 fw-semibold text-center">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="border-bottom">
                                    <td className="fw-medium tc-6533">{order.id}</td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                                                <span className="text-muted small">{order.customer.split(' ').map(n => n[0]).join('')}</span>
                                            </div>
                                            <span>{order.customer}</span>
                                        </div>
                                    </td>
                                    <td className="text-muted">{order.date}</td>
                                    <td>
                                        <span className={`badge bg-${getStatusColor(order.status)} bg-opacity-10 text-${getStatusColor(order.status)} border border-${getStatusColor(order.status)} border-opacity-25`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="text-center">{order.items}</td>
                                    <td className="fw-semibold text-end">{formatCurrency(order.total)}</td>
                                    <td className="text-center">
                                        <div className="btn-group btn-group-sm">
                                            <button className="btn btn-outline-primary btn-sm">
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M12 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z" />
                                                </svg>
                                            </button>
                                            <button className="btn btn-outline-secondary btn-sm">
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export default AdminDashboard;
