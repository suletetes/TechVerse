import { useForm as useRHF } from 'react-hook-form';
import { useCallback, useEffect } from 'react';
import { useNotifications } from '../stores/uiStore.js';

/**
 * Enhanced useForm hook with additional utilities
 * Wraps React Hook Form with common patterns and error handling
 */

export const useForm = ({
  defaultValues = {},
  resolver,
  mode = 'onChange',
  reValidateMode = 'onChange',
  shouldFocusError = true,
  shouldUnregister = false,
  shouldUseNativeValidation = false,
  criteriaMode = 'firstError',
  delayError = undefined,
  onSubmit,
  onError,
  onSuccess,
  transformSubmitData,
  resetOnSuccess = false,
  showSuccessMessage = true,
  showErrorMessage = true,
  successMessage = 'Operation completed successfully',
  ...options
}) => {
  const { showSuccess, showError } = useNotifications();
  
  const methods = useRHF({
    defaultValues,
    resolver,
    mode,
    reValidateMode,
    shouldFocusError,
    shouldUnregister,
    shouldUseNativeValidation,
    criteriaMode,
    delayError,
    ...options,
  });

  const {
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = methods;

  // Enhanced submit handler
  const onSubmitHandler = useCallback(
    async (data) => {
      try {
        // Transform data if transformer provided
        const submitData = transformSubmitData ? transformSubmitData(data) : data;
        
        // Call the actual submit function
        const result = await onSubmit?.(submitData);
        
        // Handle success
        if (onSuccess) {
          await onSuccess(result, data);
        }
        
        // Show success message
        if (showSuccessMessage) {
          showSuccess(successMessage);
        }
        
        // Reset form if requested
        if (resetOnSuccess) {
          reset();
        }
        
        return result;
      } catch (error) {
        console.error('Form submission error:', error);
        
        // Handle validation errors from server
        if (error.data?.errors) {
          Object.entries(error.data.errors).forEach(([field, message]) => {
            setError(field, {
              type: 'server',
              message: Array.isArray(message) ? message[0] : message,
            });
          });
        }
        
        // Call error handler
        if (onError) {
          await onError(error, data);
        }
        
        // Show error message
        if (showErrorMessage) {
          const errorMessage = error.message || 'An error occurred while submitting the form';
          showError(errorMessage);
        }
        
        throw error;
      }
    },
    [
      onSubmit,
      onSuccess,
      onError,
      transformSubmitData,
      resetOnSuccess,
      showSuccessMessage,
      showErrorMessage,
      successMessage,
      showSuccess,
      showError,
      setError,
      reset,
    ]
  );

  // Enhanced error handler
  const onErrorHandler = useCallback(
    (errors) => {
      console.error('Form validation errors:', errors);
      
      // Show first error message
      const firstError = Object.values(errors)[0];
      if (firstError?.message && showErrorMessage) {
        showError(firstError.message);
      }
    },
    [showError, showErrorMessage]
  );

  // Clear server errors when user starts typing
  useEffect(() => {
    const subscription = methods.watch(() => {
      // Clear server errors when form data changes
      Object.keys(errors).forEach((fieldName) => {
        if (errors[fieldName]?.type === 'server') {
          clearErrors(fieldName);
        }
      });
    });

    return () => subscription.unsubscribe();
  }, [methods, errors, clearErrors]);

  // Utility functions
  const utilities = {
    // Set multiple errors at once
    setErrors: (errorObj) => {
      Object.entries(errorObj).forEach(([field, message]) => {
        setError(field, {
          type: 'manual',
          message: Array.isArray(message) ? message[0] : message,
        });
      });
    },

    // Clear all errors
    clearAllErrors: () => {
      clearErrors();
    },

    // Reset form with new default values
    resetWithDefaults: (newDefaults) => {
      reset(newDefaults);
    },

    // Check if form has any errors
    hasErrors: () => Object.keys(errors).length > 0,

    // Get first error message
    getFirstError: () => {
      const firstError = Object.values(errors)[0];
      return firstError?.message || null;
    },

    // Validate specific field
    validateField: async (fieldName) => {
      return methods.trigger(fieldName);
    },

    // Validate all fields
    validateAll: async () => {
      return methods.trigger();
    },

    // Get form data without submitting
    getFormData: () => {
      const data = methods.getValues();
      return transformSubmitData ? transformSubmitData(data) : data;
    },

    // Check if form is dirty (has changes)
    isDirty: () => methods.formState.isDirty,

    // Check if form is valid
    isValid: () => methods.formState.isValid,

    // Submit form programmatically
    submitForm: () => {
      return handleSubmit(onSubmitHandler, onErrorHandler)();
    },
  };

  return {
    ...methods,
    onSubmit: handleSubmit(onSubmitHandler, onErrorHandler),
    utilities,
  };
};

// Specialized hooks for common form patterns
export const useLoginForm = (onSubmit, options = {}) => {
  return useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onBlur',
    onSubmit,
    successMessage: 'Login successful',
    ...options,
  });
};

export const useRegistrationForm = (onSubmit, options = {}) => {
  return useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onBlur',
    onSubmit,
    successMessage: 'Registration successful',
    resetOnSuccess: true,
    ...options,
  });
};

export const useProfileForm = (initialData = {}, onSubmit, options = {}) => {
  return useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      ...initialData,
    },
    mode: 'onBlur',
    onSubmit,
    successMessage: 'Profile updated successfully',
    ...options,
  });
};

export const usePasswordChangeForm = (onSubmit, options = {}) => {
  return useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
    onSubmit,
    successMessage: 'Password changed successfully',
    resetOnSuccess: true,
    ...options,
  });
};

export const useAddressForm = (initialData = {}, onSubmit, options = {}) => {
  return useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: '',
      isDefault: false,
      ...initialData,
    },
    mode: 'onBlur',
    onSubmit,
    successMessage: 'Address saved successfully',
    ...options,
  });
};

export const useContactForm = (onSubmit, options = {}) => {
  return useForm({
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    mode: 'onBlur',
    onSubmit,
    successMessage: 'Message sent successfully',
    resetOnSuccess: true,
    ...options,
  });
};

export const useSearchForm = (onSubmit, options = {}) => {
  return useForm({
    defaultValues: {
      query: '',
      category: '',
      priceMin: '',
      priceMax: '',
      sortBy: 'relevance',
      inStock: false,
    },
    mode: 'onChange',
    onSubmit,
    showSuccessMessage: false,
    showErrorMessage: false,
    ...options,
  });
};

export default useForm;