import React from 'react';
import LoadingSpinner from './LoadingSpinner.jsx';
import SkeletonCard from './SkeletonCard.jsx';
import { IndeterminateProgressBar } from './ProgressBar.jsx';

// Enhanced Loading Button
const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = 'Loading...', 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    small: 'btn-sm',
    medium: '',
    large: 'btn-lg'
  };

  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={loading || disabled}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <span className="me-2">
          <LoadingSpinner size="small" color="white" text="" />
        </span>
      )}
      {loading ? loadingText : children}
    </button>
  );
};

// Loading Overlay for sections
const LoadingOverlay = ({ 
  loading = false, 
  children, 
  text = 'Loading...', 
  variant = 'light',
  blur = false 
}) => {
  if (!loading) return children;

  return (
    <div className="position-relative">
      {/* Content with optional blur */}
      <div className={blur ? 'filter-blur' : 'opacity-50'}>
        {children}
      </div>
      
      {/* Overlay */}
      <div 
        className={`position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center ${
          variant === 'dark' ? 'bg-dark bg-opacity-75' : 'bg-light bg-opacity-75'
        }`}
        style={{ zIndex: 10 }}
      >
        <div className="text-center">
          <LoadingSpinner 
            size="large" 
            color={variant === 'dark' ? 'white' : 'primary'} 
            text={text} 
          />
        </div>
      </div>
    </div>
  );
};

// Loading Card Placeholder
const LoadingCard = ({ 
  variant = 'product', 
  count = 1, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} variant={variant} />
      ))}
    </div>
  );
};

// Loading List Item
const LoadingListItem = ({ showAvatar = false, lines = 2 }) => {
  return (
    <div className="d-flex align-items-start p-3 border-bottom">
      {showAvatar && (
        <div className="me-3">
          <div 
            className="bg-light rounded-circle animate-pulse" 
            style={{ width: '40px', height: '40px' }}
          />
        </div>
      )}
      <div className="flex-grow-1">
        {Array.from({ length: lines }, (_, index) => (
          <div 
            key={index}
            className={`bg-light rounded animate-pulse mb-2 ${
              index === 0 ? 'h-4' : 'h-3'
            }`}
            style={{ 
              width: index === 0 ? '75%' : '50%',
              height: index === 0 ? '16px' : '12px'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Loading Table Rows
const LoadingTableRows = ({ columns = 4, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex}>
              <div 
                className="bg-light rounded animate-pulse"
                style={{ 
                  height: '16px', 
                  width: colIndex === 0 ? '80%' : '60%' 
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Loading State Manager Component
const LoadingStateManager = ({ 
  loading = false, 
  error = null, 
  empty = false, 
  children,
  loadingComponent = null,
  errorComponent = null,
  emptyComponent = null,
  loadingText = 'Loading...',
  errorText = 'Something went wrong',
  emptyText = 'No data available'
}) => {
  if (loading) {
    return loadingComponent || (
      <div className="text-center py-5">
        <LoadingSpinner size="large" text={loadingText} />
      </div>
    );
  }

  if (error) {
    return errorComponent || (
      <div className="text-center py-5">
        <div className="text-danger mb-3">
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
          </svg>
        </div>
        <p className="text-muted">{errorText}</p>
      </div>
    );
  }

  if (empty) {
    return emptyComponent || (
      <div className="text-center py-5">
        <div className="text-muted mb-3">
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
          </svg>
        </div>
        <p className="text-muted">{emptyText}</p>
      </div>
    );
  }

  return children;
};

// Progress Loading for file uploads or long operations
const ProgressLoading = ({ 
  progress = 0, 
  text = 'Processing...', 
  subtext = '',
  variant = 'primary' 
}) => {
  return (
    <div className="text-center py-4">
      <div className="mb-3">
        <LoadingSpinner size="large" color={variant} text="" />
      </div>
      <h6 className="mb-2">{text}</h6>
      {subtext && <p className="text-muted small mb-3">{subtext}</p>}
      <div className="mx-auto" style={{ maxWidth: '300px' }}>
        <IndeterminateProgressBar 
          variant={variant} 
          label={`${Math.round(progress)}% complete`}
        />
      </div>
    </div>
  );
};

export {
  LoadingButton,
  LoadingOverlay,
  LoadingCard,
  LoadingListItem,
  LoadingTableRows,
  LoadingStateManager,
  ProgressLoading
};

export default LoadingStateManager;