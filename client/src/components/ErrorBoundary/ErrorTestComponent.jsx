import React, { useState } from 'react';

// This component is for testing error boundaries in development
// Remove this in production or add it only in development builds
const ErrorTestComponent = () => {
    const [shouldThrow, setShouldThrow] = useState(false);

    if (shouldThrow) {
        throw new Error('This is a test error to demonstrate the ErrorBoundary component!');
    }

    // Only show in development
    if (import.meta.env.PROD) {
        return null;
    }

    return (
        <div className="position-fixed bottom-0 end-0 m-3" style={{ zIndex: 1050 }}>
            <div className="card border-warning" style={{ width: '250px' }}>
                <div className="card-body p-3">
                    <h6 className="card-title text-warning mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                        Dev Tools
                    </h6>
                    <p className="card-text small text-muted mb-3">
                        Test error boundaries in development
                    </p>
                    <button 
                        className="btn btn-warning btn-sm w-100"
                        onClick={() => setShouldThrow(true)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Trigger Error
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorTestComponent;