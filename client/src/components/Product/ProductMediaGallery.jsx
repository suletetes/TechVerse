import React from 'react';

const ProductMediaGallery = ({
    product,
    mediaGallery,
    selectedMedia,
    isVideoPlaying,
    onMediaSelect,
    onVideoToggle,
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
            webp: image.url.replace(/\.(jpg|jpeg|png)$/i, '.webp'), // Attempt webp version
            alt: image.alt || product?.name || 'Product image',
            thumbnail: image.url,
            isPrimary: image.isPrimary || index === 0
        }));
    };

    const processedMedia = processImages();

    const getCurrentMedia = () => {
        if (processedMedia.length === 0) {
            // Return fallback image
            return {
                id: 'fallback',
                type: 'image',
                src: '/img/lazyload-ph.png',
                alt: 'Product image',
                thumbnail: '/img/lazyload-ph.png'
            };
        }
        
        return processedMedia.find(media => media.id === selectedMedia) || processedMedia[0];
    };

    const currentMedia = getCurrentMedia();

    // Handle case where no media is available
    if (processedMedia.length === 0) {
        return (
            <div className="store-card outline-card fill-card mb-3 position-relative">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                    <div className="text-center text-muted">
                        <svg width="64" height="64" viewBox="0 0 24 24" className="mb-3 opacity-50">
                            <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        <p>No images available</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="store-card outline-card fill-card mb-3 position-relative">
            {currentMedia.type === 'image' ? (
                <picture>
                    <source
                        type="image/webp"
                        srcSet="/img/lazyload-ph.png"
                        data-srcset={currentMedia.webp || currentMedia.src}
                    />
                    <img
                        src="/img/lazyload-ph.png"
                        data-src={currentMedia.src}
                        className="img-fluid mx-auto d-block img-rd-lg img-fluid-up lazyload"
                        alt={currentMedia.alt}
                        width="1014"
                        height="1014"
                        onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.target.src = '/img/lazyload-ph.png';
                        }}
                    />
                </picture>
            ) : (
                <div className="position-relative">
                    {!isVideoPlaying ? (
                        <div className="position-relative">
                            <img
                                src={currentMedia.poster || currentMedia.src}
                                className="img-fluid mx-auto d-block img-rd-lg"
                                alt={currentMedia.alt}
                                width="1014"
                                height="1014"
                                onError={(e) => {
                                    e.target.src = '/img/lazyload-ph.png';
                                }}
                            />
                            <div className="position-absolute top-50 start-50 translate-middle">
                                <button
                                    className="btn btn-primary btn-lg rounded-circle shadow-lg"
                                    onClick={() => onVideoToggle && onVideoToggle(true)}
                                    style={{width: '80px', height: '80px'}}
                                >
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-3">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="fw-medium">{currentMedia.title || 'Product Video'}</span>
                                    <span className="badge bg-primary">
                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1" fill="white">
                                            <path d="M8 5v14l11-7z"/>
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
                                poster={currentMedia.poster || currentMedia.src}
                            >
                                <source src={currentMedia.src} type="video/mp4"/>
                                Your browser does not support the video tag.
                            </video>
                            <button
                                className="btn btn-sm btn-outline-light position-absolute top-0 end-0 m-3"
                                onClick={() => onVideoToggle && onVideoToggle(false)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Arrows - Only show if more than one image */}
            {processedMedia.length > 1 && (
                <>
                    <button
                        className="btn btn-light btn-lg position-absolute top-50 start-0 translate-middle-y ms-3 shadow-sm"
                        onClick={onPreviousMedia}
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6"/>
                        </svg>
                    </button>

                    <button
                        className="btn btn-light btn-lg position-absolute top-50 end-0 translate-middle-y me-3 shadow-sm"
                        onClick={onNextMedia}
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,18 15,12 9,6"/>
                        </svg>
                    </button>

                    {/* Media Counter */}
                    <div className="position-absolute bottom-0 end-0 m-3">
                        <span className="badge bg-dark bg-opacity-75 text-white px-3 py-2 rounded-pill">
                            {processedMedia.findIndex(media => media.id === selectedMedia) + 1} / {processedMedia.length}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProductMediaGallery;