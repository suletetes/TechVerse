import React, { Component } from 'react';
import { useNotification } from '../../hooks/useNotification';

// Error Boundary wrapper that uses hooks
class ErrorBoundaryClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Show notification if available
    if (this.props.showError) {
      this.props.showError(
        error.message || 'An unexpected error occurred',
        0 // Don't auto-dismiss
      );
    }

    // Log to error reporting service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-content">
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="error-boundary-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            
            <h2>Something went wrong</h2>
            <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            
            <div className="error-boundary-actions">
              <button 
                onClick={this.handleReset}
                className="btn btn-primary"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn btn-outline-primary"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper to inject notification hook
const ErrorBoundary = ({ children, fallback }) => {
  const { showError } = useNotification();

  return (
    <ErrorBoundaryClass fallback={fallback} showError={showError}>
      {children}
    </ErrorBoundaryClass>
  );
};

export default ErrorBoundary;
