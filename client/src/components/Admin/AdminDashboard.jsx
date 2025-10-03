import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = ({ dashboardStats, dateRange, setDateRange, recentOrders, setActiveTab, getStatusColor, formatCurrency }) => (
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
                                +{dashboardStats.revenueGrowth}%
                            </span>
                        </div>
                    </div>
                    <div className="stats-content">
                        <h2 className="stats-value">{formatCurrency(dashboardStats.totalRevenue)}</h2>
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
                                    +{dashboardStats.ordersGrowth}%
                                </span>
                            </div>
                        </div>
                        <div className="stats-content">
                            <h2 className="stats-value">{dashboardStats.totalOrders.toLocaleString()}</h2>
                            <p className="stats-label">Total Orders</p>
                            <small className="stats-period">vs last period</small>
                        </div>
                    </div>
                </Link>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6">
                <div className="store-card fill-card h-100 position-relative overflow-hidden shadow-sm border-0">
                    <div className="position-absolute top-0 start-0 w-100" style={{ height: '4px', background: 'linear-gradient(90deg, #17a2b8, #6f42c1)' }}></div>
                    <div className="p-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="stats-icon bg-info text-white bg-opacity-15 rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-info">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                                </svg>
                            </div>
                            <div className="text-end">
                                <span className="badge bg-info bg-opacity-15 text-white px-3 py-2 rounded-pill">
                                    <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                        <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                    </svg>
                                    +{dashboardStats.usersGrowth}%
                                </span>
                            </div>
                        </div>
                        <div>
                            <h3 className="mb-1 tc-6533 fw-bold">{dashboardStats.totalUsers.toLocaleString()}</h3>
                            <p className="mb-0 text-muted fw-medium">Total Users</p>
                            <small className="text-muted">vs last period</small>
                        </div>
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
                                    +{dashboardStats.productsGrowth}%
                                </span>
                            </div>
                        </div>
                        <div className="stats-content">
                            <h2 className="stats-value">{dashboardStats.totalProducts}</h2>
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
                    <h5 className="tc-6533 fw-bold mb-4">Quick Actions</h5>
                    <div className="d-grid gap-3">
                        <button className="btn btn-success btn-rd py-3 d-flex align-items-center justify-content-center" onClick={() => setActiveTab('add-product')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            <span className="fw-medium">Add New Product</span>
                        </button>
                        <button className="btn btn-outline-primary btn-rd py-3 d-flex align-items-center justify-content-center" onClick={() => setActiveTab('orders')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z" />
                            </svg>
                            <span className="fw-medium">Manage Orders</span>
                        </button>
                        <button className="btn btn-outline-secondary btn-rd py-3 d-flex align-items-center justify-content-center" onClick={() => setActiveTab('users')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            <span className="fw-medium">View Users</span>
                        </button>
                        <button className="btn btn-outline-info btn-rd py-3 d-flex align-items-center justify-content-center" onClick={() => setActiveTab('settings')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                            <span className="fw-medium">Site Settings</span>
                        </button>
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

export default AdminDashboard;
