import React, { createContext, useContext } from 'react';
import { FormProvider as RHFFormProvider } from 'react-hook-form';

/**
 * Enhanced Form Provider with React Hook Form
 * Provides form context and utilities for all form components
 */

const FormContext = createContext({});

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

export const FormProvider = ({ 
  children, 
  methods, 
  onSubmit, 
  className = '',
  autoSave = false,
  autoSaveDelay = 1000,
  ...props 
}) => {
  const {
    handleSubmit,
    formState: { isSubmitting, isDirty, isValid },
    watch,
    reset,
    setValue,
    getValues,
  } = methods;

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave || !isDirty) return;

    const subscription = watch((data) => {
      const timeoutId = setTimeout(() => {
        // Save to localStorage or call API
        const formData = getValues();
        localStorage.setItem('form-autosave', JSON.stringify(formData));
        // Form auto-saved silently
      }, autoSaveDelay);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [watch, isDirty, autoSave, autoSaveDelay, getValues]);

  // Load auto-saved data on mount
  React.useEffect(() => {
    if (autoSave) {
      const savedData = localStorage.getItem('form-autosave');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          Object.keys(parsedData).forEach(key => {
            setValue(key, parsedData[key]);
          });
        } catch (error) {
          console.warn('Failed to load auto-saved form data:', error);
        }
      }
    }
  }, [autoSave, setValue]);

  const contextValue = {
    isSubmitting,
    isDirty,
    isValid,
    reset,
    setValue,
    getValues,
    clearAutoSave: () => {
      localStorage.removeItem('form-autosave');
    },
  };

  return (
    <FormContext.Provider value={contextValue}>
      <RHFFormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`form ${className}`}
          noValidate
          {...props}
        >
          {children}
        </form>
      </RHFFormProvider>
    </FormContext.Provider>
  );
};

export default FormProvider;