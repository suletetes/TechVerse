import { memo, useState, useCallback } from 'react';
import { useLazyImage } from '../../hooks/usePerformance.js';

const LazyImage = memo(({
  src,
  alt,
  className = '',
  placeholder = '/img/lazyload-ph.png',
  webpSrc,
  sizes,
  width,
  height,
  onLoad,
  onError,
  priority = false,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const { elementRef, imageSrc, isLoaded, isError } = useLazyImage(
    priority ? src : src, // Load immediately if priority
    placeholder
  );

  const handleLoad = useCallback((e) => {
    onLoad?.(e);
  }, [onLoad]);

  const handleError = useCallback((e) => {
    setHasError(true);
    onError?.(e);
  }, [onError]);

  // If there's an error and no fallback, show placeholder
  if (isError || hasError) {
    return (
      <img
        ref={elementRef}
        src={placeholder}
        alt={alt}
        className={`${className} lazy-image-error`}
        width={width}
        height={height}
        {...props}
      />
    );
  }

  return (
    <picture ref={elementRef}>
      {webpSrc && (
        <source
          type="image/webp"
          srcSet={isLoaded ? webpSrc : placeholder}
          sizes={sizes}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoaded ? 'lazy-loaded' : 'lazy-loading'}`}
        width={width}
        height={height}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    </picture>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;