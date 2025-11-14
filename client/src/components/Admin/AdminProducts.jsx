import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Toast } from '../Common';

const AdminProducts = ({ 
    products = [], 
    categories = [], 
    specifications = {},
    setActiveTab, 
    getStatusColor, 
    formatCurrency,
    onUpdateProduct,
    onDeleteProduct,
    onDuplicateProduct,
    isLoading = false,
    error = null 
}) => {
    const [toast, setToast] = useState(null);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(10);

    // Dynamic categories from catalog management system
    const categoryOptions = [
        { value: '', label: 'All Categories' },
        ...(Array.isArray(categories) ? categories.map((cat, index) => ({
            value: cat.slug || cat.name?.toLowerCase() || `category-${index}`,
            label: cat.name || `Category ${index + 1}`,
            count: cat.productCount || 0,
            isActive: cat.isActive
        })) : [])
    ];

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'draft', label: 'Draft' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'low-stock', label: 'Low Stock' },
        { value: 'out-of-stock', label: 'Out of Stock' }
    ];

    const sortOptions = [
        { value: 'name', label: 'Name' },
        { value: 'price', label: 'Price' },
        { value: 'stock', label: 'Stock' },
        { value: 'sales', label: 'Sales' },
        { value: 'created', label: 'Date Created' }
    ];

    // Filter and sort products
    useEffect(() => {
        // Ensure products is an array
        const safeProducts = Array.isArray(products) ? products : [];
        let filtered = [...safeProducts];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(product =>
                (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (product.id && product.id.toString().includes(searchTerm)) ||
                (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Category filter
        if (selectedCategory) {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        // Status filter
        if (selectedStatus) {
            filtered = filtered.filter(product => product.status === selectedStatus);
        }

        // Sort products
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'price') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredProducts(filtered);
        setCurrentPage(1);
    }, [products, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

    // Pagination
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = Array.isArray(filteredProducts) ? filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct) : [];
    const totalPages = Math.ceil((Array.isArray(filteredProducts) ? filteredProducts.length : 0) / productsPerPage);

    const handleView = (product) => {
        // Product slug or ID for viewing
        const productSlug = product.slug || product._id || product.id;
        const url = `/product/${productSlug}`;
        window.open(url, '_blank');
        
        setToast({
            message: 'Opening product page in new tab...',
            type: 'info'
        });
    };

    const handleEdit = (productId) => {
        console.log('Edit product:', productId);
        setActiveTab('edit-product', productId);
        
        setToast({
            message: 'Loading product editor...',
            type: 'info'
        });
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            try {
                if (onDeleteProduct) {
                    await onDeleteProduct(productId);
                    setToast({
                        message: 'Product deleted successfully!',
                        type: 'success'
                    });
                } else {
                    console.log('Delete product:', productId);
                    setToast({
                        message: 'Product deleted successfully!',
                        type: 'success'
                    });
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                setToast({
                    message: error.message || 'Failed to delete product. Please try again.',
                    type: 'error'
                });
            }
        }
    };

    const handleDuplicate = (productId) => {
        const productToDuplicate = Array.isArray(products) ? products.find(p => p.id === productId || p._id === productId) : null;
        if (productToDuplicate && onDuplicateProduct) {
            onDuplicateProduct(productToDuplicate);
            setToast({
                message: 'Product duplicated successfully!',
                type: 'success'
            });
        } else {
            console.log('Duplicate product:', productId);
            setToast({
                message: 'Product duplicated successfully!',
                type: 'success'
            });
        }
    };

    const handleToggleStatus = async (productId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const updatedProduct = { status: newStatus };
        
        try {
            if (onUpdateProduct) {
                await onUpdateProduct(productId, updatedProduct);
            } else {
                console.log('Toggle status:', productId, newStatus);
            }
            
            setToast({
                message: `Product status changed to ${newStatus}!`,
                type: 'success'
            });
        } catch (error) {
            console.error('Error toggling status:', error);
            setToast({
                message: error.message || 'Failed to update product status.',
                type: 'error'
            });
        }
    };

    const getStockStatus = (stock) => {
        if (stock === 0) return { color: 'danger', text: 'Out of Stock' };
        if (stock < 10) return { color: 'warning', text: 'Low Stock' };
        return { color: 'success', text: 'In Stock' };
    };

    const getCategorySpecs = (categoryName) => {
        const categorySpecs = specifications[categoryName];
        if (!categorySpecs) return 0;
        
        return Object.values(categorySpecs).reduce((total, group) => {
            return total + (Array.isArray(group) ? group.length : 0);
        }, 0);
    };

    const getCategoryInfo = (categorySlug) => {
        return Array.isArray(categories) ? categories.find(cat => 
            (cat.slug || cat.name.toLowerCase()) === categorySlug
        ) : null;
    };

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
                        className="btn btn-outline-secondary btn-rd d-flex align-items-center"
                        onClick={() => setActiveTab('catalog')}
                        title="Manage Categories & Specifications"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
                        </svg>
                        Manage Catalog
                    </button>
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
            </div>

            {/* Filters and Search */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3 mb-md-0">
                    <div className="input-group">
                        <span className="input-group-text">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search products, ID, or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-2 mb-3 mb-md-0">
                    <select
                        className="form-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categoryOptions.map((cat, index) => (
                            <option key={cat.value || `category-${index}`} value={cat.value}>
                                {cat.label} {cat.count > 0 && `(${cat.count})`}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2 mb-3 mb-md-0">
                    <select
                        className="form-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        {statusOptions.map((status, index) => (
                            <option key={status.value || `status-${index}`} value={status.value}>{status.label}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2 mb-3 mb-md-0">
                    <select
                        className="form-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        {sortOptions.map((sort, index) => (
                            <option key={sort.value || `sort-${index}`} value={sort.value}>Sort by {sort.label}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2">
                    <button
                        className="btn btn-outline-secondary w-100"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder.toUpperCase()}
                    </button>
                </div>
            </div>

            {/* Category & Products Summary */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card bg-light border-0">
                        <div className="card-body p-3">
                            <div className="row align-items-center">
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center">
                                        <span className="text-muted me-3">
                                            Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, Array.isArray(filteredProducts) ? filteredProducts.length : 0)} of {Array.isArray(filteredProducts) ? filteredProducts.length : 0} products
                                        </span>
                                        {selectedCategory && (
                                            <div className="d-flex align-items-center">
                                                <span className="badge bg-primary me-2">
                                                    {Array.isArray(categoryOptions) ? categoryOptions.find(c => c.value === selectedCategory)?.label : selectedCategory}
                                                </span>
                                                {getCategorySpecs(selectedCategory) > 0 && (
                                                    <small className="text-muted">
                                                        {getCategorySpecs(selectedCategory)} specs available
                                                    </small>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex gap-2 justify-content-md-end">
                                        <span className="badge bg-success bg-opacity-15 text-success">
                                            {Array.isArray(products) ? products.filter(p => p.status === 'active').length : 0} Active
                                        </span>
                                        <span className="badge bg-warning bg-opacity-15 text-warning">
                                            {Array.isArray(products) ? products.filter(p => {
                                                const stock = typeof p.stock === 'number' ? p.stock : p.stock?.quantity || 0;
                                                return stock < 10 && stock > 0;
                                            }).length : 0} Low Stock
                                        </span>
                                        <span className="badge bg-danger bg-opacity-15 text-danger">
                                            {Array.isArray(products) ? products.filter(p => {
                                                const stock = typeof p.stock === 'number' ? p.stock : p.stock?.quantity || 0;
                                                return stock === 0;
                                            }).length : 0} Out of Stock
                                        </span>
                                        <span className="badge bg-info bg-opacity-15 text-info">
                                            {Array.isArray(categories) ? categories.length : 0} Categories
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="table-responsive">
                {isLoading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading products...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading products from database...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-5">
                        <div className="alert alert-danger mx-4">
                            <h5 className="alert-heading">Error Loading Products</h5>
                            <p className="mb-0">{error}</p>
                            <hr />
                            <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : (
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th className="border-0 fw-semibold">
                                    <input type="checkbox" className="form-check-input" />
                                </th>
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
                            {currentProducts.map((product, index) => {
                            const stockQuantity = typeof product.stock === 'number' 
                                ? product.stock 
                                : product.stock?.quantity || product.stockQuantity || 0;
                            const stockStatus = getStockStatus(stockQuantity);
                            return (
                                <tr key={product.id || product._id || `product-${index}`} className="border-bottom">
                                    <td>
                                        <input type="checkbox" className="form-check-input" />
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="position-relative me-3">
                                                <img
                                                    src={product.image || product.mediaGallery?.[0]?.src || '../img/placeholder.jpg'}
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
                                                    <small className="text-muted">ID: {product.id}</small>
                                                    {product.sku && <small className="text-muted">SKU: {product.sku}</small>}
                                                </div>
                                                <div className="d-block d-md-none mt-1">
                                                    <small className="badge bg-light text-dark border px-2 py-1 rounded-pill">
                                                        {typeof product.category === 'string' 
                                                            ? product.category 
                                                            : product.category?.name || 'Category'
                                                        }
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="d-none d-md-table-cell">
                                        <div className="d-flex flex-column">
                                            <span className="badge bg-light text-dark border px-3 py-2 rounded-pill mb-1">
                                                {typeof product.category === 'string' 
                                                    ? product.category 
                                                    : product.category?.name || 'Category'
                                                }
                                            </span>
                                            {getCategorySpecs(product.category) > 0 && (
                                                <small className="text-muted">
                                                    {getCategorySpecs(product.category)} specifications
                                                </small>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold tc-6533">{formatCurrency(product.price)}</span>
                                            {product.originalPrice && product.originalPrice > product.price && (
                                                <small className="text-muted text-decoration-line-through">
                                                    {formatCurrency(product.originalPrice)}
                                                </small>
                                            )}
                                        </div>
                                    </td>
                                    <td className="d-none d-lg-table-cell">
                                        <div className="d-flex flex-column">
                                            <span className={`fw-medium text-${stockStatus.color}`}>
                                                {stockQuantity}
                                            </span>
                                            <small className={`text-${stockStatus.color}`}>
                                                {stockStatus.text}
                                            </small>
                                        </div>
                                    </td>
                                    <td className="d-none d-xl-table-cell">
                                        <div className="d-flex flex-column">
                                            <span className="fw-medium">
                                                {typeof product.sales === 'number' 
                                                    ? product.sales 
                                                    : product.sales?.totalSold || product.totalSold || 0
                                                }
                                            </span>
                                            <small className="text-muted">units sold</small>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge bg-${getStatusColor(product.status)} bg-opacity-15 text-${getStatusColor(product.status)} border border-${getStatusColor(product.status)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                className="btn btn-outline-info btn-sm"
                                                onClick={() => handleView(product)}
                                                title="View Product Page"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => handleEdit(product.id || product._id)}
                                                title="Edit Product"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => handleDuplicate(product.id || product._id)}
                                                title="Duplicate Product"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                                                </svg>
                                            </button>
                                            <button
                                                className={`btn btn-outline-${product.status === 'active' ? 'warning' : 'success'} btn-sm`}
                                                onClick={() => handleToggleStatus(product.id || product._id, product.status)}
                                                title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M17,7H22V17H17V19A1,1 0 0,0 18,20H20V22H17.5C16.95,22 16,21.55 16,21C16,21.55 15.05,22 14.5,22H12V20H14A1,1 0 0,0 15,19V5A1,1 0 0,0 14,4H12V2H14.5C15.05,2 16,2.45 16,3C16,2.45 16.95,2 17.5,2H20V4H18A1,1 0 0,0 17,5V7Z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleDelete(product.id || product._id)}
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
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                        Page {currentPage} of {totalPages}
                    </div>
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                            </li>
                            {[...Array(totalPages)].map((_, index) => (
                                <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(index + 1)}
                                    >
                                        {index + 1}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* Empty State */}
            {(!Array.isArray(filteredProducts) || filteredProducts.length === 0) && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z" />
                    </svg>
                    <h5 className="text-muted">No products found</h5>
                    <p className="text-muted">
                        {selectedCategory 
                            ? `No products found in the "${Array.isArray(categoryOptions) ? categoryOptions.find(c => c.value === selectedCategory)?.label : selectedCategory}" category`
                            : 'Try adjusting your search or filter criteria'
                        }
                    </p>
                    <div className="d-flex gap-2 justify-content-center">
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('');
                                setSelectedStatus('');
                            }}
                        >
                            Clear Filters
                        </button>
                        {selectedCategory && (
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => setActiveTab('catalog')}
                            >
                                Manage "{Array.isArray(categoryOptions) ? categoryOptions.find(c => c.value === selectedCategory)?.label : selectedCategory}" Category
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Category Management Quick Actions */}
            {selectedCategory && Array.isArray(filteredProducts) && filteredProducts.length > 0 && (
                <div className="mt-4 p-3 bg-light rounded-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="mb-1">Category: {Array.isArray(categoryOptions) ? categoryOptions.find(c => c.value === selectedCategory)?.label : selectedCategory}</h6>
                            <small className="text-muted">
                                {Array.isArray(filteredProducts) ? filteredProducts.length : 0} products • {getCategorySpecs(selectedCategory)} specifications available
                            </small>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setActiveTab('catalog')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                                </svg>
                                Manage Specifications
                            </button>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setActiveTab('add-product')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                Add Product to Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default AdminProducts;