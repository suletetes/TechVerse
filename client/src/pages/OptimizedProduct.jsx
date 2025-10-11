import { memo, useState, useCallback, useMemo, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDebounce, usePerformanceMonitor } from '../hooks/usePerformance.js';
import LazyImage from '../components/Common/LazyImage.jsx';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary.jsx';

// Lazy load heavy components
const ProductMediaGallery = lazy(() => import('../components/Product/ProductMediaGallery.jsx'));
const ReviewsSection = lazy(() => import('../components/Reviews/ReviewsSection.jsx'));
const RelatedProducts = lazy(() => import('../components/RelatedProducts/RelatedProducts.jsx'));
const DetailedSpecs = lazy(() => import('../components/ProductSpecs/DetailedSpecs.jsx'));

// Memoized components
const ProductInfo = memo(({ product, price, isInWishlist, onToggleWishlist }) => (
  <div className="product-info-section">
    <div className="price-section">
      <span className="current-price">${price.toFixed(2)}</span>
      {product.comparePrice && product.comparePrice > price && (
        <span className="original-price">${product.comparePrice.toFixed(2)}</span>
      )}
    </div>
    
    <div className="rating-section">
      <div className="stars">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`star ${i < Math.floor(product.rating?.average || 0) ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="rating-count">({product.rating?.count || 0} reviews)</span>
    </div>

    <button
      className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
      onClick={onToggleWishlist}
    >
      {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
    </button>
  </div>
));

const ProductOptions = memo(({ 
  colorOptions, 
  storageOptions, 
  selectedColor, 
  selectedStorage, 
  onColorChange, 
  onStorageChange 
}) => (
  <div className="product-options">
    <div className="color-options">
      <h4>Color</h4>
      <div className="option-buttons">
        {colorOptions.map(color => (
          <button
            key={color.id}
            className={`color-option ${selectedColor === color.id ? 'selected' : ''}`}
            onClick={() => onColorChange(color.id)}
            data-color={color.name}
          >
            <span className={`color-dot ${color.class}`}></span>
            {color.name}
          </button>
        ))}
      </div>
    </div>

    <div className="storage-options">
      <h4>Storage</h4>
      <div className="option-buttons">
        {storageOptions.map(storage => (
          <button
            key={storage.id}
            className={`storage-option ${selectedStorage === storage.id ? 'selected' : ''}`}
            onClick={() => onStorageChange(storage.id)}
          >
            {storage.name}
            <span className="price-diff">
              {storage.price > storageOptions[0].price && 
                `+$${(storage.price - storageOptions[0].price).toFixed(2)}`
              }
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
));

const ProductActions = memo(({ 
  quantity, 
  onQuantityChange, 
  onAddToCart, 
  onBuyNow, 
  totalPrice,
  isOutOfStock 
}) => (
  <div className="product-actions">
    <div className="quantity-selector">
      <label>Quantity:</label>
      <div className="quantity-controls">
        <button 
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
        >
          -
        </button>
        <input 
          type="number" 
          value={quantity} 
          onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
        />
        <button onClick={() => onQuantityChange(quantity + 1)}>
          +
        </button>
      </div>
    </div>

    <div className="action-buttons">
      <button 
        className="btn-add-to-cart"
        onClick={onAddToCart}
        disabled={isOutOfStock}
      >
        {isOutOfStock ? 'Out of Stock' : `Add to Cart - $${totalPrice.toFixed(2)}`}
      </button>
      
      <button 
        className="btn-buy-now"
        onClick={onBuyNow}
        disabled={isOutOfStock}
      >
        Buy Now
      </button>
    </div>
  </div>
));

const OptimizedProduct = () => {
  const { id } = useParams();
  const { metrics, logPerformance } = usePerformanceMonitor();
  
  // State management
  const [selectedColor, setSelectedColor] = useState('silver');
  const [selectedStorage, setSelectedStorage] = useState('128GB');
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState('main-image');

  // Debounced search for related products
  const debouncedColor = useDebounce(selectedColor, 300);
  const debouncedStorage = useDebounce(selectedStorage, 300);

  // Fetch product data with React Query for caching
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoized options
  const colorOptions = useMemo(() => [
    { id: 'silver', name: 'Silver', class: 'silver-dot' },
    { id: 'blue', name: 'Blue', class: 'blue-dot' },
    { id: 'white', name: 'White', class: 'white-dot' },
    { id: 'black', name: 'Black', class: '' },
    { id: 'red', name: 'Red', class: 'red-dot' },
    { id: 'green', name: 'Green', class: 'green-dot' }
  ], []);

  const storageOptions = useMemo(() => [
    { id: '128GB', name: '128GB', price: 1999 },
    { id: '256GB', name: '256GB', price: 2099 },
    { id: '512GB', name: '512GB', price: 2199 }
  ], []);

  // Memoized calculations
  const currentPrice = useMemo(() => {
    const storage = storageOptions.find(s => s.id === selectedStorage);
    return storage ? storage.price : 1999;
  }, [selectedStorage, storageOptions]);

  const totalPrice = useMemo(() => {
    return currentPrice * quantity;
  }, [currentPrice, quantity]);

  const isOutOfStock = useMemo(() => {
    return product?.stock?.quantity === 0;
  }, [product?.stock?.quantity]);

  // Optimized event handlers
  const handleAddToCart = useCallback(() => {
    const cartItem = {
      product: product?.name || 'Tablet Air',
      color: selectedColor,
      storage: selectedStorage,
      quantity: quantity,
      price: currentPrice
    };
    
    console.log('Added to cart:', cartItem);
    // Add to cart logic here
  }, [product, selectedColor, selectedStorage, quantity, currentPrice]);

  const handleBuyNow = useCallback(() => {
    handleAddToCart();
    // Redirect to checkout
  }, [handleAddToCart]);

  const handleToggleWishlist = useCallback(() => {
    setIsInWishlist(prev => !prev);
  }, []);

  const handleMediaSelect = useCallback((mediaId) => {
    setSelectedMedia(mediaId);
  }, []);

  // Performance logging in development
  if (process.env.NODE_ENV === 'development') {
    logPerformance('OptimizedProduct');
  }

  if (isLoading) {
    return (
      <div className="product-loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-error">
        <h2>Product not found</h2>
        <p>The product you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <section className="optimized-product-page">
        <div className="container">
          <div className="product-layout">
            {/* Product Images */}
            <div className="product-media-section">
              <Suspense fallback={<LoadingSpinner />}>
                <ProductMediaGallery
                  selectedMedia={selectedMedia}
                  onMediaSelect={handleMediaSelect}
                />
              </Suspense>
            </div>

            {/* Product Details */}
            <div className="product-details-section">
              <h1 className="product-title">{product?.name || 'Tablet Air'}</h1>
              
              <ProductInfo
                product={product || {}}
                price={currentPrice}
                isInWishlist={isInWishlist}
                onToggleWishlist={handleToggleWishlist}
              />

              <div className="product-description">
                <p>{product?.description || 'Product description goes here...'}</p>
              </div>

              <ProductOptions
                colorOptions={colorOptions}
                storageOptions={storageOptions}
                selectedColor={selectedColor}
                selectedStorage={selectedStorage}
                onColorChange={setSelectedColor}
                onStorageChange={setSelectedStorage}
              />

              <ProductActions
                quantity={quantity}
                onQuantityChange={setQuantity}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                totalPrice={totalPrice}
                isOutOfStock={isOutOfStock}
              />
            </div>
          </div>

          {/* Lazy loaded sections */}
          <div className="product-additional-sections">
            <Suspense fallback={<div className="section-loading">Loading reviews...</div>}>
              <ReviewsSection 
                productId={product?._id}
                showWriteReview={true}
              />
            </Suspense>

            <Suspense fallback={<div className="section-loading">Loading specifications...</div>}>
              <DetailedSpecs 
                productName={product?.name || 'Tablet Air'}
                specifications={product?.specifications || {}}
              />
            </Suspense>

            <Suspense fallback={<div className="section-loading">Loading related products...</div>}>
              <RelatedProducts 
                categoryId={product?.category}
                currentProductId={product?._id}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </ErrorBoundary>
  );
};

export default memo(OptimizedProduct);