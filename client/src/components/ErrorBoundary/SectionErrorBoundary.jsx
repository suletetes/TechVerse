import React from 'react';
import { useNotification } from '../../context/NotificationContext.jsx';

class SectionErrorBoundary extends React.Component {
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
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.error(`SectionErrorBoundary [${this.props.section}] caught an error:`, error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo,
            errorId: errorId
        });

        // Report error to error reporting service
        this.reportError(error, errorInfo, errorId);

        // Show notification if notification context is available
        if (this.props.showNotification && this.props.onError) {
            this.props.onError(error, errorInfo, errorId);
        }
    }

    reportError = (error, errorInfo, errorId) => {
        const errorReport = {
            id: errorId,
            section: this.props.section,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.props.userId || 'anonymous'
        };

        // In development, log to console
        if (import.meta.env.DEV) {
            console.group(`🚨 Error Report [${this.props.section}]`);
            console.error('Error ID:', errorId);
            console.error('Error:', error);
            console.error('Component Stack:', errorInfo.componentStack);
            console.error('Full Report:', errorReport);
            console.groupEnd();
        }

        // In production, send to error reporting service
        if (import.meta.env.PROD && this.props.onErrorReport) {
            this.props.onErrorReport(errorReport);
        }
    };

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

            // Default section error UI
            return (
                <SectionErrorUI
                    section={this.props.section}
                    error={this.state.error}
                    errorId={this.state.errorId}
                    onRetry={this.handleRetry}
                    minimal={this.props.minimal}
                />
            );
        }

        return this.props.children;
    }
}

// Section Error UI Component
const SectionErrorUI = ({ section, error, errorId, onRetry, minimal = false }) => {
    if (minimal) {
        return (
            <div className="alert alert-warning d-flex align-items-center" role="alert">
                <svg width="16" height="16" className="me-2" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
                <div className="flex-grow-1">
                    <strong>Error in {section}</strong>
                    <div className="small text-muted">Something went wrong in this section</div>
                </div>
                <button 
                    className="btn btn-sm btn-outline-warning ms-2"
                    onClick={onRetry}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="store-card border-warning">
            <div className="p-4 text-center">
                {/* Warning Icon */}
                <div className="mb-3">
                    <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle p-3">
                        <svg width="32" height="32" className="text-warning" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                        </svg>
                    </div>
                </div>

                {/* Error Message */}
                <h5 className="text-warning mb-2">Error in {section}</h5>
                <p className="text-muted mb-3">
                    We encountered an issue while loading this section. This might be a temporary problem.
                </p>

                {/* Error Details (Development) */}
                {import.meta.env.DEV && error && (
                    <div className="mb-3">
                        <details className="text-start">
                            <summary className="btn btn-sm btn-outline-secondary mb-2">
                                Show Error Details
                            </summary>
                            <div className="bg-light p-2 rounded border">
                                <small className="text-danger font-monospace">
                                    {error.message}
                                </small>
                            </div>
                        </details>
                    </div>
                )}

                {/* Error ID */}
                {errorId && (
                    <div className="mb-3">
                        <small className="text-muted">
                            Error ID: <code>{errorId}</code>
                        </small>
                    </div>
                )}

                {/* Actions */}
                <div className="d-flex gap-2 justify-content-center">
                    <button 
                        className="btn btn-warning btn-sm"
                        onClick={onRetry}
                    >
                        <svg width="14" height="14" className="me-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Retry
                    </button>
                    <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SectionErrorBoundary;