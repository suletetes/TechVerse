import React from 'react';

const TechnicalSpecs = ({ product, specifications }) => {
    // Handle backend specification data structure
    const backendSpecs = specifications || product?.specifications || [];
    
    // Convert backend specifications to display format
    const processedSpecs = backendSpecs.length > 0 
        ? backendSpecs.filter(spec => spec && spec.name).map(spec => ({
            label: spec.name,
            value: spec.value,
            category: spec.category
        }))
        : [
            // Fallback specs if none provided
            { label: 'Display', value: '11-inch Liquid Retina', category: 'display' },
            { label: 'Resolution', value: '2388 x 1668 pixels', category: 'display' },
            { label: 'Processor', value: 'M2 Chip', category: 'performance' },
            { label: 'RAM', value: '8GB', category: 'performance' },
            { label: 'Camera', value: '12MP Wide + 10MP Ultra Wide', category: 'camera' },
            { label: 'Battery Life', value: 'Up to 10 hours', category: 'battery' },
            { label: 'Weight', value: '466g', category: 'design' },
            { label: 'Connectivity', value: 'Wi-Fi 6E, Bluetooth 5.3', category: 'connectivity' }
        ];

    // Group specifications by category for better organization
    const groupedSpecs = processedSpecs.reduce((groups, spec) => {
        const category = spec.category || 'general';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(spec);
        return groups;
    }, {});

    // Get key specifications for quick display (limit to 8 most important)
    const keySpecs = processedSpecs.slice(0, 8);

    if (keySpecs.length === 0) {
        return null;
    }

    return (
        <div className="store-card outline-card fill-card mt-3">
            <div className="p-4">
                <h5 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-primary">
                        <path fill="currentColor"
                              d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                    </svg>
                    Technical Specifications
                </h5>

                <div className="row g-3">
                    <div className="col-12">
                        {keySpecs.map((spec, index) => (
                            <div
                                key={`${spec.label}-${index}`}
                                className={`spec-item d-flex justify-content-between align-items-center py-2 ${index < keySpecs.length - 1 ? 'border-bottom' : ''}`}
                            >
                                <span className="text-muted">{spec.label}</span>
                                <span className="fw-medium text-end" style={{ maxWidth: '60%' }}>
                                    {spec.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Show link to detailed specs if more specifications are available */}
                {processedSpecs.length > 8 && (
                    <div className="text-center mt-3 pt-3 border-top">
                        <small className="text-muted">
                            <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                            </svg>
                            View detailed specifications below
                        </small>
                    </div>
                )}

                {/* Additional product info if available */}
                {product && (
                    <div className="mt-3 pt-3 border-top">
                        <div className="row g-2 text-center">
                            {product.brand && (
                                <div className="col-6">
                                    <small className="text-muted d-block">Brand</small>
                                    <small className="fw-medium">{product.brand}</small>
                                </div>
                            )}
                            {product.sku && (
                                <div className="col-6">
                                    <small className="text-muted d-block">SKU</small>
                                    <small className="fw-medium">{product.sku}</small>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicalSpecs;