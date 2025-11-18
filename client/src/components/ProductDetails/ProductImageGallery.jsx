import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ProductImageGallery = ({ images = [], productName = '' }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Fallback to placeholder if no images
  const displayImages = images.length > 0 ? images : [
    { 
      url: '/img/placeholder.jpg', 
      alt: `${productName} - Product image`, 
      isPrimary: true,
      width: 800,
      height: 600
    }
  ];

  const selectedImage = displayImages[selectedImageIndex];

  const nextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
        <div className="aspect-square relative">
          <img
            src={selectedImage.url}
            alt={selectedImage.alt}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={toggleZoom}
            loading="lazy"
            width={selectedImage.width || 800}
            height={selectedImage.height || 600}
          />
          
          {/* Zoom Icon */}
          <button
            onClick={toggleZoom}
            className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100"
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
          </button>

          {/* Navigation Arrows (only show if multiple images) */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedImageIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`View ${image.alt}`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
                width={200}
                height={200}
              />
              
              {/* Overlay for non-selected thumbnails */}
              {index !== selectedImageIndex && (
                <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-opacity" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Image Information */}
      <div className="text-sm text-gray-600 space-y-1">
        <p className="font-medium">{selectedImage.alt}</p>
        {selectedImage.type && (
          <p className="capitalize">View: {selectedImage.type.replace('-', ' ')}</p>
        )}
        {displayImages.length > 1 && (
          <p>{displayImages.length} images available</p>
        )}
      </div>

      {/* Keyboard Navigation Hint */}
      {displayImages.length > 1 && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <p className="font-medium mb-1">Navigation:</p>
          <div className="flex flex-wrap gap-4">
            <span>← → Arrow keys to navigate</span>
            <span>Click image to zoom</span>
            <span>Click thumbnails to jump</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Keyboard navigation hook
React.useEffect(() => {
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      prevImage();
    } else if (event.key === 'ArrowRight') {
      nextImage();
    } else if (event.key === 'Escape' && isZoomed) {
      setIsZoomed(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

export default ProductImageGallery;