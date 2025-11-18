import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../context';
import wishlistService from '../api/services/wishlistService';
import { LoadingSpinner, Toast } from '../components/Common';
import { RelatedProducts } from '../components';

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
    const [selectedItems, setSelectedItems] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [toast, setToast] = useState(null);

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
                options: item.options || {},
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

    const removeFromWishlist = useCallback(async (id) => {
        try {
            setIsUpdating(true);
            const item = wishlistItems.find(i => i.id === id);
            await wishlistService.removeFromWishlist(item.productId);
            setWishlistItems(items => items.filter(item => item.id !== id));
            setSelectedItems(selected => selected.filter(itemId => itemId !== id));
            setToast({
                message: 'Item removed from wishlist',
                type: 'success'
            });
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            setToast({
                message: 'Failed to remove item. Please try again.',
                type: 'error'
            });
        } finally {
            setIsUpdating(false);
        }
    }, [wishlistItems]);

    const handleAddToCart = useCallback(async (item) => {
        if (!item.inStock) {
            setToast({
                message: 'This product is currently out of stock.',
                type: 'warning'
            });
            return;
        }

        try {
            setIsUpdating(true);
            // Use stored options from wishlist item
            const options = item.options || {};
            await addToCart(item.productId, 1, options);
            
            // Remove from wishlist after successfully adding to cart
            await wishlistService.removeFromWishlist(item.productId);
            setWishlistItems(items => items.filter(i => i.id !== item.id));
            setSelectedItems(selected => selected.filter(itemId => itemId !== item.id));
            
            // Build options display string
            const optionsText = Object.keys(options).length > 0 
                ? ` (${Object.entries(options).map(([key, value]) => `${key}: ${value}`).join(', ')})`
                : '';
            
            setToast({
                message: `${item.name}${optionsText} added to cart!`,
                type: 'success',
                action: {
                    label: 'View Cart',
                    path: '/cart'
                }
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            setToast({
                message: error.response?.data?.message || 'Failed to add to cart. Please try again.',
                type: 'error'
            });
        } finally {
            setIsUpdating(false);
        }
    }, [addToCart]);

    const moveAllToCart = useCallback(async () => {
        const itemsToMove = selectedItems.length > 0 
            ? wishlistItems.filter(item => selectedItems.includes(item.id) && item.inStock)
            : wishlistItems.filter(item => item.inStock);
        
        if (itemsToMove.length === 0) {
            setToast({
                message: 'No items available to add to cart.',
                type: 'warning'
            });
            return;
        }

        try {
            setIsUpdating(true);
            let successCount = 0;
            const successfullyAddedIds = [];
            
            for (const item of itemsToMove) {
                try {
                    // Use stored options from wishlist item
                    const options = item.options || {};
                    await addToCart(item.productId, 1, options);
                    successCount++;
                    successfullyAddedIds.push(item.id);
                } catch (error) {
                    console.error(`Failed to add ${item.name}:`, error);
                }
            }
            
            // Remove successfully added items from wishlist
            if (successfullyAddedIds.length > 0) {
                for (const itemId of successfullyAddedIds) {
                    const item = wishlistItems.find(i => i.id === itemId);
                    if (item) {
                        try {
                            await wishlistService.removeFromWishlist(item.productId);
                        } catch (error) {
                            console.error(`Failed to remove ${item.name} from wishlist:`, error);
                        }
                    }
                }
                
                // Update local state
                setWishlistItems(items => items.filter(item => !successfullyAddedIds.includes(item.id)));
                setSelectedItems([]);
            }
            
            if (successCount > 0) {
                setToast({
                    message: `${successCount} of ${itemsToMove.length} items added to cart!`,
                    type: 'success',
                    action: {
                        label: 'View Cart',
                        path: '/cart'
                    }
                });
            } else {
                setToast({
                    message: 'Failed to add items to cart. Please try again.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error moving items to cart:', error);
            setToast({
                message: 'Failed to add items to cart. Please try again.',
                type: 'error'
            });
        } finally {
            setIsUpdating(false);
        }
    }, [wishlistItems, selectedItems, addToCart]);

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
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    action={toast.action}
                    onClose={() => setToast(null)}
                />
            )}
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
                                                        </div>

                                                        {/* Variant Options */}
                                                        {item.options && Object.keys(item.options).length > 0 && (
                                                            <div className="mb-3">
                                                                {Object.entries(item.options).map(([key, value]) => (
                                                                    <small key={key} className="d-block text-muted">
                                                                        <strong>{key}:</strong> {value}
                                                                    </small>
                                                                ))}
                                                            </div>
                                                        )}

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
                                                                
                                                                <button 
                                                                    className="btn btn-outline-danger btn-rd"
                                                                    onClick={() => removeFromWishlist(item.id)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    Remove
                                                                </button>
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
                                                        {item.options && Object.keys(item.options).length > 0 && (
                                                            <div className="mt-1">
                                                                {Object.entries(item.options).map(([key, value]) => (
                                                                    <small key={key} className="d-block text-muted">
                                                                        {key}: {value}
                                                                    </small>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="col-md-2 col-6">
                                                        {!item.inStock ? (
                                                            <span className="badge bg-danger">Out of Stock</span>
                                                        ) : (
                                                            <span className="badge bg-success">In Stock</span>
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
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger btn-rd"
                                                                onClick={() => removeFromWishlist(item.id)}
                                                                disabled={isUpdating}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Related Products */}
                            <div className="row mt-5">
                                <div className="col-12">
                                    <RelatedProducts />
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