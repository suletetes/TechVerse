import React, { useState, useEffect } from 'react';
import productService from '../../api/services/productService';
import '../../assets/css/admin-homepage-manager.css';

const AdminHomepageManager = () => {
    const [activeSection, setActiveSection] = useState('latest');
    const [selectedProducts, setSelectedProducts] = useState({});
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [currentEditingSection, setCurrentEditingSection] = useState('');
    const [availableProducts, setAvailableProducts] = useState([]);
    const [sectionAssignments, setSectionAssignments] = useState({
        latest: [],
        topSellers: [],
        quickPicks: [],
        weeklyDeals: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load data from backend on component mount
    useEffect(() => {
        loadHomepageData();
    }, []);

    const loadHomepageData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load all products for the product selector
            const productsResponse = await productService.getProducts({ limit: 100 });
            const products = productsResponse.data?.products || productsResponse.products || [];
            
            // Transform backend product data to component format
            const transformedProducts = products.map(product => ({
                id: product._id,
                name: product.name,
                price: product.price,
                category: product.category?.name || 'Uncategorized',
                image: product.images?.[0]?.url || 'img/lazyload-ph.png',
                rating: product.rating?.average || 0,
                sales: product.sales?.totalSold || 0,
                sections: product.sections || []
            }));
            
            setAvailableProducts(transformedProducts);

            // Load section assignments
            const sectionData = {};
            const sections = ['latest', 'topSellers', 'quickPicks', 'weeklyDeals'];
            
            for (const section of sections) {
                try {
                    // Map frontend section names to backend section names
                    const backendSectionName = {
                        'latest': 'latest',
                        'topSellers': 'topSeller',
                        'quickPicks': 'quickPick',
                        'weeklyDeals': 'weeklyDeal'
                    }[section];
                    
                    const sectionResponse = await productService.getProductsBySection(backendSectionName);
                    const sectionProducts = sectionResponse.data?.products || sectionResponse.products || [];
                    sectionData[section] = sectionProducts.map(p => p._id);
                } catch (sectionError) {
                    console.warn(`Failed to load ${section} section:`, sectionError);
                    sectionData[section] = [];
                }
            }
            
            setSectionAssignments(sectionData);
        } catch (err) {
            console.error('Failed to load homepage data:', err);
            setError('Failed to load homepage data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Icon components
    const SectionIcons = {
        latest: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        ),
        topSellers: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7M9 3V4H15V3H9M7 6V19H17V6H7M9 8H15V18H9V8Z"/>
            </svg>
        ),
        quickPicks: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,2V13H10V22L17,10H13L17,2H7Z"/>
            </svg>
        ),
        weeklyDeals: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
        )
    };

    // Homepage sections configuration
    const homepageSections = {
        latest: {
            title: 'Latest Products',
            subtitle: 'Take a look at what\'s new',
            maxProducts: 8,
            description: 'Showcase the newest products in your catalog',
            icon: SectionIcons.latest,
            color: 'primary'
        },
        topSellers: {
            title: 'Top Sellers',
            subtitle: 'Find the perfect gift',
            maxProducts: 9,
            description: 'Display your best-selling products',
            icon: SectionIcons.topSellers,
            color: 'success'
        },
        quickPicks: {
            title: 'Quick Picks',
            subtitle: 'Perfect gifts at perfect prices',
            maxProducts: 9,
            description: 'Curated selection of recommended products',
            icon: SectionIcons.quickPicks,
            color: 'warning'
        },
        weeklyDeals: {
            title: 'Weekly Deals',
            subtitle: 'Discover our amazing offers',
            maxProducts: 3,
            description: 'Featured deals and discounts',
            icon: SectionIcons.weeklyDeals,
            color: 'danger'
        }
    };

    const handleAddProduct = async (sectionKey, productId) => {
        const section = homepageSections[sectionKey];
        const currentProducts = sectionAssignments[sectionKey] || [];
        
        if (currentProducts.length >= section.maxProducts) {
            alert(`Maximum ${section.maxProducts} products allowed in ${section.title}`);
            return;
        }

        try {
            // Map frontend section names to backend section names
            const backendSectionName = {
                'latest': 'latest',
                'topSellers': 'topSeller',
                'quickPicks': 'quickPick',
                'weeklyDeals': 'weeklyDeal'
            }[sectionKey];

            // Add product to section via API
            await productService.addProductToSection(productId, backendSectionName);

            // Update local state
            setSectionAssignments(prev => ({
                ...prev,
                [sectionKey]: [...currentProducts, productId]
            }));

            // Close product selector
            setShowProductSelector(false);
            setCurrentEditingSection('');
            
        } catch (error) {
            console.error('Failed to add product to section:', error);
            alert('Failed to add product to section. Please try again.');
        }

        if (currentProducts.includes(productId)) {
            alert('Product already added to this section');
            return;
        }

        setSectionAssignments(prev => ({
            ...prev,
            [sectionKey]: [...currentProducts, productId]
        }));
    };

    const handleRemoveProduct = async (sectionKey, productId) => {
        try {
            // Map frontend section names to backend section names
            const backendSectionName = {
                'latest': 'latest',
                'topSellers': 'topSeller',
                'quickPicks': 'quickPick',
                'weeklyDeals': 'weeklyDeal'
            }[sectionKey];

            // Remove product from section via API
            await productService.removeProductFromSection(productId, backendSectionName);

            // Update local state
            setSectionAssignments(prev => ({
                ...prev,
                [sectionKey]: prev[sectionKey].filter(id => id !== productId)
            }));
            
        } catch (error) {
            console.error('Failed to remove product from section:', error);
            alert('Failed to remove product from section. Please try again.');
        }
    };

    const handleReorderProducts = (sectionKey, fromIndex, toIndex) => {
        const products = [...sectionAssignments[sectionKey]];
        const [removed] = products.splice(fromIndex, 1);
        products.splice(toIndex, 0, removed);
        
        setSectionAssignments(prev => ({
            ...prev,
            [sectionKey]: products
        }));
    };

    const openProductSelector = (sectionKey) => {
        setCurrentEditingSection(sectionKey);
        setShowProductSelector(true);
    };

    const getProductById = (id) => availableProducts.find(p => p.id === id);

    const getSectionStats = (sectionKey) => {
        const products = sectionAssignments[sectionKey] || [];
        const section = homepageSections[sectionKey];
        return {
            assigned: products.length,
            max: section.maxProducts,
            percentage: Math.round((products.length / section.maxProducts) * 100)
        };
    };

    const handleSaveChanges = () => {
        console.log('Saving homepage assignments:', sectionAssignments);
        alert('Homepage sections updated successfully!');
    };

    const handlePreview = () => {
        console.log('Opening homepage preview with current assignments');
        alert('Opening homepage preview... (Demo mode)');
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="homepage-manager">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Loading homepage sections...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="homepage-manager">
                <div className="alert alert-danger m-4">
                    <h4>Error Loading Homepage Data</h4>
                    <p>{error}</p>
                    <button 
                        className="btn btn-outline-danger"
                        onClick={loadHomepageData}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="homepage-manager">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="tc-6533 fw-bold mb-1">Homepage Manager</h3>
                    <p className="text-muted mb-0">Manage product assignments for homepage sections</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary" onClick={handlePreview}>
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        Preview Homepage
                    </button>
                    <button className="btn btn-success" onClick={handleSaveChanges}>
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"/>
                        </svg>
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Section Navigation */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="btn-group w-100" role="group">
                        {Object.entries(homepageSections).map(([key, section]) => {
                            const stats = getSectionStats(key);
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`btn ${activeSection === key ? `btn-${section.color}` : `btn-outline-${section.color}`} position-relative`}
                                    onClick={() => setActiveSection(key)}
                                >
                                    <span className="me-2">{section.icon}</span>
                                    {section.title}
                                    <span className="badge bg-light text-dark ms-2">
                                        {stats.assigned}/{stats.max}
                                    </span>
                                    {stats.percentage < 100 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">
                                            !
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Section Management */}
            {Object.entries(homepageSections).map(([sectionKey, section]) => {
                if (activeSection !== sectionKey) return null;
                
                const stats = getSectionStats(sectionKey);
                const assignedProducts = sectionAssignments[sectionKey] || [];

                return (
                    <div key={sectionKey} className="section-manager">
                        {/* Section Header */}
                        <div className="card mb-4">
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="me-3" style={{ fontSize: '2rem' }}>{section.icon}</div>
                                            <div>
                                                <h5 className="mb-1">{section.title}</h5>
                                                <p className="text-muted mb-0">{section.subtitle}</p>
                                            </div>
                                        </div>
                                        <p className="small text-muted mb-0">{section.description}</p>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="text-end">
                                            <div className="d-flex align-items-center justify-content-end mb-2">
                                                <span className="me-2">Progress:</span>
                                                <div className="progress" style={{ width: '100px' }}>
                                                    <div 
                                                        className={`progress-bar bg-${section.color}`}
                                                        style={{ width: `${stats.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ms-2 small">{stats.assigned}/{stats.max}</span>
                                            </div>
                                            <button 
                                                className={`btn btn-${section.color} btn-sm`}
                                                onClick={() => openProductSelector(sectionKey)}
                                                disabled={stats.assigned >= stats.max}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                                    <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                                </svg>
                                                Add Product
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Products */}
                        <div className="assigned-products">
                            <h6 className="mb-3">Assigned Products ({assignedProducts.length})</h6>
                            
                            {assignedProducts.length === 0 ? (
                                <div className="text-center py-5 border rounded-3 bg-light">
                                    <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                    </svg>
                                    <h6 className="text-muted">No products assigned</h6>
                                    <p className="text-muted mb-3">Add products to display in the {section.title} section</p>
                                    <button 
                                        className={`btn btn-${section.color}`}
                                        onClick={() => openProductSelector(sectionKey)}
                                    >
                                        Add First Product
                                    </button>
                                </div>
                            ) : (
                                <div className="row">
                                    {assignedProducts.map((productId, index) => {
                                        const product = getProductById(productId);
                                        if (!product) return null;

                                        return (
                                            <div key={`${productId}-${index}`} className="col-md-6 col-lg-4 col-xl-3 mb-3">
                                                <div className="card h-100">
                                                    <div className="position-relative">
                                                        <img 
                                                            src={product.image} 
                                                            className="card-img-top" 
                                                            alt={product.name}
                                                            style={{ height: '150px', objectFit: 'cover' }}
                                                        />
                                                        <div className="position-absolute top-0 end-0 p-2">
                                                            <span className="badge bg-primary">#{index + 1}</span>
                                                        </div>
                                                        <button 
                                                            className="btn btn-danger btn-sm position-absolute top-0 start-0 m-2"
                                                            onClick={() => handleRemoveProduct(sectionKey, productId)}
                                                            title="Remove from section"
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24">
                                                                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="card-body p-3">
                                                        <h6 className="card-title mb-1">{product.name}</h6>
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <span className="fw-bold text-primary">£{product.price}</span>
                                                            <span className="badge bg-light text-dark">{product.category}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <small className="text-muted">★ {product.rating}</small>
                                                            <small className="text-muted">{product.sales} sales</small>
                                                        </div>
                                                        <div className="d-flex gap-1 mt-2">
                                                            <button 
                                                                className="btn btn-outline-secondary btn-sm flex-fill"
                                                                onClick={() => handleReorderProducts(sectionKey, index, Math.max(0, index - 1))}
                                                                disabled={index === 0}
                                                                title="Move up"
                                                            >
                                                                ↑
                                                            </button>
                                                            <button 
                                                                className="btn btn-outline-secondary btn-sm flex-fill"
                                                                onClick={() => handleReorderProducts(sectionKey, index, Math.min(assignedProducts.length - 1, index + 1))}
                                                                disabled={index === assignedProducts.length - 1}
                                                                title="Move down"
                                                            >
                                                                ↓
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Product Selector Modal */}
            {showProductSelector && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Add Product to {homepageSections[currentEditingSection]?.title}
                                </h5>
                                <button 
                                    className="btn-close"
                                    onClick={() => setShowProductSelector(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    {availableProducts
                                        .filter(product => !sectionAssignments[currentEditingSection]?.includes(product.id))
                                        .map(product => (
                                        <div key={product.id} className="col-md-6 col-lg-4 mb-3">
                                            <div className="card h-100">
                                                <img 
                                                    src={product.image} 
                                                    className="card-img-top" 
                                                    alt={product.name}
                                                    style={{ height: '120px', objectFit: 'cover' }}
                                                />
                                                <div className="card-body p-3">
                                                    <h6 className="card-title mb-1">{product.name}</h6>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="fw-bold text-primary">£{product.price}</span>
                                                        <span className="badge bg-light text-dark">{product.category}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <small className="text-muted">★ {product.rating}</small>
                                                        <small className="text-muted">{product.sales} sales</small>
                                                    </div>
                                                    <button 
                                                        className="btn btn-primary btn-sm w-100"
                                                        onClick={() => {
                                                            handleAddProduct(currentEditingSection, product.id);
                                                            setShowProductSelector(false);
                                                        }}
                                                    >
                                                        Add to Section
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setShowProductSelector(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="row mt-5">
                {Object.entries(homepageSections).map(([key, section]) => {
                    const stats = getSectionStats(key);
                    return (
                        <div key={key} className="col-md-3 mb-3">
                            <div className={`card text-center bg-${section.color} bg-opacity-10`}>
                                <div className="card-body py-3">
                                    <div className="mb-1" style={{ fontSize: '1.5rem' }}>{section.icon}</div>
                                    <h6 className={`text-${section.color} mb-1`}>{stats.assigned}/{stats.max}</h6>
                                    <small className="text-muted">{section.title}</small>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminHomepageManager;