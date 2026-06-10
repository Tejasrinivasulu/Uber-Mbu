
import React, { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationToast: React.FC = () => {
  const { notification, hideNotification } = useNotification();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 5000); // Auto-hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [notification, hideNotification]);

  if (!notification) {
    return null;
  }

  return (
    <div
      className={`notification-toast ${notification ? 'show' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-content">
        <i className="fas fa-bell toast-icon" aria-hidden="true"></i>
        <div className="toast-message">
          <div className="toast-title">{notification.title}</div>
          <div className="toast-body">{notification.message}</div>
        </div>
      </div>
      <button onClick={hideNotification} className="toast-close-btn" aria-label="Close notification">&times;</button>
    </div>
  );
};

export default NotificationToast;