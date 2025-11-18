import React from 'react';
import PropTypes from 'prop-types';

/**
 * Optimized Image Component
 * Features: lazy loading, responsive images, async decoding
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  srcSet,
  sizes,
  onError,
  style = {},
  ...props
}) => {
  const handleError = (e) => {
    // Fallback to placeholder on error
    e.target.src = '/img/placeholder.jpg';
    if (onError) {
      onError(e);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      decoding={decoding}
      srcSet={srcSet}
      sizes={sizes}
      onError={handleError}
      style={style}
      {...props}
    />
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  loading: PropTypes.oneOf(['lazy', 'eager']),
  decoding: PropTypes.oneOf(['async', 'sync', 'auto']),
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  onError: PropTypes.func,
  style: PropTypes.object
};

/**
 * Generate srcSet for responsive images
 * @param {string} baseUrl - Base image URL
 * @param {array} widths - Array of widths (e.g., [320, 640, 1024])
 * @returns {string} srcSet string
 */
export const generateSrcSet = (baseUrl, widths = [320, 640, 1024, 1920]) => {
  return widths
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
};

/**
 * Generate sizes attribute for responsive images
 * @param {object} breakpoints - Breakpoints object (e.g., { sm: '100vw', md: '50vw', lg: '33vw' })
 * @returns {string} sizes string
 */
export const generateSizes = (breakpoints = {}) => {
  const defaultBreakpoints = {
    sm: '100vw',
    md: '50vw',
    lg: '33vw',
    ...breakpoints
  };

  return Object.entries(defaultBreakpoints)
    .map(([key, value]) => {
      const width = {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px'
      }[key];
      return width ? `(max-width: ${width}) ${value}` : value;
    })
    .join(', ');
};

export default OptimizedImage;
