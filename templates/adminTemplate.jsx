import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminProfile = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dateRange, setDateRange] = useState('7days');

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        image: null
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

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

    const handleProductInputChange = (e) => {
        const { name, value } = e.target;

        // Handle description character limit
        if (name === 'description' && value.length > 500) {
            return; // Don't update if over limit
        }

        // Handle price validation
        if (name === 'price' && value && parseFloat(value) < 0) {
            return; // Don't allow negative prices
        }

        // Handle stock validation
        if (name === 'stock' && value && parseInt(value) < 0) {
            return; // Don't allow negative stock
        }

        setNewProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProductImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setNewProduct(prev => ({
                    ...prev,
                    image: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddProduct = (e) => {
        e.preventDefault();

        // Validation
        if (!newProduct.name.trim()) {
            alert('Please enter a product name');
            return;
        }
        if (!newProduct.category) {
            alert('Please select a category');
            return;
        }
        if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
            alert('Please enter a valid price');
            return;
        }
        if (!newProduct.stock || parseInt(newProduct.stock) < 0) {
            alert('Please enter a valid stock quantity');
            return;
        }
        if (!newProduct.description.trim()) {
            alert('Please enter a product description');
            return;
        }
        if (newProduct.description.length > 500) {
            alert('Description must be 500 characters or less');
            return;
        }

        // Create new product object
        const productData = {
            id: Date.now(), // Simple ID generation for demo
            name: newProduct.name.trim(),
            category: newProduct.category,
            price: parseFloat(newProduct.price),
            stock: parseInt(newProduct.stock),
            description: newProduct.description.trim(),
            image: newProduct.image || 'img/default-product.jpg',
            status: parseInt(newProduct.stock) > 10 ? 'Active' : parseInt(newProduct.stock) > 0 ? 'Low Stock' : 'Out of Stock',
            sales: 0,
            dateAdded: new Date().toISOString().split('T')[0]
        };

        console.log('Adding product:', productData);

        // Here you would typically make an API call to save the product
        // For demo purposes, we'll just show success message
        alert(`Product "${productData.name}" added successfully!`);

        // Reset form and redirect to products
        setNewProduct({
            name: '',
            category: '',
            price: '',
            stock: '',
            description: '',
            image: null
        });
        setActiveTab('products');
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();

        // Validation
        if (!passwordData.currentPassword) {
            alert('Please enter your current password');
            return;
        }
        if (!passwordData.newPassword) {
            alert('Please enter a new password');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            alert('New password must be at least 8 characters long');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New password and confirmation do not match');
            return;
        }

        // Here you would typically make an API call to change the password
        console.log('Changing password...');
        alert('Password changed successfully!');

        // Reset form
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6">
        <div className="store-card fill-card h-100 position-relative overflow-hidden shadow-sm border-0">
            <div className="position-absolute top-0 start-0 w-100" style={{ height: '4px', background: 'linear-gradient(90deg, #28a745, #20c997)' }}></div>
            <div className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="stats-icon bg-success bg-opacity-15 rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-success">
                            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor" />
                        </svg>
                    </div>
                    <div className="text-end">
                                    <span className="badge bg-success bg-opacity-15 text-success px-3 py-2 rounded-pill">
                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        +{dashboardStats.revenueGrowth}%
                                    </span>
                    </div>
                </div>
                <div>
                    <h3 className="mb-1 tc-6533 fw-bold">{formatCurrency(dashboardStats.totalRevenue)}</h3>
                    <p className="mb-0 text-muted fw-medium">Total Revenue</p>
                    <small className="text-muted">vs last period</small>
                </div>
            </div>
        </div>
    </div>
    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6">
        <div className="store-card fill-card h-100 position-relative overflow-hidden shadow-sm border-0">
            <div className="position-absolute top-0 start-0 w-100" style={{ height: '4px', background: 'linear-gradient(90deg, #17a2b8, #6f42c1)' }}></div>
            <div className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="stats-icon bg-info bg-opacity-15 rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-info">
                            <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" fill="currentColor" />
                        </svg>
                    </div>
                    <div className="text-end">
                                    <span className="badge bg-info bg-opacity-15 text-info px-3 py-2 rounded-pill">
                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        +{dashboardStats.ordersGrowth}%
                                    </span>
                    </div>
                </div>
                <div>
                    <h3 className="mb-1 tc-6533 fw-bold">{dashboardStats.totalOrders.toLocaleString()}</h3>
                    <p className="mb-0 text-muted fw-medium">Total Orders</p>
                    <small className="text-muted">vs last period</small>
                </div>
            </div>
        </div>
    </div>
    <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6">
        <div className="store-card fill-card h-100 position-relative overflow-hidden shadow-sm border-0">
            <div className="position-absolute top-0 start-0 w-100" style={{ height: '4px', background: 'linear-gradient(90deg, #007bff, #6610f2)' }}></div>
            <div className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="stats-icon bg-primary bg-opacity-15 rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                        </svg>
                    </div>
                    <div className="text-end">
                                    <span className="badge bg-primary bg-opacity-15 text-primary px-3 py-2 rounded-pill">
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
        <div className="store-card fill-card h-100 position-relative overflow-hidden shadow-sm border-0">
            <div className="position-absolute top-0 start-0 w-100" style={{ height: '4px', background: 'linear-gradient(90deg, #ffc107, #fd7e14)' }}></div>
            <div className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="stats-icon bg-warning bg-opacity-15 rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-warning">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
                        </svg>
                    </div>
                    <div className="text-end">
                                    <span className="badge bg-warning bg-opacity-15 text-warning px-3 py-2 rounded-pill">
                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        +{dashboardStats.productsGrowth}%
                                    </span>
                    </div>
                </div>
                <div>
                    <h3 className="mb-1 tc-6533 fw-bold">{dashboardStats.totalProducts}</h3>
                    <p className="mb-0 text-muted fw-medium">Total Products</p>
                    <small className="text-muted">vs last period</small>
                </div>
            </div>
        </div>
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

    const renderProducts = () => (
        <div className="store-card fill-card">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
                <h3 className="tc-6533 bold-text mb-2 mb-sm-0">Product Management</h3>
                <button
                    className="btn btn-success btn-rd d-flex align-items-center"
                    onClick={() => setActiveTab('add-product')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" className="me-2" fill="white">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add New Product
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
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                    <tr>
                        <th className="border-0 fw-semibold">Product</th>
                        <th className="border-0 fw-semibold d-none d-md-table-cell">Category</th>
                        <th className="border-0 fw-semibold">Price</th>
                        <th className="border-0 fw-semibold d-none d-lg-table-cell">Stock</th>
                        <th className="border-0 fw-semibold d-none d-xl-table-cell">Sales</th>
                        <th className="border-0 fw-semibold">Status</th>
                        <th className="border-0 fw-semibold text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.map((product) => (
                        <tr key={product.id} className="border-bottom">
                            <td>
                                <div className="d-flex align-items-center">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="rounded-3 me-3 shadow-sm"
                                        width="60"
                                        height="60"
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <div>
                                        <h6 className="mb-1 fw-semibold">{product.name}</h6>
                                        <small className="text-muted">ID: {product.id}</small>
                                        <div className="d-block d-md-none">
                                            <small className="text-muted">{product.category}</small>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="d-none d-md-table-cell">
                                    <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                                        {product.category}
                                    </span>
                            </td>
                            <td className="fw-bold tc-6533">{formatCurrency(product.price)}</td>
                            <td className="d-none d-lg-table-cell">
                                    <span className={`fw-medium ${product.stock < 10 ? 'text-warning' : product.stock === 0 ? 'text-danger' : 'text-success'}`}>
                                        {product.stock}
                                    </span>
                            </td>
                            <td className="d-none d-xl-table-cell text-muted">{product.sales}</td>
                            <td>
                                    <span className={`badge bg-${getStatusColor(product.status)} bg-opacity-15 text-${getStatusColor(product.status)} border border-${getStatusColor(product.status)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                        {product.status}
                                    </span>
                            </td>
                            <td className="text-center">
                                <div className="btn-group btn-group-sm">
                                    <button className="btn btn-outline-primary btn-sm rounded-start">
                                        <svg width="14" height="14" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                        </svg>
                                    </button>
                                    <button className="btn btn-outline-danger btn-sm rounded-end">
                                        <svg width="14" height="14" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
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
                        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8c0-.55-.45-1-1-1s-1 .45-1 1v2H2c-.55 0-1 .45-1 1s.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1H6z" />
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
                                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
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

    const renderAddProduct = () => (
        <div className="container-fluid px-0">
            {/* Hero Header */}
            <div className="row g-0 mb-4">
                <div className="col-12">
                    <div className="position-relative overflow-hidden rounded-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <div className="position-absolute top-0 end-0 opacity-10">
                            <svg width="200" height="200" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        </div>
                        <div className="p-5 text-white position-relative">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <div className="bg-white bg-opacity-20 rounded-4 p-4 me-4 backdrop-blur">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="mb-2 fw-bold display-6">Create New Product</h1>
                                        <p className="mb-0 opacity-90 fs-5">Build your inventory with amazing products</p>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-light btn-lg rounded-3 shadow-sm"
                                    onClick={() => setActiveTab('products')}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                    Back to Products
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleAddProduct}>
                <div className="row g-4">
                    {/* Product Image Section */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                            <div className="card-header bg-gradient text-white border-0 p-4" style={{ background: 'linear-gradient(45deg, #28a745, #20c997)' }}>
                                <div className="d-flex align-items-center">
                                    <div className="bg-white bg-opacity-20 rounded-3 p-2 me-3">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                        </svg>
                                    </div>
                                    <h4 className="mb-0 fw-bold">Product Gallery</h4>
                                </div>
                            </div>
                            <div className="card-body p-4 text-center">
                                {newProduct.image ? (
                                    <div className="position-relative mb-4">
                                        <img
                                            src={newProduct.image}
                                            alt="Product preview"
                                            className="img-fluid rounded-4 shadow-lg border"
                                            style={{ maxHeight: '350px', width: '100%', objectFit: 'cover' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-danger position-absolute top-0 end-0 m-3 rounded-circle shadow-lg"
                                            onClick={() => setNewProduct(prev => ({ ...prev, image: null }))}
                                            style={{ width: '44px', height: '44px' }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24">
                                                <path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                            </svg>
                                        </button>
                                        <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-3 rounded-bottom-4">
                                            <small className="fw-medium">✓ Image uploaded successfully</small>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-3 border-dashed rounded-4 p-5 mb-4 bg-light position-relative" style={{ borderColor: '#dee2e6', minHeight: '350px' }}>
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                            <div className="bg-primary bg-opacity-10 rounded-circle p-4 mb-4">
                                                <svg width="48" height="48" viewBox="0 0 24 24" className="text-primary">
                                                    <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                                </svg>
                                            </div>
                                            <h5 className="text-muted mb-3 fw-bold">Upload Product Image</h5>
                                            <p className="text-muted mb-4">Drag and drop your image here or click to browse</p>
                                            <div className="d-flex gap-2 text-muted small">
                                                <span className="badge bg-light text-dark">JPG</span>
                                                <span className="badge bg-light text-dark">PNG</span>
                                                <span className="badge bg-light text-dark">GIF</span>
                                                <span className="badge bg-light text-dark">Max 5MB</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <label className="btn btn-primary btn-lg w-100 rounded-3 shadow-sm">
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                                    </svg>
                                    {newProduct.image ? 'Change Image' : 'Choose Image'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProductImageChange}
                                        className="d-none"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Product Details Section */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                            <div className="card-header bg-gradient text-white border-0 p-4" style={{ background: 'linear-gradient(45deg, #007bff, #6610f2)' }}>
                                <div className="d-flex align-items-center">
                                    <div className="bg-white bg-opacity-20 rounded-3 p-2 me-3">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                                        </svg>
                                    </div>
                                    <h4 className="mb-0 fw-bold">Product Information</h4>
                                </div>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark mb-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-primary">
                                                <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                            </svg>
                                            Product Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control form-control-lg rounded-3 border-2"
                                            value={newProduct.name}
                                            onChange={handleProductInputChange}
                                            placeholder="Enter product name"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark mb-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-primary">
                                                <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                            </svg>
                                            Category *
                                        </label>
                                        <select
                                            name="category"
                                            className="form-select form-select-lg rounded-3 border-2"
                                            value={newProduct.category}
                                            onChange={handleProductInputChange}
                                            required
                                        >
                                            <option value="">Select category</option>
                                            <option value="phones">📱 Phones</option>
                                            <option value="tablets">📱 Tablets</option>
                                            <option value="laptops">💻 Laptops</option>
                                            <option value="accessories">🎧 Accessories</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark mb-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-success">
                                                <path fill="currentColor" d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                                            </svg>
                                            Price (£) *
                                        </label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text bg-success text-white border-2 border-success fw-bold">£</span>
                                            <input
                                                type="number"
                                                name="price"
                                                className="form-control border-2 border-start-0"
                                                value={newProduct.price}
                                                onChange={handleProductInputChange}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark mb-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-warning">
                                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                            </svg>
                                            Stock Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            name="stock"
                                            className="form-control form-control-lg rounded-3 border-2"
                                            value={newProduct.stock}
                                            onChange={handleProductInputChange}
                                            placeholder="0"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold text-dark mb-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-info">
                                                <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                                            </svg>
                                            Product Description *
                                        </label>
                                        <textarea
                                            name="description"
                                            className="form-control rounded-3 border-2"
                                            rows="5"
                                            value={newProduct.description}
                                            onChange={handleProductInputChange}
                                            placeholder="Enter detailed product description, features, specifications..."
                                            required
                                            style={{ resize: 'vertical' }}
                                        ></textarea>
                                        <div className="d-flex justify-content-between mt-2">
                                            <small className="text-muted">💡 Provide detailed information about the product</small>
                                            <small className={`fw-medium ${newProduct.description.length > 450 ? 'text-warning' : newProduct.description.length > 0 ? 'text-success' : 'text-muted'}`}>
                                                {newProduct.description.length}/500 characters
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="d-flex gap-3 pt-4 mt-4 border-top">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-lg px-4 rounded-3"
                                        onClick={() => {
                                            setNewProduct({
                                                name: '',
                                                category: '',
                                                price: '',
                                                stock: '',
                                                description: '',
                                                image: null
                                            });
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                        </svg>
                                        Clear Form
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success btn-lg px-5 flex-grow-1 rounded-3 shadow-sm"
                                        disabled={
                                            !newProduct.name ||
                                            !newProduct.category ||
                                            !newProduct.price ||
                                            !newProduct.stock ||
                                            !newProduct.description
                                        }
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                        </svg>
                                        Create Product
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
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

            {/* Password Management */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3 d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-warning">
                        <path fill="currentColor" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                    </svg>
                    Change Password
                </h5>
                <div className="card border-0 bg-light rounded-3">
                    <div className="card-body p-4">
                        <form onSubmit={handlePasswordChange}>
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label tc-6533 fw-semibold">Current Password *</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        className="form-control"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordInputChange}
                                        placeholder="Enter current password"
                                        required
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label tc-6533 fw-semibold">New Password *</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        className="form-control"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordInputChange}
                                        placeholder="Enter new password"
                                        minLength="8"
                                        required
                                    />
                                    <small className="text-muted">Minimum 8 characters</small>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label tc-6533 fw-semibold">Confirm New Password *</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="form-control"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordInputChange}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="d-flex gap-2 mt-3">
                                <button
                                    type="submit"
                                    className="btn btn-warning btn-rd px-4"
                                    disabled={
                                        !passwordData.currentPassword ||
                                        !passwordData.newPassword ||
                                        !passwordData.confirmPassword ||
                                        passwordData.newPassword !== passwordData.confirmPassword
                                    }
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="white">
                                        <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                                    </svg>
                                    Change Password
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-rd px-4"
                                    onClick={() => setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    })}
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* System Settings */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3 d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-primary">
                        <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                    </svg>
                    System Settings
                </h5>
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
        <div className="min-vh-100 bg-light">
            <div className="container-fluid p-0">
                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
                        style={{ zIndex: 1040 }}
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}

                <div className="row g-0 min-vh-100">
                    {/* Sidebar Navigation */}
                    <div className={`col-lg-3 col-xl-2 ${sidebarOpen ? 'position-fixed start-0 top-0 h-100 bg-white d-lg-block shadow-lg' : 'd-none d-lg-block'}`} style={{ zIndex: 1050, width: sidebarOpen ? '280px' : 'auto' }}>
                        <div className="bg-white h-100 border-end">
                            {/* Mobile Close Button */}
                            <div className="d-flex justify-content-between align-items-center p-3 d-lg-none border-bottom">
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                                        <span className="text-white fw-bold small">{adminData.name.split(' ').map(n => n[0]).join('')}</span>
                                    </div>
                                    <h6 className="mb-0 tc-6533 fw-bold">Admin Menu</h6>
                                </div>
                                <button
                                    className="btn btn-sm btn-outline-secondary rounded-circle p-2"
                                    onClick={() => setSidebarOpen(false)}
                                    style={{ width: '36px', height: '36px' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Admin Profile Section */}
                            <div className="p-4 border-bottom d-none d-lg-block">
                                <div className="d-flex align-items-center">
                                    <div className="position-relative me-3">
                                        <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                            <span className="text-white fw-bold">{adminData.name.split(' ').map(n => n[0]).join('')}</span>
                                        </div>
                                        <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white" style={{ width: '12px', height: '12px' }}></div>
                                    </div>
                                    <div>
                                        <h6 className="mb-0 tc-6533 fw-bold">{adminData.name}</h6>
                                        <small className="text-muted">{adminData.role}</small>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Menu */}
                            <div className="py-3">
                                <nav className="nav flex-column">
                                    <button
                                        className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'dashboard' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                                        onClick={() => {
                                            setActiveTab('dashboard');
                                            setSidebarOpen(false);
                                        }}
                                    >
                                        {activeTab === 'dashboard' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                                        <div className={`rounded-2 p-2 me-3 ${activeTab === 'dashboard' ? 'bg-primary' : 'bg-light'}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-muted'}`}>
                                                <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">Dashboard</div>
                                            <small className="text-muted">Overview & Analytics</small>
                                        </div>
                                    </button>
                                    <button
                                        className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'products' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                                        onClick={() => {
                                            setActiveTab('products');
                                            setSidebarOpen(false);
                                        }}
                                    >
                                        {activeTab === 'products' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                                        <div className={`rounded-2 p-2 me-3 ${activeTab === 'products' ? 'bg-primary' : 'bg-light'}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'products' ? 'text-white' : 'text-muted'}`}>
                                                <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">Products</div>
                                            <small className="text-muted">Manage Inventory</small>
                                        </div>
                                    </button>
                                    <button
                                        className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'add-product' ? 'active bg-success bg-opacity-10 text-success' : 'text-dark'}`}
                                        onClick={() => {
                                            setActiveTab('add-product');
                                            setSidebarOpen(false);
                                        }}
                                    >
                                        {activeTab === 'add-product' && <div className="position-absolute start-0 top-0 bottom-0 bg-success" style={{ width: '3px' }}></div>}
                                        <div className={`rounded-2 p-2 me-3 ${activeTab === 'add-product' ? 'bg-success' : 'bg-light'}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'add-product' ? 'text-white' : 'text-muted'}`}>
                                                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">Add Product</div>
                                            <small className="text-muted">Create New Item</small>
                                        </div>
                                    </button>
                                    <button
                                        className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'orders' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                                        onClick={() => {
                                            setActiveTab('orders');
                                            setSidebarOpen(false);
                                        }}
                                    >
                                        {activeTab === 'orders' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                                        <div className={`rounded-2 p-2 me-3 ${activeTab === 'orders' ? 'bg-primary' : 'bg-light'}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'orders' ? 'text-white' : 'text-muted'}`}>
                                                <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">Orders</div>
                                            <small className="text-muted">Process & Track</small>
                                        </div>
                                    </button>
                                    <button
                                        className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'users' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                                        onClick={() => {
                                            setActiveTab('users');
                                            setSidebarOpen(false);
                                        }}
                                    >
                                        {activeTab === 'users' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                                        <div className={`rounded-2 p-2 me-3 ${activeTab === 'users' ? 'bg-primary' : 'bg-light'}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'users' ? 'text-white' : 'text-muted'}`}>
                                                <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">Users</div>
                                            <small className="text-muted">Customer Management</small>
                                        </div>
                                    </button>
                                    <button
                                        className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'settings' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                                        onClick={() => {
                                            setActiveTab('settings');
                                            setSidebarOpen(false);
                                        }}
                                    >
                                        {activeTab === 'settings' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                                        <div className={`rounded-2 p-2 me-3 ${activeTab === 'settings' ? 'bg-primary' : 'bg-light'}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'settings' ? 'text-white' : 'text-muted'}`}>
                                                <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">Settings</div>
                                            <small className="text-muted">System Configuration</small>
                                        </div>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-lg-9 col-xl-10">
                        {/* Top Header */}
                        <div className="bg-white border-bottom px-4 py-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <button
                                        className="btn btn-outline-primary btn-sm me-3 d-lg-none"
                                        onClick={() => setSidebarOpen(!sidebarOpen)}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
                                        </svg>
                                    </button>
                                    <div>
                                        <h1 className="h4 mb-0 tc-6533 fw-bold">
                                            {activeTab === 'dashboard' && 'Admin Dashboard'}
                                            {activeTab === 'products' && 'Product Management'}
                                            {activeTab === 'add-product' && 'Add New Product'}
                                            {activeTab === 'orders' && 'Order Management'}
                                            {activeTab === 'users' && 'User Management'}
                                            {activeTab === 'settings' && 'Admin Settings'}
                                        </h1>
                                        <p className="mb-0 text-muted small">
                                            {activeTab === 'dashboard' && `Welcome back, ${adminData.name}`}
                                            {activeTab === 'products' && 'Manage your product inventory'}
                                            {activeTab === 'add-product' && 'Create a new product listing'}
                                            {activeTab === 'orders' && 'Process and track customer orders'}
                                            {activeTab === 'users' && 'Manage customer accounts'}
                                            {activeTab === 'settings' && 'Configure system settings'}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center d-none d-sm-flex">
                                    <div className="text-end me-3">
                                        <div className="fw-semibold tc-6533 small">{adminData.name}</div>
                                        <small className="text-muted">{adminData.role}</small>
                                    </div>
                                    <div className="position-relative">
                                        <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                            <span className="text-white fw-bold small">{adminData.name.split(' ').map(n => n[0]).join('')}</span>
                                        </div>
                                        <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white" style={{ width: '12px', height: '12px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-4">
                            {activeTab === 'dashboard' && renderDashboard()}
                            {activeTab === 'products' && renderProducts()}
                            {activeTab === 'add-product' && renderAddProduct()}
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
