import React from 'react';
import { Link, useRouteError } from 'react-router-dom';

const RouterErrorBoundary = () => {
    const error = useRouteError();
    const isDevelopment = import.meta.env.DEV;

    console.error('Router Error:', error);

    if (isDevelopment) {
        return <DevelopmentRouterErrorUI error={error} />;
    } else {
        return <ProductionRouterErrorUI error={error} />;
    }
};

// Development Router Error UI - Shows detailed error information
const DevelopmentRouterErrorUI = ({ error }) => {
    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" style={{ minHeight: '100vh' }}>
            <div className="container bloc-lg">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="store-card fill-card border-warning">
                            <div className="p-4">
                                {/* Development Router Error Header */}
                                <div className="d-flex align-items-center mb-4">
                                    <div className="bg-warning rounded-circle p-3 me-3">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-warning mb-1">Router Error (Development)</h2>
                                        <p className="text-muted mb-0">An error occurred in the routing system</p>
                                    </div>
                                </div>

                                {/* Error Type */}
                                <div className="mb-4">
                                    <h5 className="text-warning mb-3">Error Type:</h5>
                                    <div className="bg-light p-3 rounded border">
                                        <code className="text-danger">
                                            {error?.status ? `${error.status} ${error.statusText}` : 'Router Error'}
                                        </code>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error?.message && (
                                    <div className="mb-4">
                                        <h5 className="text-warning mb-3">Error Message:</h5>
                                        <div className="bg-light p-3 rounded border">
                                            <pre className="mb-0 text-danger" style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                                {error.message}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Error Data */}
                                {error?.data && (
                                    <div className="mb-4">
                                        <h5 className="text-warning mb-3">Error Data:</h5>
                                        <div className="bg-light p-3 rounded border" style={{ maxHeight: '200px', overflow: 'auto' }}>
                                            <pre className="mb-0 text-muted" style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                                {typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Stack Trace */}
                                {error?.stack && (
                                    <div className="mb-4">
                                        <h5 className="text-warning mb-3">Stack Trace:</h5>
                                        <div className="bg-light p-3 rounded border" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                            <pre className="mb-0 text-muted" style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                                                {error.stack}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Development Actions */}
                                <div className="d-flex gap-3 mb-4">
                                    <button 
                                        className="btn btn-outline-primary btn-rd"
                                        onClick={() => window.location.reload()}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="23 4 23 10 17 10" />
                                            <polyline points="1 20 1 14 7 14" />
                                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        Reload Page
                                    </button>
                                    <Link to="/" className="btn btn-outline-secondary btn-rd">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9,22 9,12 15,12 15,22" />
                                        </svg>
                                        Go Home
                                    </Link>
                                    <button 
                                        className="btn btn-outline-info btn-rd"
                                        onClick={() => window.history.back()}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                        Go Back
                                    </button>
                                </div>

                                {/* Development Tips */}
                                <div className="p-3 bg-warning bg-opacity-10 rounded border border-warning">
                                    <h6 className="text-warning mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                        </svg>
                                        Router Development Tips:
                                    </h6>
                                    <ul className="mb-0 small text-warning">
                                        <li>Check if the route path is correctly defined in your router configuration</li>
                                        <li>Verify that all required route parameters are provided</li>
                                        <li>Look for loader function errors if using React Router data loading</li>
                                        <li>This detailed router error view is only shown in development mode</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Production Router Error UI - Shows user-friendly error message
const ProductionRouterErrorUI = ({ error }) => {
    const is404 = error?.status === 404;
    
    if (is404) {
        // For 404 errors, show the existing NotFound component content
        return (
            <section className="bloc l-bloc full-width-bloc bgc-5700" id="bloc-404">
                <div className="container bloc-lg">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 col-md-10 col-sm-12 text-center">
                            <div className="store-card outline-card fill-card mb-5">
                                <div className="p-5">
                                    {/* Large 404 Number */}
                                    <div className="mb-4">
                                        <h1 className="display-1 fw-bold primary-text mb-0" style={{ fontSize: '8rem', lineHeight: '1' }}>
                                            404
                                        </h1>
                                        <div className="d-flex justify-content-center mb-3">
                                            <div className="bg-primary rounded-pill" style={{ width: '100px', height: '4px' }}></div>
                                        </div>
                                    </div>

                                    {/* Error Icon */}
                                    <div className="mb-4">
                                        <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle p-4 mb-3" style={{ width: '120px', height: '120px' }}>
                                            <svg width="60" height="60" viewBox="0 0 24 24" className="text-primary">
                                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    <h2 className="tc-6533 mb-3 fw-bold">Page Not Found</h2>
                                    <p className="tc-6533 mb-4 lead">
                                        The page you're looking for doesn't exist or has been moved.
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                                        <Link
                                            to="/"
                                            className="btn btn-rd btn-c-2101 btn-lg d-flex align-items-center justify-content-center px-4"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                                            </svg>
                                            Back to Home
                                        </Link>
                                        <Link
                                            to="/products"
                                            className="btn btn-outline-primary btn-rd btn-lg d-flex align-items-center justify-content-center px-4"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="m21 21-4.35-4.35" />
                                            </svg>
                                            Browse Products
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // For other router errors (500, etc.)
    return (
        <section className="bloc l-bloc full-width-bloc bgc-5700" id="bloc-router-error">
            <div className="container bloc-lg">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-10 col-sm-12 text-center">
                        <div className="store-card outline-card fill-card">
                            <div className="p-5">
                                {/* Error Icon */}
                                <div className="mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle p-4 mb-3" style={{ width: '120px', height: '120px' }}>
                                        <svg width="60" height="60" viewBox="0 0 24 24" className="text-warning">
                                            <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Error Message */}
                                <h2 className="tc-6533 mb-3 fw-bold">
                                    {error?.status ? `Error ${error.status}` : 'Navigation Error'}
                                </h2>
                                <p className="tc-6533 mb-4 lead">
                                    {error?.statusText || 'We encountered an issue while navigating to this page.'}
                                </p>

                                {/* Action Buttons */}
                                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center mb-4">
                                    <button
                                        className="btn btn-rd btn-c-2101 btn-lg d-flex align-items-center justify-content-center px-4"
                                        onClick={() => window.location.reload()}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                            <polyline points="23 4 23 10 17 10" />
                                            <polyline points="1 20 1 14 7 14" />
                                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        Try Again
                                    </button>
                                    <Link
                                        to="/"
                                        className="btn btn-outline-primary btn-rd btn-lg d-flex align-items-center justify-content-center px-4"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9,22 9,12 15,12 15,22" />
                                        </svg>
                                        Back to Home
                                    </Link>
                                </div>

                                {/* Help Section */}
                                <div className="border-top pt-4">
                                    <h6 className="tc-6533 mb-3">Need Help?</h6>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <Link to="/contact" className="btn btn-outline-secondary btn-sm w-100">
                                                Contact Support
                                            </Link>
                                        </div>
                                        <div className="col-md-4">
                                            <Link to="/faq" className="btn btn-outline-secondary btn-sm w-100">
                                                FAQ
                                            </Link>
                                        </div>
                                        <div className="col-md-4">
                                            <Link to="/products" className="btn btn-outline-secondary btn-sm w-100">
                                                Browse Products
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RouterErrorBoundary;