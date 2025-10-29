import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProduct, useCart, useWishlist, useAuth } from "../context";
import { LoadingSpinner } from "../components/Common";
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

    // Context hooks
    const {
        currentProduct,
        relatedProducts,
        reviews,
        isLoading: productLoading,
        error: productError,
        loadProduct,
        loadRelatedProducts,
        loadProductReviews,
        addProductReview,
        clearCurrentProduct
    } = useProduct();

    const {
        addToCart,
        isLoading: cartLoading
    } = useCart();

    const {
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        isLoading: wishlistLoading
    } = useWishlist();

    // Local state
    const [selectedColor, setSelectedColor] = useState('silver');
    const [selectedStorage, setSelectedStorage] = useState('128GB');
    const [quantity, setQuantity] = useState(1);
    const [selectedMedia, setSelectedMedia] = useState('main-image');
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Load product data on mount
    useEffect(() => {
        if (id) {
            loadProduct(id);
            loadProductReviews(id);
            loadRelatedProducts(id);
        }

        return () => {
            clearCurrentProduct();
        };
    }, [id]); // Only depend on the product ID

    // Update selected options when product loads
    useEffect(() => {
        if (currentProduct) {
            // Set default color and storage from product variants
            const variants = currentProduct.variants || [];
            const colorVariant = variants.find(v => v.name.toLowerCase().includes('color') || v.name.toLowerCase().includes('colour'));
            const storageVariant = variants.find(v => v.name.toLowerCase().includes('storage') || v.name.toLowerCase().includes('memory'));

            if (colorVariant && colorVariant.options.length > 0) {
                setSelectedColor(colorVariant.options[0]._id || colorVariant.options[0].value);
            }
            if (storageVariant && storageVariant.options.length > 0) {
                setSelectedStorage(storageVariant.options[0]._id || storageVariant.options[0].value);
            }

            // Set default media selection from product images
            if (currentProduct.images && currentProduct.images.length > 0) {
                const primaryImage = currentProduct.images.find(img => img.isPrimary);
                const defaultImage = primaryImage || currentProduct.images[0];
                setSelectedMedia(defaultImage._id || `image-0`);
            } else if (currentProduct.mediaGallery && currentProduct.mediaGallery.length > 0) {
                setSelectedMedia(currentProduct.mediaGallery[0].id);
            }
        }
    }, [currentProduct]);

    // Show loading state
    if (productLoading && !currentProduct) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Show error state
    if (productError && !currentProduct) {
        return (
            <div className="container text-center py-5">
                <div className="alert alert-danger">
                    <h4>Product Not Found</h4>
                    <p>{productError}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/')}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    // If no product data, show not found
    if (!currentProduct) {
        return (
            <div className="container text-center py-5">
                <div className="alert alert-warning">
                    <h4>Product Not Found</h4>
                    <p>The product you're looking for doesn't exist.</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/')}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    // Get product data from context - handle backend structure
    const variants = currentProduct.variants || [];
    const colorVariant = variants.find(v => v.name.toLowerCase().includes('color') || v.name.toLowerCase().includes('colour'));
    const storageVariant = variants.find(v => v.name.toLowerCase().includes('storage') || v.name.toLowerCase().includes('memory'));

    const colorOptions = colorVariant?.options || currentProduct.colors || [];
    const storageOptions = storageVariant?.options || currentProduct.storageOptions || [];
    const mediaGallery = currentProduct.mediaGallery || [];
    const productInWishlist = isInWishlist(currentProduct._id);

    const getCurrentPrice = () => {
        const basePrice = currentProduct.price || 0;

        if (storageOptions.length === 0) return basePrice;

        // Handle backend variant structure
        const selectedStorageOption = storageOptions.find(s =>
            s._id === selectedStorage || s.value === selectedStorage || s.id === selectedStorage
        );

        if (selectedStorageOption) {
            // Backend uses priceModifier, frontend might use price directly
            return basePrice + (selectedStorageOption.priceModifier || 0);
        }

        return basePrice;
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login', {
                state: {
                    from: { pathname: `/product/${id}` },
                    message: 'Please login to add items to your cart'
                }
            });
            return;
        }

        try {
            setIsAddingToCart(true);

            const cartData = {
                productId: currentProduct._id,
                quantity: quantity,
                options: {
                    color: selectedColor,
                    storage: selectedStorage
                }
            };

            await addToCart(cartData.productId, cartData.quantity, cartData.options);
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        await handleAddToCart();
        if (isAuthenticated) {
            navigate('/cart');
        }
    };

    const toggleWishlist = async () => {
        if (!isAuthenticated) {
            navigate('/login', {
                state: {
                    from: { pathname: `/product/${id}` },
                    message: 'Please login to manage your wishlist'
                }
            });
            return;
        }

        try {
            if (productInWishlist) {
                await removeFromWishlist(currentProduct._id);
            } else {
                await addToWishlist(currentProduct._id);
            }
        } catch (error) {
            console.error('Error updating wishlist:', error);
        }
    };

    const handleMediaSelect = (mediaId) => {
        setSelectedMedia(mediaId);
        setIsVideoPlaying(false);
    };

    const handlePreviousMedia = () => {
        // Handle both mediaGallery and product images
        const images = mediaGallery.length > 0
            ? mediaGallery
            : (currentProduct?.images || []).map((img, index) => ({
                id: img._id || `image-${index}`,
                ...img
            }));

        if (images.length === 0) return;

        const currentIndex = images.findIndex(media =>
            media.id === selectedMedia || media._id === selectedMedia
        );
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
        handleMediaSelect(images[previousIndex].id || images[previousIndex]._id);
    };

    const handleNextMedia = () => {
        // Handle both mediaGallery and product images
        const images = mediaGallery.length > 0
            ? mediaGallery
            : (currentProduct?.images || []).map((img, index) => ({
                id: img._id || `image-${index}`,
                ...img
            }));

        if (images.length === 0) return;

        const currentIndex = images.findIndex(media =>
            media.id === selectedMedia || media._id === selectedMedia
        );
        const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
        handleMediaSelect(images[nextIndex].id || images[nextIndex]._id);
    };

    const handleSubmitReview = async (reviewData) => {
        if (!isAuthenticated) {
            navigate('/login', {
                state: {
                    from: { pathname: `/product/${id}` },
                    message: 'Please login to write a review'
                }
            });
            return;
        }

        try {
            const reviewWithVariant = {
                ...reviewData,
                variant: `${selectedColor} - ${selectedStorage}`
            };

            await addProductReview(currentProduct._id, reviewWithVariant);
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    return (
        <section className="bloc l-bloc full-width-bloc" id="bloc-7">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Title */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 mb-4 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        <h1 className="tc-6533 mb-0">{currentProduct.name}</h1>
                        {currentProduct.subtitle && (
                            <p className="tc-6533 opacity-75 mb-0">{currentProduct.subtitle}</p>
                        )}
                    </div>

                    {/* Product Media Gallery */}
                    <div
                        className="text-start offset-lg-1 mb-2 col-lg-6 mb-md-2 mb-lg-0 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        {/* Main Media Display */}
                        <ProductMediaGallery
                            product={currentProduct}
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
                            product={currentProduct}
                            mediaGallery={mediaGallery}
                            selectedMedia={selectedMedia}
                            onMediaSelect={handleMediaSelect}
                            onPreviousMedia={handlePreviousMedia}
                            onNextMedia={handleNextMedia}
                        />

                        {/* Quick Technical Specs */}
                        <TechnicalSpecs
                            product={currentProduct}
                            specifications={currentProduct.specifications}
                        />

                        {/* Key Features */}
                        <KeyFeatures
                            product={currentProduct}
                            features={currentProduct.features}
                        />
                    </div>

                    {/* Right Column - Product Details and Customer Reviews */}
                    <div className="col-lg-4 col-md-10 offset-md-1 offset-lg-0 col-sm-10 offset-sm-1 col-10 offset-1">
                        {/* Product Details */}
                        <div className="text-start mb-4">
                            <div className="store-card outline-card fill-card">
                                <ProductInfo
                                    product={currentProduct}
                                    price={getCurrentPrice()}
                                    originalPrice={currentProduct.originalPrice}
                                    discount={currentProduct.discount}
                                    rating={currentProduct.averageRating}
                                    reviewCount={currentProduct.reviewCount}
                                    inStock={currentProduct.inStock}
                                    stockCount={currentProduct.stockCount}
                                    isInWishlist={productInWishlist}
                                    onToggleWishlist={toggleWishlist}
                                    isWishlistLoading={wishlistLoading}
                                />

                                {currentProduct.description && (
                                    <p>{currentProduct.description}</p>
                                )}

                                {(colorOptions.length > 0 || storageOptions.length > 0) && (
                                    <>
                                        <div className="divider-h"></div>
                                        <ProductOptions
                                            product={currentProduct}
                                            colorOptions={colorOptions}
                                            storageOptions={storageOptions}
                                            selectedColor={selectedColor}
                                            selectedStorage={selectedStorage}
                                            onColorChange={setSelectedColor}
                                            onStorageChange={setSelectedStorage}
                                        />
                                    </>
                                )}

                                <div className="divider-h"></div>

                                <ProductQuantity
                                    product={currentProduct}
                                    quantity={quantity}
                                    onQuantityChange={setQuantity}
                                    maxQuantity={currentProduct.stockCount || currentProduct.stock?.quantity || 10}
                                    inStock={currentProduct.inStock || currentProduct.stock?.quantity > 0}
                                />

                                <ProductActions
                                    product={currentProduct}
                                    totalPrice={getCurrentPrice() * quantity}
                                    onBuyNow={handleBuyNow}
                                    onAddToCart={handleAddToCart}
                                    isAddingToCart={isAddingToCart || cartLoading}
                                    inStock={currentProduct.inStock || currentProduct.stock?.quantity > 0}
                                    isAuthenticated={isAuthenticated}
                                />

                                <ProductIncludes
                                    product={currentProduct}
                                    includes={currentProduct.includes}
                                />
                            </div>
                        </div>

                        {/* Product Highlights */}
                        <ProductHighlights
                            product={currentProduct}
                            highlights={currentProduct.highlights}
                        />
                    </div>

                    {/* Customer Reviews Section - Full Width Below */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                        <ReviewsSection
                            productId={currentProduct._id}
                            reviews={reviews}
                            averageRating={currentProduct.averageRating}
                            totalReviews={currentProduct.reviewCount}
                            showWriteReview={isAuthenticated}
                            onSubmitReview={handleSubmitReview}
                            productInfo={{
                                id: currentProduct._id,
                                name: currentProduct.name,
                                variant: colorOptions.length > 0 || storageOptions.length > 0
                                    ? `${selectedColor} - ${selectedStorage}`
                                    : null,
                                image: currentProduct.images?.[0] || currentProduct.thumbnail
                            }}
                            isLoading={productLoading}
                        />
                    </div>

                    {/* Detailed Specifications Section - Full Width */}
                    {currentProduct.specifications && (
                        <div
                            className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                            <DetailedSpecs
                                product={currentProduct}
                                productName={currentProduct.name}
                                specifications={currentProduct.specifications}
                            />
                        </div>
                    )}

                    {/* Related Products Section */}
                    <div
                        className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-5">
                        <RelatedProducts
                            products={relatedProducts}
                            isLoading={productLoading}
                        />
                    </div>

                    {/* FAQ Section */}
                    {currentProduct.faqs && currentProduct.faqs.length > 0 && (
                        <div
                            className="text-start offset-lg-1 col-lg-10 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1 mt-4">
                            <ProductFAQ
                                faqs={currentProduct.faqs}
                                productName={currentProduct.name}
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Product;