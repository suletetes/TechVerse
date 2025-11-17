import { useState, useEffect } from 'react';
import productService from '../../api/services/productService';
import { useNotification } from '../../context';

const AdminHomepageManager = () => {
    const { showSuccess, showError, showWarning, showInfo } = useNotification();
    
    const showNotification = (message, type = 'info') => {
        switch(type) {
            case 'success':
                showSuccess(message);
                break;
            case 'error':
                showError(message);
                break;
            case 'warning':
                showWarning(message);
                break;
            case 'info':
            default:
                showInfo(message);
                break;
        }
    };
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
    const [editingLimit, setEditingLimit] = useState(null);
    const [tempLimit, setTempLimit] = useState('');

    const [homepageSections, setHomepageSections] = useState({
        latest: { name: 'Latest Products', color: 'primary', max: 8 },
        topSellers: { name: 'Top Sellers', color: 'success', max: 8 },
        quickPicks: { name: 'Quick Picks', color: 'warning', max: 6 },
        weeklyDeals: { name: 'Weekly Deals', color: 'danger', max: 6 }
    });

    useEffect(() => {
        loadHomepageData();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchTerm, categoryFilter, availableProducts]);

    const loadSectionAssignments = async () => {
        try {
            console.log('🔄 [ADMIN_HOMEPAGE] ========== Loading Section Assignments ==========');
            
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
                    console.log(`\n📥 [ADMIN_HOMEPAGE] Fetching section: "${key}" (backend field: "${backendName}")`);
                    const res = await productService.getProductsBySection(backendName, 100);
                    
                    console.log(`📦 [ADMIN_HOMEPAGE] Response structure for "${key}":`, {
                        hasData: !!res.data,
                        hasProducts: !!res.data?.products,
                        isArray: Array.isArray(res.data),
                        responseKeys: Object.keys(res),
                        dataType: typeof res.data,
                        dataKeys: res.data ? Object.keys(res.data) : null
                    });
                    console.log(`📦 [ADMIN_HOMEPAGE] Full response for "${key}":`, res);
                    
                    // Handle different response structures
                    let sectionProducts = [];
                    if (res.data?.products) {
                        sectionProducts = res.data.products;
                    } else if (Array.isArray(res.data)) {
                        sectionProducts = res.data;
                    } else if (res.products) {
                        sectionProducts = res.products;
                    } else if (Array.isArray(res)) {
                        sectionProducts = res;
                    }
                    
                    console.log(`📋 [ADMIN_HOMEPAGE] Extracted ${sectionProducts.length} products for "${key}"`);
                    
                    // Verify each product has the correct section
                    const productDetails = sectionProducts.map(p => ({
                        id: p._id,
                        name: p.name,
                        sections: p.sections || []
                    }));
                    
                    console.log(`🔍 [ADMIN_HOMEPAGE] Product details for "${key}":`, productDetails);
                    
                    // Only store products that actually have this section assigned
                    const filteredProducts = sectionProducts.filter(p => {
                        const sections = p.sections || [];
                        const hasSection = sections.includes(backendName);
                        
                        if (!hasSection) {
                            console.warn(`⚠️ [ADMIN_HOMEPAGE] Product "${p.name}" (${p._id}) missing section "${backendName}". Has: [${sections.join(', ')}]`);
                        }
                        
                        return hasSection;
                    });
                    
                    console.log(`✅ [ADMIN_HOMEPAGE] Verified ${filteredProducts.length}/${sectionProducts.length} products for "${key}"`);
                    
                    if (filteredProducts.length > 0) {
                        console.log(`📌 [ADMIN_HOMEPAGE] Products in "${key}":`, 
                            filteredProducts.map(p => `  - ${p.name} (${p._id})`).join('\n')
                        );
                    }
                    
                    sectionData[key] = filteredProducts.map(p => p._id || p.id);
                } catch (err) {
                    console.error(`❌ [ADMIN_HOMEPAGE] Failed to load "${key}":`, err.message);
                    sectionData[key] = [];
                }
            }
            
            console.log('\n✨ [ADMIN_HOMEPAGE] ========== Final Section Assignments ==========');
            Object.entries(sectionData).forEach(([key, ids]) => {
                console.log(`  ${key}: ${ids.length} products [${ids.join(', ')}]`);
            });
            console.log('========================================\n');
            
            setSectionAssignments(sectionData);
        } catch (err) {
            console.error('❌ [ADMIN_HOMEPAGE] Critical error loading sections:', err);
        }
    };

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
            await loadSectionAssignments();
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
        console.log(`\n➕ [ADMIN_HOMEPAGE] ========== Adding Product to Section ==========`);
        console.log(`   Section: ${sectionKey}`);
        console.log(`   Product ID: ${productId}`);
        
        const currentProducts = sectionAssignments[sectionKey] || [];
        const section = homepageSections[sectionKey];
        
        console.log(`📊 [ADMIN_HOMEPAGE] Current state:`, {
            sectionKey,
            currentProductCount: currentProducts.length,
            maxAllowed: section.max,
            currentProductIds: currentProducts
        });
        
        if (currentProducts.includes(productId)) {
            console.warn(`⚠️ [ADMIN_HOMEPAGE] Product ${productId} already in ${sectionKey}`);
            showNotification('Product already in this section', 'warning');
            return;
        }
        
        if (currentProducts.length >= section.max) {
            console.warn(`⚠️ [ADMIN_HOMEPAGE] Section ${sectionKey} is full (${currentProducts.length}/${section.max})`);
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
            
            console.log(`🔍 [ADMIN_HOMEPAGE] Fetching product details...`);
            
            // Load full product data first
            const productResponse = await productService.getProductById(productId);
            const fullProduct = productResponse.data?.product || productResponse.product || productResponse;
            
            if (!fullProduct) {
                console.error(`❌ [ADMIN_HOMEPAGE] Product ${productId} not found`);
                showNotification('Product not found', 'error');
                return;
            }

            console.log(`📦 [ADMIN_HOMEPAGE] Product details:`, {
                id: fullProduct._id,
                name: fullProduct.name,
                currentSections: fullProduct.sections || []
            });

            const newSection = sectionMap[sectionKey];
            
            // Add this section to product's existing sections
            const currentSections = fullProduct.sections || [];
            const updatedSections = [...new Set([...currentSections, newSection])]; // Use Set to avoid duplicates
            
            console.log(`🔄 [ADMIN_HOMEPAGE] Section update:`, {
                productName: fullProduct.name,
                before: currentSections,
                adding: newSection,
                after: updatedSections
            });
            
            // Use dedicated sections update endpoint
            console.log(`📡 [ADMIN_HOMEPAGE] Calling API to update sections...`);
            const updateResult = await productService.updateProductSections(productId, updatedSections);
            console.log(`✅ [ADMIN_HOMEPAGE] API response:`, updateResult);
            
            // Verify the update was successful
            const updatedProduct = updateResult.data?.product || updateResult.product;
            if (updatedProduct) {
                console.log(`🔍 [ADMIN_HOMEPAGE] Verifying update:`, {
                    productId: updatedProduct._id,
                    productName: updatedProduct.name,
                    sectionsAfterUpdate: updatedProduct.sections
                });
                
                if (!updatedProduct.sections.includes(newSection)) {
                    console.error(`❌ [ADMIN_HOMEPAGE] CRITICAL: Section "${newSection}" NOT in updated product!`);
                    showNotification('Failed to add product to section - update not saved', 'error');
                    return;
                }
            }
            
            // Wait a bit for database to fully commit
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Refresh section assignments from backend to ensure consistency
            console.log(`🔄 [ADMIN_HOMEPAGE] Refreshing all section assignments...`);
            await loadSectionAssignments();
            
            console.log(`✨ [ADMIN_HOMEPAGE] Product successfully added to ${section.name}`);
            console.log(`========================================\n`);
            
            showNotification(`Product added to ${section.name}`, 'success');
            setShowProductSelector(false);
        } catch (err) {
            console.error(`❌ [ADMIN_HOMEPAGE] Error adding product:`, err);
            console.error(`   Error message:`, err.message);
            console.error(`   Error stack:`, err.stack);
            showNotification(err.message || 'Failed to add product to section', 'error');
        }
    };

    const handleRemoveProduct = async (sectionKey, productId) => {
        console.log(`\n➖ [ADMIN_HOMEPAGE] ========== Removing Product from Section ==========`);
        console.log(`   Section: ${sectionKey}`);
        console.log(`   Product ID: ${productId}`);
        
        try {
            const sectionMap = {
                latest: 'latest',
                topSellers: 'topSeller',
                quickPicks: 'quickPick',
                weeklyDeals: 'weeklyDeal'
            };
            
            console.log(`🔍 [ADMIN_HOMEPAGE] Fetching product details...`);
            
            // Load full product data first
            const productResponse = await productService.getProductById(productId);
            const fullProduct = productResponse.data?.product || productResponse.product || productResponse;
            
            if (!fullProduct) {
                console.error(`❌ [ADMIN_HOMEPAGE] Product ${productId} not found`);
                showNotification('Product not found', 'error');
                return;
            }

            console.log(`📦 [ADMIN_HOMEPAGE] Product details:`, {
                id: fullProduct._id,
                name: fullProduct.name,
                currentSections: fullProduct.sections || []
            });

            // Remove this section from product's sections array
            const currentSections = fullProduct.sections || [];
            const sectionToRemove = sectionMap[sectionKey];
            const updatedSections = currentSections.filter(s => s !== sectionToRemove);
            
            console.log(`🔄 [ADMIN_HOMEPAGE] Section update:`, {
                productName: fullProduct.name,
                before: currentSections,
                removing: sectionToRemove,
                after: updatedSections
            });
            
            // Use dedicated sections update endpoint
            console.log(`📡 [ADMIN_HOMEPAGE] Calling API to update sections...`);
            const result = await productService.updateProductSections(productId, updatedSections);
            console.log(`✅ [ADMIN_HOMEPAGE] API response:`, result);
            
            // Verify the update was successful
            const updatedProduct = result.data?.product || result.product;
            if (updatedProduct) {
                console.log(`🔍 [ADMIN_HOMEPAGE] Verifying update:`, {
                    productId: updatedProduct._id,
                    productName: updatedProduct.name,
                    sectionsAfterUpdate: updatedProduct.sections
                });
                
                if (updatedProduct.sections.includes(sectionToRemove)) {
                    console.error(`❌ [ADMIN_HOMEPAGE] CRITICAL: Section "${sectionToRemove}" STILL in product!`);
                    showNotification('Failed to remove product from section - update not saved', 'error');
                    return;
                }
            }
            
            // Wait a bit for database to fully commit
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Refresh section assignments from backend to ensure consistency
            console.log(`🔄 [ADMIN_HOMEPAGE] Refreshing all section assignments...`);
            await loadSectionAssignments();
            
            console.log(`✨ [ADMIN_HOMEPAGE] Product successfully removed from ${homepageSections[sectionKey].name}`);
            console.log(`========================================\n`);
            
            showNotification('Product removed from section', 'success');
        } catch (err) {
            console.error(`❌ [ADMIN_HOMEPAGE] Error removing product:`, err);
            console.error(`   Error message:`, err.message);
            showNotification(err.message || 'Failed to remove product from section', 'error');
        }
    };

    const handleClearSection = async (sectionKey) => {
        if (!window.confirm(`Are you sure you want to remove all products from ${homepageSections[sectionKey].name}?`)) {
            return;
        }

        console.log(`\n🗑️ [ADMIN_HOMEPAGE] ========== Clearing Section ==========`);
        console.log(`   Section: ${sectionKey}`);

        try {
            const sectionMap = {
                latest: 'latest',
                topSellers: 'topSeller',
                quickPicks: 'quickPick',
                weeklyDeals: 'weeklyDeal'
            };
            
            const assigned = sectionAssignments[sectionKey] || [];
            const sectionToRemove = sectionMap[sectionKey];
            
            console.log(`📊 [ADMIN_HOMEPAGE] Clearing ${assigned.length} products from "${sectionKey}"`);
            console.log(`   Product IDs:`, assigned);
            
            // Remove section from all assigned products
            let successCount = 0;
            let failCount = 0;
            
            for (const productId of assigned) {
                try {
                    console.log(`🔄 [ADMIN_HOMEPAGE] Processing product ${productId}...`);
                    
                    const productResponse = await productService.getProductById(productId);
                    const fullProduct = productResponse.data?.product || productResponse.product || productResponse;
                    
                    if (fullProduct) {
                        const currentSections = fullProduct.sections || [];
                        const updatedSections = currentSections.filter(s => s !== sectionToRemove);
                        
                        console.log(`   Product: ${fullProduct.name}`);
                        console.log(`   Before: [${currentSections.join(', ')}]`);
                        console.log(`   After: [${updatedSections.join(', ')}]`);
                        
                        await productService.updateProductSections(productId, updatedSections);
                        successCount++;
                        console.log(`   ✅ Updated successfully`);
                    }
                } catch (err) {
                    failCount++;
                    console.warn(`   ❌ Failed to remove product ${productId}:`, err.message);
                }
            }
            
            console.log(`\n📊 [ADMIN_HOMEPAGE] Clear section results:`);
            console.log(`   Success: ${successCount}`);
            console.log(`   Failed: ${failCount}`);
            
            // Refresh section assignments
            console.log(`🔄 [ADMIN_HOMEPAGE] Refreshing section assignments...`);
            await loadSectionAssignments();
            
            console.log(`✨ [ADMIN_HOMEPAGE] Section cleared successfully`);
            console.log(`========================================\n`);
            
            showNotification(`All products removed from ${homepageSections[sectionKey].name}`, 'success');
        } catch (err) {
            console.error(`❌ [ADMIN_HOMEPAGE] Error clearing section:`, err);
            showNotification(err.message || 'Failed to clear section', 'error');
        }
    };

    const openProductSelector = (sectionKey) => {
        setCurrentEditingSection(sectionKey);
        setShowProductSelector(true);
        setSearchTerm('');
        setCategoryFilter('');
        setCurrentPage(1);
    };

    const handleEditLimit = (sectionKey) => {
        setEditingLimit(sectionKey);
        setTempLimit(homepageSections[sectionKey].max.toString());
    };

    const handleSaveLimit = (sectionKey) => {
        const newLimit = parseInt(tempLimit);
        if (isNaN(newLimit) || newLimit < 1 || newLimit > 50) {
            showNotification('Limit must be between 1 and 50', 'warning');
            return;
        }

        setHomepageSections(prev => ({
            ...prev,
            [sectionKey]: {
                ...prev[sectionKey],
                max: newLimit
            }
        }));

        setEditingLimit(null);
        showNotification(`Section limit updated to ${newLimit}`, 'success');
    };

    const handleCancelEditLimit = () => {
        setEditingLimit(null);
        setTempLimit('');
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
                const assignedProducts = assigned
                    .map(id => availableProducts.find(p => p.id === id || p._id === id))
                    .filter(Boolean);

                return (
                    <div key={key} className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0">{section.name}</h5>
                                {editingLimit === key ? (
                                    <div className="d-flex align-items-center gap-2 mt-2">
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            style={{ width: '80px' }}
                                            value={tempLimit}
                                            onChange={(e) => setTempLimit(e.target.value)}
                                            min="1"
                                            max="50"
                                            autoFocus
                                        />
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleSaveLimit(key)}
                                        >
                                            ✓
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={handleCancelEditLimit}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <small className="text-muted d-flex align-items-center gap-2">
                                        {assigned.length} / {section.max} products
                                        <button
                                            className="btn btn-link btn-sm p-0 text-decoration-none"
                                            onClick={() => handleEditLimit(key)}
                                            title="Edit limit"
                                        >
                                            ✏️
                                        </button>
                                    </small>
                                )}
                            </div>
                            <div className="d-flex gap-2">
                                {assigned.length > 0 && (
                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleClearSection(key)}
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button
                                    className={`btn btn-${section.color} btn-sm`}
                                    onClick={() => openProductSelector(key)}
                                    disabled={assigned.length >= section.max}
                                >
                                    + Add Products
                                </button>
                            </div>
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
