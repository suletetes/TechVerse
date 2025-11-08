import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../context';
import wishlistService from '../api/services/wishlistService';
import { LoadingSpinner } from '../components/Common';

const Wishlist = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    
    const [wishlistItems, setWishlistItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('dateAdded');
    const [showPriceAlerts, setShowPriceAlerts] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { 
                state: { 
                    from: { pathname: '/wishlist' },
                    message: 'Please login to view your wishlist'
                }
            });
        }
    }, [isAuthenticated, navigate]);

    // Load wishlist from API
    const loadWishlist = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            setError(null);
            const response = await wishlistService.getWishlist();
            const items = response.data?.items || [];
            
            // Transform API data to match UI format
            const transformedItems = items.map(item => ({
                id: item._id,
                _id: item._id,
                productId: item.product?._id,
                name: item.product?.name || 'Unknown Product',
                price: item.product?.finalPrice || item.product?.price || 0,
                originalPrice: item.product?.compareAtPrice,
                discount: item.product?.discountPercentage || 0,
                image: item.product?.primaryImage?.url || item.product?.images?.[0]?.url || 'img/placeholder.jpg',
                imageWebp: item.product?.primaryImage?.url || item.product?.images?.[0]?.url || 'img/placeholder.jpg',
                inStock: item.product?.stockStatus !== 'out_of_stock',
                rating: item.product?.rating?.average || 0,
                reviews: item.product?.rating?.count || 0,
                dateAdded: item.addedAt,
                priceWhenAdded: item.priceWhenAdded,
                notes: item.notes,
                product: item.product
            }));

            setWishlistItems(transformedItems);
        } catch (err) {
            console.error('Error loading wishlist:', err);
            setError('Failed to load wishlist. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // Load wishlist on mount
    useEffect(() => {
        loadWishlist();
    }, [loadWishlist]);

    // Filter and sort items
    const getFilteredItems = () => {
        let filtered = wishlistItems;
        
        if (activeCategory !== 'all') {
            filtered = filtered.filter(item => item.category === activeCategory);
        }
        
        // Sort items
        switch (sortBy) {
            case 'dateAdded':
                filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case 'priceHigh':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'priceLow':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                break;
        }
        
        return filtered;
    };

    const toggleItemSelection = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) 
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    const selectAllItems = () => {
        const filteredItems = getFilteredItems();
        setSelectedItems(filteredItems.map(item => item.id));
    };

    const clearSelection = () => {
        setSelectedItems([]);
    };

    const togglePriceAlert = (id) => {
        setWishlistItems(items => 
            items.map(item => 
                item.id === id 
                    ? { 
                        ...item, 
                        priceAlert: { 
                            ...item.priceAlert, 
                            enabled: !item.priceAlert?.enabled 
                        } 
                    }
                    : item
            )
        );
    };

    const setPriceAlertTarget = (id, targetPrice) => {
        setWishlistItems(items => 
            items.map(item => 
                item.id === id 
                    ? { 
                        ...item, 
                        priceAlert: { 
                            ...item.priceAlert, 
                            targetPrice: parseFloat(targetPrice),
                            enabled: true
                        } 
                    }
                    : item
            )
        );
    };

    const moveToCategory = (itemId, newCategory) => {
        setWishlistItems(items => 
            items.map(item => 
                item.id === itemId ? { ...item, category: newCategory } : item
            )
        );
    };

    // Simplified categories - just show all items for now
    const wishlistCategories = [
        { id: 'all', name: 'All Items', count: wishlistItems.length }
    ];

    const [oldWishlistCategories] = useState([
        {
            id: 1,
            name: 'Ultra HD QLED TV',
            price: 2999,
            originalPrice: 3499,
            discount: 15,
            image: 'img/tv-product.jpg',
            imageWebp: 'img/tv-product.webp',
            inStock: true,
            rating: 4.8,
            reviews: 124,
            category: 'default',
            dateAdded: '2024-01-15',
            priceAlert: { enabled: true, targetPrice: 2500, currentPrice: 2999 },
            lastPriceChange: { date: '2024-01-10', oldPrice: 3200, newPrice: 2999 }
        },
        {
            id: 2,
            name: 'Phone Ultra',
            price: 999,
            originalPrice: 1099,
            discount: 9,
            image: 'img/phone-product.jpg',
            imageWebp: 'img/phone-product.webp',
            inStock: true,
            rating: 4.9,
            reviews: 89,
            category: 'gifts',
            dateAdded: '2024-01-12',
            priceAlert: { enabled: false, targetPrice: null, currentPrice: 999 },
            lastPriceChange: null
        },
        {
            id: 3,
            name: 'Laptop Pro',
            price: 2599,
            originalPrice: null,
            discount: 0,
            image: 'img/laptop-product.jpg',
            imageWebp: 'img/laptop-product.webp',
            inStock: false,
            rating: 4.7,
            reviews: 156,
            category: 'price-watch',
            dateAdded: '2024-01-08',
            priceAlert: { enabled: true, targetPrice: 2400, currentPrice: 2599 },
            lastPriceChange: null,
            stockAlert: true
        }
    ]);

    const removeFromWishlist = useCallback(async (id) => {
        try {
            setIsUpdating(true);
            const item = wishlistItems.find(i => i.id === id);
            await wishlistService.removeFromWishlist(item.productId);
            setWishlistItems(items => items.filter(item => item.id !== id));
            setSelectedItems(selected => selected.filter(itemId => itemId !== id));
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            alert('Failed to remove item. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    }, [wishlistItems]);

    const handleAddToCart = useCallback(async (item) => {
        if (!item.inStock) {
            alert('This product is currently out of stock.');
            return;
        }

        try {
            setIsUpdating(true);
            await addToCart(item.productId, 1, {});
            alert(`${item.name} added to cart!`);
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add to cart. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    }, [addToCart]);

    const moveAllToCart = useCallback(async () => {
        const itemsToMove = selectedItems.length > 0 
            ? wishlistItems.filter(item => selectedItems.includes(item.id) && item.inStock)
            : wishlistItems.filter(item => item.inStock);
        
        if (itemsToMove.length === 0) {
            alert('No items available to add to cart.');
            return;
        }

        try {
            setIsUpdating(true);
            let successCount = 0;
            
            for (const item of itemsToMove) {
                try {
                    await addToCart(item.productId, 1, {});
                    successCount++;
                } catch (error) {
                    console.error(`Failed to add ${item.name}:`, error);
                }
            }
            
            alert(`${successCount} of ${itemsToMove.length} items added to cart!`);
            
            if (successCount > 0) {
                // Optionally navigate to cart
                const goToCart = window.confirm('Would you like to view your cart?');
                if (goToCart) {
                    navigate('/cart');
                }
            }
        } catch (error) {
            console.error('Error moving items to cart:', error);
            alert('Failed to add items to cart. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    }, [wishlistItems, selectedItems, addToCart, navigate]);

    const filteredItems = getFilteredItems();

    // Loading state
    if (isLoading) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc" id="wishlist-loading">
                <div className="container bloc-md bloc-lg-md">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <LoadingSpinner size="lg" />
                        <div className="ms-3">
                            <p className="tc-6533">Loading your wishlist...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc" id="wishlist-error">
                <div className="container bloc-md bloc-lg-md">
                    <div className="alert alert-danger mt-5">
                        <h4>Error Loading Wishlist</h4>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={loadWishlist}>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="wishlist-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row position-relative">
                    {isUpdating && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 1000 }}>
                            <LoadingSpinner size="lg" />
                        </div>
                    )}
                    {/* Page Header */}
                    <div className="col-12 mb-4">
                        <div className="d-flex justify-content-between align-items-center flex-wrap">
                            <div className="mb-3 mb-md-0">
                                <h1 className="tc-6533 bold-text mb-2">My Wishlist</h1>
                                <p className="tc-6533 mb-0">
                                    {filteredItems.length} of {wishlistItems.length} items
                                    {selectedItems.length > 0 && ` • ${selectedItems.length} selected`}
                                </p>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                                {selectedItems.length > 0 && (
                                    <>
                                        <button
                                            className="btn btn-outline-secondary btn-rd"
                                            onClick={clearSelection}
                                        >
                                            Clear Selection
                                        </button>
                                        <button
                                            className="btn btn-c-2101 btn-rd"
                                            onClick={moveAllToCart}
                                        >
                                            Add Selected to Cart ({selectedItems.length})
                                        </button>
                                    </>
                                )}
                                {wishlistItems.length > 0 && selectedItems.length === 0 && (
                                    <button
                                        className="btn btn-c-2101 btn-rd"
                                        onClick={moveAllToCart}
                                    >
                                        Add All to Cart
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {wishlistItems.length > 0 && (
                        <>
                            {/* Category Tabs */}
                            <div className="col-12 mb-4">
                                <div className="store-card fill-card">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                                        <div className="d-flex gap-2 mb-3 mb-md-0 flex-wrap">
                                            {wishlistCategories.map(category => (
                                                <button
                                                    key={category.id}
                                                    className={`btn btn-sm ${activeCategory === category.id ? 'btn-primary' : 'btn-outline-secondary'} btn-rd`}
                                                    onClick={() => setActiveCategory(category.id)}
                                                >
                                                    {category.name} ({category.count})
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="d-flex gap-2 align-items-center flex-wrap">
                                            {/* Sort Dropdown */}
                                            <select 
                                                className="form-select form-select-sm"
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                style={{width: 'auto'}}
                                            >
                                                <option value="dateAdded">Recently Added</option>
                                                <option value="priceHigh">Price: High to Low</option>
                                                <option value="priceLow">Price: Low to High</option>
                                                <option value="name">Name A-Z</option>
                                            </select>

                                            {/* View Mode Toggle */}
                                            <div className="btn-group" role="group">
                                                <button
                                                    className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                    onClick={() => setViewMode('grid')}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                                        <path fill="currentColor" d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3"/>
                                                    </svg>
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                    onClick={() => setViewMode('list')}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                                        <path fill="currentColor" d="M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4"/>
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Select All */}
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={selectedItems.length === filteredItems.length ? clearSelection : selectAllItems}
                                            >
                                                {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Alerts Summary */}
                            <div className="col-12 mb-4">
                                <div className="store-card fill-card">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="tc-6533 mb-1">Price Alerts</h6>
                                            <small className="text-muted">
                                                {wishlistItems.filter(item => item.priceAlert?.enabled).length} active alerts • 
                                                {wishlistItems.filter(item => item.lastPriceChange).length} recent price changes
                                            </small>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-info"
                                            onClick={() => setShowPriceAlerts(!showPriceAlerts)}
                                        >
                                            {showPriceAlerts ? 'Hide' : 'Show'} Alerts
                                        </button>
                                    </div>
                                    
                                    {showPriceAlerts && (
                                        <div className="mt-3 pt-3 border-top">
                                            {wishlistItems.filter(item => item.priceAlert?.enabled || item.lastPriceChange).map(item => (
                                                <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                                                    <div className="d-flex align-items-center">
                                                        <img src={item.image} alt={item.name} width="40" height="40" className="rounded me-3"/>
                                                        <div>
                                                            <h6 className="mb-0">{item.name}</h6>
                                                            {item.priceAlert?.enabled && (
                                                                <small className="text-info">
                                                                    Alert at £{item.priceAlert.targetPrice} (Current: £{item.price})
                                                                </small>
                                                            )}
                                                            {item.lastPriceChange && (
                                                                <small className="text-success d-block">
                                                                    Price dropped from £{item.lastPriceChange.oldPrice} to £{item.lastPriceChange.newPrice}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="d-flex gap-1">
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => {
                                                                const newTarget = prompt('Set price alert target:', item.priceAlert?.targetPrice || item.price * 0.9);
                                                                if (newTarget) setPriceAlertTarget(item.id, newTarget);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className={`btn btn-sm ${item.priceAlert?.enabled ? 'btn-warning' : 'btn-success'}`}
                                                            onClick={() => togglePriceAlert(item.id)}
                                                        >
                                                            {item.priceAlert?.enabled ? 'Disable' : 'Enable'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {filteredItems.length === 0 ? (
                        /* Empty Wishlist */
                        <div className="col-12">
                            <div className="store-card fill-card text-center py-5">
                                <div className="mb-4">
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3">
                                        <path
                                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                            fill="#ccc"
                                        />
                                    </svg>
                                </div>
                                <h3 className="tc-6533 mb-3">
                                    {wishlistItems.length === 0 ? 'Your wishlist is empty' : `No items in ${wishlistCategories.find(cat => cat.id === activeCategory)?.name}`}
                                </h3>
                                <p className="tc-6533 mb-4">
                                    {wishlistItems.length === 0 
                                        ? 'Save items you love by clicking the heart icon on any product'
                                        : 'Try selecting a different category or add more items to your wishlist'
                                    }
                                </p>
                                <div className="d-flex gap-2 justify-content-center flex-wrap">
                                    <Link to="/" className="btn btn-c-2101 btn-rd btn-lg">
                                        Start Shopping
                                    </Link>
                                    {wishlistItems.length > 0 && (
                                        <button 
                                            className="btn btn-outline-primary btn-rd btn-lg"
                                            onClick={() => setActiveCategory('all')}
                                        >
                                            View All Items
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Wishlist Items */
                        <div className="col-12">
                            <div className={viewMode === 'grid' ? 'row' : ''}>
                                {filteredItems.map((item) => (
                                    <div key={item.id} className={viewMode === 'grid' ? 'col-lg-4 col-md-6 mb-4' : 'mb-4'}>
                                        <div className={`store-card fill-card h-100 ${selectedItems.includes(item.id) ? 'border-primary' : ''}`}>
                                            {viewMode === 'grid' ? (
                                                /* Grid View */
                                                <>
                                                    {/* Selection Checkbox */}
                                                    <div className="position-absolute top-0 start-0 m-2" style={{zIndex: 10}}>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={selectedItems.includes(item.id)}
                                                            onChange={() => toggleItemSelection(item.id)}
                                                        />
                                                    </div>

                                                    {/* Product Image */}
                                                    <div className="position-relative mb-3">
                                                        <Link to={`/product/${item.id}`}>
                                                            <picture>
                                                                <source type="image/webp" srcSet={item.imageWebp} />
                                                                <img
                                                                    src={item.image}
                                                                    className="img-fluid rounded"
                                                                    alt={item.name}
                                                                    width="300"
                                                                    height="300"
                                                                />
                                                            </picture>
                                                        </Link>
                                                        
                                                        {/* Badges */}
                                                        <div className="position-absolute top-0 end-0 m-2">
                                                            {item.discount > 0 && (
                                                                <span className="badge bg-danger mb-1 d-block">
                                                                    -{item.discount}%
                                                                </span>
                                                            )}
                                                            {item.priceAlert?.enabled && (
                                                                <span className="badge bg-info mb-1 d-block">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                        <path fill="white" d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
                                                                    </svg>
                                                                    Alert
                                                                </span>
                                                            )}
                                                            {item.lastPriceChange && (
                                                                <span className="badge bg-success mb-1 d-block">
                                                                    Price Drop!
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Stock Status */}
                                                        {!item.inStock && (
                                                            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center py-2">
                                                                <small>Out of Stock</small>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex-grow-1 d-flex flex-column">
                                                        <Link to={`/product/${item.id}`} className="text-decoration-none">
                                                            <h5 className="tc-6533 mb-2">{item.name}</h5>
                                                        </Link>

                                                        {/* Rating */}
                                                        <div className="d-flex align-items-center mb-2">
                                                            <div className="d-flex me-2">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" className={i < Math.floor(item.rating) ? 'text-warning' : 'text-muted'}>
                                                                        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                            <small className="tc-6533">({item.reviews})</small>
                                                        </div>

                                                        {/* Price */}
                                                        <div className="mb-3">
                                                            <span className="tc-2101 bold-text h5">£{item.price}</span>
                                                            {item.originalPrice && (
                                                                <span className="text-muted text-decoration-line-through ms-2">
                                                                    £{item.originalPrice}
                                                                </span>
                                                            )}
                                                            {item.priceAlert?.enabled && (
                                                                <div className="mt-1">
                                                                    <small className="text-info">
                                                                        Target: £{item.priceAlert.targetPrice}
                                                                    </small>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Category & Date */}
                                                        <div className="mb-3">
                                                            <small className="text-muted">
                                                                Added {new Date(item.dateAdded).toLocaleDateString()} • 
                                                                {wishlistCategories.find(cat => cat.id === item.category)?.name}
                                                            </small>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="mt-auto">
                                                            <div className="d-flex gap-2 mb-2">
                                                                {item.inStock ? (
                                                                    <button
                                                                        className="btn btn-c-2101 btn-rd flex-fill"
                                                                        onClick={() => handleAddToCart(item)}
                                                                        disabled={isUpdating}
                                                                    >
                                                                        {isUpdating ? 'Adding...' : 'Add to Cart'}
                                                                    </button>
                                                                ) : (
                                                                    <button className="btn btn-outline-secondary btn-rd flex-fill" disabled>
                                                                        Notify When Available
                                                                    </button>
                                                                )}
                                                                
                                                                <div className="dropdown">
                                                                    <button className="btn btn-outline-secondary btn-rd" data-bs-toggle="dropdown">
                                                                        ⋮
                                                                    </button>
                                                                    <ul className="dropdown-menu">
                                                                        <li><h6 className="dropdown-header">Move to Category</h6></li>
                                                                        {wishlistCategories.filter(cat => cat.id !== 'all' && cat.id !== item.category).map(cat => (
                                                                            <li key={cat.id}>
                                                                                <button 
                                                                                    className="dropdown-item"
                                                                                    onClick={() => moveToCategory(item.id, cat.id)}
                                                                                >
                                                                                    {cat.name}
                                                                                </button>
                                                                            </li>
                                                                        ))}
                                                                        <li><hr className="dropdown-divider" /></li>
                                                                        <li>
                                                                            <button 
                                                                                className="dropdown-item"
                                                                                onClick={() => togglePriceAlert(item.id)}
                                                                            >
                                                                                {item.priceAlert?.enabled ? 'Disable' : 'Enable'} Price Alert
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button 
                                                                                className="dropdown-item text-danger"
                                                                                onClick={() => removeFromWishlist(item.id)}
                                                                            >
                                                                                Remove from Wishlist
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                /* List View */
                                                <div className="row align-items-center">
                                                    <div className="col-auto">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={selectedItems.includes(item.id)}
                                                            onChange={() => toggleItemSelection(item.id)}
                                                        />
                                                    </div>
                                                    <div className="col-md-2 col-3">
                                                        <Link to={`/product/${item.id}`}>
                                                            <img
                                                                src={item.image}
                                                                className="img-fluid rounded"
                                                                alt={item.name}
                                                                width="80"
                                                                height="80"
                                                            />
                                                        </Link>
                                                    </div>
                                                    <div className="col-md-4 col-9">
                                                        <Link to={`/product/${item.id}`} className="text-decoration-none">
                                                            <h6 className="tc-6533 mb-1">{item.name}</h6>
                                                        </Link>
                                                        <div className="d-flex align-items-center mb-1">
                                                            <div className="d-flex me-2">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg key={i} width="12" height="12" viewBox="0 0 24 24" className={i < Math.floor(item.rating) ? 'text-warning' : 'text-muted'}>
                                                                        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                            <small className="tc-6533">({item.reviews})</small>
                                                        </div>
                                                        <small className="text-muted">
                                                            Added {new Date(item.dateAdded).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                    <div className="col-md-2 col-6">
                                                        <span className="tc-2101 bold-text h6">£{item.price}</span>
                                                        {item.originalPrice && (
                                                            <div>
                                                                <small className="text-muted text-decoration-line-through">
                                                                    £{item.originalPrice}
                                                                </small>
                                                            </div>
                                                        )}
                                                        {item.priceAlert?.enabled && (
                                                            <div>
                                                                <small className="text-info">Alert: £{item.priceAlert.targetPrice}</small>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="col-md-2 col-6">
                                                        {!item.inStock ? (
                                                            <span className="badge bg-danger">Out of Stock</span>
                                                        ) : (
                                                            <span className="badge bg-success">In Stock</span>
                                                        )}
                                                        {item.priceAlert?.enabled && (
                                                            <span className="badge bg-info d-block mt-1">Price Alert</span>
                                                        )}
                                                    </div>
                                                    <div className="col-md-2 col-12 mt-2 mt-md-0">
                                                        <div className="d-flex gap-1">
                                                            {item.inStock ? (
                                                                <button
                                                                    className="btn btn-sm btn-c-2101 btn-rd"
                                                                    onClick={() => handleAddToCart(item)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    {isUpdating ? 'Adding...' : 'Add to Cart'}
                                                                </button>
                                                            ) : (
                                                                <button className="btn btn-sm btn-outline-secondary btn-rd" disabled>
                                                                    Notify
                                                                </button>
                                                            )}
                                                            <div className="dropdown">
                                                                <button className="btn btn-sm btn-outline-secondary btn-rd" data-bs-toggle="dropdown">
                                                                    ⋮
                                                                </button>
                                                                <ul className="dropdown-menu">
                                                                    <li>
                                                                        <button 
                                                                            className="dropdown-item"
                                                                            onClick={() => togglePriceAlert(item.id)}
                                                                        >
                                                                            {item.priceAlert?.enabled ? 'Disable' : 'Enable'} Alert
                                                                        </button>
                                                                    </li>
                                                                    <li>
                                                                        <button 
                                                                            className="dropdown-item text-danger"
                                                                            onClick={() => removeFromWishlist(item.id)}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recommendations */}
                            <div className="row mt-5">
                                <div className="col-12">
                                    <div className="store-card fill-card">
                                        <h4 className="tc-6533 mb-4 bold-text">You might also like</h4>
                                        <div className="row">
                                            <div className="col-md-3 col-6 mb-3">
                                                <div className="text-center">
                                                    <img src="img/tablet-product.jpg" className="img-fluid rounded mb-2" alt="Tablet" />
                                                    <h6 className="tc-6533">Tablet Air</h6>
                                                    <p className="tc-2101 bold-text">£899</p>
                                                </div>
                                            </div>
                                            <div className="col-md-3 col-6 mb-3">
                                                <div className="text-center">
                                                    <img src="img/phone-product.jpg" className="img-fluid rounded mb-2" alt="Phone" />
                                                    <h6 className="tc-6533">Phone Pro</h6>
                                                    <p className="tc-2101 bold-text">£999</p>
                                                </div>
                                            </div>
                                            <div className="col-md-3 col-6 mb-3">
                                                <div className="text-center">
                                                    <img src="img/laptop-product.jpg" className="img-fluid rounded mb-2" alt="Laptop" />
                                                    <h6 className="tc-6533">Laptop Air</h6>
                                                    <p className="tc-2101 bold-text">£1299</p>
                                                </div>
                                            </div>
                                            <div className="col-md-3 col-6 mb-3">
                                                <div className="text-center">
                                                    <img src="img/tv-product.jpg" className="img-fluid rounded mb-2" alt="TV" />
                                                    <h6 className="tc-6533">HD TV</h6>
                                                    <p className="tc-2101 bold-text">£1999</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wishlist;