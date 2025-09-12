import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminProfile = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dateRange, setDateRange] = useState('7days');

    // Mock admin data
    const adminData = {
        name: 'Sarah Johnson',
        role: 'Super Admin',
        email: 'sarah.johnson@techverse.com',
        avatar: null,
        lastLogin: '2024-01-15 14:30:00',
        permissions: ['users', 'products', 'orders', 'analytics', 'settings']
    };

    // Mock dashboard stats
    const dashboardStats = {
        totalRevenue: 125430.50,
        totalOrders: 1247,
        totalUsers: 8934,
        totalProducts: 456,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
        usersGrowth: 15.2,
        productsGrowth: 5.7
    };

    // Mock recent orders
    const recentOrders = [
        {
            id: 'TV-2024-001234',
            customer: 'John Smith',
            date: '2024-01-15',
            status: 'Processing',
            total: 2999.00,
            items: 2
        },
        {
            id: 'TV-2024-001233',
            customer: 'Emma Wilson',
            date: '2024-01-15',
            status: 'Shipped',
            total: 1299.00,
            items: 1
        },
        {
            id: 'TV-2024-001232',
            customer: 'Michael Brown',
            date: '2024-01-14',
            status: 'Delivered',
            total: 899.00,
            items: 3
        },
        {
            id: 'TV-2024-001231',
            customer: 'Lisa Davis',
            date: '2024-01-14',
            status: 'Cancelled',
            total: 1599.00,
            items: 1
        }
    ];

    // Mock products data
    const products = [
        {
            id: 1,
            name: 'Tablet Air',
            category: 'Tablets',
            price: 1999,
            stock: 45,
            status: 'Active',
            sales: 234,
            image: 'img/tablet-product.jpg'
        },
        {
            id: 2,
            name: 'Phone Pro',
            category: 'Phones',
            price: 999,
            stock: 12,
            status: 'Low Stock',
            sales: 567,
            image: 'img/phone-product.jpg'
        },
        {
            id: 3,
            name: 'Ultra Laptop',
            category: 'Laptops',
            price: 2599,
            stock: 0,
            status: 'Out of Stock',
            sales: 123,
            image: 'img/laptop-product.jpg'
        }
    ];

    // Mock users data
    const users = [
        {
            id: 1,
            name: 'John Smith',
            email: 'john.smith@email.com',
            joinDate: '2023-12-01',
            orders: 5,
            totalSpent: 4567.89,
            status: 'Active'
        },
        {
            id: 2,
            name: 'Emma Wilson',
            email: 'emma.wilson@email.com',
            joinDate: '2023-11-15',
            orders: 12,
            totalSpent: 8934.56,
            status: 'VIP'
        },
        {
            id: 3,
            name: 'Michael Brown',
            email: 'michael.brown@email.com',
            joinDate: '2024-01-10',
            orders: 1,
            totalSpent: 299.99,
            status: 'New'
        }
    ];

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': case 'active': case 'vip': return 'success';
            case 'shipped': case 'processing': return 'info';
            case 'low stock': case 'new': return 'warning';
            case 'cancelled': case 'out of stock': return 'danger';
            default: return 'secondary';
        }
    };

    const formatCurrency = (amount) => `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

    const renderDashboard = () => (
        <div>
            {/* Stats Cards */}
            <div className="row mb-4">
                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="store-card fill-card stats-card">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h3 className="mb-1">{formatCurrency(dashboardStats.totalRevenue)}</h3>
                                <p className="mb-0">Total Revenue</p>
                            </div>
                            <div className="stats-icon bg-success">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-success">+{dashboardStats.revenueGrowth}%</span>
                            <small className="text-muted ms-1">vs last period</small>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="store-card fill-card stats-card">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h3 className="mb-1">{dashboardStats.totalOrders.toLocaleString()}</h3>
                                <p className="mb-0">Total Orders</p>
                            </div>
                            <div className="stats-icon bg-info">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                                </svg>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-success">+{dashboardStats.ordersGrowth}%</span>
                            <small className="text-muted ms-1">vs last period</small>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="store-card fill-card stats-card">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h3 className="mb-1">{dashboardStats.totalUsers.toLocaleString()}</h3>
                                <p className="mb-0">Total Users</p>
                            </div>
                            <div className="stats-icon bg-primary">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2 1l-3 4v2h2l2.54-3.4L16.5 18H20z"/>
                                </svg>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-success">+{dashboardStats.usersGrowth}%</span>
                            <small className="text-muted ms-1">vs last period</small>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-4">
                    <div className="store-card fill-card stats-card">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h3 className="mb-1">{dashboardStats.totalProducts}</h3>
                                <p className="mb-0">Total Products</p>
                            </div>
                            <div className="stats-icon bg-warning">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-success">+{dashboardStats.productsGrowth}%</span>
                            <small className="text-muted ms-1">vs last period</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts and Recent Activity */}
            <div className="row">
                <div className="col-lg-8 mb-4">
                    <div className="store-card fill-card">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="tc-6533 bold-text mb-0">Revenue Overview</h4>
                            <select 
                                className="form-select w-auto"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                            >
                                <option value="7days">Last 7 days</option>
                                <option value="30days">Last 30 days</option>
                                <option value="90days">Last 90 days</option>
                                <option value="1year">Last year</option>
                            </select>
                        </div>
                        <div className="chart-placeholder bg-light rounded d-flex align-items-center justify-content-center" style={{height: '300px'}}>
                            <div className="text-center">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="#6c757d">
                                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                                </svg>
                                <p className="tc-6533 mt-2">Revenue Chart Placeholder</p>
                                <small className="text-muted">Chart integration would go here</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4 mb-4">
                    <div className="store-card fill-card">
                        <h4 className="tc-6533 bold-text mb-4">Quick Actions</h4>
                        <div className="d-grid gap-2">
                            <button className="btn btn-c-2101 btn-rd" onClick={() => setActiveTab('products')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                Add New Product
                            </button>
                            <button className="btn btn-outline-primary btn-rd" onClick={() => setActiveTab('orders')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z"/>
                                </svg>
                                Manage Orders
                            </button>
                            <button className="btn btn-outline-secondary btn-rd" onClick={() => setActiveTab('users')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                View Users
                            </button>
                            <button className="btn btn-outline-info btn-rd">
                                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                                Site Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="row">
                <div className="col-12">
                    <div className="store-card fill-card">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="tc-6533 bold-text mb-0">Recent Orders</h4>
                            <Link to="/admin/orders" className="btn btn-outline-primary btn-rd btn-sm">
                                View All Orders
                            </Link>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="bold-text">{order.id}</td>
                                            <td>{order.customer}</td>
                                            <td>{order.date}</td>
                                            <td>
                                                <span className={`badge bg-${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>{order.items}</td>
                                            <td className="bold-text">{formatCurrency(order.total)}</td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-primary me-1">View</button>
                                                <button className="btn btn-sm btn-outline-secondary">Edit</button>
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

    const renderProducts = () => (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Product Management</h3>
                <button className="btn btn-c-2101 btn-rd">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add Product
                </button>
            </div>

            <div className="row mb-3">
                <div className="col-md-6">
                    <input type="text" className="form-control" placeholder="Search products..." />
                </div>
                <div className="col-md-3">
                    <select className="form-select">
                        <option value="">All Categories</option>
                        <option value="phones">Phones</option>
                        <option value="tablets">Tablets</option>
                        <option value="laptops">Laptops</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <select className="form-select">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="low-stock">Low Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                    </select>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Sales</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="rounded me-3"
                                            width="50"
                                            height="50"
                                        />
                                        <div>
                                            <h6 className="mb-0">{product.name}</h6>
                                            <small className="text-muted">ID: {product.id}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>{product.category}</td>
                                <td className="bold-text">{formatCurrency(product.price)}</td>
                                <td>{product.stock}</td>
                                <td>{product.sales}</td>
                                <td>
                                    <span className={`badge bg-${getStatusColor(product.status)}`}>
                                        {product.status}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-outline-primary me-1">Edit</button>
                                    <button className="btn btn-sm btn-outline-danger">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Order Management</h3>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-success btn-rd btn-sm">Export</button>
                    <select className="form-select w-auto">
                        <option value="">All Orders</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                    </select>
                </div>
            </div>

            <div className="row mb-3">
                <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="Search orders..." />
                </div>
                <div className="col-md-4">
                    <input type="date" className="form-control" />
                </div>
                <div className="col-md-4">
                    <input type="date" className="form-control" />
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map((order) => (
                            <tr key={order.id}>
                                <td className="bold-text">{order.id}</td>
                                <td>{order.customer}</td>
                                <td>{order.date}</td>
                                <td>
                                    <select className={`form-select form-select-sm badge-${getStatusColor(order.status)}`}>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td>{order.items}</td>
                                <td className="bold-text">{formatCurrency(order.total)}</td>
                                <td>
                                    <button className="btn btn-sm btn-outline-primary me-1">View</button>
                                    <button className="btn btn-sm btn-outline-secondary">Print</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">User Management</h3>
                <button className="btn btn-c-2101 btn-rd">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8c0-.55-.45-1-1-1s-1 .45-1 1v2H2c-.55 0-1 .45-1 1s.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1H6z"/>
                    </svg>
                    Add User
                </button>
            </div>

            <div className="row mb-3">
                <div className="col-md-6">
                    <input type="text" className="form-control" placeholder="Search users..." />
                </div>
                <div className="col-md-3">
                    <select className="form-select">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="vip">VIP</option>
                        <option value="new">New</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <select className="form-select">
                        <option value="">Sort by</option>
                        <option value="name">Name</option>
                        <option value="date">Join Date</option>
                        <option value="orders">Orders</option>
                        <option value="spent">Total Spent</option>
                    </select>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Join Date</th>
                            <th>Orders</th>
                            <th>Total Spent</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                                            <span className="text-white">{user.name.split(' ').map(n => n[0]).join('')}</span>
                                        </div>
                                        <div>
                                            <h6 className="mb-0">{user.name}</h6>
                                            <small className="text-muted">ID: {user.id}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>{user.joinDate}</td>
                                <td>{user.orders}</td>
                                <td className="bold-text">{formatCurrency(user.totalSpent)}</td>
                                <td>
                                    <span className={`badge bg-${getStatusColor(user.status)}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-outline-primary me-1">View</button>
                                    <button className="btn btn-sm btn-outline-secondary">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="store-card fill-card">
            <h3 className="tc-6533 bold-text mb-4">Admin Settings</h3>
            
            {/* Admin Profile */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Admin Profile</h5>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label tc-6533 bold-text">Name</label>
                        <input type="text" className="form-control" value={adminData.name} readOnly />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label tc-6533 bold-text">Role</label>
                        <input type="text" className="form-control" value={adminData.role} readOnly />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label tc-6533 bold-text">Email</label>
                        <input type="email" className="form-control" value={adminData.email} readOnly />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label tc-6533 bold-text">Last Login</label>
                        <input type="text" className="form-control" value={adminData.lastLogin} readOnly />
                    </div>
                </div>
            </div>

            {/* Permissions */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Permissions</h5>
                <div className="row">
                    {adminData.permissions.map((permission) => (
                        <div key={permission} className="col-md-3 mb-2">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" defaultChecked disabled />
                                <label className="form-check-label tc-6533 text-capitalize">
                                    {permission}
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Settings */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">System Settings</h5>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label tc-6533 bold-text">Site Name</label>
                        <input type="text" className="form-control" defaultValue="TechVerse" />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label tc-6533 bold-text">Currency</label>
                        <select className="form-select">
                            <option value="GBP">GBP (£)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label tc-6533 bold-text">Tax Rate (%)</label>
                        <input type="number" className="form-control" defaultValue="20" />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label tc-6533 bold-text">Free Shipping Threshold</label>
                        <input type="number" className="form-control" defaultValue="50" />
                    </div>
                </div>
            </div>

            <div className="d-flex gap-2">
                <button className="btn btn-c-2101 btn-rd">Save Changes</button>
                <button className="btn btn-outline-secondary btn-rd">Reset</button>
            </div>
        </div>
    );

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="admin-profile-bloc">
            <div className="container-fluid bloc-md bloc-lg-md">
                <div className="row">
                    {/* Admin Header */}
                    <div className="col-12 mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="tc-6533 bold-text mb-1">Admin Dashboard</h1>
                                <p className="tc-6533 mb-0">Welcome back, {adminData.name}</p>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <div className="text-end">
                                    <p className="mb-0 bold-text tc-6533">{adminData.name}</p>
                                    <small className="tc-6533">{adminData.role}</small>
                                </div>
                                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{width: '48px', height: '48px'}}>
                                    <span className="text-white h5 mb-0">{adminData.name.split(' ').map(n => n[0]).join('')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Sidebar Navigation */}
                        <div className="col-lg-2 mb-4 mb-lg-0">
                            <div className="store-card fill-card">
                                <div className="list-group list-group-flush">
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'dashboard' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('dashboard')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                        </svg>
                                        Dashboard
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'products' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('products')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        Products
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'orders' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('orders')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z"/>
                                        </svg>
                                        Orders
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'users' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('users')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                        Users
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'settings' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('settings')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                                        </svg>
                                        Settings
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="col-lg-10">
                            {activeTab === 'dashboard' && renderDashboard()}
                            {activeTab === 'products' && renderProducts()}
                            {activeTab === 'orders' && renderOrders()}
                            {activeTab === 'users' && renderUsers()}
                            {activeTab === 'settings' && renderSettings()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;