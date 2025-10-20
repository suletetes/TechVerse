import React, { useState, useEffect } from 'react';

const ProgressBar = ({ 
  progress = 0, 
  variant = 'primary', 
  size = 'medium',
  animated = false,
  striped = false,
  showLabel = false,
  label = '',
  className = ''
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animate progress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const sizeClasses = {
    small: 'progress-sm',
    medium: '',
    large: 'progress-lg'
  };

  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info'
  };

  const progressBarClasses = [
    'progress-bar',
    variantClasses[variant],
    striped && 'progress-bar-striped',
    animated && 'progress-bar-animated'
  ].filter(Boolean).join(' ');

  const progressClasses = [
    'progress',
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="progress-container">
      {showLabel && (
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="small text-muted">{label}</span>
          <span className="small text-muted">{Math.round(displayProgress)}%</span>
        </div>
      )}
      <div className={progressClasses}>
        <div
          className={progressBarClasses}
          role="progressbar"
          style={{ 
            width: `${displayProgress}%`,
            transition: 'width 0.3s ease-in-out'
          }}
          aria-valuenow={displayProgress}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
};

// Indeterminate Progress Bar for unknown duration tasks
const IndeterminateProgressBar = ({ 
  variant = 'primary', 
  size = 'medium',
  label = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    small: 'progress-sm',
    medium: '',
    large: 'progress-lg'
  };

  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info'
  };

  const progressClasses = [
    'progress',
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="progress-container">
      {label && (
        <div className="mb-1">
          <span className="small text-muted">{label}</span>
        </div>
      )}
      <div className={progressClasses}>
        <div
          className={`progress-bar progress-bar-striped progress-bar-animated ${variantClasses[variant]}`}
          role="progressbar"
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

// Multi-step Progress Indicator
const StepProgress = ({ 
  steps = [], 
  currentStep = 0, 
  variant = 'primary',
  showLabels = true 
}) => {
  const variantClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info'
  };

  const getStepStatus = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  const getStepClasses = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-white';
      case 'active':
        return `bg-${variant} text-white`;
      case 'pending':
        return 'bg-light text-muted border';
      default:
        return 'bg-light text-muted';
    }
  };

  return (
    <div className="step-progress">
      <div className="d-flex align-items-center justify-content-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="d-flex flex-column align-items-center">
              {/* Step Circle */}
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center ${getStepClasses(getStepStatus(index))}`}
                style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}
              >
                {getStepStatus(index) === 'completed' ? (
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step Label */}
              {showLabels && (
                <span 
                  className={`small mt-2 text-center ${
                    getStepStatus(index) === 'active' ? variantClasses[variant] : 'text-muted'
                  }`}
                  style={{ maxWidth: '80px' }}
                >
                  {step}
                </span>
              )}
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div 
                className="flex-grow-1 mx-2"
                style={{ height: '2px', marginTop: showLabels ? '-20px' : '0' }}
              >
                <div 
                  className={`h-100 ${
                    index < currentStep ? 'bg-success' : 'bg-light'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export { ProgressBar, IndeterminateProgressBar, StepProgress };
export default ProgressBar;