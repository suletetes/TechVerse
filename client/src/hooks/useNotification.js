import { useContext } from 'react';
import NotificationContext from '../context/NotificationContext';

/**
 * Custom hook to access notification system
 * Provides methods to show different types of notifications
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return {
    // State
    notifications: context.notifications,

    // Methods
    addNotification: context.addNotification,
    removeNotification: context.removeNotification,
    clearNotifications: context.clearNotifications,

    // Convenience methods
    showSuccess: context.showSuccess,
    showError: context.showError,
    showWarning: context.showWarning,
    showInfo: context.showInfo,

    // Alias for dismiss
    dismiss: context.removeNotification
  };
};

export default useNotification;
