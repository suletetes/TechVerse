import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useModals } from '../../stores/uiStore.js';

/**
 * Accessible Dialog Component using Radix UI
 * Provides modal dialogs with proper focus management and accessibility
 */

export const Dialog = ({
  children,
  open,
  onOpenChange,
  modal = true,
  ...props
}) => {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={modal}
      {...props}
    >
      {children}
    </DialogPrimitive.Root>
  );
};

export const DialogTrigger = React.forwardRef(({ 
  children, 
  asChild = false,
  className = '',
  ...props 
}, ref) => {
  return (
    <DialogPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      className={`dialog-trigger ${className}`}
      {...props}
    >
      {children}
    </DialogPrimitive.Trigger>
  );
});

export const DialogContent = React.forwardRef(({ 
  children,
  className = '',
  showCloseButton = true,
  size = 'medium',
  ...props 
}, ref) => {
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in-0" />
      <DialogPrimitive.Content
        ref={ref}
        className={`
          dialog-content fixed left-1/2 top-1/2 z-50 w-full ${sizeClasses[size]}
          -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg
          animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]
          duration-200 ${className}
        `}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="dialog-close absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export const DialogHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`dialog-header flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props}>
      {children}
    </div>
  );
};

export const DialogTitle = React.forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={`dialog-title text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  );
});

export const DialogDescription = React.forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={`dialog-description text-sm text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </DialogPrimitive.Description>
  );
});

export const DialogFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`dialog-footer flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const DialogClose = React.forwardRef(({ 
  children,
  asChild = false,
  className = '',
  ...props 
}, ref) => {
  return (
    <DialogPrimitive.Close
      ref={ref}
      asChild={asChild}
      className={`dialog-close-button ${className}`}
      {...props}
    >
      {children}
    </DialogPrimitive.Close>
  );
});

// Convenience component for common dialog patterns
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
}) => {
  const variantStyles = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    destructive: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };

  const handleConfirm = () => {
    onConfirm?.();
    if (!loading) {
      onOpenChange?.(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="mt-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${variantStyles[variant]} focus:ring-blue-500`}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Hook for managing dialogs with Zustand store
export const useDialog = (dialogName) => {
  const { modals, modalData, openModal, closeModal } = useModals();
  
  return {
    isOpen: modals[dialogName] || false,
    data: modalData[dialogName],
    open: (data) => openModal(dialogName, data),
    close: () => closeModal(dialogName),
  };
};

export default Dialog;