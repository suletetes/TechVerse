import React from 'react';
import { useFormContext } from './FormProvider.jsx';

/**
 * Form Button Component
 * Handles form submission states and provides consistent styling
 */

export const FormButton = ({
  type = 'submit',
  variant = 'primary',
  size = 'medium',
  children,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  className = '',
  requireValid = true,
  requireDirty = false,
  onClick,
  ...props
}) => {
  const { isSubmitting, isValid, isDirty } = useFormContext();

  const isDisabled = disabled || 
    (type === 'submit' && isSubmitting) ||
    (requireValid && !isValid) ||
    (requireDirty && !isDirty);

  const isLoading = loading || (type === 'submit' && isSubmitting);

  const buttonClasses = [
    'form-button',
    `form-button--${variant}`,
    `form-button--${size}`,
    isDisabled && 'form-button--disabled',
    isLoading && 'form-button--loading',
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {isLoading && (
        <span className="form-button__spinner" aria-hidden="true">
          <svg className="animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      <span className="form-button__text">
        {isLoading ? loadingText : children}
      </span>
    </button>
  );
};

export const SubmitButton = (props) => (
  <FormButton type="submit" {...props} />
);

export const ResetButton = ({ onReset, ...props }) => {
  const { reset, clearAutoSave } = useFormContext();

  const handleReset = (e) => {
    e.preventDefault();
    reset();
    clearAutoSave();
    onReset?.();
  };

  return (
    <FormButton
      type="button"
      variant="secondary"
      onClick={handleReset}
      requireValid={false}
      requireDirty={false}
      {...props}
    />
  );
};

export const CancelButton = (props) => (
  <FormButton
    type="button"
    variant="outline"
    requireValid={false}
    requireDirty={false}
    {...props}
  />
);

export default FormButton;