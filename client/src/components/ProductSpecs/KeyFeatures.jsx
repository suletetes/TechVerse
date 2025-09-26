import React from 'react';

const KeyFeatures = () => {
    const features = [
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
                    {features.map((feature, index) => (
                        <div key={feature.title} className={`feature-item d-flex align-items-start ${index < features.length - 1 ? 'mb-3' : ''}`}>
                            <div className={`feature-icon bg-primary bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" className={feature.icon}>
                                    <path fill="currentColor"
                                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div>
                                <h6 className="mb-1 fw-semibold">{feature.title}</h6>
                                <p className="text-muted small mb-0">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KeyFeatures;