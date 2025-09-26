import React from 'react';

const TechnicalSpecs = () => {
    const specs = [
        { label: 'Display', value: '11-inch Liquid Retina' },
        { label: 'Resolution', value: '2388 x 1668 pixels' },
        { label: 'Processor', value: 'M2 Chip' },
        { label: 'RAM', value: '8GB' },
        { label: 'Camera', value: '12MP Wide + 10MP Ultra Wide' },
        { label: 'Battery Life', value: 'Up to 10 hours' },
        { label: 'Weight', value: '466g' },
        { label: 'Connectivity', value: 'Wi-Fi 6E, Bluetooth 5.3' }
    ];

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
                        {specs.map((spec, index) => (
                            <div
                                key={spec.label}
                                className={`spec-item d-flex justify-content-between align-items-center py-2 ${index < specs.length - 1 ? 'border-bottom' : ''}`}
                            >
                                <span className="text-muted">{spec.label}</span>
                                <span className="fw-medium">{spec.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicalSpecs;