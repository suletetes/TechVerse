import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminHeader } from '../../components/Admin';

const AdminProductManagement = () => {
    const [products, setProducts] = useState([
        {
            id: 1,
            name: 'Tablet Air',
            category: 'Tablets',
            price: 1999,
            originalPrice: 2199,
            stock: 45,
            status: 'Active',
            sales: 234,
            image: '/img/tablet-product.jpg',
            featured: true,
            sku: 'TAB-001'
        },
        {
            id: 2,
            name: 'Phone Pro',
            category: 'Phones',
            price: 999,
            originalPrice: null,
            stock: 12,
            status: 'Low Stock',
            sales: 567,
            image: '/img/phone-product.jpg',
            featured: false,
            sku: 'PHN-002'
        },
        {
            id: 3,
            name: 'Ultra Laptop',
            category: 'Laptops',
            price: 2599,
            originalPrice: null,
            stock: 0,
            status: 'Out of Stock',
            sales: 123,
            image: '/img/laptop-product.jpg',
            featured: true,
            sku: 'LAP-003'
        },
        {
            id: 4,
            name: 'Smart TV 55"',
            category: 'TVs',
            price: 1299,
            originalPrice: 1499,
            stock: 28,
            status: 'Active',
            sales: 89,
            image: '/img/tv-product.jpg',
            featured: false,
            sku: 'TV-004'
        }
    ]);

    const [filters, setFilters] = useState({
        category: 'all',
        status: 'all',
        priceMin: '',
        priceMax: '',
        search: ''
    });

    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'active': return 'success';
            case 'low stock': return 'warning';
            case 'out of stock': return 'danger';
            case 'inactive': return 'secondary';
            default: return 'secondary';
        }
    };

    const formatCurrency = (amount) => `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

    const filteredProducts = products.filter(product => {
        if (filters.category !== 'all' && product.category.toLowerCase() !== filters.category.toLowerCase()) return false;
        if (filters.status !== 'all' && product.status.toLowerCase() !== filters.status.toLowerCase()) return false;
        if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.priceMin && product.price < parseFloat(filters.priceMin)) return false;
        if (filters.priceMax && product.price > parseFloat(filters.priceMax)) return false;
        return true;
    }).sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const adminData = {
        name: 'Sarah Johnson',
        role: 'Super Admin',
        email: 'sarah.johnson@techverse.com',
        avatar: null
    };

    const categories = ['Tablets', 'Phones', 'Laptops', 'TVs', 'Headphones', 'Watches'];

    return (
        <div className="min-vh-100 bg-light">
            <AdminHeader
                activeTab="products"
                adminData={adminData}
                sidebarOpen={false}
                setSidebarOpen={() => { }}
            />

            <div className="container-fluid p-4">
                {/* Page Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="h3 mb-1">Product Management</h1>
                                <p className="text-muted mb-0">Manage your product catalog and inventory</p>
                            </div>
                            <div className="d-flex gap-2">
                                <Link to="/admin" className="btn btn-outline-secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                    Back to Dashboard
                                </Link>
                                <button className="btn btn-success">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                                    </svg>
                                    Add Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-lg-3 col-md-6">
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
                                        +5.7%
                                    </span>
                                </div>
                            </div>
                            <div className="stats-content">
                                <h2 className="stats-value">{products.length}</h2>
                                <p className="stats-label">Total Products</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <div className="dashboard-stats-card">
                            <div className="stats-card-header">
                                <div className="stats-icon-container">
                                    <div className="stats-icon bg-success">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="stats-growth">
                                    <span className="growth-badge positive">
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        +3.2%
                                    </span>
                                </div>
                            </div>
                            <div className="stats-content">
                                <h2 className="stats-value">{products.filter(p => p.status === 'Active').length}</h2>
                                <p className="stats-label">Active Products</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <div className="dashboard-stats-card">
                            <div className="stats-card-header">
                                <div className="stats-icon-container">
                                    <div className="stats-icon bg-danger">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="stats-growth">
                                    <span className="growth-badge negative">
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 10l5 5 5-5z" />
                                        </svg>
                                        -2.1%
                                    </span>
                                </div>
                            </div>
                            <div className="stats-content">
                                <h2 className="stats-value">{products.filter(p => p.status === 'Out of Stock').length}</h2>
                                <p className="stats-label">Out of Stock</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <div className="dashboard-stats-card">
                            <div className="stats-card-header">
                                <div className="stats-icon-container">
                                    <div className="stats-icon bg-info">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="stats-growth">
                                    <span className="growth-badge positive">
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        +1.5%
                                    </span>
                                </div>
                            </div>
                            <div className="stats-content">
                                <h2 className="stats-value">{categories.length}</h2>
                                <p className="stats-label">Categories</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Search Products</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name or SKU..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-select"
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="low stock">Low Stock</option>
                                    <option value="out of stock">Out of Stock</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Min Price</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="£0"
                                    value={filters.priceMin}
                                    onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Max Price</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="£9999"
                                    value={filters.priceMax}
                                    onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                                />
                            </div>
                            <div className="col-md-1">
                                <label className="form-label">&nbsp;</label>
                                <button
                                    className="btn btn-outline-secondary w-100"
                                    onClick={() => setFilters({ category: 'all', status: 'all', priceMin: '', priceMax: '', search: '' })}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Products ({filteredProducts.length})</h5>
                        <div className="d-flex gap-2 align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 small">Sort by:</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    style={{ width: 'auto' }}
                                >
                                    <option value="name">Name</option>
                                    <option value="price">Price</option>
                                    <option value="stock">Stock</option>
                                    <option value="sales">Sales</option>
                                </select>
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                        <path fill="currentColor" d={sortOrder === 'asc' ? "M7 14l5-5 5 5z" : "M7 10l5 5 5-5z"} />
                                    </svg>
                                </button>
                            </div>
                            <div className="vr"></div>
                            <button className="btn btn-outline-primary btn-sm">
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                                </svg>
                                Export
                            </button>
                            <button className="btn btn-outline-secondary btn-sm">
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        <div className="admin-table-container">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="border-0 fw-semibold">Product</th>
                                            <th className="border-0 fw-semibold">Category</th>
                                            <th className="border-0 fw-semibold">Price</th>
                                            <th className="border-0 fw-semibold">Stock</th>
                                            <th className="border-0 fw-semibold">Status</th>
                                            <th className="border-0 fw-semibold">Sales</th>
                                            <th className="border-0 fw-semibold text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="product-image-container me-3">
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="product-table-image"
                                                                onError={(e) => {
                                                                    e.target.src = '/img/placeholder-product.jpg';
                                                                }}
                                                            />
                                                            {product.featured && (
                                                                <span className="featured-badge">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24">
                                                                        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                    </svg>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold">{product.name}</div>
                                                            <small className="text-muted">SKU: {product.sku}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="category-badge">{product.category}</span>
                                                </td>
                                                <td>
                                                    <div>
                                                        <span className="fw-semibold">{formatCurrency(product.price)}</span>
                                                        {product.originalPrice && (
                                                            <div>
                                                                <small className="text-muted text-decoration-line-through">
                                                                    {formatCurrency(product.originalPrice)}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <span className={`stock-indicator ${product.stock === 0 ? 'out-of-stock' : product.stock <= 15 ? 'low-stock' : 'in-stock'}`}></span>
                                                        <span className="ms-2">{product.stock}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${product.status.toLowerCase().replace(' ', '-')}`}>
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td className="fw-semibold">{product.sales}</td>
                                                <td className="text-center">
                                                    <div className="btn-group btn-group-sm">
                                                        <button className="btn btn-outline-primary btn-sm" title="View Product">
                                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                                            </svg>
                                                        </button>
                                                        <button className="btn btn-outline-secondary btn-sm" title="Edit Product">
                                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                                <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                                            </svg>
                                                        </button>
                                                        <button className="btn btn-outline-warning btn-sm" title={product.featured ? 'Remove from Featured' : 'Add to Featured'}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                                <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                            </svg>
                                                        </button>
                                                        <button className="btn btn-outline-danger btn-sm" title="Delete Product">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProductManagement;