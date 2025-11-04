import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../api/services/index.js';
import { adminDataStore } from '../../utils/AdminDataStore';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';

const AdminProductsNew = ({ setActiveTab }) => {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const { categories: adminCategories, loadCategories: adminLoadCategories } = useAdmin();
    const [allProducts, setAllProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        search: '',
        priceMin: '',
        priceMax: '',
        stockStatus: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10
    });
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    // Load products and categories only once on mount or when data is stale
    useEffect(() => {
        if (!adminDataStore.isDataFresh('products')) {
            loadProducts();
        } else {
            setAllProducts(adminDataStore.getData('products'));
            setLoading(false);
        }

        // Try to use categories from AdminContext first
        if (adminCategories && adminCategories.length > 0) {
            console.log('📦 Using categories from AdminContext:', adminCategories.length);
            setAllCategories(adminCategories);
            adminDataStore.setData('categories', adminCategories);
        } else if (!adminDataStore.isDataFresh('categories')) {
            loadCategories();
        } else {
            setAllCategories(adminDataStore.getData('categories'));
        }

        // Listen for data updates
        const unsubscribeProducts = adminDataStore.addListener('products', (data) => {
            setAllProducts(data.data || []);
            setLoading(data.loading || false);
            setError(data.error);
        });

        const unsubscribeCategories = adminDataStore.addListener('categories', (data) => {
            setAllCategories(data.data || []);
        });

        return () => {
            unsubscribeProducts();
            unsubscribeCategories();
        };
    }, []);
    
    // Sync categories from AdminContext
    useEffect(() => {
        if (adminCategories && adminCategories.length > 0) {
            console.log('📦 Syncing categories from AdminContext:', adminCategories.length);
            setAllCategories(adminCategories);
            adminDataStore.setData('categories', adminCategories);
        }
    }, [adminCategories]);
    
    // Reset to page 1 when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [filters, sortBy, sortOrder]);

    const loadProducts = async () => {
        try {
            adminDataStore.setLoading('products', true);
            adminDataStore.setError('products', null);
            
            console.log('🔍 AdminProductsNew: Fetching products...');
            
            // Check authentication
            console.log('🔐 Auth status:', {
                isAuthenticated,
                isAdmin: isAdmin(),
                user: user?.email,
                userRole: user?.role
            });
            
            if (!isAuthenticated) {
                throw new Error('User not authenticated');
            }
            
            if (!isAdmin()) {
                throw new Error('User does not have admin privileges');
            }
            
            const token = localStorage.getItem('token') || localStorage.getItem('techverse_token_v2');
            console.log('🔐 Auth token exists:', !!token);
            console.log('🔐 Token preview:', token ? `${token.substring(0, 20)}...` : 'none');
            
            const response = await adminService.getAdminProducts({ limit: 1000 }); // Get all products
            
            console.log('📦 AdminService response:', response);
            console.log('📦 Response type:', typeof response);
            console.log('📦 Response keys:', Object.keys(response || {}));
            
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
            
            console.log(`📊 Loaded ${backendProducts.length} products`);
            
            if (backendProducts.length > 0) {
                console.log('Sample product:', backendProducts[0]);
                console.log('Sample product stock:', backendProducts[0]?.stock);
                console.log('Stock type:', typeof backendProducts[0]?.stock);
                
                // Check if any products have problematic stock objects
                const problematicProducts = backendProducts.filter(p => 
                    p.stock && typeof p.stock === 'object' && 
                    !p.stock.hasOwnProperty('quantity') && 
                    !p.stock.hasOwnProperty('stockQuantity')
                );
                
                if (problematicProducts.length > 0) {
                    console.warn('⚠️ Found products with problematic stock objects:', problematicProducts.slice(0, 3));
                }
                
                adminDataStore.setData('products', backendProducts);
            } else {
                console.log('⚠️ No products found, trying fallback...');
                throw new Error('No products returned from admin service');
            }
            
        } catch (err) {
            console.error('❌ Error loading products:', err);
            adminDataStore.setError('products', err.message);
            
            // Try direct API call as fallback
            try {
                // Try multiple token storage keys
                const token = localStorage.getItem('token') || 
                             localStorage.getItem('techverse_token_v2') ||
                             localStorage.getItem('authToken') ||
                             localStorage.getItem('accessToken');
                
                console.log('🔑 Trying direct API call with token:', token ? 'Found' : 'Not found');
                
                const directResponse = await fetch('http://localhost:5000/api/admin/products?limit=1000', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('📡 Direct API response status:', directResponse.status);
                
                if (directResponse.ok) {
                    const directData = await directResponse.json();
                    console.log('📦 Direct API response data:', directData);
                    
                    const directProducts = directData?.data?.products || directData?.products || directData || [];
                    console.log(`🎉 Found ${directProducts.length} products via direct API`);
                    adminDataStore.setData('products', directProducts);
                } else {
                    const errorText = await directResponse.text();
                    console.error('❌ Direct API error response:', errorText);
                    throw new Error(`API returned ${directResponse.status}: ${errorText}`);
                }
            } catch (directErr) {
                console.error('❌ Direct API call also failed:', directErr);
                adminDataStore.setError('products', `Failed to load products: ${err.message}`);
            }
        } finally {
            adminDataStore.setLoading('products', false);
        }
    };

    const loadCategories = async () => {
        try {
            console.log('🔍 Loading categories...');
            
            // Check authentication first
            const token = localStorage.getItem('token') || localStorage.getItem('techverse_token_v2');
            if (!token) {
                console.error('❌ No authentication token found');
                throw new Error('No authentication token');
            }
            
            // Try direct API call first (more reliable)
            console.log('🔄 Trying direct categories API call...');
            const directResponse = await fetch('http://localhost:5000/api/admin/categories', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Categories API response status:', directResponse.status);
            console.log('📡 Categories API response headers:', [...directResponse.headers.entries()]);
            
            if (directResponse.ok) {
                const directData = await directResponse.json();
                console.log('📦 Categories API response:', directData);
                console.log('📦 Response structure:', {
                    hasData: !!directData.data,
                    hasCategories: !!directData.categories,
                    isArray: Array.isArray(directData),
                    dataKeys: Object.keys(directData || {})
                });
                
                let categories = [];
                if (directData?.data?.categories) {
                    categories = directData.data.categories;
                } else if (directData?.categories) {
                    categories = directData.categories;
                } else if (Array.isArray(directData)) {
                    categories = directData;
                } else if (directData?.data && Array.isArray(directData.data)) {
                    categories = directData.data;
                }
                
                console.log(`📊 Found ${categories.length} categories from API`);
                
                if (categories.length > 0) {
                    setAllCategories(categories);
                    adminDataStore.setData('categories', categories);
                    return;
                }
            } else {
                const errorText = await directResponse.text();
                console.error('❌ Categories API error:', directResponse.status, errorText);
            }
            
            // Fallback: Try adminService
            console.log('🔄 Trying adminService.getCategories...');
            const response = await adminService.getCategories();
            console.log('📦 AdminService categories response:', response);
            
            let categories = [];
            if (response?.data?.categories) {
                categories = response.data.categories;
            } else if (response?.categories) {
                categories = response.categories;
            } else if (Array.isArray(response)) {
                categories = response;
            }
            
            if (categories.length > 0) {
                console.log(`📊 Found ${categories.length} categories from adminService`);
                setAllCategories(categories);
                adminDataStore.setData('categories', categories);
                return;
            }
            
            // Final fallback: Use default categories
            console.log('📝 No categories found, using defaults');
            throw new Error('No categories found from API');
            
        } catch (err) {
            console.error('❌ Error loading categories:', err);
            
            // Create default categories as final fallback
            const defaultCategories = [
                { _id: '1', name: 'Phones', slug: 'phones' },
                { _id: '2', name: 'Tablets', slug: 'tablets' },
                { _id: '3', name: 'Computers', slug: 'computers' },
                { _id: '4', name: 'TVs', slug: 'tvs' },
                { _id: '5', name: 'Gaming', slug: 'gaming' },
                { _id: '6', name: 'Watches', slug: 'watches' },
                { _id: '7', name: 'Audio & Headphones', slug: 'audio' },
                { _id: '8', name: 'Cameras', slug: 'cameras' },
                { _id: '9', name: 'Accessories', slug: 'accessories' },
                { _id: '10', name: 'Smart Home', slug: 'home-smart-devices' },
                { _id: '11', name: 'Fitness & Health', slug: 'fitness-health' }
            ];
            console.log('📝 Using default categories due to error');
            setAllCategories(defaultCategories);
            adminDataStore.setData('categories', defaultCategories);
        }
    };

    // Computed filtered and paginated products
    const { filteredProducts, paginatedProducts, totalPages } = useMemo(() => {
        let filtered = [...allProducts];
        
        // Apply search filter
        if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase().trim();
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm) ||
                product.brand?.toLowerCase().includes(searchTerm) ||
                product.model?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(product => {
                const productCategory = product.category?.name || product.category || 'uncategorized';
                return productCategory.toLowerCase() === filters.category.toLowerCase();
            });
        }
        
        // Apply status filter
        if (filters.status) {
            filtered = filtered.filter(product => {
                const productStatus = product.status || 'active';
                return productStatus === filters.status;
            });
        }
        
        // Apply stock status filter
        if (filters.stockStatus) {
            filtered = filtered.filter(product => {
                let stock = 0;
                if (typeof product.stock === 'number') {
                    stock = product.stock;
                } else if (product.stock && typeof product.stock === 'object') {
                    stock = product.stock.quantity || product.stock.stockQuantity || 0;
                }
                
                switch (filters.stockStatus) {
                    case 'in-stock':
                        return stock > 10;
                    case 'low-stock':
                        return stock > 0 && stock <= 10;
                    case 'out-of-stock':
                        return stock === 0;
                    default:
                        return true;
                }
            });
        }
        
        // Apply price range filter
        if (filters.priceMin || filters.priceMax) {
            filtered = filtered.filter(product => {
                const price = product.price || 0;
                const min = parseFloat(filters.priceMin) || 0;
                const max = parseFloat(filters.priceMax) || Infinity;
                return price >= min && price <= max;
            });
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = (a.name || '').toLowerCase();
                    bValue = (b.name || '').toLowerCase();
                    break;
                case 'price':
                    aValue = a.price || 0;
                    bValue = b.price || 0;
                    break;
                case 'stock':
                    aValue = typeof a.stock === 'number' ? a.stock : (a.stock?.quantity || a.stock?.stockQuantity || 0);
                    bValue = typeof b.stock === 'number' ? b.stock : (b.stock?.quantity || b.stock?.stockQuantity || 0);
                    break;
                case 'category':
                    aValue = (a.category?.name || a.category || 'uncategorized').toLowerCase();
                    bValue = (b.category?.name || b.category || 'uncategorized').toLowerCase();
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt || 0);
                    bValue = new Date(b.createdAt || 0);
                    break;
                default:
                    aValue = (a.name || '').toLowerCase();
                    bValue = (b.name || '').toLowerCase();
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Calculate pagination
        const totalPages = Math.ceil(filtered.length / pagination.limit);
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginated = filtered.slice(startIndex, endIndex);
        
        return {
            filteredProducts: filtered,
            paginatedProducts: paginated,
            totalPages
        };
    }, [allProducts, filters, sortBy, sortOrder, pagination.page, pagination.limit]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            category: '',
            status: '',
            search: '',
            priceMin: '',
            priceMax: '',
            stockStatus: ''
        });
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(price || 0);
    };

    const getStockStatus = (stock) => {
        const quantity = stock?.quantity || stock || 0;
        if (quantity === 0) return { status: 'Out of Stock', color: 'danger' };
        if (quantity <= 10) return { status: 'Low Stock', color: 'warning' };
        return { status: 'In Stock', color: 'success' };
    };

    const getCategoryName = (category) => {
        if (typeof category === 'string') return category;
        return category?.name || 'Uncategorized';
    };

    // Check authentication first
    if (!isAuthenticated) {
        return (
            <div className="store-card fill-card">
                <div className="text-center py-5">
                    <div className="alert alert-warning mx-4">
                        <h5 className="alert-heading">Authentication Required</h5>
                        <p className="mb-0">Please log in to access the admin panel.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin()) {
        return (
            <div className="store-card fill-card">
                <div className="text-center py-5">
                    <div className="alert alert-danger mx-4">
                        <h5 className="alert-heading">Access Denied</h5>
                        <p className="mb-0">You do not have admin privileges to access this page.</p>
                        <p className="mb-0">Current role: {user?.role || 'Unknown'}</p>
                    </div>
                </div>
            </div>
        );
    }

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
                        className="btn btn-outline-info btn-rd"
                        onClick={() => {
                            console.log('🔍 Debug Info:', {
                                isAuthenticated,
                                isAdmin: isAdmin(),
                                user,
                                allCategories: allCategories,
                                categoriesCount: allCategories.length,
                                localStorage: {
                                    token: localStorage.getItem('token'),
                                    techverse_token: localStorage.getItem('techverse_token_v2'),
                                    authToken: localStorage.getItem('authToken')
                                }
                            });
                        }}
                    >
                        Debug
                    </button>
                    <button
                        className="btn btn-outline-warning btn-rd"
                        onClick={() => {
                            console.log('🔄 Manual category refresh...');
                            loadCategories();
                        }}
                    >
                        Reload Categories
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
                <div className="col-md-2">
                    <label className="form-label">Category</label>
                    <select 
                        className="form-select"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="">All Categories ({allCategories.length})</option>
                        {allCategories.map(category => (
                            <option key={category._id || category.id} value={category.name}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2">
                    <label className="form-label">Status</label>
                    <select 
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
                <div className="col-md-2">
                    <label className="form-label">Stock</label>
                    <select 
                        className="form-select"
                        value={filters.stockStatus}
                        onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                    >
                        <option value="">All Stock</option>
                        <option value="in-stock">In Stock</option>
                        <option value="low-stock">Low Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <label className="form-label">Search</label>
                    <input 
                        type="text"
                        className="form-control"
                        placeholder="Name, brand, model..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <label className="form-label">Price Range</label>
                    <div className="d-flex gap-1">
                        <input 
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Min"
                            value={filters.priceMin}
                            onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                        />
                        <input 
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Max"
                            value={filters.priceMax}
                            onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-1">
                    <label className="form-label">&nbsp;</label>
                    <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={handleClearFilters}
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
                            <h3 className="text-primary mb-1">{allProducts.length}</h3>
                            <p className="text-muted mb-0">Total Products</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-success mb-1">
                                {allProducts.filter(p => {
                                    const stock = typeof p.stock === 'number' ? p.stock : (p.stock?.quantity || p.stock?.stockQuantity || 0);
                                    return stock > 10;
                                }).length}
                            </h3>
                            <p className="text-muted mb-0">In Stock</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-warning mb-1">
                                {allProducts.filter(p => {
                                    const stock = typeof p.stock === 'number' ? p.stock : (p.stock?.quantity || p.stock?.stockQuantity || 0);
                                    return stock > 0 && stock <= 10;
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
                                {allProducts.filter(p => {
                                    const stock = typeof p.stock === 'number' ? p.stock : (p.stock?.quantity || p.stock?.stockQuantity || 0);
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
                            <th className="border-0 fw-semibold">Image</th>
                            <th 
                                className="border-0 fw-semibold cursor-pointer" 
                                onClick={() => handleSortChange('name')}
                            >
                                Product {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="border-0 fw-semibold cursor-pointer"
                                onClick={() => handleSortChange('category')}
                            >
                                Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="border-0 fw-semibold cursor-pointer"
                                onClick={() => handleSortChange('price')}
                            >
                                Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="border-0 fw-semibold cursor-pointer"
                                onClick={() => handleSortChange('stock')}
                            >
                                Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="border-0 fw-semibold">Status</th>
                            <th className="border-0 fw-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map((product) => {
                            const stockInfo = getStockStatus(product.stock);
                            return (
                                <tr key={product._id || product.id}>
                                    <td>
                                        <div className="product-image-sm">
                                            {product.images?.[0] ? (
                                                <img 
                                                    src={product.images[0]} 
                                                    alt={product.name}
                                                    className="rounded"
                                                    width="50"
                                                    height="50"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" className="text-muted">
                                                        <path fill="currentColor" d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,19H5V5H19V19Z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <div className="fw-medium">{product.name}</div>
                                            <small className="text-muted">
                                                {product.brand} {product.model && `• ${product.model}`}
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge bg-secondary bg-opacity-15 text-secondary border border-secondary border-opacity-25 px-3 py-2 rounded-pill">
                                            {getCategoryName(product.category)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="fw-medium">{formatPrice(product.price)}</span>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-medium">
                                                {(() => {
                                                    const stock = product.stock;
                                                    if (typeof stock === 'number') return stock;
                                                    if (stock && typeof stock === 'object') {
                                                        return stock.quantity || stock.stockQuantity || 0;
                                                    }
                                                    return 0;
                                                })()}
                                            </span>
                                            <span className={`badge bg-${stockInfo.color} bg-opacity-15 text-${stockInfo.color} border border-${stockInfo.color} border-opacity-25 px-2 py-1 rounded-pill`}>
                                                {stockInfo.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${(product.status || 'active') === 'active' ? 'bg-success' : 'bg-secondary'} bg-opacity-15 text-${(product.status || 'active') === 'active' ? 'success' : 'secondary'} border border-${(product.status || 'active') === 'active' ? 'success' : 'secondary'} border-opacity-25 px-3 py-2 rounded-pill`}>
                                            {product.status || 'active'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                title="View Product"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                title="Edit Product"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
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
          {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, filteredProducts.length)} of {filteredProducts.length} products
                    </div>
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    Previous
                                </button>
                            </li>
                            {[...Array(totalPages)].map((_, index) => {
                                const pageNum = index + 1;
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                                ) {
                                    return (
                                        <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                                            <button 
                                                className="page-link"
                                                onClick={() => handlePageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                } else if (
                                    pageNum === pagination.page - 3 ||
                                    pageNum === pagination.page + 3
                                ) {
                                    return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                                }
                                return null;
                            })}
                            <li className={`page-item ${pagination.page === totalPages ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === totalPages}
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* Empty State */}
            {paginatedProducts.length === 0 && !loading && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
                    </svg>
                    <h5 className="text-muted">No Products Found</h5>
                    <p className="text-muted mb-0">
                        {allProducts.length === 0 ? 'No products in database.' : 'No products match your current filters.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminProductsNew;