import React from 'react';

const ProductThumbnails = ({
    product,
    mediaGallery,
    selectedMedia,
    onMediaSelect,
    onPreviousMedia,
    onNextMedia
}) => {
    // Handle backend image data structure
    const processImages = () => {
        // Use mediaGallery if provided, otherwise use product images
        if (mediaGallery && mediaGallery.length > 0) {
            return mediaGallery;
        }

        // Convert backend product images to media gallery format
        const productImages = product?.images || [];
        return productImages.map((image, index) => ({
            id: image._id || `image-${index}`,
            type: 'image',
            src: image.url,
            alt: image.alt || product?.name || 'Product image',
            thumbnail: image.url,
            isPrimary: image.isPrimary || index === 0
        }));
    };

    const processedMedia = processImages();

    // Don't render if no media available
    if (processedMedia.length === 0) {
        return null;
    }

    // Don't render thumbnails if only one image
    if (processedMedia.length === 1) {
        return null;
    }
    return (
        <div className="store-card outline-card fill-card">
            <div className="p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="tc-6533 fw-bold mb-0 d-flex align-items-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" className="me-2 text-primary">
                            <path fill="currentColor"
                                  d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        Product Gallery
                    </h6>
                    <div className="d-flex gap-1">
                        <button
                            className="btn btn-sm btn-outline-secondary rounded-circle p-1"
                            onClick={onPreviousMedia}
                            style={{width: '32px', height: '32px'}}
                            title="Previous"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15,18 9,12 15,6"/>
                            </svg>
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary rounded-circle p-1"
                            onClick={onNextMedia}
                            style={{width: '32px', height: '32px'}}
                            title="Next"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9,18 15,12 9,6"/>
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
                        {processedMedia.map((media, index) => (
                            <div key={media.id} className="flex-shrink-0" style={{width: '80px'}}>
                                <div
                                    className={`position-relative cursor-pointer rounded-3 overflow-hidden border-2 transition-all ${selectedMedia === media.id ? 'border-primary shadow-sm scale-105' : 'border-light hover:border-secondary'}`}
                                    onClick={() => onMediaSelect(media.id)}
                                    style={{
                                        cursor: 'pointer',
                                        aspectRatio: '1/1',
                                        transform: selectedMedia === media.id ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <img
                                        src={media.thumbnail || media.poster || media.src}
                                        alt={media.alt}
                                        className="img-fluid w-100 h-100"
                                        style={{objectFit: 'cover'}}
                                        onError={(e) => {
                                            // Fallback to placeholder if thumbnail fails to load
                                            e.target.src = '/img/lazyload-ph.png';
                                        }}
                                    />
                                    {media.type === 'video' && (
                                        <div className="position-absolute top-50 start-50 translate-middle">
                                            <div className="bg-dark bg-opacity-75 rounded-circle p-1">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                                    <path d="M8 5v14l11-7z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                    {selectedMedia === media.id && (
                                        <div className="position-absolute top-0 start-0 w-100 h-100 bg-primary bg-opacity-20 d-flex align-items-center justify-content-center">
                                            <div className="bg-primary rounded-circle p-1">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                    <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white px-1">
                                        <small className="fw-medium d-block text-center" style={{fontSize: '0.6rem', lineHeight: '1.2'}}>
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
                            const firstImage = processedMedia.find(m => m.type === 'image');
                            if (firstImage) onMediaSelect(firstImage.id);
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor"
                                  d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        Images ({processedMedia.filter(m => m.type === 'image').length})
                    </button>
                    {processedMedia.some(m => m.type === 'video') && (
                        <button
                            className="btn btn-sm btn-outline-success rounded-pill px-3"
                            onClick={() => {
                                const firstVideo = processedMedia.find(m => m.type === 'video');
                                if (firstVideo) onMediaSelect(firstVideo.id);
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor" d="M8 5v14l11-7z"/>
                            </svg>
                            Videos ({processedMedia.filter(m => m.type === 'video').length})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductThumbnails;