import { useState, useEffect } from 'react';
import productService from '../../api/services/productService';
import { useNotification } from '../../context';

const AdminHomepageManager = () => {
    const notificationContext = useNotification();
    const showNotification = notificationContext?.showNotification || ((msg, type) => {
        console.log(`[${type}] ${msg}`);
        alert(msg);
    });
    const [sectionAssignments, setSectionAssignments] = useState({
        latest: [],
        topSellers: [],
        quickPicks: [],
        weeklyDeals: []
    });
    const [availableProducts, setAvailableProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [currentEditingSection, setCurrentEditingSection] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Filter and pagination state
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(12);
    const [categories, setCategories] = useState([]);

    const homepageSections = {
        latest: { name: 'Latest Products', color: 'primary', max: 8 },
        topSellers: { name: 'Top Sellers', color: 'success', max: 8 },
        quickPicks: { name: 'Quick Picks', color: 'warning', max: 6 },
        weeklyDeals: { name: 'Weekly Deals', color: 'danger', max: 6 }
    };

    useEffect(() => {
        loadHomepageData();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchTerm, categoryFilter, availableProducts]);

    const loadHomepageData = async () => {
        try {
            setIsLoading(true);
            
            // Load products and categories
            const [productsRes, categoriesRes] = await Promise.all([
                productService.getProducts({ limit: 500 }),
                productService.getCategories()
            ]);
            
            const products = productsRes.data?.products || productsRes.products || [];
            const cats = categoriesRes.data || categoriesRes || [];
            
            const transformedProducts = products.map(product => ({
                id: product._id,
                name: product.name,
                price: product.price,
                category: product.category?.name || product.category || 'Uncategorized',
                categoryId: product.category?._id || product.category,
                image: product.images?.[0]?.url || product.image || '/img/placeholder.jpg',
                rating: product.rating?.average || 0,
                sales: product.sales?.totalSold || 0
            }));
            
            setAvailableProducts(transformedProducts);
            setCategories(cats);

            // Load section assignments
            const sectionData = {};
            const sectionMap = {
                latest: 'latest',
                topSellers: 'topSeller',
                quickPicks: 'quickPick',
                weeklyDeals: 'weeklyDeal'
            };
            
            for (const [key, backendName] of Object.entries(sectionMap)) {
                try {
                    const res = await productService.getProductsBySection(backendName);
                    const sectionProducts = res.data?.products || res.products || [];
                    sectionData[key] = sectionProducts.map(p => p._id);
                } catch (err) {
                    console.warn(`Failed to load ${key}:`, err);
                    sectionData[key] = [];
                }
            }
            
            setSectionAssignments(sectionData);
        } catch (err) {
            console.error('Failed to load homepage data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = [...availableProducts];
        
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (categoryFilter) {
            filtered = filtered.filter(p => 
                p.categoryId === categoryFilter || p.category === categoryFilter
            );
        }
        
        setFilteredProducts(filtered);
        setCurrentPage(1);
    };

    const handleAddProduct = async (sectionKey, productId) => {
        const currentProducts = sectionAssignments[sectionKey] || [];
        const section = homepageSections[sectionKey];
        
        if (currentProducts.includes(productId)) {
            showNotification('Product already in this section', 'warning');
            return;
        }
        
        if (currentProducts.length >= section.max) {
            showNotification(`Maximum ${section.max} products allowed in ${section.name}`, 'warning');
            return;
        }

        try {
            const sectionMap = {
                latest: 'latest',
                topSellers: 'topSeller',
                quickPicks: 'quickPick',
                weeklyDeals: 'weeklyDeal'
            };
            
            // Load full product data first
            const productResponse = await productService.getProductById(productId);
            const fullProduct = productResponse.data?.product || productResponse.product || productResponse;
            
            if (!fullProduct) {
                showNotification('Product not found', 'error');
                return;
            }

            // Update sections array
            const currentSections = fullProduct.sections || [];
            const newSection = sectionMap[sectionKey];
            
            if (!currentSections.includes(newSection)) {
                const updatedSections = [...currentSections, newSection];
                
                // Update product with new sections - only send necessary fields
                // Get category ID properly
                let categoryId;
                if (typeof fullProduct.category === 'object' && fullProduct.category?._id) {
                    categoryId = fullProduct.category._id;
                } else if (typeof fullProduct.category === 'string' && fullProduct.category.length === 24) {
                    categoryId = fullProduct.category;
                } else {
                    // Find category by name
                    const cat = categories.find(c => c.name === fullProduct.category);
                    categoryId = cat?._id || cat?.id;
                }
                
                const updateData = {
                    name: fullProduct.name,
                    description: fullProduct.description,
                    price: fullProduct.price,
                    category: categoryId,
                    sections: updatedSections
                };
                
                await productService.updateProduct(productId, updateData);
                
                setSectionAssignments(prev => ({
                    ...prev,
                    [sectionKey]: [...prev[sectionKey], productId]
                }));
                
                showNotification('Product added successfully', 'success');
                setShowProductSelector(false);
            }
        } catch (err) {
            console.error('Failed to add product:', err);
            showNotification(err.message || 'Failed to add product to section', 'error');
        }
    };

    const handleRemoveProduct = async (sectionKey, productId) => {
        try {
            const sectionMap = {
                latest: 'latest',
                topSellers: 'topSeller',
                quickPicks: 'quickPick',
                weeklyDeals: 'weeklyDeal'
            };
            
            // Load full product data first
            const productResponse = await productService.getProductById(productId);
            const fullProduct = productResponse.data?.product || productResponse.product || productResponse;
            
            if (!fullProduct) {
                showNotification('Product not found', 'error');
                return;
            }

            // Remove section from product
            const currentSections = fullProduct.sections || [];
            const updatedSections = currentSections.filter(s => s !== sectionMap[sectionKey]);
            
            // Update product with new sections - only send necessary fields
            // Get category ID properly
            let categoryId;
            if (typeof fullProduct.category === 'object' && fullProduct.category?._id) {
                categoryId = fullProduct.category._id;
            } else if (typeof fullProduct.category === 'string' && fullProduct.category.length === 24) {
                categoryId = fullProduct.category;
            } else {
                // Find category by name
                const cat = categories.find(c => c.name === fullProduct.category);
                categoryId = cat?._id || cat?.id;
            }
            
            const updateData = {
                name: fullProduct.name,
                description: fullProduct.description,
                price: fullProduct.price,
                category: categoryId,
                sections: updatedSections
            };
            
            await productService.updateProduct(productId, updateData);
            
            setSectionAssignments(prev => ({
                ...prev,
                [sectionKey]: prev[sectionKey].filter(id => id !== productId)
            }));
            
            showNotification('Product removed successfully', 'success');
        } catch (err) {
            console.error('Failed to remove product:', err);
            showNotification(err.message || 'Failed to remove product from section', 'error');
        }
    };

    const openProductSelector = (sectionKey) => {
        setCurrentEditingSection(sectionKey);
        setShowProductSelector(true);
        setSearchTerm('');
        setCategoryFilter('');
        setCurrentPage(1);
    };

    // Pagination
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="homepage-manager">
            <div className="mb-4">
                <h3 className="mb-2">Homepage Manager</h3>
                <p className="text-muted">Manage products displayed in homepage sections</p>
            </div>

            {/* Sections */}
            {Object.entries(homepageSections).map(([key, section]) => {
                const assigned = sectionAssignments[key] || [];
                const assignedProducts = assigned.map(id => 
                    availableProducts.find(p => p.id === id)
                ).filter(Boolean);

                return (
                    <div key={key} className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0">{section.name}</h5>
                                <small className="text-muted">
                                    {assigned.length} / {section.max} products
                                </small>
                            </div>
                            <button
                                className={`btn btn-${section.color} btn-sm`}
                                onClick={() => openProductSelector(key)}
                                disabled={assigned.length >= section.max}
                            >
                                + Add Products
                            </button>
                        </div>
                        <div className="card-body">
                            {assignedProducts.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    No products assigned. Click "Add Products" to get started.
                                </div>
                            ) : (
                                <div className="row">
                                    {assignedProducts.map(product => (
                                        <div key={product.id} className="col-md-3 mb-3">
                                            <div className="card h-100 position-relative">
                                                <button
                                                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                                                    onClick={() => handleRemoveProduct(key, product.id)}
                                                    style={{ zIndex: 10 }}
                                                >
                                                    ×
                                                </button>
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="card-img-top"
                                                    style={{ height: '150px', objectFit: 'cover' }}
                                                />
                                                <div className="card-body p-2">
                                                    <h6 className="card-title small mb-1">{product.name}</h6>
                                                    <p className="card-text small text-muted mb-0">
                                                        £{product.price}
                                                    </p>
                                                    <small className="text-muted">{product.category}</small>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Product Selector Modal */}
            {showProductSelector && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Add Products to {homepageSections[currentEditingSection]?.name}
                                </h5>
                                <button
                                    className="btn-close"
                                    onClick={() => setShowProductSelector(false)}
                                ></button>
                            </div>
                            
                            {/* Filters */}
                            <div className="modal-body">
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search products..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <select
                                            className="form-select"
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Products Grid */}
                                <div className="row">
                                    {currentProducts.map(product => {
                                        const isAssigned = sectionAssignments[currentEditingSection]?.includes(product.id);
                                        return (
                                            <div key={product.id} className="col-md-3 mb-3">
                                                <div className="card h-100">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="card-img-top"
                                                        style={{ height: '150px', objectFit: 'cover' }}
                                                    />
                                                    <div className="card-body p-2">
                                                        <h6 className="card-title small mb-1">{product.name}</h6>
                                                        <p className="card-text small mb-1">£{product.price}</p>
                                                        <small className="text-muted d-block mb-2">{product.category}</small>
                                                        <button
                                                            className={`btn btn-sm w-100 ${isAssigned ? 'btn-secondary' : 'btn-primary'}`}
                                                            onClick={() => handleAddProduct(currentEditingSection, product.id)}
                                                            disabled={isAssigned}
                                                        >
                                                            {isAssigned ? 'Already Added' : 'Add'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <nav className="mt-4">
                                        <ul className="pagination justify-content-center">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                >
                                                    Previous
                                                </button>
                                            </li>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => setCurrentPage(i + 1)}
                                                    >
                                                        {i + 1}
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
                                )}

                                {filteredProducts.length === 0 && (
                                    <div className="text-center py-5 text-muted">
                                        No products found matching your filters.
                                    </div>
                                )}
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
        </div>
    );
};

export default AdminHomepageManager;
