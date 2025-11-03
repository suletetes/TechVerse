import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// AdminHeader removed for cleaner interface
import { ProductsTable } from '../../components/tables';
import { productService } from '../../api/services';

const AdminProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await productService.getProducts({ limit: 100 });
            const backendProducts = response?.data?.products || response?.products || [];
            
            // Transform backend data to component format
            const transformedProducts = backendProducts.map(product => {
                // Safely extract stock value
                let stockValue = 0;
                if (typeof product.stock === 'number') {
                    stockValue = product.stock;
                } else if (product.stock && typeof product.stock === 'object') {
                    stockValue = product.stock.quantity || product.stock.stockQuantity || 0;
                } else if (product.stockQuantity !== undefined) {
                    stockValue = product.stockQuantity;
                }
                
                return {
                    id: product._id,
                    name: product.name,
                    category: product.category?.name || 'Uncategorized',
                    price: product.price,
                    originalPrice: product.compareAtPrice || null,
                    stock: stockValue,
                    status: getProductStatus(product),
                    sales: product.sales?.totalSold || 0,
                    image: product.images?.[0]?.url || '/img/placeholder-product.jpg',
                    featured: product.featured || false,
                    sku: product.sku || `PRD-${product._id?.slice(-6)?.toUpperCase()}`
                };
            });
            
            setProducts(transformedProducts);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const getProductStatus = (product) => {
        // Safely extract stock value
        let stock = 0;
        if (typeof product.stock === 'number') {
            stock = product.stock;
        } else if (product.stock && typeof product.stock === 'object') {
            stock = product.stock.quantity || product.stock.stockQuantity || 0;
        } else if (product.stockQuantity !== undefined) {
            stock = product.stockQuantity;
        }
        
        const lowStockThreshold = (product.stock && typeof product.stock === 'object') 
            ? product.stock.lowStockThreshold || 10 
            : 10;
        
        if (stock === 0) return 'Out of Stock';
        if (stock <= lowStockThreshold) return 'Low Stock';
        if (product.status === 'active') return 'Active';
        return 'Inactive';
    };

    const [filters, setFilters] = useState({
        category: 'all',
        status: 'all',
        priceMin: '',
        priceMax: '',
        search: ''
    });

    // Product action handlers
    const handleViewProduct = (product) => {
        console.log('View product:', product);
        // Navigate to product details or open modal
    };

    const handleEditProduct = (product) => {
        console.log('Edit product:', product);
        // Navigate to edit form or open modal
    };

    const handleDeleteProduct = async (product) => {
        if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
            try {
                await productService.deleteProduct(product.id);
                setProducts(products.filter(p => p.id !== product.id));
            } catch (err) {
                console.error('Error deleting product:', err);
                alert('Failed to delete product');
            }
        }
    };

    const handleToggleFeatured = async (product) => {
        try {
            await productService.updateProduct(product.id, { featured: !product.featured });
            setProducts(products.map(p => 
                p.id === product.id 
                    ? { ...p, featured: !p.featured }
                    : p
            ));
        } catch (err) {
            console.error('Error updating product:', err);
            alert('Failed to update product');
        }
    };

    // Apply filters to products
    const filteredProducts = Array.isArray(products) ? products.filter(product => {
        if (filters.category !== 'all' && product.category.toLowerCase() !== filters.category.toLowerCase()) return false;
        if (filters.status !== 'all' && product.status.toLowerCase() !== filters.status.toLowerCase()) return false;
        if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.priceMin && product.price < parseFloat(filters.priceMin)) return false;
        if (filters.priceMax && product.price > parseFloat(filters.priceMax)) return false;
        return true;
    }) : [];

    const adminData = {
        name: 'Sarah Johnson',
        role: 'Super Admin',
        email: 'sarah.johnson@techverse.com',
        avatar: null
    };

    const categories = ['Tablets', 'Phones', 'Laptops', 'TVs', 'Headphones', 'Watches'];

    return (
        <div className="min-vh-100 bg-light">
            {/* AdminHeader removed for cleaner interface */}

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
                                <h2 className="stats-value">{Array.isArray(products) ? products.filter(p => p.status === 'Active').length : 0}</h2>
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
                                <h2 className="stats-value">{Array.isArray(products) ? products.filter(p => p.status === 'Out of Stock').length : 0}</h2>
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
                                    {Array.isArray(categories) ? categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    )) : null}
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
                        <div className="d-flex gap-2">
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
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2 text-muted">Loading products...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-5">
                                <div className="alert alert-danger" role="alert">
                                    <svg width="24" height="24" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M12,2L13.09,8.26L22,9L17,14L18.18,21L12,17.77L5.82,21L7,14L2,9L10.91,8.26L12,2Z"/>
                                    </svg>
                                    {error}
                                </div>
                                <button 
                                    className="btn btn-primary"
                                    onClick={fetchProducts}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <ProductsTable
                                products={filteredProducts}
                                onView={handleViewProduct}
                                onEdit={handleEditProduct}
                                onDelete={handleDeleteProduct}
                                onToggleFeatured={handleToggleFeatured}
                                enableSelection={false}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProductManagement;