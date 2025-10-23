import React from 'react';
import { useController } from 'react-hook-form';
import { useFormContext } from './FormProvider.jsx';

/**
 * Universal Form Field Component
 * Handles all input types with React Hook Form integration
 */

export const FormField = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  helpText,
  options = [], // For select, radio, checkbox groups
  rows = 4, // For textarea
  accept, // For file inputs
  multiple = false, // For file inputs and selects
  min,
  max,
  step,
  pattern,
  autoComplete,
  autoFocus = false,
  readOnly = false,
  ...props
}) => {
  const { isSubmitting } = useFormContext();
  
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error, isDirty, isTouched },
  } = useController({
    name,
    defaultValue: getDefaultValue(type, multiple),
  });

  const fieldId = `field-${name}`;
  const isInvalid = !!error;
  const showError = isInvalid && isTouched;

  // Handle different input types
  const renderInput = () => {
    const baseProps = {
      id: fieldId,
      name,
      ref,
      onBlur,
      disabled: disabled || isSubmitting,
      className: `form-input ${className} ${isInvalid ? 'error' : ''} ${isDirty ? 'dirty' : ''}`,
      autoComplete,
      autoFocus,
      readOnly,
      ...props,
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...baseProps}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
          />
        );

      case 'select':
        return (
          <select
            {...baseProps}
            value={value || (multiple ? [] : '')}
            onChange={onChange}
            multiple={multiple}
          >
            {placeholder && !multiple && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        if (options.length > 0) {
          // Checkbox group
          return (
            <div className="checkbox-group">
              {options.map((option) => (
                <label key={option.value} className="checkbox-item">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onChange={(e) => {
                      const newValue = Array.isArray(value) ? [...value] : [];
                      if (e.target.checked) {
                        newValue.push(option.value);
                      } else {
                        const index = newValue.indexOf(option.value);
                        if (index > -1) {
                          newValue.splice(index, 1);
                        }
                      }
                      onChange(newValue);
                    }}
                    disabled={disabled || isSubmitting || option.disabled}
                  />
                  <span className="checkbox-label">{option.label}</span>
                </label>
              ))}
            </div>
          );
        } else {
          // Single checkbox
          return (
            <input
              {...baseProps}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
          );
        }

      case 'radio':
        return (
          <div className="radio-group">
            {options.map((option) => (
              <label key={option.value} className="radio-item">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                  disabled={disabled || isSubmitting || option.disabled}
                />
                <span className="radio-label">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            {...baseProps}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => {
              const files = Array.from(e.target.files);
              onChange(multiple ? files : files[0] || null);
            }}
          />
        );

      case 'number':
        return (
          <input
            {...baseProps}
            type="number"
            value={value || ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? '' : Number(e.target.value);
              onChange(numValue);
            }}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
          />
        );

      case 'date':
      case 'datetime-local':
      case 'time':
        return (
          <input
            {...baseProps}
            type={type}
            value={value || ''}
            onChange={onChange}
            min={min}
            max={max}
          />
        );

      case 'range':
        return (
          <div className="range-input">
            <input
              {...baseProps}
              type="range"
              value={value || min || 0}
              onChange={(e) => onChange(Number(e.target.value))}
              min={min}
              max={max}
              step={step}
            />
            <span className="range-value">{value || min || 0}</span>
          </div>
        );

      case 'color':
        return (
          <input
            {...baseProps}
            type="color"
            value={value || '#000000'}
            onChange={onChange}
          />
        );

      default:
        // text, email, password, tel, url, search, etc.
        return (
          <input
            {...baseProps}
            type={type}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            pattern={pattern}
            minLength={min}
            maxLength={max}
          />
        );
    }
  };

  return (
    <div className={`form-field ${containerClassName} ${showError ? 'has-error' : ''}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className={`form-label ${labelClassName} ${required ? 'required' : ''}`}
        >
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className="form-input-container">
        {renderInput()}
        
        {showError && (
          <div className={`form-error ${errorClassName}`}>
            {error.message}
          </div>
        )}
        
        {helpText && !showError && (
          <div className="form-help-text">
            {helpText}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get default values based on input type
const getDefaultValue = (type, multiple) => {
  switch (type) {
    case 'checkbox':
      return multiple ? [] : false;
    case 'select':
      return multiple ? [] : '';
    case 'file':
      return multiple ? [] : null;
    case 'number':
    case 'range':
      return 0;
    default:
      return '';
  }
};

export default FormField;