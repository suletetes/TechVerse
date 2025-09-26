import React from 'react';

const ProductIncludes = () => {
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
                <div className="col-md-6">
                    <div className="d-flex align-items-center mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-success" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <small className="text-muted">Free delivery on orders over £50</small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-info" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        <small className="text-muted">2-year warranty included</small>
                    </div>
                    <div className="d-flex align-items-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-warning" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <small className="text-muted">30-day return policy</small>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="d-flex align-items-center mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-primary" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <small className="text-muted">Premium build quality</small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-success" fill="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <small className="text-muted">Certified refurbished</small>
                    </div>
                    <div className="d-flex align-items-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-info" fill="currentColor">
                            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        <small className="text-muted">24/7 customer support</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductIncludes;