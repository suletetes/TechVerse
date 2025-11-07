import React, { useState } from 'react';

const DetailedSpecs = ({ 
    productName = "Tablet Air",
    specifications = {
        "Display & Design": [
            { label: 'Display Size', value: '11-inch Liquid Retina', highlight: true },
            { label: 'Resolution', value: '2388 x 1668 pixels at 264 ppi' },
            { label: 'Display Technology', value: 'IPS LCD with True Tone' },
            { label: 'Brightness', value: '500 nits max brightness' },
            { label: 'Color Gamut', value: 'P3 wide color gamut' },
            { label: 'Dimensions', value: '247.6 × 178.5 × 6.1 mm' },
            { label: 'Weight', value: '466g (Wi-Fi) / 468g (Cellular)' },
            { label: 'Colors', value: 'Silver, Blue, Pink, Purple, Starlight' }
        ],
        "Performance": [
            { label: 'Processor', value: 'Apple M2 chip', highlight: true },
            { label: 'CPU', value: '8-core CPU with 4 performance and 4 efficiency cores' },
            { label: 'GPU', value: '10-core GPU' },
            { label: 'Neural Engine', value: '16-core Neural Engine' },
            { label: 'Memory', value: '8GB unified memory' },
            { label: 'Storage Options', value: '128GB, 256GB, 512GB, 1TB' }
        ],
        "Camera & Audio": [
            { label: 'Rear Camera', value: '12MP Wide camera', highlight: true },
            { label: 'Front Camera', value: '12MP Ultra Wide front camera' },
            { label: 'Video Recording', value: '4K video recording at 24, 25, 30, or 60 fps' },
            { label: 'Audio', value: 'Stereo speakers in landscape mode' },
            { label: 'Microphones', value: 'Dual microphones for calls and video recording' }
        ],
        "Connectivity": [
            { label: 'Wi-Fi', value: 'Wi-Fi 6E (802.11ax)', highlight: true },
            { label: 'Bluetooth', value: 'Bluetooth 5.3' },
            { label: 'Cellular', value: '5G (sub-6 GHz and mmWave) - Cellular models' },
            { label: 'Connector', value: 'USB-C with support for Thunderbolt 4' },
            { label: 'Location', value: 'GPS, GLONASS, Galileo, QZSS, BeiDou' }
        ],
        "Battery & Power": [
            { label: 'Battery Life', value: 'Up to 10 hours', highlight: true },
            { label: 'Video Playback', value: 'Up to 10 hours of video playback' },
            { label: 'Audio Playback', value: 'Up to 9 hours of audio playback' },
            { label: 'Charging', value: 'Fast charging with 20W adapter (sold separately)' },
            { label: 'Power Adapter', value: '20W USB-C Power Adapter' }
        ],
        "Compatibility": [
            { label: 'Apple Pencil', value: 'Apple Pencil (2nd generation)', highlight: true },
            { label: 'Keyboard', value: 'Magic Keyboard, Smart Keyboard Folio' },
            { label: 'Operating System', value: 'iPadOS 17' },
            { label: 'Accessibility', value: 'Full range of accessibility features' }
        ]
    }
}) => {
    const [activeSection, setActiveSection] = useState(Object.keys(specifications)[0]);
    const [expandedSections, setExpandedSections] = useState(new Set([Object.keys(specifications)[0]]));

    const toggleSection = (section) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
        setActiveSection(section);
    };

    const getSectionIcon = (sectionName) => {
        const icons = {
            "Display & Design": (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/>
                </svg>
            ),
            "Performance": (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            ),
            "Camera & Audio": (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            ),
            "Connectivity": (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                </svg>
            ),
            "Battery & Power": (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                </svg>
            ),
            "Compatibility": (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            )
        };
        return icons[sectionName] || icons["Performance"];
    };

    return (
        <div className="detailed-specs">
            <div className="store-card outline-card fill-card">
                <div className="p-4">
                    <h4 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" className="me-3 text-primary">
                            <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                        </svg>
                        {productName} - Detailed Specifications
                    </h4>

                    {/* Specification Sections */}
                    <div className="specs-accordion">
                        {Object.entries(specifications).map(([sectionName, specs], index) => (
                            <div key={sectionName} className={`spec-section mb-3 ${index === Object.keys(specifications).length - 1 ? 'mb-0' : ''}`}>
                                <div 
                                    className={`spec-section-header p-3 rounded-3 cursor-pointer border ${
                                        expandedSections.has(sectionName) 
                                            ? 'bg-primary bg-opacity-10 border-primary border-opacity-25' 
                                            : 'bg-light border-light'
                                    }`}
                                    onClick={() => toggleSection(sectionName)}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <div className={`me-3 ${expandedSections.has(sectionName) ? 'text-primary' : 'text-muted'}`}>
                                                {getSectionIcon(sectionName)}
                                            </div>
                                            <h6 className={`mb-0 fw-semibold ${expandedSections.has(sectionName) ? 'text-primary' : 'text-dark'}`}>
                                                {sectionName}
                                            </h6>
                                            <span className="badge bg-secondary bg-opacity-25 text-dark ms-2">
                                                {specs.length} specs
                                            </span>
                                        </div>
                                        <svg 
                                            width="20" 
                                            height="20" 
                                            viewBox="0 0 24 24" 
                                            className={`transition-transform ${expandedSections.has(sectionName) ? 'rotate-180' : ''} ${
                                                expandedSections.has(sectionName) ? 'text-primary' : 'text-muted'
                                            }`}
                                            style={{ transform: expandedSections.has(sectionName) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                                        >
                                            <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                                        </svg>
                                    </div>
                                </div>

                                {expandedSections.has(sectionName) && (
                                    <div className="spec-section-content mt-2 p-3 bg-white rounded-3 border">
                                        <div className="row g-0">
                                            {specs.map((spec, specIndex) => (
                                                <div key={spec.label} className="col-12">
                                                    <div className={`spec-item d-flex justify-content-between align-items-center py-3 ${
                                                        specIndex < specs.length - 1 ? 'border-bottom border-light' : ''
                                                    }`}>
                                                        <div className="spec-label">
                                                            <span className={`${spec.highlight ? 'fw-semibold text-dark' : 'text-muted'}`}>
                                                                {spec.label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            </span>
                                                        </div>
                                                        <div className="spec-value text-end">
                                                            <span className={`${spec.highlight ? 'fw-bold text-primary' : 'fw-medium text-dark'}`}>
                                                                {spec.value}
                                                            </span>
                                                            {spec.highlight && (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" className="ms-2 text-primary">
                                                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Quick Specs Summary */}
                    <div className="quick-specs-summary mt-4 pt-4 border-top">
                        <h6 className="fw-semibold mb-3 text-muted">Quick Overview</h6>
                        <div className="row g-3">
                            <div className="col-md-3 col-6">
                                <div className="text-center p-3 bg-light rounded-3">
                                    <div className="fw-bold text-primary">11"</div>
                                    <div className="small text-muted">Display</div>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="text-center p-3 bg-light rounded-3">
                                    <div className="fw-bold text-primary">M2</div>
                                    <div className="small text-muted">Chip</div>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="text-center p-3 bg-light rounded-3">
                                    <div className="fw-bold text-primary">10hrs</div>
                                    <div className="small text-muted">Battery</div>
                                </div>
                            </div>
                            <div className="col-md-3 col-6">
                                <div className="text-center p-3 bg-light rounded-3">
                                    <div className="fw-bold text-primary">466g</div>
                                    <div className="small text-muted">Weight</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Link */}

                    {/*  
                    <div className="text-center mt-4">
                        <button className="btn btn-outline-primary btn-rd">
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                <path fill="currentColor" d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H3.5C2.67 2 2 2.67 2 3.5v15C2 19.33 2.67 20 3.5 20h15c.83 0 1.5-.67 1.5-1.5v-15C20 2.67 19.33 2 18.5 2z"/>
                            </svg>
                            Compare with Similar Products
                        </button>
                    </div>
                    */}
                </div>
            </div>
        </div>
    );
};

export default DetailedSpecs;