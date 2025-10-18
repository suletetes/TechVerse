import React from 'react';

const ErrorState = ({ 
  message = 'Something went wrong', 
  onRetry = null, 
  showRetry = true,
  variant = 'default'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'network':
        return (
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'empty':
        return (
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center">
        {getIcon()}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {variant === 'empty' ? 'No products found' : 'Oops! Something went wrong'}
        </h3>
        <p className="text-gray-500 mb-4 max-w-sm">
          {message}
        </p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-primary btn-sm"
          >
            <i className="fa fa-refresh me-2"></i>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;