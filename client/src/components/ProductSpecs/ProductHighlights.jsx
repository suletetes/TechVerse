import React from 'react';

const ProductHighlights = ({ product, highlights }) => {
    // Handle backend highlights data
    const backendHighlights = highlights || product?.highlights || [];
    
    // Process backend highlights or use defaults
    const processedHighlights = backendHighlights.length > 0 
        ? backendHighlights.map((highlight, index) => {
            if (typeof highlight === 'string') {
                return {
                    title: highlight,
                    description: null,
                    ...getHighlightStyle(highlight, index)
                };
            }
            return {
                title: highlight.title || highlight.name,
                description: highlight.description,
                ...getHighlightStyle(highlight.title || highlight.name, index)
            };
        })
        : [
            {
                color: '#198754',
                bgColor: 'rgba(25, 135, 84, 0.1)',
                borderColor: 'rgba(25, 135, 84, 0.25)',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#198754" strokeWidth="2.5">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                ),
                title: 'Premium Quality',
                description: 'Built with high-grade materials and precision engineering for lasting durability.'
            },
            {
                color: '#0d6efd',
                bgColor: 'rgba(13, 110, 253, 0.1)',
                borderColor: 'rgba(13, 110, 253, 0.25)',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                    </svg>
                ),
                title: 'Fast Performance',
                description: 'Lightning-fast processing power for smooth multitasking and productivity.'
            },
            {
                color: '#ffc107',
                bgColor: 'rgba(255, 193, 7, 0.1)',
                borderColor: 'rgba(255, 193, 7, 0.25)',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6"/>
                        <path d="M12 3v12"/>
                        <rect x="8" y="21" width="8" height="1"/>
                    </svg>
                ),
                title: 'Award Winning',
                description: 'Recognized by industry experts for innovation and design excellence.'
            },
            {
                color: '#0dcaf0',
                bgColor: 'rgba(13, 202, 240, 0.1)',
                borderColor: 'rgba(13, 202, 240, 0.25)',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0dcaf0" strokeWidth="2.5">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                ),
                title: 'Trusted Brand',
                description: product?.brand ? `From ${product.brand}, a trusted name in technology.` : 'From a company with over 20 years of innovation and customer satisfaction.'
            },
            {
                color: '#198754',
                bgColor: 'rgba(25, 135, 84, 0.1)',
                borderColor: 'rgba(25, 135, 84, 0.25)',
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#198754" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                ),
                title: 'Eco-Friendly',
                description: 'Manufactured using sustainable practices and recyclable materials.'
            }
        ];

    // Helper function to get styling for highlights based on content
    function getHighlightStyle(title, index) {
        const text = title.toLowerCase();
        const colors = [
            { color: '#198754', bgColor: 'rgba(25, 135, 84, 0.1)', borderColor: 'rgba(25, 135, 84, 0.25)' },
            { color: '#0d6efd', bgColor: 'rgba(13, 110, 253, 0.1)', borderColor: 'rgba(13, 110, 253, 0.25)' },
            { color: '#ffc107', bgColor: 'rgba(255, 193, 7, 0.1)', borderColor: 'rgba(255, 193, 7, 0.25)' },
            { color: '#0dcaf0', bgColor: 'rgba(13, 202, 240, 0.1)', borderColor: 'rgba(13, 202, 240, 0.25)' },
            { color: '#dc3545', bgColor: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.25)' }
        ];

        const colorSet = colors[index % colors.length];
        
        const icon = (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colorSet.color} strokeWidth="2.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
        );

        return {
            ...colorSet,
            icon
        };
    }

    // Limit to 5 highlights for better display
    const displayHighlights = processedHighlights.slice(0, 5);

    // Get rating information from product
    const averageRating = product?.rating?.average || 0;
    const reviewCount = product?.rating?.count || 0;

    return (
        <div className="text-start">
            <div className="store-card outline-card fill-card h-100 d-flex flex-column">
                <div className="p-4 flex-grow-1 d-flex flex-column">
                    <h5 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-primary">
                            <path fill="currentColor"
                                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Why Choose This Product
                    </h5>

                    <div className="flex-grow-1 d-flex flex-column justify-content-between">
                        <div className="highlights-list">
                            {displayHighlights.map((highlight, index) => (
                                <div key={`${highlight.title}-${index}`} className={`highlight-item d-flex align-items-start ${index < displayHighlights.length - 1 ? 'mb-4' : 'mb-4'}`}>
                                    <div
                                        className="rounded-3 me-3 flex-shrink-0 border d-flex align-items-center justify-content-center"
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            backgroundColor: highlight.bgColor,
                                            borderColor: highlight.borderColor
                                        }}
                                    >
                                        {highlight.icon}
                                    </div>
                                    <div>
                                        <h6 className="fw-semibold mb-1">{highlight.title}</h6>
                                        {highlight.description && (
                                            <p className="text-muted small mb-0">{highlight.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Customer Rating Section */}
                        <div className="mt-auto pt-3">
                            <div className="bg-light rounded-3 p-3 text-center">
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="text-success me-2">
                                        <path fill="currentColor"
                                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                    <span className="fw-bold text-success">
                                        {averageRating > 0 ? `${averageRating.toFixed(1)}/5 Customer Rating` : 'Highly Rated Product'}
                                    </span>
                                </div>
                                <small className="text-muted">
                                    {reviewCount > 0 ? `Based on ${reviewCount} verified review${reviewCount !== 1 ? 's' : ''}` : 'Trusted by customers worldwide'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductHighlights;