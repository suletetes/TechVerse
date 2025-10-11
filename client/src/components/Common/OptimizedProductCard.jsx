import { memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import LazyImage from './LazyImage.jsx';
import { useOptimizedEventHandler } from '../../hooks/usePerformance.js';

const OptimizedProductCard = memo(({
  product,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  showQuickView = true,
  showCompare = true,
  className = '',
  imageSize = 'medium'
}) => {
  // Memoized calculations
  const discountPercentage = useMemo(() => {
    if (product.comparePrice && product.comparePrice > product.price) {
      return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
    }
    return 0;
  }, [product.price, product.comparePrice]);

  const isOnSale = useMemo(() => discountPercentage > 0, [discountPercentage]);

  const stockStatus = useMemo(() => {
    if (!product.stock?.trackQuantity) return 'in_stock';
    if (product.stock.quantity === 0) return 'out_of_stock';
    if (product.stock.quantity <= product.stock.lowStockThreshold) return 'low_stock';
    return 'in_stock';
  }, [product.stock]);

  const imageConfig = useMemo(() => {
    const configs = {
      small: { width: 200, height: 200 },
      medium: { width: 300, height: 300 },
      large: { width: 400, height: 400 }
    };
    return configs[imageSize] || configs.medium;
  }, [imageSize]);

  // Optimized event handlers
  const handleAddToCart = useOptimizedEventHandler((e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  }, [onAddToCart, product]);

  const handleToggleWishlist = useOptimizedEventHandler((e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.(product);
  }, [onToggleWishlist, product]);

  const handleQuickView = useOptimizedEventHandler((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Quick view logic
  }, [product]);

  // Render rating stars
  const renderRating = useCallback(() => {
    const rating = product.rating?.average || 0;
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : 'empty'}`}
        >
          ★
        </span>
      );
    }
    
    return (
      <div className="rating">
        {stars}
        <span className="rating-count">({product.rating?.count || 0})</span>
      </div>
    );
  }, [product.rating]);

  return (
    <div className={`product-card optimized ${className}`}>
      <div className="product-card-inner">
        {/* Image Container */}
        <div className="product-image-container">
          <Link to={`/product/${product.slug || product._id}`}>
            <LazyImage
              src={product.primaryImage?.url || product.images?.[0]?.url}
              webpSrc={product.primaryImage?.webp || product.images?.[0]?.webp}
              alt={product.name}
              width={imageConfig.width}
              height={imageConfig.height}
              className="product-image"
              sizes={`(max-width: 768px) 50vw, (max-width: 1200px) 33vw, ${imageConfig.width}px`}
            />
          </Link>

          {/* Badges */}
          <div className="product-badges">
            {isOnSale && (
              <span className="badge sale-badge">
                -{discountPercentage}%
              </span>
            )}
            {product.featured && (
              <span className="badge featured-badge">
                Featured
              </span>
            )}
            {stockStatus === 'low_stock' && (
              <span className="badge stock-badge">
                Low Stock
              </span>
            )}
            {stockStatus === 'out_of_stock' && (
              <span className="badge out-of-stock-badge">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button
              className={`btn-icon wishlist ${isInWishlist ? 'active' : ''}`}
              onClick={handleToggleWishlist}
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill={isInWishlist ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                />
              </svg>
            </button>

            {showQuickView && (
              <button
                className="btn-icon quick-view"
                onClick={handleQuickView}
                title="Quick view"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            )}

            {showCompare && (
              <button
                className="btn-icon compare"
                title="Add to compare"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M9 19c-5 0-8-3-8-8s3-8 8-8 8 3 8 8-3 8-8 8z"
                  />
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M15 5c5 0 8 3 8 8s-3 8-8 8"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-brand">{product.brand}</div>
          
          <h3 className="product-name">
            <Link to={`/product/${product.slug || product._id}`}>
              {product.name}
            </Link>
          </h3>

          {renderRating()}

          <div className="product-price">
            <span className="current-price">
              ${product.price.toFixed(2)}
            </span>
            {isOnSale && (
              <span className="original-price">
                ${product.comparePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            className={`btn-add-to-cart ${stockStatus === 'out_of_stock' ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={stockStatus === 'out_of_stock'}
          >
            {stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
});

OptimizedProductCard.displayName = 'OptimizedProductCard';

export default OptimizedProductCard;