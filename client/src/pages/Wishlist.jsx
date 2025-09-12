import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
    const [wishlistItems, setWishlistItems] = useState([
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
            reviews: 124
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
            reviews: 89
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
            reviews: 156
        }
    ]);

    const removeFromWishlist = (id) => {
        setWishlistItems(items => items.filter(item => item.id !== id));
    };

    const addToCart = (item) => {
        console.log('Adding to cart:', item);
        // Handle add to cart logic
    };

    const moveAllToCart = () => {
        const inStockItems = wishlistItems.filter(item => item.inStock);
        console.log('Moving to cart:', inStockItems);
        // Handle move all to cart logic
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="wishlist-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Page Header */}
                    <div className="col-12 mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="tc-6533 bold-text mb-2">My Wishlist</h1>
                                <p className="tc-6533 mb-0">
                                    {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
                                </p>
                            </div>
                            {wishlistItems.length > 0 && (
                                <button
                                    className="btn btn-c-2101 btn-rd"
                                    onClick={moveAllToCart}
                                >
                                    Add All to Cart
                                </button>
                            )}
                        </div>
                    </div>

                    {wishlistItems.length === 0 ? (
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
                                <h3 className="tc-6533 mb-3">Your wishlist is empty</h3>
                                <p className="tc-6533 mb-4">
                                    Save items you love by clicking the heart icon on any product
                                </p>
                                <Link to="/" className="btn btn-c-2101 btn-rd btn-lg">
                                    Start Shopping
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* Wishlist Items */
                        <div className="col-12">
                            <div className="row">
                                {wishlistItems.map((item) => (
                                    <div key={item.id} className="col-lg-4 col-md-6 mb-4">
                                        <div className="store-card fill-card h-100">
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
                                                
                                                {/* Discount Badge */}
                                                {item.discount > 0 && (
                                                    <span className="position-absolute top-0 start-0 badge bg-danger m-2">
                                                        -{item.discount}%
                                                    </span>
                                                )}

                                                {/* Remove from Wishlist */}
                                                <button
                                                    className="position-absolute top-0 end-0 btn btn-sm btn-light m-2"
                                                    onClick={() => removeFromWishlist(item.id)}
                                                    title="Remove from wishlist"
                                                    style={{width: '36px', height: '36px'}}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="red">
                                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                                    </svg>
                                                </button>

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
                                                            <span
                                                                key={i}
                                                                className={i < Math.floor(item.rating) ? 'text-warning' : 'text-muted'}
                                                            >
                                                                ★
                                                            </span>
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

                                                {/* Action Buttons */}
                                                <div className="mt-auto">
                                                    {item.inStock ? (
                                                        <button
                                                            className="btn btn-c-2101 btn-rd w-100 mb-2"
                                                            onClick={() => addToCart(item)}
                                                        >
                                                            Add to Cart
                                                        </button>
                                                    ) : (
                                                        <button className="btn btn-outline-secondary btn-rd w-100 mb-2" disabled>
                                                            Notify When Available
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        className="btn btn-outline-danger btn-rd w-100"
                                                        onClick={() => removeFromWishlist(item.id)}
                                                    >
                                                        Remove from Wishlist
                                                    </button>
                                                </div>
                                            </div>
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