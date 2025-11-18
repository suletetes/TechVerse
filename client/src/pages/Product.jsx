import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useCart, useAuth } from '../context';
import { LoadingSpinner } from '../components/Common';
import Toast from '../components/Common/Toast';
import wishlistService from '../api/services/wishlistService';
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
    const { id } = useParams();
    const navigate = useNavigate();
    
    const { isAuthenticated } = useAuth();
    const { addToCart, isLoading: cartLoading } = useCart();
    const {
        currentProduct,
        isLoading,
        error,
        loadProduct,
        clearCurrentProduct
    } = useProduct();

    const [selectedColor, setSelectedColor] = useState('silver');
    const [selectedStorage, setSelectedStorage] = useState('128GB');
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedMedia, setSelectedMedia] = useState('main-image');
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Memoized options based on product data from database
    const colorOptions = useMemo(() => {
        if (currentProduct?.brand === 'Apple') {
            return [
                { id: 'silver', name: 'Silver', class: 'silver-dot' },
                { id: 'space-gray', name: 'Space Gray', class: 'space-gray-dot' },
                { id: 'gold', name: 'Gold', class: 'gold-dot' }
            ];
        } else if (currentProduct?.brand === 'Samsung') {
            return [
                { id: 'phantom-black', name: 'Phantom Black', class: 'black-dot' },
                { id: 'phantom-silver', name: 'Phantom Silver', class: 'silver-dot' }
            ];
        }
        return [
            { id: 'silver', name: 'Silver', class: 'silver-dot' },
            { id: 'blue', name: 'Blue', class: 'blue-dot' },
            { id: 'white', name: 'White', class: 'white-dot' },
            { id: 'black', name: 'Black', class: '' },
            { id: 'red', name: 'Red', class: 'red-dot' },
            { id: 'green', name: 'Green', class: 'green-dot' }
        ];
    }, [currentProduct?.brand]);

    const storageOptions = useMemo(() => {
        if (currentProduct?.category?.name?.includes('Smartphones') || currentProduct?.category?.name?.includes('Tablets')) {
            return [
                { id: '128GB', name: '128GB', price: currentProduct?.price || 0 },
                { id: '256GB', name: '256GB', price: (currentProduct?.price || 0) + 100 },
                { id: '512GB', name: '512GB', price: (currentProduct?.price || 0) + 200 }
            ];
        }
        return [
            { id: '128GB', name: '128GB', price: currentProduct?.price || 1999 },
            { id: '256GB', name: '256GB', price: (currentProduct?.price || 1999) + 100 },
            { id: '512GB', name: '512GB', price: (currentProduct?.price || 1999) + 200 }
        ];
    }, [currentProduct?.category?.name, currentProduct?.price]);

    // Media gallery from database with fallback
    const mediaGallery = useMemo(() => {
        if (currentProduct?.images && currentProduct.images.length > 0) {
            return currentProduct.images.map((image, index) => ({
                id: image._id || image.id || `image-${index}`,
                type: 'image',
                src: image.url,
                webp: image.webp || image.url,
                thumbnail: image.thumbnail || image.url,
                alt: image.alt || `${currentProduct.name} - View ${index + 1}`,
                title: image.title || `View ${index + 1}`,
                isPrimary: image.isPrimary || index === 0
            }));
        }
        
        // Fallback media gallery with working placeholder images
        return [
            {
                id: 'main-image',
                type: 'image',
                src: 'https://picsum.photos/800/600?random=1',
                webp: 'https://picsum.photos/800/600?random=1',
                thumbnail: 'https://picsum.photos/200/150?random=1',
                alt: `${currentProduct?.name || 'Product'} - Main View`,
                title: 'Main View',
                isPrimary: true
            }
        ];
    }, [currentProduct?.images, currentProduct?.name]);

    // Memoized price calculation
    const getCurrentPrice = useMemo(() => {
        const storage = storageOptions.find(s => s.id === selectedStorage);
        return storage ? storage.price : (currentProduct?.price || 1999);
    }, [selectedStorage, storageOptions, currentProduct?.price]);

    // Helper function to format specification categories
    const formatSpecificationCategories = useMemo(() => {
        if (!currentProduct?.specifications || currentProduct.specifications.length === 0) return {};
        
        return currentProduct.specifications.reduce((acc, spec) => {
            // Get category name - it might already be formatted or need formatting
            let categoryName = spec.category || 'General';
            
            // If category is already formatted (contains spaces or &), use it as is
            // Otherwise, map common lowercase categories to formatted versions
            if (!categoryName.includes(' ') && !categoryName.includes('&')) {
                const categoryMap = {
                    'display': 'Display & Design',
                    'performance': 'Performance',
                    'camera': 'Camera & Audio',
                    'audio': 'Camera & Audio',
                    'connectivity': 'Connectivity & Accessories',
                    'battery': 'Battery & Power',
                    'power': 'Battery & Power',
                    'general': 'General',
                    'processor': 'Performance',
                    'memory': 'Performance',
                    'storage': 'Performance'
                };
                
                categoryName = categoryMap[categoryName.toLowerCase()] || 
                              categoryName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            
            if (!acc[categoryName]) acc[categoryName] = [];
            acc[categoryName].push({
                label: spec.name,
                value: spec.value,
                highlight: spec.category?.toLowerCase().includes('performance') || 
                          spec.category?.toLowerCase().includes('display')
            });
            return acc;
        }, {});
    }, [currentProduct?.specifications]);

    const handleAddToCart = useCallback(async () => {
        if (!currentProduct) return;
        
        // Check authentication
        if (!isAuthenticated) {
            navigate('/login', { 
                state: { 
                    from: { pathname: `/product/${id}` },
                    message: 'Please login to add items to your cart'
                }
            });
            return;
        }
        
        // Check if product is in stock
        if (currentProduct.stock?.quantity === 0) {
            setToast({
                message: 'Sorry, this product is currently out of stock.',
                type: 'warning'
            });
            return;
        }

        try {
            // CartContext.addToCart expects (productId, quantity, variants)
            // where variants is an array or options object
            const options = {
                color: selectedColor,
                storage: selectedStorage
            };

            console.log('Adding to cart:', {
                productId: currentProduct._id,
                quantity,
                options
            });
            
            const result = await addToCart(currentProduct._id, quantity, options);
            console.log('Cart add result:', result);
            
            // Show success toast with action
            const toastMessage = `${currentProduct.name} added to cart!`;
            console.log('Setting toast:', toastMessage);
            setToast({
                message: toastMessage,
                type: 'success',
                action: {
                    label: 'View Cart',
                    path: '/cart'
                }
            });
            
            // Optional: Show browser notification as backup
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Added to Cart', {
                    body: `${currentProduct.name} has been added to your cart`,
                    icon: currentProduct.images?.[0]?.url
                });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            setToast({
                message: 'Failed to add product to cart. Please try again.',
                type: 'error'
            });
        }
    }, [currentProduct, selectedColor, selectedStorage, quantity, isAuthenticated, addToCart, navigate, id]);

    const handleBuyNow = useCallback(async () => {
        if (!currentProduct) return;
        
        // Check authentication
        if (!isAuthenticated) {
            navigate('/login', { 
                state: { 
                    from: { pathname: `/product/${id}` },
                    message: 'Please login to purchase'
                }
            });
            return;
        }
        
        // Check if product is in stock
        if (currentProduct.stock?.quantity === 0) {
            setToast({
                message: 'Sorry, this product is currently out of stock.',
                type: 'warning'
            });
            return;
        }

        try {
            // Add to cart first
            const options = {
                color: selectedColor,
                storage: selectedStorage
            };

            await addToCart(currentProduct._id, quantity, options);
            
            // Redirect to checkout
            navigate('/payment');
        } catch (error) {
            console.error('Error processing buy now:', error);
            setToast({
                message: 'Failed to process your request. Please try again.',
                type: 'error'
            });
        }
    }, [currentProduct, selectedColor, selectedStorage, quantity, isAuthenticated, addToCart, navigate, id]);

    const toggleWishlist = useCallback(async () => {
        if (!currentProduct) return;
        
        // Check authentication
        if (!isAuthenticated) {
            navigate('/login', { 
                state: { 
                    from: { pathname: `/product/${id}` },
                    message: 'Please login to add items to your wishlist'
                }
            });
            return;
        }

        try {
            setWishlistLoading(true);
            
            if (isInWishlist) {
                // Remove from wishlist
                await wishlistService.removeFromWishlist(currentProduct._id);
                setIsInWishlist(false);
                setToast({
                    message: `${currentProduct.name} removed from wishlist`,
                    type: 'info'
                });
            } else {
                // Add to wishlist with selected options
                const selectedOptions = {
                    color: selectedColor,
                    storage: selectedStorage
                };
                await wishlistService.addToWishlist(currentProduct._id, '', selectedOptions);
                setIsInWishlist(true);
                setToast({
                    message: `${currentProduct.name} added to wishlist!`,
                    type: 'success',
                    action: {
                        label: 'View Wishlist',
                        path: '/wishlist'
                    }
                });
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            // Handle 409 conflict (already in wishlist)
            if (error.response?.status === 409) {
                setIsInWishlist(true);
                setToast({
                    message: 'Product is already in your wishlist',
                    type: 'info'
                });
            } else {
                setToast({
                    message: 'Failed to update wishlist. Please try again.',
                    type: 'error'
                });
            }
        } finally {
            setWishlistLoading(false);
        }
    }, [currentProduct, isInWishlist, isAuthenticated, navigate, id]);

    const handleMediaSelect = useCallback((mediaId) => {
        setSelectedMedia(mediaId);
        setIsVideoPlaying(false);
    }, []);

    const handlePreviousMedia = useCallback(() => {
        const currentIndex = mediaGallery.findIndex(media => media.id === selectedMedia);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : mediaGallery.length - 1;
        handleMediaSelect(mediaGallery[previousIndex].id);
    }, [mediaGallery, selectedMedia, handleMediaSelect]);

    const handleNextMedia = useCallback(() => {
        const currentIndex = mediaGallery.findIndex(media => media.id === selectedMedia);
        const nextIndex = currentIndex < mediaGallery.length - 1 ? currentIndex + 1 : 0;
        handleMediaSelect(mediaGallery[nextIndex].id);
    }, [mediaGallery, selectedMedia, handleMediaSelect]);

    // Load product on mount (supports both ID and slug)
    useEffect(() => {
        if (id) {
            loadProduct(id);
        }
        
        return () => {
            clearCurrentProduct();
        };
    }, [id, loadProduct, clearCurrentProduct]);

    // Load product reviews
    useEffect(() => {
        const fetchReviews = async () => {
            if (!currentProduct?._id) return;
            
            setReviewsLoading(true);
            try {
                // Direct fetch to bypass caching issues
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const url = `${apiUrl}/products/${currentProduct._id}/reviews?page=1&limit=10&sort=newest`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data?.data?.reviews) {
                    setReviews(data.data.reviews);
                } else if (Array.isArray(data?.data)) {
                    setReviews(data.data);
                } else {
                    setReviews([]);
                }
            } catch (error) {
                setReviews([]);
            } finally {
                setReviewsLoading(false);
            }
        };

        fetchReviews();
    }, [currentProduct?._id]);

    // Initialize variants from product data
    useEffect(() => {
        if (currentProduct) {
            // Set default color and storage based on product type
            if (currentProduct.brand === 'Apple') {
                setSelectedColor('silver');
            } else if (currentProduct.brand === 'Samsung') {
                setSelectedColor('phantom-black');
            }
            
            if (currentProduct.category?.name?.includes('Smartphones') || currentProduct.category?.name?.includes('Tablets')) {
                setSelectedStorage('128GB');
            }
        }
    }, [currentProduct]);

    // Initialize selected media when gallery changes
    useEffect(() => {
        if (mediaGallery && mediaGallery.length > 0) {
            setSelectedMedia(mediaGallery[0].id);
        }
    }, [mediaGallery]);

    // Check if product is in wishlist
    useEffect(() => {
        const checkWishlistStatus = async () => {
            if (!currentProduct?._id || !isAuthenticated) {
                setIsInWishlist(false);
                return;
            }

            try {
                const response = await wishlistService.checkWishlistStatus(currentProduct._id);
                setIsInWishlist(response.data?.isInWishlist || false);
            } catch (error) {
                console.error('Error checking wishlist status:', error);
                setIsInWishlist(false);
            }
        };

        checkWishlistStatus();
    }, [currentProduct?._id, isAuthenticated]);



    // Loading state
    if (isLoading && !currentProduct) {
        return (
            <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="product-loading">
                <div className="container bloc-md-sm bloc-md bloc-lg-md">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <LoadingSpinner size="lg" />
                        <div className="ms-3">
                            <p className="tc-6533">Loading product {id}...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="product-error">
                <div className="container bloc-md-sm bloc-md bloc-lg-md">
                    <div className="text-center py-5">
                        <div className="alert alert-danger">
                            <h4>Error Loading Product</h4>
                            <p>{error}</p>
                            <div className="mt-3">
                                <button
                                    className="btn btn-primary me-2"
                                    onClick={() => loadProduct(id)}
                                >
                                    Try Again
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/products')}
                                >
                                    Browse Products
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Product not found
    if (!currentProduct && !isLoading) {
        return (
            <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="product-not-found">
                <div className="container bloc-md-sm bloc-md bloc-lg-md">
                    <div className="text-center py-5">
                        <div className="tc-6533">
                            <i className="fa fa-search fa-3x mb-3 opacity-50"></i>
                            <h4>Product Not Found</h4>
                            <p>The product you're looking for doesn't exist or has been removed.</p>
                            <button
                                className="btn btn-c-2101 btn-rd"
                                onClick={() => navigate('/products')}
                            >
                                Browse Products
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const product = currentProduct;

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
        setToast({
            message: `Thank you for your ${reviewData.rating}-star review of the Tablet Air!`,
            type: 'success'
        });
    };

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    action={toast.action}
                    onClose={() => setToast(null)}
                />
            )}
            <section className="bloc l-bloc full-width-bloc" id="bloc-7">
                <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Category Navigation Pane - Full Width
                    <div className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mb-4">
                        <ProductCategoryPane 
                            category={product?.category || 'Products'}
                            subcategory={typeof product?.category === 'object' ? product.category.name : product?.category || 'All Products'}
                            breadcrumbs={[
                                { name: 'Home', path: '/' },
                                { name: 'Products', path: '/products' },
                                ...(product?.category ? [{ 
                                    name: typeof product.category === 'object' ? product.category.name : product.category, 
                                    path: `/products?category=${typeof product.category === 'object' ? product.category.slug : product.category}` 
                                }] : []),
                                { name: product?.name || 'Product', path: `/product/${id}` }
                            ]}
                            relatedCategories={[
                                { name: 'Similar Products', path: `/products?category=${typeof product?.category === 'object' ? product.category.slug : product?.category}`, count: 12 },
                                { name: 'Same Brand', path: `/products?brand=${product?.brand}`, count: 8 },
                                { name: 'Price Range', path: `/products?minPrice=${Math.floor((product?.price || 0) * 0.8)}&maxPrice=${Math.ceil((product?.price || 0) * 1.2)}`, count: 15 }
                            ]}
                        />
                    </div>
                  */}
                  
                    {/* Title */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 mb-4 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        <h1 className="tc-6533 mb-0">{product?.name || 'Product'}</h1>
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
                        <TechnicalSpecs 
                            specifications={product?.specifications?.slice(0, 4) || []}
                        />

                        {/* Key Features */}
                        <KeyFeatures 
                            features={product?.features || 
                                // Generate features from specifications if no explicit features
                                product?.specifications?.slice(0, 4).map(spec => `${spec.name}: ${spec.value}`) || 
                                ['High-quality product', 'Premium materials', 'Advanced technology', 'Excellent performance']
                            }
                        />
                    </div>

                    {/* Right Column - Product Details and Customer Reviews */}
                    <div className="col-lg-4 col-md-10 offset-md-1 offset-lg-0 col-sm-10 offset-sm-1 col-10 offset-1">
                        {/* Product Details */}
                        <div className="text-start mb-4">
                            <div className="store-card outline-card fill-card">
                                <ProductInfo
                                    product={product}
                                    price={getCurrentPrice}
                                    originalPrice={product?.compareAtPrice}
                                    rating={product?.rating?.average}
                                    reviewCount={product?.rating?.count}
                                    inStock={product?.stock?.quantity > 0}
                                    stockCount={product?.stock?.quantity}
                                    isInWishlist={isInWishlist}
                                    onToggleWishlist={toggleWishlist}
                                    wishlistLoading={wishlistLoading}
                                />
                                <p>
                                    {product?.description || product?.shortDescription || 'Product description goes here...'}
                                </p>

                                <div className="divider-h"></div>

                                <ProductOptions
                                    product={product}
                                    colorOptions={colorOptions}
                                    storageOptions={storageOptions}
                                    selectedColor={selectedColor}
                                    selectedStorage={selectedStorage}
                                    onColorChange={setSelectedColor}
                                    onStorageChange={setSelectedStorage}
                                />

                                <div className="divider-h"></div>

                                <ProductQuantity
                                    product={product}
                                    quantity={quantity}
                                    onQuantityChange={setQuantity}
                                    inStock={product?.stock?.quantity > 0}
                                    maxQuantity={product?.stock?.quantity}
                                />

                                <ProductActions
                                    product={product}
                                    totalPrice={getCurrentPrice * quantity}
                                    inStock={product?.stock?.quantity > 0}
                                    onBuyNow={handleBuyNow}
                                    onAddToCart={handleAddToCart}
                                    isLoading={cartLoading}
                                />

                                <ProductIncludes />
                            </div>
                        </div>

                        {/* Product Highlights */}
                        <ProductHighlights />
                    </div>

 {/* Detailed Specifications Section - Full Width */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                        <DetailedSpecs 
                            productName={product?.name || 'Product'}
                            specifications={Object.keys(formatSpecificationCategories).length > 0 ? 
                                formatSpecificationCategories :
                                // Fallback specifications
                                {
                                    "General": [
                                        { label: 'Brand', value: product?.brand || 'Unknown', highlight: true },
                                        { label: 'Price', value: `£${product?.price || 0}` },
                                        { label: 'Category', value: typeof product?.category === 'object' ? product.category.name : product?.category || 'Product' }
                                    ]
                                }
                            }
                        />
                    </div>

                    {/* Customer Reviews Section - Full Width Below */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                        {reviewsLoading ? (
                            <div className="text-center py-5">
                                <LoadingSpinner size="md" />
                                <p className="tc-6533 mt-3">Loading reviews...</p>
                            </div>
                        ) : reviews.length > 0 ? (
                            <ReviewsSection 
                                productId={product?._id}
                                reviews={reviews}
                                averageRating={product?.rating?.average || 0}
                                totalReviews={product?.rating?.count || 0}
                                isLoading={false}
                                showWriteReview={false} 
                                onSubmitReview={handleSubmitReview}
                                productInfo={{
                                    id: product?._id || 'product-001',
                                    slug: product?.slug || id,
                                    name: product?.name || 'Product',
                                    variant: `${selectedColor} - ${selectedStorage}`,
                                    image: product?.images?.[0]?.url || '../img/tablet-thumb.jpg'
                                }}
                            />
                        ) : (
                            <div className="store-card outline-card fill-card text-center py-5">
                                <div className="tc-6533">
                                    <i className="fa fa-star-o fa-3x mb-3 opacity-50"></i>
                                    <h4>No Reviews Yet</h4>
                                    <p className="text-muted">Be the first to review this product!</p>
                                    {isAuthenticated && (
                                        <button 
                                            className="btn btn-primary btn-rd mt-3"
                                            onClick={() => navigate(`/product/${id}/review`)}
                                        >
                                            Write a Review
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Related Products Section */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                        <RelatedProducts />
                    </div>

                    {/* FAQ Section 
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-4">
                        <ProductFAQ />
                    </div>
                    */}
                </div>
            </div>
        </section>
        </>
    );
};

export default Product;