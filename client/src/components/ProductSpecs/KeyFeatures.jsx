import React from 'react';

const KeyFeatures = ({ product, features }) => {
    // Handle backend features data
    const backendFeatures = features || product?.features || [];
    
    // Convert simple feature strings to structured format
    const processedFeatures = backendFeatures.length > 0 
        ? backendFeatures.map((feature, index) => {
            if (typeof feature === 'string') {
                return {
                    title: feature,
                    description: null,
                    icon: getIconForFeature(feature, index)
                };
            }
            return {
                title: feature.title || feature.name,
                description: feature.description,
                icon: feature.icon || getIconForFeature(feature.title || feature.name, index)
            };
        })
        : [
            // Fallback features if none provided
            {
                icon: 'text-primary',
                title: 'All-Day Battery Life',
                description: 'Up to 10 hours of surfing the web on Wi-Fi, watching video, or listening to music'
            },
            {
                icon: 'text-success',
                title: 'Advanced Camera System',
                description: '12MP Wide camera with Smart HDR 4 and 4K video recording'
            },
            {
                icon: 'text-info',
                title: 'Ultra-Fast Performance',
                description: 'M2 chip delivers incredible performance for demanding apps and multitasking'
            },
            {
                icon: 'text-warning',
                title: 'Versatile Connectivity',
                description: 'USB-C connector for charging and accessories, plus support for Apple Pencil'
            }
        ];

    // Helper function to assign icons based on feature content
    function getIconForFeature(featureText, index) {
        const text = featureText.toLowerCase();
        const iconClasses = ['text-primary', 'text-success', 'text-info', 'text-warning', 'text-danger'];
        
        if (text.includes('battery') || text.includes('power')) return 'text-success';
        if (text.includes('camera') || text.includes('photo')) return 'text-info';
        if (text.includes('performance') || text.includes('speed') || text.includes('fast')) return 'text-primary';
        if (text.includes('connectivity') || text.includes('wireless') || text.includes('bluetooth')) return 'text-warning';
        if (text.includes('display') || text.includes('screen')) return 'text-info';
        if (text.includes('storage') || text.includes('memory')) return 'text-primary';
        if (text.includes('security') || text.includes('secure')) return 'text-danger';
        
        // Default to cycling through colors
        return iconClasses[index % iconClasses.length];
    }

    // Limit to 6 features for better display
    const displayFeatures = processedFeatures.slice(0, 6);

    if (displayFeatures.length === 0) {
        return null;
    }

    return (
        <div className="store-card outline-card fill-card mt-3">
            <div className="p-4">
                <h5 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-success">
                        <path fill="currentColor"
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Key Features
                </h5>

                <div className="features-list">
                    {displayFeatures.map((feature, index) => (
                        <div key={`${feature.title}-${index}`} className={`feature-item d-flex align-items-start ${index < displayFeatures.length - 1 ? 'mb-3' : ''}`}>
                            <div className={`feature-icon bg-primary bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" className={feature.icon}>
                                    <path fill="currentColor"
                                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div>
                                <h6 className="mb-1 fw-semibold">{feature.title}</h6>
                                {feature.description && (
                                    <p className="text-muted small mb-0">{feature.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show additional features count if more exist */}
                {processedFeatures.length > 6 && (
                    <div className="text-center mt-3 pt-3 border-top">
                        <small className="text-muted">
                            +{processedFeatures.length - 6} more features
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KeyFeatures;