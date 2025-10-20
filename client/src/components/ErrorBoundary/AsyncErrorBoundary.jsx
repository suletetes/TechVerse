import React, { useState, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext.jsx';

// Hook for handling async errors in functional components
export const useAsyncError = () => {
    const [, setError] = useState();
    const { showError } = useNotification();

    return useCallback((error) => {
        console.error('Async Error:', error);
        
        // Show user notification
        showError(
            error.message || 'An unexpected error occurred',
            8000
        );

        // Trigger error boundary by setting state
        setError(() => {
            throw error;
        });
    }, [showError]);
};

// Async Error Boundary for handling promise rejections and async errors
class AsyncErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null,
            asyncErrors: []
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('AsyncErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Report async error
        this.reportAsyncError(error, errorInfo);
    }

    componentDidMount() {
        // Listen for unhandled promise rejections
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
        
        // Listen for general errors
        window.addEventListener('error', this.handleError);
    }

    componentWillUnmount() {
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
        window.removeEventListener('error', this.handleError);
    }

    handleUnhandledRejection = (event) => {
        console.error('Unhandled Promise Rejection:', event.reason);
        
        const error = {
            type: 'unhandledrejection',
            message: event.reason?.message || 'Unhandled promise rejection',
            stack: event.reason?.stack,
            timestamp: new Date().toISOString()
        };

        this.setState(prevState => ({
            asyncErrors: [...prevState.asyncErrors, error]
        }));

        // Report the error
        this.reportAsyncError(event.reason, null, 'unhandledrejection');

        // Show user notification if callback provided
        if (this.props.onAsyncError) {
            this.props.onAsyncError(event.reason);
        }

        // Prevent default browser error handling
        event.preventDefault();
    };

    handleError = (event) => {
        console.error('Global Error:', event.error);
        
        const error = {
            type: 'error',
            message: event.error?.message || event.message || 'Global error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            timestamp: new Date().toISOString()
        };

        this.setState(prevState => ({
            asyncErrors: [...prevState.asyncErrors, error]
        }));

        // Report the error
        this.reportAsyncError(event.error, null, 'global');
    };

    reportAsyncError = (error, errorInfo, type = 'component') => {
        const errorReport = {
            id: `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            message: error?.message || 'Unknown async error',
            stack: error?.stack,
            componentStack: errorInfo?.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.props.userId || 'anonymous'
        };

        // In development, log to console
        if (import.meta.env.DEV) {
            console.group(`🚨 Async Error Report [${type}]`);
            console.error('Error:', error);
            if (errorInfo) console.error('Component Stack:', errorInfo.componentStack);
            console.error('Full Report:', errorReport);
            console.groupEnd();
        }

        // In production, send to error reporting service
        if (import.meta.env.PROD && this.props.onErrorReport) {
            this.props.onErrorReport(errorReport);
        }
    };

    clearAsyncErrors = () => {
        this.setState({ asyncErrors: [] });
    };

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            asyncErrors: []
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback(
                    this.state.error, 
                    this.state.errorInfo, 
                    this.handleRetry
                );
            }

            // Default async error UI
            return (
                <AsyncErrorUI
                    error={this.state.error}
                    asyncErrors={this.state.asyncErrors}
                    onRetry={this.handleRetry}
                    onClearErrors={this.clearAsyncErrors}
                />
            );
        }

        return (
            <>
                {this.props.children}
                {/* Show async error notifications */}
                {this.state.asyncErrors.length > 0 && this.props.showAsyncErrors && (
                    <AsyncErrorNotifications
                        errors={this.state.asyncErrors}
                        onClear={this.clearAsyncErrors}
                    />
                )}
            </>
        );
    }
}

// Async Error UI Component
const AsyncErrorUI = ({ error, asyncErrors, onRetry, onClearErrors }) => {
    return (
        <div className="store-card border-danger">
            <div className="p-4">
                {/* Error Header */}
                <div className="d-flex align-items-center mb-3">
                    <div className="bg-danger rounded-circle p-2 me-3">
                        <svg width="24" height="24" className="text-white" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                        </svg>
                    </div>
                    <div>
                        <h5 className="text-danger mb-1">Application Error</h5>
                        <p className="text-muted mb-0">An unexpected error occurred</p>
                    </div>
                </div>

                {/* Error Message */}
                <div className="mb-3">
                    <p className="text-muted">
                        {error?.message || 'Something went wrong while processing your request.'}
                    </p>
                </div>

                {/* Async Errors Summary */}
                {asyncErrors.length > 0 && (
                    <div className="mb-3">
                        <div className="alert alert-warning">
                            <strong>Additional Issues Detected:</strong>
                            <ul className="mb-0 mt-2">
                                {asyncErrors.slice(-3).map((asyncError, index) => (
                                    <li key={index} className="small">
                                        {asyncError.type}: {asyncError.message}
                                    </li>
                                ))}
                            </ul>
                            {asyncErrors.length > 3 && (
                                <small className="text-muted">
                                    ... and {asyncErrors.length - 3} more issues
                                </small>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-danger"
                        onClick={onRetry}
                    >
                        <svg width="16" height="16" className="me-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Retry
                    </button>
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                    {asyncErrors.length > 0 && (
                        <button 
                            className="btn btn-outline-warning"
                            onClick={onClearErrors}
                        >
                            Clear Errors
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Async Error Notifications Component
const AsyncErrorNotifications = ({ errors, onClear }) => {
    if (errors.length === 0) return null;

    return (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
            <div className="toast show" role="alert">
                <div className="toast-header bg-warning text-dark">
                    <svg width="16" height="16" className="me-2" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    <strong className="me-auto">Background Errors ({errors.length})</strong>
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={onClear}
                    ></button>
                </div>
                <div className="toast-body">
                    <small>
                        {errors.length} background error{errors.length > 1 ? 's' : ''} detected. 
                        Check console for details.
                    </small>
                </div>
            </div>
        </div>
    );
};

export default AsyncErrorBoundary;