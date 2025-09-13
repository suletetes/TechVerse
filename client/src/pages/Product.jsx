import React, { useState } from "react";
import { Link } from "react-router-dom";

const Product = () => {
    const [selectedColor, setSelectedColor] = useState('silver');
    const [selectedStorage, setSelectedStorage] = useState('128GB');
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const colorOptions = [
        { id: 'silver', name: 'Silver', class: 'silver-dot' },
        { id: 'blue', name: 'Blue', class: 'blue-dot' },
        { id: 'white', name: 'White', class: 'white-dot' },
        { id: 'black', name: 'Black', class: '' },
        { id: 'red', name: 'Red', class: 'red-dot' },
        { id: 'green', name: 'Green', class: 'green-dot' }
    ];

    const storageOptions = [
        { id: '128GB', name: '128GB', price: 1999 },
        { id: '256GB', name: '256GB', price: 2099 },
        { id: '512GB', name: '512GB', price: 2199 }
    ];

    const getCurrentPrice = () => {
        const storage = storageOptions.find(s => s.id === selectedStorage);
        return storage ? storage.price : 1999;
    };

    const handleAddToCart = () => {
        // Add to cart logic here
        console.log('Added to cart:', {
            product: 'Tablet Air',
            color: selectedColor,
            storage: selectedStorage,
            quantity: quantity,
            price: getCurrentPrice()
        });
        // You can add toast notification here
        alert('Product added to cart!');
    };

    const handleBuyNow = () => {
        // Buy now logic - could add to cart and redirect to checkout
        handleAddToCart();
        // Redirect to payment page
    };

    const toggleWishlist = () => {
        setIsInWishlist(!isInWishlist);
        // Add wishlist logic here
        console.log(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    };
    return (
        <section className="bloc l-bloc full-width-bloc" id="bloc-7">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Title */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 mb-4 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        <h1 className="tc-6533 mb-0">Tablet Air</h1>
                    </div>

                    {/* Large product image */}
                    <div
                        className="text-start offset-lg-1 mb-4 col-lg-6 mb-md-4 mb-lg-0 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        <div className="store-card outline-card fill-card">
                            <picture>
                                <source
                                    type="image/webp"
                                    srcSet="/img/lazyload-ph.png"
                                    data-srcset="../img/tablet-lg.webp"
                                />
                                <img
                                    src="/img/lazyload-ph.png"
                                    data-src="../img/tablet-lg.jpg"
                                    className="img-fluid mx-auto d-block img-rd-lg img-fluid-up lazyload"
                                    alt="tablet product"
                                    width="1014"
                                    height="1014"
                                />
                            </picture>
                        </div>
                    </div>

                    {/* Product details */}
                    <div
                        className="text-start col-lg-4 col-md-10 offset-md-1 offset-lg-0 col-sm-10 offset-sm-1 col-10 offset-1">
                        <div className="store-card outline-card fill-card">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <p className="sm-product-title tc-2101 mb-0">Free Delivery</p>
                                    <h3 className="tc-6533 mb-1">Buy Tablet Air</h3>
                                    <p className="tc-6533 h4 mb-0">£{getCurrentPrice().toLocaleString()}</p>
                                </div>
                                <button 
                                    className={`btn btn-link p-2 ${isInWishlist ? 'text-danger' : 'text-muted'}`}
                                    onClick={toggleWishlist}
                                    title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                    </svg>
                                </button>
                            </div>
                            <p>
                                Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean
                                commodo ligula eget dolor. Lorem ipsum dolor sit amet,
                                consectetuer adipiscing elit.
                            </p>

                            <div className="divider-h"></div>

                            {/* Colour Options */}
                            <h5 className="tc-6533 mb-3">Colour</h5>
                            <div className="blocs-grid-container mb-4 colour-option-grid">
                                {colorOptions.map((color) => (
                                    <div 
                                        key={color.id}
                                        className={`text-lg-start model-option ${selectedColor === color.id ? 'primary-outline' : ''}`}
                                        onClick={() => setSelectedColor(color.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <p className="mb-0">
                                            <span className={`color-dot ${color.class}`}>•</span> {color.name}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="divider-h"></div>

                            {/* Storage Options */}
                            <h5 className="tc-6533 mb-3">Storage</h5>
                            <ul className="list-unstyled list-sp-lg">
                                {storageOptions.map((storage) => (
                                    <li key={storage.id}>
                                        <div 
                                            className={`text-lg-start model-option ${selectedStorage === storage.id ? 'primary-outline' : ''}`}
                                            onClick={() => setSelectedStorage(storage.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <p className="mb-0 float-lg-none">
                                                {storage.name}{" "}
                                                <span className={`price-right token ${selectedStorage === storage.id ? 'primary-gradient-bg' : ''}`}>
                                                    £{storage.price}
                                                </span>
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="divider-h"></div>

                            {/* Quantity Selector */}
                            <div className="mb-4">
                                <h5 className="tc-6533 mb-3">Quantity</h5>
                                <div className="d-flex align-items-center">
                                    <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                    </button>
                                    <span className="mx-3 fw-bold">{quantity}</span>
                                    <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19"/>
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-grid gap-2">
                                <Link
                                    to="/payment"
                                    className="btn btn-rd btn-c-2101 btn-lg d-flex align-items-center justify-content-center"
                                    onClick={handleBuyNow}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                    </svg>
                                    Buy Now - £{(getCurrentPrice() * quantity).toLocaleString()}
                                </Link>
                                <button
                                    className="btn btn-outline-primary btn-rd btn-lg d-flex align-items-center justify-content-center"
                                    onClick={handleAddToCart}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="9" cy="21" r="1"/>
                                        <circle cx="20" cy="21" r="1"/>
                                        <path d="m1 1 4 4 7 13h7l4-8H6"/>
                                    </svg>
                                    Add to Cart
                                </button>
                            </div>

                            {/* Product Info */}
                            <div className="mt-4 p-3 bg-light rounded">
                                <div className="d-flex align-items-center mb-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-success" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    <small className="text-muted">Free delivery on orders over £50</small>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-info" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                    </svg>
                                    <small className="text-muted">2-year warranty included</small>
                                </div>
                                <div className="d-flex align-items-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-warning" fill="currentColor">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                    <small className="text-muted">30-day return policy</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Product;
