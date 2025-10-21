import React from 'react';

const ProductIncludes = ({ includes, product }) => {
    // Return null if no product provided
    if (!product) {
        return null;
    }
    
    // Handle backend data structure
    const productIncludes = includes || product?.includes || [];
    const features = product?.features || [];
    
    // Default includes if none provided
    const defaultIncludes = [
        {
            icon: 'success',
            text: product?.shipping?.free ? 'Free delivery' : 'Standard delivery available',
            type: 'shipping'
        },
        {
            icon: 'info',
            text: '2-year warranty included',
            type: 'warranty'
        },
        {
            icon: 'warning',
            text: '30-day return policy',
            type: 'returns'
        },
        {
            icon: 'primary',
            text: 'Premium build quality',
            type: 'quality'
        },
        {
            icon: 'success',
            text: 'Certified authentic',
            type: 'certification'
        },
        {
            icon: 'info',
            text: '24/7 customer support',
            type: 'support'
        }
    ];

    // Combine backend includes with features
    const allIncludes = [
        ...productIncludes.map(item => ({
            icon: 'success',
            text: typeof item === 'string' ? item : item.text || item.name,
            type: 'included'
        })),
        ...features.slice(0, 3).map(feature => ({
            icon: 'primary',
            text: feature,
            type: 'feature'
        }))
    ];

    // Use backend data if available, otherwise use defaults
    const displayIncludes = allIncludes.length > 0 ? allIncludes : defaultIncludes;

    const getIcon = (iconType) => {
        const icons = {
            success: (
                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-success" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            ),
            info: (
                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-info" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
            ),
            warning: (
                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-warning" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            ),
            primary: (
                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-primary" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            )
        };
        return icons[iconType] || icons.success;
    };

    if (displayIncludes.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 p-4 bg-light rounded-3">
            <h6 className="tc-6533 fw-bold mb-3 d-flex align-items-center">
                <svg width="18" height="18" viewBox="0 0 24 24" className="me-2 text-primary">
                    <path fill="currentColor"
                          d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
                What's Included
            </h6>
            <div className="row g-3">
                {displayIncludes.map((item, index) => {
                    const colClass = displayIncludes.length <= 3 ? 'col-12' : 'col-md-6';
                    return (
                        <div key={index} className={colClass}>
                            <div className="d-flex align-items-center mb-2">
                                {getIcon(item.icon)}
                                <small className="text-muted">{item.text}</small>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional product-specific information */}
            {product?.weight && (
                <div className="mt-3 pt-3 border-top">
                    <small className="text-muted d-flex align-items-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M12 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm7 7.7c0-.8-.7-1.5-1.5-1.5S16 9.9 16 10.7v.8l-2.1 2.1c-.9.9-2.4.9-3.3 0L8.5 11.5c-.9-.9-2.4-.9-3.3 0L3 13.7v.8c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-.8l2.1-2.1c.9-.9 2.4-.9 3.3 0l2.1 2.1c.9.9 2.4.9 3.3 0L19 11.5v-.8z"/>
                        </svg>
                        Weight: {product.weight.value} {product.weight.unit}
                    </small>
                </div>
            )}
        </div>
    );
};

export default ProductIncludes;