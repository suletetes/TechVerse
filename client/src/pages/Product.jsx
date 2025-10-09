import React, { useState } from "react";
import {
    ProductMediaGallery,
    ProductThumbnails,
    ProductCategoryPane,
    ProductInfo,
    ProductOptions,
    ProductQuantity,
    ProductActions,
    ProductIncludes,
    TechnicalSpecs,
    KeyFeatures,
    ProductHighlights,
    DetailedSpecs,
    ReviewsSection,
    RelatedProducts,
    ProductFAQ
} from "../components"

// Import product-specific CSS enhancements
import '../assets/css/product-enhancements.css';

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

    const handleSubmitReview = (reviewData) => {
        console.log('Review submitted for Tablet Air:', reviewData);
        // Handle review submission logic here
        // You could send this to your backend API
        const reviewWithProduct = {
            ...reviewData,
            productId: 'tablet-air-001',
            productName: 'Tablet Air',
            selectedColor,
            selectedStorage,
            submittedAt: new Date().toISOString()
        };
        console.log('Complete review data:', reviewWithProduct);
        alert(`Thank you for your ${reviewData.rating}-star review of the Tablet Air!`);
    };

    return (
        <section className="bloc l-bloc full-width-bloc" id="bloc-7">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Category Navigation Pane - Full Width */}
                    <div className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mb-4">
                        <ProductCategoryPane 
                            category="Tablets"
                            subcategory="iPad & Tablets"
                            breadcrumbs={[
                                { name: 'Home', path: '/' },
                                { name: 'Electronics', path: '/category/electronics' },
                                { name: 'Tablets', path: '/category/tablets' },
                                { name: 'Tablet Air', path: '/product/tablet-air' }
                            ]}
                            relatedCategories={[
                                { name: 'iPad Pro', path: '/category/tablets/ipad-pro', count: 12 },
                                { name: 'iPad Air', path: '/category/tablets/ipad-air', count: 8 },
                                { name: 'iPad Mini', path: '/category/tablets/ipad-mini', count: 6 },
                                { name: 'Android Tablets', path: '/category/tablets/android', count: 15 },
                                { name: 'Tablet Accessories', path: '/category/tablets/accessories', count: 24 }
                            ]}
                        />
                    </div>

                    {/* Title */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 mb-4 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        <h1 className="tc-6533 mb-0">Tablet Air</h1>
                    </div>

                    {/* Product Media Gallery */}
                    <div
                        className="text-start offset-lg-1 mb-2 col-lg-6 mb-md-2 mb-lg-0 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        {/* Main Media Display */}
                        <ProductMediaGallery
                            mediaGallery={mediaGallery}
                            selectedMedia={selectedMedia}
                            isVideoPlaying={isVideoPlaying}
                            onMediaSelect={handleMediaSelect}
                            onVideoToggle={setIsVideoPlaying}
                            onPreviousMedia={handlePreviousMedia}
                            onNextMedia={handleNextMedia}
                        />

                        {/* Media Thumbnails */}
                        <ProductThumbnails
                            mediaGallery={mediaGallery}
                            selectedMedia={selectedMedia}
                            onMediaSelect={handleMediaSelect}
                            onPreviousMedia={handlePreviousMedia}
                            onNextMedia={handleNextMedia}
                        />

                        {/* Quick Technical Specs */}
                        <TechnicalSpecs />

                        {/* Key Features */}
                        <KeyFeatures />
                    </div>

                    {/* Right Column - Product Details and Customer Reviews */}
                    <div className="col-lg-4 col-md-10 offset-md-1 offset-lg-0 col-sm-10 offset-sm-1 col-10 offset-1">
                        {/* Product Details */}
                        <div className="text-start mb-4">
                            <div className="store-card outline-card fill-card">
                                <ProductInfo
                                    price={getCurrentPrice()}
                                    isInWishlist={isInWishlist}
                                    onToggleWishlist={toggleWishlist}
                                />
                                <p>
                                    Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean
                                    commodo ligula eget dolor. Lorem ipsum dolor sit amet,
                                    consectetuer adipiscing elit.
                                </p>

                                <div className="divider-h"></div>

                                <ProductOptions
                                    colorOptions={colorOptions}
                                    storageOptions={storageOptions}
                                    selectedColor={selectedColor}
                                    selectedStorage={selectedStorage}
                                    onColorChange={setSelectedColor}
                                    onStorageChange={setSelectedStorage}
                                />

                                <div className="divider-h"></div>

                                <ProductQuantity
                                    quantity={quantity}
                                    onQuantityChange={setQuantity}
                                />

                                <ProductActions
                                    totalPrice={getCurrentPrice() * quantity}
                                    onBuyNow={handleBuyNow}
                                    onAddToCart={handleAddToCart}
                                />

                                <ProductIncludes />
                            </div>
                        </div>

                        {/* Product Highlights */}
                        <ProductHighlights />
                    </div>

                    {/* Customer Reviews Section - Full Width Below */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                        <ReviewsSection 
                            showWriteReview={false} 
                            // showHeader={false}
                            // showDividers={false}
                            onSubmitReview={handleSubmitReview}
                            productInfo={{
                                id: 'tablet-air-001',
                                name: 'Tablet Air',
                                variant: `${selectedColor} - ${selectedStorage}`,
                                image: '../img/tablet-thumb.jpg'
                            }}
                        />
                    </div>

                    {/* Detailed Specifications Section - Full Width */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                        <DetailedSpecs 
                            productName="Tablet Air"
                            specifications={{
                                "Display & Design": [
                                    { label: 'Display Size', value: '11-inch Liquid Retina', highlight: true },
                                    { label: 'Resolution', value: '2388 x 1668 pixels at 264 ppi' },
                                    { label: 'Display Technology', value: 'IPS LCD with True Tone' },
                                    { label: 'Brightness', value: '500 nits max brightness' },
                                    { label: 'Color Gamut', value: 'P3 wide color gamut' },
                                    { label: 'Dimensions', value: '247.6 × 178.5 × 6.1 mm' },
                                    { label: 'Weight', value: '466g (Wi-Fi) / 468g (Cellular)' },
                                    { label: 'Colors', value: 'Silver, Blue, Pink, Purple, Starlight' }
                                ],
                                "Performance": [
                                    { label: 'Processor', value: 'Apple M2 chip', highlight: true },
                                    { label: 'CPU', value: '8-core CPU with 4 performance and 4 efficiency cores' },
                                    { label: 'GPU', value: '10-core GPU' },
                                    { label: 'Neural Engine', value: '16-core Neural Engine' },
                                    { label: 'Memory', value: '8GB unified memory' },
                                    { label: 'Storage Options', value: '128GB, 256GB, 512GB, 1TB' }
                                ],
                                "Camera & Audio": [
                                    { label: 'Rear Camera', value: '12MP Wide camera', highlight: true },
                                    { label: 'Front Camera', value: '12MP Ultra Wide front camera' },
                                    { label: 'Video Recording', value: '4K video recording at 24, 25, 30, or 60 fps' },
                                    { label: 'Audio', value: 'Stereo speakers in landscape mode' },
                                    { label: 'Microphones', value: 'Dual microphones for calls and video recording' }
                                ],
                                "Connectivity": [
                                    { label: 'Wi-Fi', value: 'Wi-Fi 6E (802.11ax)', highlight: true },
                                    { label: 'Bluetooth', value: 'Bluetooth 5.3' },
                                    { label: 'Cellular', value: '5G (sub-6 GHz and mmWave) - Cellular models' },
                                    { label: 'Connector', value: 'USB-C with support for Thunderbolt 4' },
                                    { label: 'Location', value: 'GPS, GLONASS, Galileo, QZSS, BeiDou' }
                                ],
                                "Battery & Power": [
                                    { label: 'Battery Life', value: 'Up to 10 hours', highlight: true },
                                    { label: 'Video Playback', value: 'Up to 10 hours of video playback' },
                                    { label: 'Audio Playback', value: 'Up to 9 hours of audio playback' },
                                    { label: 'Charging', value: 'Fast charging with 20W adapter (sold separately)' },
                                    { label: 'Power Adapter', value: '20W USB-C Power Adapter' }
                                ],
                                "Compatibility": [
                                    { label: 'Apple Pencil', value: 'Apple Pencil (2nd generation)', highlight: true },
                                    { label: 'Keyboard', value: 'Magic Keyboard, Smart Keyboard Folio' },
                                    { label: 'Operating System', value: 'iPadOS 17' },
                                    { label: 'Accessibility', value: 'Full range of accessibility features' }
                                ]
                            }}
                        />
                    </div>

                    {/* Related Products Section */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                        <RelatedProducts />
                    </div>

                    {/* FAQ Section */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-4">
                        <ProductFAQ />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Product;