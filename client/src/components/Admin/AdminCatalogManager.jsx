import React, { useState, useEffect } from 'react';
import AdminCategoryManager from './AdminCategoryManager';
import AdminSpecificationManager from './AdminSpecificationManager';
import productService from '../../api/services/productService';

const AdminCatalogManager = ({ 
    onSaveCategory,
    onDeleteCategory,
    onSaveSpecifications
}) => {
    const [activeTab, setActiveTab] = useState('categories');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [specifications, setSpecifications] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Load data from backend
    useEffect(() => {
        loadCatalogData();
    }, []);

    const loadCatalogData = async () => {
        try {
            console.log('📥 Loading catalog data...');
            setIsLoading(true);
            setError(null);

            // Load categories and products in parallel
            const [categoriesResponse, productsResponse] = await Promise.all([
                productService.getCategories(),
                productService.getProducts({ limit: 1000 }) // Get all products for accurate counts
            ]);

            console.log('📦 Categories response:', categoriesResponse);
            console.log('📦 Products response:', productsResponse);

            // Process categories
            const backendCategories = categoriesResponse.data || categoriesResponse || [];
            console.log('📋 Backend categories count:', backendCategories.length);
            const processedCategories = backendCategories.map(category => ({
                id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                image: category.image || `/img/category-${category.slug}.jpg`,
                isActive: category.isActive !== false,
                sortOrder: category.displayOrder || 0,
                productCount: 0, // Will be calculated below
                parentId: category.parent?._id || null,
                seoTitle: category.seo?.title || `${category.name} - Shop Now`,
                seoDescription: category.seo?.description || `Discover our ${category.name} collection`,
                relatedCategories: [],
                categoryFeatures: {
                    freeShipping: true,
                    warranty: '1 Year Warranty',
                    returnPolicy: '30-day return policy'
                }
            }));

            // Process products
            const backendProducts = productsResponse.data?.products || productsResponse.products || [];
            const processedProducts = backendProducts.map(product => ({
                id: product._id,
                name: product.name,
                category: product.category?.name || product.category,
                categoryId: product.category?._id || product.category,
                price: product.price,
                status: product.status,
                stock: product.stock?.quantity || 0,
                images: product.images || [],
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            }));

            // Calculate product counts for categories
            const categoriesWithCounts = processedCategories.map(category => ({
                ...category,
                productCount: processedProducts.filter(product => 
                    product.categoryId === category.id || 
                    product.category === category.name
                ).length
            }));

            console.log('✅ Processed categories:', categoriesWithCounts.length);
            console.log('✅ Processed products:', processedProducts.length);
            
            setCategories(categoriesWithCounts);
            setProducts(processedProducts);
            setLastUpdated(new Date());

        } catch (err) {
            console.error('❌ Failed to load catalog data:', err);
            setError('Failed to load catalog data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate product counts for categories (helper function)
    const getProductCountForCategory = (categoryName) => {
        return products.filter(product => 
            product.category === categoryName || 
            product.category === categoryName.toLowerCase()
        ).length;
    };

    // Refresh data when products are modified
    const handleDataRefresh = () => {
        loadCatalogData();
    };

    // Wrapper functions to handle real-time updates
    const handleSaveCategoryWrapper = async (categoryData) => {
        try {
            console.log('💾 Saving category:', categoryData);
            if (onSaveCategory) {
                const result = await onSaveCategory(categoryData);
                console.log('✅ Category saved:', result);
            }
            // Refresh data to reflect changes
            console.log('🔄 Refreshing category list...');
            await loadCatalogData();
            console.log('✅ Category list refreshed');
        } catch (error) {
            console.error('❌ Failed to save category:', error);
            alert(`Failed to save category: ${error.message}`);
        }
    };

    const handleDeleteCategoryWrapper = async (categoryId) => {
        try {
            if (onDeleteCategory) {
                await onDeleteCategory(categoryId);
            }
            // Refresh data to reflect changes
            await loadCatalogData();
        } catch (error) {
            console.error('Failed to delete category:', error);
            alert('Failed to delete category. Please try again.');
        }
    };

    const handleSaveSpecificationsWrapper = async (specData) => {
        try {
            if (onSaveSpecifications) {
                await onSaveSpecifications(specData);
            }
            // Update local state
            setSpecifications(prev => ({ ...prev, ...specData }));
        } catch (error) {
            console.error('Failed to save specifications:', error);
            alert('Failed to save specifications. Please try again.');
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="catalog-manager">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Loading catalog data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="catalog-manager">
                <div className="alert alert-danger m-4">
                    <h4>Error Loading Catalog Data</h4>
                    <p>{error}</p>
                    <button 
                        className="btn btn-outline-danger"
                        onClick={loadCatalogData}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    const sampleCategories = [
        {
            id: 1,
            name: 'Tablets',
            slug: 'tablets',
            description: 'High-performance tablets for work and entertainment',
            image: '/img/category-tablets.jpg',
            isActive: true,
            sortOrder: 1,
            productCount: getProductCountForCategory('Tablets'),
            parentId: null,
            seoTitle: 'Tablets - Latest iPad, Android & Windows Tablets',
            seoDescription: 'Shop the latest tablets from top brands. Find iPad, Android, and Windows tablets with fast shipping.',
            relatedCategories: [
                { name: 'iPad Pro', path: '/category/tablets/ipad-pro', count: 12 },
                { name: 'iPad Air', path: '/category/tablets/ipad-air', count: 8 },
                { name: 'Android Tablets', path: '/category/tablets/android', count: 15 }
            ],
            categoryFeatures: {
                freeShipping: true,
                warranty: '2 Year Warranty',
                returnPolicy: '30-day return policy'
            }
        },
        {
            id: 2,
            name: 'Phones',
            slug: 'phones',
            description: 'Latest smartphones with cutting-edge technology',
            image: '/img/category-phones.jpg',
            isActive: true,
            sortOrder: 2,
            productCount: getProductCountForCategory('Phones'),
            parentId: null,
            seoTitle: 'Smartphones - iPhone, Samsung, Google Pixel',
            seoDescription: 'Discover the latest smartphones with advanced features and competitive prices.',
            relatedCategories: [
                { name: 'iPhone', path: '/category/phones/iphone', count: 18 },
                { name: 'Samsung Galaxy', path: '/category/phones/samsung', count: 22 },
                { name: 'Google Pixel', path: '/category/phones/pixel', count: 5 }
            ],
            categoryFeatures: {
                freeShipping: true,
                warranty: '1 Year Warranty',
                returnPolicy: '14-day return policy'
            }
        },
        {
            id: 3,
            name: 'Laptops',
            slug: 'laptops',
            description: 'Professional laptops for work and gaming',
            image: '/img/category-laptops.jpg',
            isActive: true,
            sortOrder: 3,
            productCount: getProductCountForCategory('Laptops'),
            parentId: null,
            seoTitle: 'Laptops - MacBook, Windows, Gaming Laptops',
            seoDescription: 'Find the perfect laptop for work, study, or gaming. Top brands and competitive prices.',
            relatedCategories: [
                { name: 'MacBook', path: '/category/laptops/macbook', count: 8 },
                { name: 'Gaming Laptops', path: '/category/laptops/gaming', count: 12 },
                { name: 'Business Laptops', path: '/category/laptops/business', count: 12 }
            ],
            categoryFeatures: {
                freeShipping: true,
                warranty: '3 Year Warranty',
                returnPolicy: '30-day return policy'
            }
        }
    ];

    // Sample specifications data
    const sampleSpecifications = {
        'Tablets': {
            "Display & Design": [
                { id: 'display_size', label: 'Display Size', type: 'text', required: true, highlight: true },
                { id: 'resolution', label: 'Resolution', type: 'text', required: true },
                { id: 'display_tech', label: 'Display Technology', type: 'text', required: false },
                { id: 'dimensions', label: 'Dimensions', type: 'text', required: true },
                { id: 'weight', label: 'Weight', type: 'text', required: true }
            ],
            "Performance": [
                { id: 'processor', label: 'Processor', type: 'text', required: true, highlight: true },
                { id: 'memory', label: 'Memory/RAM', type: 'text', required: true },
                { id: 'storage', label: 'Storage Options', type: 'text', required: true }
            ],
            "Connectivity": [
                { id: 'wifi', label: 'Wi-Fi', type: 'text', required: true, highlight: true },
                { id: 'bluetooth', label: 'Bluetooth', type: 'text', required: false },
                { id: 'cellular', label: 'Cellular', type: 'text', required: false }
            ],
            "Battery & Power": [
                { id: 'battery_life', label: 'Battery Life', type: 'text', required: true, highlight: true },
                { id: 'charging', label: 'Charging', type: 'text', required: false }
            ]
        },
        'Phones': {
            "Display & Design": [
                { id: 'screen_size', label: 'Screen Size', type: 'text', required: true, highlight: true },
                { id: 'resolution', label: 'Resolution', type: 'text', required: true },
                { id: 'display_type', label: 'Display Type', type: 'text', required: false },
                { id: 'dimensions', label: 'Dimensions', type: 'text', required: true },
                { id: 'weight', label: 'Weight', type: 'text', required: true }
            ],
            "Performance": [
                { id: 'chipset', label: 'Chipset', type: 'text', required: true, highlight: true },
                { id: 'ram', label: 'RAM', type: 'text', required: true },
                { id: 'storage', label: 'Storage', type: 'text', required: true },
                { id: 'os', label: 'Operating System', type: 'text', required: true }
            ],
            "Camera": [
                { id: 'main_camera', label: 'Main Camera', type: 'text', required: true, highlight: true },
                { id: 'front_camera', label: 'Front Camera', type: 'text', required: true },
                { id: 'video_recording', label: 'Video Recording', type: 'text', required: false }
            ],
            "Battery & Connectivity": [
                { id: 'battery_capacity', label: 'Battery Capacity', type: 'text', required: true, highlight: true },
                { id: 'charging_speed', label: 'Charging Speed', type: 'text', required: false },
                { id: 'network', label: 'Network Support', type: 'text', required: true }
            ]
        }
    };







    return (
        <div className="catalog-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 fw-bold mb-0">Catalog Management</h3>
                <div className="d-flex gap-2">
                    <span className="badge bg-primary">{categories.length} Categories</span>
                    <span className="badge bg-info">{Object.keys(specifications).length || Object.keys(sampleSpecifications).length} Spec Templates</span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
                        </svg>
                        Categories
                        <span className="badge bg-primary ms-2">{categories.length}</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'specifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('specifications')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                        </svg>
                        Specifications
                        <span className="badge bg-info ms-2">{Object.keys(specifications).length || Object.keys(sampleSpecifications).length}</span>
                    </button>
                </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'categories' && (
                    <div className="tab-pane active">
                        {categories.length > 0 ? (
                            <AdminCategoryManager
                                categories={categories}
                                onSaveCategory={handleSaveCategoryWrapper}
                                onDeleteCategory={handleDeleteCategoryWrapper}
                            />
                        ) : (
                            <div className="alert alert-info">
                                <h5><i className="fas fa-info-circle me-2"></i>No Categories Yet</h5>
                                <p className="mb-3">You haven't created any categories yet. Categories help organize your products.</p>
                                <AdminCategoryManager
                                    categories={[]}
                                    onSaveCategory={handleSaveCategoryWrapper}
                                    onDeleteCategory={handleDeleteCategoryWrapper}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'specifications' && (
                    <div className="tab-pane active">
                        <AdminSpecificationManager
                            categories={categories.length > 0 ? categories : sampleCategories}
                            specifications={Object.keys(specifications).length > 0 ? specifications : sampleSpecifications}
                            onSaveSpecifications={handleSaveSpecificationsWrapper}
                        />
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="row mt-5">
                <div className="col-md-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title text-primary">{categories.length}</h5>
                            <p className="card-text">Total Categories</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title text-success">
                                {categories.filter(cat => cat.isActive).length}
                            </h5>
                            <p className="card-text">Active Categories</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title text-info">{Object.keys(specifications).length || Object.keys(sampleSpecifications).length}</h5>
                            <p className="card-text">Spec Templates</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center">
                        <div className="card-body">
                            <h5 className="card-title text-warning">
                                {Object.values(specifications).length > 0 
                                    ? Object.values(specifications).reduce((total, specs) => 
                                        total + Object.values(specs).reduce((groupTotal, group) => groupTotal + group.length, 0), 0)
                                    : Object.values(sampleSpecifications).reduce((total, specs) => 
                                        total + Object.values(specs).reduce((groupTotal, group) => groupTotal + group.length, 0), 0)
                                }
                            </h5>
                            <p className="card-text">Total Specifications</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCatalogManager;