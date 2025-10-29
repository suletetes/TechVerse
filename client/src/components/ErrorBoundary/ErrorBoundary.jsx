import React from 'react';
import errorReportingService from './ErrorReportingService.js';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null,
            errorId: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        const errorId = `app_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Log error details for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo,
            errorId: errorId
        });

        // Report error to error reporting service
        const errorReport = {
            id: errorId,
            section: 'application',
            type: 'component',
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.props.userId || 'anonymous',
            props: this.props.reportProps ? JSON.stringify(this.props) : undefined
        };

        errorReportingService.reportError(errorReport);

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo, errorId);
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback(
                    this.state.error, 
                    this.state.errorInfo, 
                    this.handleRetry,
                    this.state.errorId
                );
            }

            const isDevelopment = import.meta.env.DEV;

            if (isDevelopment) {
                return (
                    <DevelopmentErrorUI 
                        error={this.state.error} 
                        errorInfo={this.state.errorInfo}
                        errorId={this.state.errorId}
                        onRetry={this.handleRetry}
                    />
                );
            } else {
                return (
                    <ProductionErrorUI 
                        errorId={this.state.errorId}
                        onRetry={this.handleRetry}
                    />
                );
            }
        }

        return this.props.children;
    }
}

// Development Error UI - Shows detailed error information
const DevelopmentErrorUI = ({ error, errorInfo, errorId, onRetry }) => {
    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" style={{ minHeight: '100vh' }}>
            <div className="container bloc-lg">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="store-card fill-card border-danger">
                            <div className="p-4">
                                {/* Development Error Header */}
                                <div className="d-flex align-items-center mb-4">
                                    <div className="bg-danger rounded-circle p-3 me-3">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-danger mb-1">Development Error</h2>
                                        <p className="text-muted mb-0">An error occurred while rendering this component</p>
                                    </div>
                                </div>

                                {/* Error Details */}
                                <div className="mb-4">
                                    <h5 className="text-danger mb-3">Error Details:</h5>
                                    <div className="bg-light p-3 rounded border">
                                        <pre className="mb-0 text-danger" style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                            {error && error.toString()}
                                        </pre>
                                    </div>
                                </div>

                                {/* Stack Trace */}
                                {errorInfo && errorInfo.componentStack && (
                                    <div className="mb-4">
                                        <h5 className="text-danger mb-3">Component Stack:</h5>
                                        <div className="bg-light p-3 rounded border" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                            <pre className="mb-0 text-muted" style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                                {errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Development Actions */}
                                <div className="d-flex gap-3">
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
                                    <a href="/" className="btn btn-outline-secondary btn-rd">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9,22 9,12 15,12 15,22" />
                                        </svg>
                                        Go Home
                                    </a>
                                </div>

                                {/* Development Tips */}
                                <div className="mt-4 p-3 bg-info bg-opacity-10 rounded border border-info">
                                    <h6 className="text-info mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                        </svg>
                                        Development Tips:
                                    </h6>
                                    <ul className="mb-0 small text-info">
                                        <li>Check the browser console for additional error details</li>
                                        <li>Look at the component stack to identify the problematic component</li>
                                        <li>This detailed error view is only shown in development mode</li>
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

// Production Error UI - Shows user-friendly error message
const ProductionErrorUI = ({ errorId, onRetry }) => {
    return (
        <section className="bloc l-bloc full-width-bloc bgc-5700" id="bloc-error">
            <div className="container bloc-lg">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-10 col-sm-12 text-center">
                        <div className="store-card outline-card fill-card">
                            <div className="p-5">
                                {/* Error Icon */}
                                <div className="mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle p-4 mb-3" style={{ width: '120px', height: '120px' }}>
                                        <svg width="60" height="60" viewBox="0 0 24 24" className="text-danger">
                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Error Message */}
                                <h2 className="tc-6533 mb-3 fw-bold">Something went wrong</h2>
                                <p className="tc-6533 mb-4 lead">
                                    We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
                                </p>

                                {/* Error ID for Support */}
                                {errorId && (
                                    <div className="mb-4">
                                        <small className="text-muted">
                                            Error ID: <code>{errorId}</code>
                                        </small>
                                        <br />
                                        <small className="text-muted">
                                            Please include this ID when contacting support.
                                        </small>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center mb-4">
                                    <button
                                        className="btn btn-rd btn-c-2101 btn-lg d-flex align-items-center justify-content-center px-4"
                                        onClick={onRetry}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                            <polyline points="23 4 23 10 17 10" />
                                            <polyline points="1 20 1 14 7 14" />
                                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        Try Again
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-rd btn-lg d-flex align-items-center justify-content-center px-4"
                                        onClick={() => window.location.reload()}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="23 4 23 10 17 10" />
                                            <polyline points="1 20 1 14 7 14" />
                                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        Reload Page
                                    </button>
                                    <a
                                        href="/"
                                        className="btn btn-outline-secondary btn-rd btn-lg d-flex align-items-center justify-content-center px-4"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9,22 9,12 15,12 15,22" />
                                        </svg>
                                        Back to Home
                                    </a>
                                </div>

                                {/* Help Section */}
                                <div className="border-top pt-4">
                                    <h6 className="tc-6533 mb-3">Need Help?</h6>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <a href="/contact" className="btn btn-outline-secondary btn-sm w-100">
                                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                    <polyline points="22,6 12,13 2,6" />
                                                </svg>
                                                Contact Support
                                            </a>
                                        </div>
                                        <div className="col-md-4">
                                            <a href="/faq" className="btn btn-outline-secondary btn-sm w-100">
                                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                                FAQ
                                            </a>
                                        </div>
                                        <div className="col-md-4">
                                            <a href="/products" className="btn btn-outline-secondary btn-sm w-100">
                                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <path d="m21 21-4.35-4.35" />
                                                </svg>
                                                Browse Products
                                            </a>
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

export default ErrorBoundary;