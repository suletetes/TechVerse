import React, { useState } from "react";
import { Link } from "react-router-dom";

const Product = () => {
    const [selectedColor, setSelectedColor] = useState('silver');
    const [selectedStorage, setSelectedStorage] = useState('128GB');
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedMedia, setSelectedMedia] = useState('main-image');
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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

    const mediaGallery = [
        {
            id: 'main-image',
            type: 'image',
            src: '../img/tablet-lg.jpg',
            webp: '../img/tablet-lg.webp',
            thumbnail: '../img/tablet-thumb.jpg',
            alt: 'Tablet Air - Main View',
            title: 'Main View'
        },
        {
            id: 'side-view',
            type: 'image',
            src: '../img/tablet-side.jpg',
            webp: '../img/tablet-side.webp',
            thumbnail: '../img/tablet-side-thumb.jpg',
            alt: 'Tablet Air - Side View',
            title: 'Side View'
        },
        {
            id: 'back-view',
            type: 'image',
            src: '../img/tablet-back.jpg',
            webp: '../img/tablet-back.webp',
            thumbnail: '../img/tablet-back-thumb.jpg',
            alt: 'Tablet Air - Back View',
            title: 'Back View'
        },
        {
            id: 'accessories',
            type: 'image',
            src: '../img/tablet-accessories.jpg',
            webp: '../img/tablet-accessories.webp',
            thumbnail: '../img/tablet-accessories-thumb.jpg',
            alt: 'Tablet Air - With Accessories',
            title: 'Accessories'
        },
        {
            id: 'product-video',
            type: 'video',
            src: '../videos/tablet-demo.mp4',
            poster: '../img/tablet-video-poster.jpg',
            thumbnail: '../img/tablet-video-thumb.jpg',
            alt: 'Tablet Air - Product Demo',
            title: 'Product Demo'
        },
        {
            id: 'unboxing-video',
            type: 'video',
            src: '../videos/tablet-unboxing.mp4',
            poster: '../img/tablet-unboxing-poster.jpg',
            thumbnail: '../img/tablet-unboxing-thumb.jpg',
            alt: 'Tablet Air - Unboxing Experience',
            title: 'Unboxing'
        }
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

    const getCurrentMedia = () => {
        return mediaGallery.find(media => media.id === selectedMedia) || mediaGallery[0];
    };

    const handleMediaSelect = (mediaId) => {
        setSelectedMedia(mediaId);
        setIsVideoPlaying(false);
    };

    const handlePreviousMedia = () => {
        const currentIndex = mediaGallery.findIndex(media => media.id === selectedMedia);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : mediaGallery.length - 1;
        handleMediaSelect(mediaGallery[previousIndex].id);
    };

    const handleNextMedia = () => {
        const currentIndex = mediaGallery.findIndex(media => media.id === selectedMedia);
        const nextIndex = currentIndex < mediaGallery.length - 1 ? currentIndex + 1 : 0;
        handleMediaSelect(mediaGallery[nextIndex].id);
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

                    {/*
                    Title (full width)
                    Product Media Gallery  |  Product Details & Reviews Summary
                    Customer Reviews (full width)
                    */}


                    {/* Product Media Gallery */}
                    <div
                        className="text-start offset-lg-1 mb-2 col-lg-6 mb-md-2 mb-lg-0 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        {/* Main Media Display */}
                        <div className="store-card outline-card fill-card mb-3 position-relative">
                            {getCurrentMedia().type === 'image' ? (
                                <picture>
                                    <source
                                        type="image/webp"
                                        srcSet="/img/lazyload-ph.png"
                                        data-srcset={getCurrentMedia().webp}
                                    />
                                    <img
                                        src="/img/lazyload-ph.png"
                                        data-src={getCurrentMedia().src}
                                        className="img-fluid mx-auto d-block img-rd-lg img-fluid-up lazyload"
                                        alt={getCurrentMedia().alt}
                                        width="1014"
                                        height="1014"
                                    />
                                </picture>
                            ) : (
                                <div className="position-relative">
                                    {!isVideoPlaying ? (
                                        <div className="position-relative">
                                            <img
                                                src={getCurrentMedia().poster}
                                                className="img-fluid mx-auto d-block img-rd-lg"
                                                alt={getCurrentMedia().alt}
                                                width="1014"
                                                height="1014"
                                            />
                                            <div className="position-absolute top-50 start-50 translate-middle">
                                                <button
                                                    className="btn btn-primary btn-lg rounded-circle shadow-lg"
                                                    onClick={() => setIsVideoPlaying(true)}
                                                    style={{ width: '80px', height: '80px' }}
                                                >
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div
                                                className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-3">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span className="fw-medium">{getCurrentMedia().title}</span>
                                                    <span className="badge bg-primary">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1"
                                                            fill="white">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                        Video
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="position-relative">
                                            <video
                                                className="img-fluid mx-auto d-block img-rd-lg"
                                                controls
                                                autoPlay
                                                width="1014"
                                                height="1014"
                                                poster={getCurrentMedia().poster}
                                            >
                                                <source src={getCurrentMedia().src} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                            <button
                                                className="btn btn-sm btn-outline-light position-absolute top-0 end-0 m-3"
                                                onClick={() => setIsVideoPlaying(false)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path
                                                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Navigation Arrows */}
                            <button
                                className="btn btn-light btn-lg position-absolute top-50 start-0 translate-middle-y ms-3 shadow-sm"
                                onClick={handlePreviousMedia}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    border: '2px solid rgba(255,255,255,0.8)',
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    backdropFilter: 'blur(10px)',
                                    zIndex: 10
                                }}
                                title="Previous image"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2">
                                    <polyline points="15,18 9,12 15,6" />
                                </svg>
                            </button>

                            <button
                                className="btn btn-light btn-lg position-absolute top-50 end-0 translate-middle-y me-3 shadow-sm"
                                onClick={handleNextMedia}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    border: '2px solid rgba(255,255,255,0.8)',
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    backdropFilter: 'blur(10px)',
                                    zIndex: 10
                                }}
                                title="Next image"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2">
                                    <polyline points="9,18 15,12 9,6" />
                                </svg>
                            </button>

                            {/* Media Counter */}
                            <div className="position-absolute bottom-0 end-0 m-3">
                                <span className="badge bg-dark bg-opacity-75 text-white px-3 py-2 rounded-pill">
                                    {mediaGallery.findIndex(media => media.id === selectedMedia) + 1} / {mediaGallery.length}
                                </span>
                            </div>
                        </div>

                        {/* Media Thumbnails */}
                        <div className="store-card outline-card fill-card">
                            <div className="p-3">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 className="tc-6533 fw-bold mb-0 d-flex align-items-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" className="me-2 text-primary">
                                            <path fill="currentColor"
                                                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                        </svg>
                                        Product Gallery
                                    </h6>
                                    <div className="d-flex gap-1">
                                        <button
                                            className="btn btn-sm btn-outline-secondary rounded-circle p-1"
                                            onClick={handlePreviousMedia}
                                            style={{ width: '32px', height: '32px' }}
                                            title="Previous"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2">
                                                <polyline points="15,18 9,12 15,6" />
                                            </svg>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-secondary rounded-circle p-1"
                                            onClick={handleNextMedia}
                                            style={{ width: '32px', height: '32px' }}
                                            title="Next"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2">
                                                <polyline points="9,18 15,12 9,6" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Horizontal Scrollable Thumbnails */}
                                <div className="position-relative">
                                    <div
                                        className="d-flex gap-2 overflow-auto pb-2"
                                        style={{
                                            scrollBehavior: 'smooth',
                                            scrollbarWidth: 'thin',
                                            msOverflowStyle: 'none'
                                        }}
                                        id="thumbnail-container"
                                    >
                                        {mediaGallery.map((media, index) => (
                                            <div key={media.id} className="flex-shrink-0" style={{ width: '80px' }}>
                                                <div
                                                    className={`position-relative cursor-pointer rounded-3 overflow-hidden border-2 transition-all ${selectedMedia === media.id ? 'border-primary shadow-sm scale-105' : 'border-light hover:border-secondary'}`}
                                                    onClick={() => handleMediaSelect(media.id)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        aspectRatio: '1/1',
                                                        transform: selectedMedia === media.id ? 'scale(1.05)' : 'scale(1)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <img
                                                        src={media.thumbnail || media.poster}
                                                        alt={media.alt}
                                                        className="img-fluid w-100 h-100"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                    {media.type === 'video' && (
                                                        <div
                                                            className="position-absolute top-50 start-50 translate-middle">
                                                            <div className="bg-dark bg-opacity-75 rounded-circle p-1">
                                                                <svg width="12" height="12" viewBox="0 0 24 24"
                                                                    fill="white">
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedMedia === media.id && (
                                                        <div
                                                            className="position-absolute top-0 start-0 w-100 h-100 bg-primary bg-opacity-20 d-flex align-items-center justify-content-center">
                                                            <div className="bg-primary rounded-circle p-1">
                                                                <svg width="10" height="10" viewBox="0 0 24 24"
                                                                    fill="white">
                                                                    <path
                                                                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div
                                                        className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white px-1">
                                                        <small className="fw-medium d-block text-center"
                                                            style={{ fontSize: '0.6rem', lineHeight: '1.2' }}>
                                                            {index + 1}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Media Type Filter */}
                                <div className="d-flex gap-2 mt-3 justify-content-center">
                                    <button
                                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                        onClick={() => {
                                            const firstImage = mediaGallery.find(m => m.type === 'image');
                                            if (firstImage) handleMediaSelect(firstImage.id);
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor"
                                                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                        </svg>
                                        Images ({mediaGallery.filter(m => m.type === 'image').length})
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-success rounded-pill px-3"
                                        onClick={() => {
                                            const firstVideo = mediaGallery.find(m => m.type === 'video');
                                            if (firstVideo) handleMediaSelect(firstVideo.id);
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M8 5v14l11-7z" />
                                        </svg>
                                        Videos ({mediaGallery.filter(m => m.type === 'video').length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Product Specifications */}
                        <div className="store-card outline-card fill-card mt-3">
                            <div className="p-4">
                                <h5 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-primary">
                                        <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                                    </svg>
                                    Technical Specifications
                                </h5>

                                <div className="row g-3">
                                    <div className="col-12">
                                        <div className="spec-item d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <span className="text-muted">Display</span>
                                            <span className="fw-medium">11-inch Liquid Retina</span>
                                        </div>
                                        <div className="spec-item d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <span className="text-muted">Resolution</span>
                                            <span className="fw-medium">2388 x 1668 pixels</span>
                                        </div>
                                        <div className="spec-item d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <span className="text-muted">Processor</span>
                                            <span className="fw-medium">M2 Chip</span>
                                        </div>
                                        <div className="spec-item d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <span className="text-muted">RAM</span>
                                            <span className="fw-medium">8GB</span>
                                        </div>
                                        <div className="spec-item d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <span className="text-muted">Camera</span>
                                            <span className="fw-medium">12MP Wide + 10MP Ultra Wide</span>
                                        </div>
                                        <div className="spec-item d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <span className="text-muted">Battery Life</span>
                                            <span className="fw-medium">Up to 10 hours</span>
                                        </div>
                                        <div className="spec-item d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <span className="text-muted">Weight</span>
                                            <span className="fw-medium">466g</span>
                                        </div>
                                        <div className="spec-item d-flex justify-content-between align-items-center py-2">
                                            <span className="text-muted">Connectivity</span>
                                            <span className="fw-medium">Wi-Fi 6E, Bluetooth 5.3</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Key Features */}
                        <div className="store-card outline-card fill-card mt-3">
                            <div className="p-4">
                                <h5 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-success">
                                        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    Key Features
                                </h5>

                                <div className="features-list">
                                    <div className="feature-item d-flex align-items-start mb-3">
                                        <div className="feature-icon bg-primary bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="text-primary">
                                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="mb-1 fw-semibold">All-Day Battery Life</h6>
                                            <p className="text-muted small mb-0">Up to 10 hours of surfing the web on Wi-Fi, watching video, or listening to music</p>
                                        </div>
                                    </div>

                                    <div className="feature-item d-flex align-items-start mb-3">
                                        <div className="feature-icon bg-success bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="text-success">
                                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="mb-1 fw-semibold">Advanced Camera System</h6>
                                            <p className="text-muted small mb-0">12MP Wide camera with Smart HDR 4 and 4K video recording</p>
                                        </div>
                                    </div>

                                    <div className="feature-item d-flex align-items-start mb-3">
                                        <div className="feature-icon bg-info bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="text-info">
                                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="mb-1 fw-semibold">Ultra-Fast Performance</h6>
                                            <p className="text-muted small mb-0">M2 chip delivers incredible performance for demanding apps and multitasking</p>
                                        </div>
                                    </div>

                                    <div className="feature-item d-flex align-items-start">
                                        <div className="feature-icon bg-warning bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="text-warning">
                                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="mb-1 fw-semibold">Versatile Connectivity</h6>
                                            <p className="text-muted small mb-0">USB-C connector for charging and accessories, plus support for Apple Pencil</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Product Details and Customer Reviews */}
                    <div className="col-lg-4 col-md-10 offset-md-1 offset-lg-0 col-sm-10 offset-sm-1 col-10 offset-1">
                        {/* Product Details */}
                        <div className="text-start mb-4">
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
                                        <svg width="24" height="24" viewBox="0 0 24 24"
                                            fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor"
                                            strokeWidth="2">
                                            <path
                                                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
                                                    <span
                                                        className={`price-right token ${selectedStorage === storage.id ? 'primary-gradient-bg' : ''}`}>
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
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        </button>
                                        <span className="mx-3 fw-bold">{quantity}</span>
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => setQuantity(quantity + 1)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
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
                                            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        Buy Now - £{(getCurrentPrice() * quantity).toLocaleString()}
                                    </Link>
                                    <button
                                        className="btn btn-outline-primary btn-rd btn-lg d-flex align-items-center justify-content-center"
                                        onClick={handleAddToCart}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none"
                                            stroke="currentColor" strokeWidth="2">
                                            <circle cx="9" cy="21" r="1" />
                                            <circle cx="20" cy="21" r="1" />
                                            <path d="m1 1 4 4 7 13h7l4-8H6" />
                                        </svg>
                                        Add to Cart
                                    </button>
                                </div>

                                {/* Product Info */}
                                <div className="mt-4 p-4 bg-light rounded-3">
                                    <h6 className="tc-6533 fw-bold mb-3 d-flex align-items-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" className="me-2 text-primary">
                                            <path fill="currentColor"
                                                d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                                        </svg>
                                        What's Included
                                    </h6>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-center mb-2">
                                                <svg width="16" height="16" viewBox="0 0 24 24"
                                                    className="me-2 text-success" fill="currentColor">
                                                    <path
                                                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                </svg>
                                                <small className="text-muted">Free delivery on orders over £50</small>
                                            </div>
                                            <div className="d-flex align-items-center mb-2">
                                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-info"
                                                    fill="currentColor">
                                                    <path
                                                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                                </svg>
                                                <small className="text-muted">2-year warranty included</small>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <svg width="16" height="16" viewBox="0 0 24 24"
                                                    className="me-2 text-warning" fill="currentColor">
                                                    <path
                                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                                <small className="text-muted">30-day return policy</small>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-center mb-2">
                                                <svg width="16" height="16" viewBox="0 0 24 24"
                                                    className="me-2 text-primary" fill="currentColor">
                                                    <path
                                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                                <small className="text-muted">Premium build quality</small>
                                            </div>
                                            <div className="d-flex align-items-center mb-2">
                                                <svg width="16" height="16" viewBox="0 0 24 24"
                                                    className="me-2 text-success" fill="currentColor">
                                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <small className="text-muted">Certified refurbished</small>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-info"
                                                    fill="currentColor">
                                                    <path
                                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <small className="text-muted">24/7 customer support</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Reviews Summary - Compact Version */}
                        <div className="text-start">
                            <div className="store-card outline-card fill-card">
                                <div className="p-3">
                                    <h5 className="tc-6533 fw-bold mb-3 d-flex align-items-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-warning">
                                            <path fill="currentColor"
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        Reviews
                                    </h5>

                                    {/* Compact Rating Summary */}
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <div className="d-flex align-items-center">
                                            <span className="h4 fw-bold text-warning me-2">4.8</span>
                                            <div className="d-flex me-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <svg key={star} width="16" height="16" viewBox="0 0 24 24"
                                                        className="text-warning">
                                                        <path fill="currentColor"
                                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        <small className="text-muted">127 reviews</small>
                                    </div>

                                    {/* Recent Review Preview */}
                                    <div className="border-top pt-3">
                                        <div className="d-flex align-items-start mb-2">
                                            <div
                                                className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-2 flex-shrink-0"
                                                style={{ width: '32px', height: '32px' }}>
                                                <span className="text-primary fw-bold small">SJ</span>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center mb-1">
                                                    <h6 className="mb-0 me-2 small">Sarah Johnson</h6>
                                                    <div className="d-flex">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <svg key={star} width="12" height="12" viewBox="0 0 24 24"
                                                                className="text-warning">
                                                                <path fill="currentColor"
                                                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-muted small mb-0">"Excellent tablet, highly recommended! Great build quality and performance."</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View All Reviews Button */}
                                    <div className="text-center mt-3">
                                        <button className="btn btn-outline-primary btn-sm btn-rd w-100">
                                            View All Reviews
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Reviews Section - Full Width Below */}
                    <div className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                        <div className="store-card outline-card fill-card">
                            <div className="p-4">
                                <h3 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                                    <svg width="24" height="24" viewBox="0 0 24 24" className="me-2 text-warning">
                                        <path fill="currentColor"
                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    Customer Reviews
                                </h3>

                                {/* Overall Rating Summary */}
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <div className="text-center">
                                            <div className="display-4 fw-bold text-warning mb-2">4.8</div>
                                            <div className="d-flex justify-content-center mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <svg key={star} width="20" height="20" viewBox="0 0 24 24"
                                                        className="text-warning me-1">
                                                        <path fill="currentColor"
                                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <p className="text-muted mb-0">Based on 127 reviews</p>
                                        </div>
                                    </div>
                                    <div className="col-md-8">
                                        <div className="rating-breakdown">
                                            {[5, 4, 3, 2, 1].map((rating) => (
                                                <div key={rating} className="d-flex align-items-center mb-2">
                                                    <span className="text-muted me-2">{rating}</span>
                                                    <svg width="16" height="16" viewBox="0 0 24 24"
                                                        className="text-warning me-2">
                                                        <path fill="currentColor"
                                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                    <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                                        <div
                                                            className="progress-bar bg-warning"
                                                            style={{
                                                                width: `${rating === 5 ? 85 : rating === 4 ? 12 : rating === 3 ? 2 : rating === 2 ? 1 : 0}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-muted small">
                                                        {rating === 5 ? 108 : rating === 4 ? 15 : rating === 3 ? 3 : rating === 2 ? 1 : 0}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="divider-h mb-4"></div>

                                {/* Individual Reviews */}
                                <div className="reviews-list">
                                    {[
                                        {
                                            id: 1,
                                            name: "Sarah Johnson",
                                            rating: 5,
                                            date: "2 days ago",
                                            title: "Excellent tablet, highly recommended!",
                                            review: "I've been using this tablet for a month now and I'm extremely satisfied. The build quality is outstanding, the display is crisp and vibrant, and the performance is smooth. The battery life is impressive - I can use it all day without worrying about charging.",
                                            verified: true,
                                            helpful: 12
                                        },
                                        {
                                            id: 2,
                                            name: "Michael Chen",
                                            rating: 5,
                                            date: "1 week ago",
                                            title: "Perfect for work and entertainment",
                                            review: "This tablet has exceeded my expectations. The screen size is perfect for both work presentations and watching movies. The speakers are surprisingly good, and the camera quality is decent for video calls. The design is sleek and modern.",
                                            verified: true,
                                            helpful: 8
                                        },
                                        {
                                            id: 3,
                                            name: "Emily Rodriguez",
                                            rating: 4,
                                            date: "2 weeks ago",
                                            title: "Great value for money",
                                            review: "Overall a great tablet. The performance is solid and the display is beautiful. The only minor issue I have is that it can get a bit warm during intensive use, but it's not a deal-breaker. Would definitely recommend to others.",
                                            verified: true,
                                            helpful: 5
                                        },
                                        {
                                            id: 4,
                                            name: "David Thompson",
                                            rating: 5,
                                            date: "3 weeks ago",
                                            title: "Amazing build quality and performance",
                                            review: "I've owned several tablets over the years, and this one stands out. The aluminum body feels premium, the screen is gorgeous, and the battery life is fantastic. The software is smooth and responsive. Worth every penny!",
                                            verified: true,
                                            helpful: 15
                                        },
                                        {
                                            id: 5,
                                            name: "Lisa Wang",
                                            rating: 4,
                                            date: "1 month ago",
                                            title: "Good tablet with minor drawbacks",
                                            review: "This is a solid tablet with great features. The display is excellent and the performance is smooth. However, I wish the storage options were more flexible and the price point was a bit lower. Still, it's a good purchase overall.",
                                            verified: true,
                                            helpful: 3
                                        }
                                    ].map((review) => (
                                        <div key={review.id} className="review-item border-bottom pb-4 mb-4">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="d-flex align-items-center">
                                                    <div
                                                        className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                                                        style={{ width: '40px', height: '40px' }}>
                                                        <span
                                                            className="text-primary fw-bold">{review.name.split(' ').map(n => n[0]).join('')}</span>
                                                    </div>
                                                    <div>
                                                        <div className="d-flex align-items-center mb-1">
                                                            <h6 className="tc-6533 mb-0 me-2">{review.name}</h6>
                                                            {review.verified && (
                                                                <span
                                                                    className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24"
                                                                        className="me-1">
                                                                        <path fill="currentColor"
                                                                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                                    </svg>
                                                                    Verified Purchase
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <div className="d-flex me-2">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <svg key={star} width="16" height="16"
                                                                        viewBox="0 0 24 24"
                                                                        className={star <= review.rating ? 'text-warning' : 'text-muted'}>
                                                                        <path fill="currentColor"
                                                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                            <span className="text-muted small">{review.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <h6 className="tc-6533 fw-semibold mb-2">{review.title}</h6>
                                            <p className="text-muted mb-3">{review.review}</p>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <button className="btn btn-sm btn-outline-secondary me-2">
                                                        <svg width="14" height="14" viewBox="0 0 24 24"
                                                            className="me-1">
                                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                                        </svg>
                                                        Helpful ({review.helpful})
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-secondary">
                                                        <svg width="14" height="14" viewBox="0 0 24 24"
                                                            className="me-1">
                                                            <path fill="currentColor" d="M7 14l5 5 5-5z" />
                                                        </svg>
                                                        Not helpful
                                                    </button>
                                                </div>
                                                <button className="btn btn-sm btn-outline-primary">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                                        <path fill="currentColor"
                                                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                    </svg>
                                                    Report
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Load More Reviews Button */}
                                <div className="text-center mt-4">
                                    <button className="btn btn-outline-primary btn-rd px-4">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        Load More Reviews
                                    </button>
                                </div>

                                <div className="divider-h my-4"></div>

                                {/* Write a Review Section */}
                                <div className="write-review">
                                    <h5 className="tc-6533 fw-bold mb-4">Write a Review</h5>
                                    <form>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Your Name</label>
                                                <input type="text" className="form-control"
                                                    placeholder="Enter your name" />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Email Address</label>
                                                <input type="email" className="form-control"
                                                    placeholder="Enter your email" />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Rating</label>
                                            <div className="rating-input d-flex">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        className="btn btn-link p-1"
                                                        style={{ fontSize: '24px', color: '#ffc107' }}
                                                    >
                                                        <svg width="24" height="24" viewBox="0 0 24 24">
                                                            <path fill="currentColor"
                                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Review Title</label>
                                            <input type="text" className="form-control"
                                                placeholder="Summarize your review" />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Your Review</label>
                                            <textarea
                                                className="form-control"
                                                rows="4"
                                                placeholder="Tell us about your experience with this product..."
                                            ></textarea>
                                        </div>

                                        <div className="form-check mb-3">
                                            <input className="form-check-input" type="checkbox" id="verifiedPurchase" />
                                            <label className="form-check-label" htmlFor="verifiedPurchase">
                                                I confirm this is a verified purchase
                                            </label>
                                        </div>

                                        <button type="submit" className="btn btn-primary btn-rd px-4">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                                <path fill="currentColor"
                                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                            Submit Review
                                        </button>
                                    </form>
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
