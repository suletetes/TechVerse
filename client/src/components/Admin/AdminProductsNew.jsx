import React, { useState, useEffect } from 'react';
import { adminDataManager } from '../../utils/AdminDataManager.js';

const AdminProductsNew = ({ setActiveTab }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    // Load products
    useEffect(() => {
        loadProducts();
    }, [filters]);

    // Set up data manager listener
    useEffect(() => {
        const unsubscribe = adminDataManager.addListener('products', (data) => {
            console.log('📦 Products data update:', data);
            setLoading(data.loading);
            setError(data.error);
            if (data.data) {
                setProducts(data.data);
                console.log('✅ Products set:', data.data.length);
            }
            if (data.pagination) {
                setPagination(data.pagination);
            }
        });

        return unsubscribe;
    }, []);

    const loadProducts = async () => {
        try {
            await adminDataManager.loadProducts(filters);
        } catch (err) {
            console.error('Failed to load products:', err);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount || 0);
    };

    const getStatusColor = (status) => {
        const colors = {
            'active': 'success',
            'draft': 'warning',
            'inactive': 'secondary',
            'archived': 'danger',
            'out_of_stock': 'danger'
        };
        return colors[status?.toLowerCase()] || 'secondary';
    };

    const getStockStatus = (product) => {
        const stock = product.stock?.quantity || product.stockQuantity || 0;
        if (stock === 0) return { color: 'danger', text: 'Out of Stock' };
        if (stock < 10) return { color: 'warning', text: 'Low Stock' };
        return { color: 'success', text: 'In Stock' };
    };

    if (loading) {
        return (
            <div className="store-card fill-card">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading products...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading products from database...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="store-card fill-card">
                <div className="text-center py-5">
                    <div className="alert alert-danger mx-4">
                        <h5 className="alert-heading">Error Loading Products</h5>
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
                                onClick={loadProducts}
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
                    <h3 className="tc-6533 bold-text mb-1">Product Management</h3>
                    <p className="text-muted mb-0">Manage your product catalog and inventory</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-secondary btn-rd"
                        onClick={loadProducts}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                        </svg>
                        Refresh
                    </button>
                    <button
                        className="btn btn-success btn-rd"
                        onClick={() => setActiveTab?.('add-product')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                        </svg>
                        Add Product
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <label className="form-label">Category</label>
                    <select 
                        className="form-select"
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                        <option value="">All Categories</option>
                        <option value="phones">Phones</option>
                        <option value="tablets">Tablets</option>
                        <option value="computers">Computers</option>
                        <option value="tvs">TVs</option>
                        <option value="gaming">Gaming</option>
                        <option value="watches">Watches</option>
                        <option value="audio">Audio</option>
                        <option value="cameras">Cameras</option>
                        <option value="accessories">Accessories</option>
                        <option value="smart-home">Smart Home</option>
                        <option value="fitness">Fitness</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <label className="form-label">Status</label>
                    <select 
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label">Search</label>
                    <input 
                        type="text"
                        className="form-control"
                        placeholder="Product name, SKU, or description..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                <div className="col-md-2">
                    <label className="form-label">&nbsp;</label>
                    <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={() => setFilters({category: '', status: '', search: ''})}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Product Stats */}
            <div className="row g-3 mb-4">
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-primary mb-1">{products.length}</h3>
                            <p className="text-muted mb-0">Total Products</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-success mb-1">
                                {products.filter(p => p.status === 'active').length}
                            </h3>
                            <p className="text-muted mb-0">Active</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-warning mb-1">
                                {products.filter(p => {
                                    const stock = p.stock?.quantity || p.stockQuantity || 0;
                                    return stock > 0 && stock < 10;
                                }).length}
                            </h3>
                            <p className="text-muted mb-0">Low Stock</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-danger bg-opacity-10 border-danger border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-danger mb-1">
                                {products.filter(p => {
                                    const stock = p.stock?.quantity || p.stockQuantity || 0;
                                    return stock === 0;
                                }).length}
                            </h3>
                            <p className="text-muted mb-0">Out of Stock</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th className="border-0 fw-semibold">Product</th>
                            <th className="border-0 fw-semibold">Category</th>
                            <th className="border-0 fw-semibold">Price</th>
                            <th className="border-0 fw-semibold">Stock</th>
                            <th className="border-0 fw-semibold">Status</th>
                            <th className="border-0 fw-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => {
                            const stockStatus = getStockStatus(product);
                            return (
                                <tr key={product._id || product.id}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="position-relative me-3">
                                                <img
                                                    src={product.images?.[0]?.url || product.image || '/img/placeholder-product.jpg'}
                                                    alt={product.name}
                                                    className="rounded-3 shadow-sm"
                                                    width="60"
                                                    height="60"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                                {product.featured && (
                                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h6 className="mb-1 fw-semibold">{product.name}</h6>
                                                <div className="d-flex flex-column">
                                                    <small className="text-muted">ID: {product._id?.slice(-8) || product.id}</small>
                                                    {product.sku && <small className="text-muted">SKU: {product.sku}</small>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                                            {product.category?.name || product.categoryName || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold tc-6533">{formatCurrency(product.price)}</span>
                                            {product.comparePrice && product.comparePrice > product.price && (
                                                <small className="text-muted text-decoration-line-through">
                                                    {formatCurrency(product.comparePrice)}
                                                </small>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className={`fw-medium text-${stockStatus.color}`}>
                                                {product.stock?.quantity || product.stockQuantity || 0}
                                            </span>
                                            <small className={`text-${stockStatus.color}`}>
                                                {stockStatus.text}
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge bg-${getStatusColor(product.status)} bg-opacity-15 text-${getStatusColor(product.status)} border border-${getStatusColor(product.status)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                title="Edit Product"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                title="Duplicate Product"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                title="Delete Product"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {products.length === 0 && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z" />
                    </svg>
                    <h5 className="text-muted">No Products Found</h5>
                    <p className="text-muted mb-0">No products match your current filters.</p>
                </div>
            )}
        </div>
    );
};

export default AdminProductsNew;