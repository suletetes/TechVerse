import React from 'react';
import { useNotification } from '../../context';
import './NotificationContainer.css';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠'}
              {notification.type === 'info' && 'ℹ'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
