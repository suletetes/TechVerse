import React from 'react';

const ProductMediaGallery = ({
    mediaGallery,
    selectedMedia,
    isVideoPlaying,
    onMediaSelect,
    onVideoToggle,
    onPreviousMedia,
    onNextMedia
}) => {
    const getCurrentMedia = () => {
        return mediaGallery.find(media => media.id === selectedMedia) || mediaGallery[0];
    };

    return (
        <div className="store-card outline-card fill-card mb-3 position-relative">
            {getCurrentMedia().type === 'image' ? (
                <picture>
                    <source
                        type="image/webp"
                        srcSet="/img/lazyload-ph.png"
                        data-srcset={getCurrentMedia().webp}
                    />
                    <img
                        src="/img/lazyload-ph.png"
                        data-src={getCurrentMedia().src}
                        className="img-fluid mx-auto d-block img-rd-lg img-fluid-up lazyload"
                        alt={getCurrentMedia().alt}
                        width="1014"
                        height="1014"
                    />
                </picture>
            ) : (
                <div className="position-relative">
                    {!isVideoPlaying ? (
                        <div className="position-relative">
                            <img
                                src={getCurrentMedia().poster}
                                className="img-fluid mx-auto d-block img-rd-lg"
                                alt={getCurrentMedia().alt}
                                width="1014"
                                height="1014"
                            />
                            <div className="position-absolute top-50 start-50 translate-middle">
                                <button
                                    className="btn btn-primary btn-lg rounded-circle shadow-lg"
                                    onClick={() => onVideoToggle(true)}
                                    style={{width: '80px', height: '80px'}}
                                >
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-3">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="fw-medium">{getCurrentMedia().title}</span>
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
                                poster={getCurrentMedia().poster}
                            >
                                <source src={getCurrentMedia().src} type="video/mp4"/>
                                Your browser does not support the video tag.
                            </video>
                            <button
                                className="btn btn-sm btn-outline-light position-absolute top-0 end-0 m-3"
                                onClick={() => onVideoToggle(false)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Arrows */}
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
                    {mediaGallery.findIndex(media => media.id === selectedMedia) + 1} / {mediaGallery.length}
                </span>
            </div>
        </div>
    );
};

export default ProductMediaGallery;