import React, { useState, useEffect } from 'react';

const SubFooter = () => {
    const messages = [
        // "Trade in your old devices and get credit towards your next purchase.",
        "Free shipping on orders over $50 - Fast delivery nationwide.",
        "️2-year warranty on all products - Your satisfaction guaranteed.",
        "24/7 customer support - We're here to help anytime.",
        "Join our newsletter for exclusive deals and tech updates."
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-scroll every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => 
                prevIndex === messages.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [messages.length]);

    const goToPrevious = () => {
        setCurrentIndex(currentIndex === 0 ? messages.length - 1 : currentIndex - 1);
    };

    const goToNext = () => {
        setCurrentIndex(currentIndex === messages.length - 1 ? 0 : currentIndex + 1);
    };

    return (
        <div className="bloc none l-bloc primary-gradient-bg" id="sub-footer">
            <div className="container bloc-sm-lg bloc-md bloc-sm-md bloc-md-sm">
                <div className="row">
                    <div className="text-start col-lg-6 offset-lg-3 ps-0 pe-0">
                        <div className="d-flex align-items-center justify-content-center position-relative">
                            {/* Previous Button */}
                            <button 
                                className="btn p-0 me-3" 
                                onClick={goToPrevious}
                                style={{ 
                                    background: 'rgba(0,0,0,0.15)', 
                                    borderRadius: '50%', 
                                    width: '40px', 
                                    height: '40px',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                                    <path 
                                        d="M22,2L9,16,22,30" 
                                        stroke="white" 
                                        strokeWidth="4" 
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>

                            {/* Message Display */}
                            <div className="flex-grow-1 text-center px-3">
                                <p className="mb-0 tc-2175 sub-footer-text" style={{ minHeight: '1.5rem' }}>
                                    {messages[currentIndex]}
                                </p>
                            </div>

                            {/* Next Button */}
                            <button
                                className="btn p-0 ms-3" 
                                onClick={goToNext}
                                style={{ 
                                    background: 'rgba(0,0,0,0.15)', 
                                    borderRadius: '50%', 
                                    width: '40px', 
                                    height: '40px',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                                    <path 
                                        d="M10.344,2l13,14-13,14" 
                                        stroke="white" 
                                        strokeWidth="4" 
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Dots Indicator */}
                        <div className="d-flex justify-content-center mt-2">
                            {messages.map((_, index) => (
                                <button
                                    key={index}
                                    className="btn p-0 mx-1"
                                    onClick={() => setCurrentIndex(index)}
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubFooter;