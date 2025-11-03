import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/services';

const AdminProductsNew = ({ setActiveTab }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        search: ''
    });

    // Load products directly using adminService (same approach as AdminProductManagement)
    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 AdminProductsNew: Fetching products...');
            console.log('Auth token exists:', !!localStorage.getItem('token'));
            
            const response = await adminService.getAdminProducts({ limit: 100 });
            
            console.log('📦 AdminProductsNew API Response:', response);
            console.log('Response type:', typeof response);
            console.log('Response keys:', Object.keys(response || {}));
            
            // Try multiple ways to extract products (same as AdminProductManagement)
            let backendProducts = [];
            
            if (response?.data?.products) {
                backendProducts = response.data.products;
                console.log('✅ Found products in response.data.products');
            } else if (response?.products) {
                backendProducts = response.products;
                console.log('✅ Found products in response.products');
            } else if (response?.data && Array.isArray(response.data)) {
                backendProducts = response.data;
                console.log('✅ Found products in response.data (array)');
            } else if (Array.isArray(response)) {
                backendProducts = response;
                console.log('✅ Found products in response (direct array)');
            } else {
                console.log('❌ No products found in any expected location');
                console.log('Full response structure:', JSON.stringify(response, null, 2));
            }
            
            console.log(`📊 AdminProductsNew: Extracted ${backendProducts.length} products`);
            
            if (backendProducts.length > 0) {
                console.log('Sample product:', backendProducts[0]);
            }
            
            // Transform products for display
            const transformedProducts = backendProducts.map(product => ({
                _id: product._id,
                name: product.name,
                category: product.category?.name || 'Uncategorized',
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                stock: product.stock,
                status: product.status,
                featured: product.featured,
                images: product.images,
                sku: product.sku,
                sales: product.sales
            }));
            
            setProducts(transformedProducts);
            
        } catch (err) {
            console.error('❌ AdminProductsNew: Error fetching products:', err);
            console.error('Error details:', {
                message: err.message,
                status: err.status,
                response: err.response
            });
            
            // Try direct API call as fallback (same as AdminProductManagement)
            console.log('🔄 AdminProductsNew: Trying direct API call as fallback...');
            try {
                const token = localStorage.getItem('token');
                const directResponse = await fetch('http://localhost:5000/api/admin/products?limit=100', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Direct API response status:', directResponse.status);
                
                if (directResponse.ok) {
                    const directData = await directResponse.json();
                    console.log('✅ AdminProductsNew: Direct API call successful:', directData);
                    
                    const directProducts = directData?.data?.products || directData?.products || directData || [];
                    if (directProducts.length > 0) {
                        console.log(`🎉 AdminProductsNew: Found ${directProducts.length} products via direct API`);
                        
                        const transformedProducts = directProducts.map(product => ({
                            _id: product._id,
                            name: product.name,
                            category: product.category?.name || 'Uncategorized',
                            price: product.price,
                            compareAtPrice: product.compareAtPrice,
                            stock: product.stock,
                            status: product.status,
                            featured: product.featured,
                            images: product.images,
                            sku: product.sku,
                            sales: product.sales
                        }));
                        
                        setProducts(transformedProducts);
                        return; // Success, exit the function
                    }
                } else {
                    const errorText = await directResponse.text();
                    console.log('Direct API error response:', errorText);
                }
            } catch (directErr) {
                console.error('❌ AdminProductsNew: Direct API call also failed:', directErr);
            }
            
            setError(`Failed to load products: ${err.message}`);
        } finally {
            setLoading(false);
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
                                className="btn btn-primary btn-sm"
                                onClick={loadProducts}
                            >
                                Try Again
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
            <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="mb-1">Products</h5>
                    <small className="text-muted">Manage your product catalog</small>
                </div>
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={loadProducts}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                        </svg>
                        Refresh
                    </button>
                    <button 
                        className="btn btn-success btn-sm"
                        onClick={() => setActiveTab('add-product')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                        </svg>
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="card-body">
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <div className="avatar avatar-sm bg-primary bg-opacity-15 text-primary rounded">
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h3 className="text-primary mb-1">
                                    {products.length}
                                </h3>
                                <p className="text-muted mb-0 small">Total Products</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <div className="avatar avatar-sm bg-success bg-opacity-15 text-success rounded">
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h3 className="text-success mb-1">
                                    {products.filter(p => p.status === 'active').length}
                                </h3>
                                <p className="text-muted mb-0 small">Active</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <div className="avatar avatar-sm bg-warning bg-opacity-15 text-warning rounded">
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h3 className="text-warning mb-1">
                                    {products.filter(p => {
                                        const stock = p.stock?.quantity || p.stockQuantity || 0;
                                        return stock > 0 && stock < 10;
                                    }).length}
                                </h3>
                                <p className="text-muted mb-0 small">Low Stock</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <div className="avatar avatar-sm bg-danger bg-opacity-15 text-danger rounded">
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h3 className="text-danger mb-1">
                                    {products.filter(p => {
                                        const stock = p.stock?.quantity || p.stockQuantity || 0;
                                        return stock === 0;
                                    }).length}
                                </h3>
                                <p className="text-muted mb-0 small">Out of Stock</p>
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
                                    <tr key={product._id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {/* <div className="flex-shrink-0">
                                                    <img 
                                                        src={product.images?.[0]?.url || '/img/placeholder-product.jpg'} 
                                                        alt={product.name}
                                                        className="avatar avatar-sm rounded"
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                    />
                                                </div> */}
                                                <div className="flex-grow-1 ms-3">
                                                    <h6 className="mb-0">{product.name}</h6>
                                                    <small className="text-muted">{product.sku}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark">{product.category}</span>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="fw-medium">{formatCurrency(product.price)}</span>
                                                {product.compareAtPrice && (
                                                    <small className="text-muted text-decoration-line-through">
                                                        {formatCurrency(product.compareAtPrice)}
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
                                            <span className={`badge bg-${getStatusColor(product.status)}`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <button 
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => setActiveTab('edit-product', product._id)}
                                                    title="Edit Product"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                                        <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    className="btn btn-outline-secondary btn-sm"
                                                    title="View Product"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                                        <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {products.length === 0 && (
                        <div className="text-center py-5">
                            <div className="mb-3">
                                <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted">
                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>
                            <h6 className="text-muted">No products found</h6>
                            <p className="text-muted mb-3">Get started by adding your first product</p>
                            <button 
                                className="btn btn-primary"
                                onClick={() => setActiveTab('add-product')}
                            >
                                Add Product
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminProductsNew;