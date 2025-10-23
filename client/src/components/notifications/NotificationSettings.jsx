import React, { useState } from 'react';
import { usePushNotifications, useNotificationPreferences } from '../../hooks/usePushNotifications';

const NotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading: pushLoading,
    error: pushError,
    requestPermission,
    unsubscribe,
    sendTestNotification,
    isEnabled
  } = usePushNotifications();

  const {
    preferences,
    isLoading: prefsLoading,
    error: prefsError,
    updatePreferences
  } = useNotificationPreferences();

  const [localPreferences, setLocalPreferences] = useState(preferences || {
    orderUpdates: true,
    inventoryAlerts: false,
    promotions: true,
    securityAlerts: true,
    chatMessages: true,
    adminNotifications: false
  });

  const [isSaving, setIsSaving] = useState(false);

  // Update local preferences when loaded from server
  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await requestPermission();
    }
  };

  const handlePreferenceChange = (key, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(localPreferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { text: 'Granted', color: 'success' };
      case 'denied':
        return { text: 'Denied', color: 'danger' };
      default:
        return { text: 'Not requested', color: 'warning' };
    }
  };

  const permissionStatus = getPermissionStatus();

  if (!isSupported) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="text-muted mb-3">
            <svg width="48" height="48" viewBox="0 0 24 24" className="mb-2">
              <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H13V7H11M11,15V17H13V15H11Z" />
            </svg>
          </div>
          <h5>Push Notifications Not Supported</h5>
          <p className="text-muted">
            Your browser doesn't support push notifications. Please use a modern browser 
            like Chrome, Firefox, or Safari to enable this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">🔔 Push Notification Settings</h5>
            </div>
            <div className="card-body">
              {/* Permission Status */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-1">Notification Status</h6>
                      <small className="text-muted">
                        Current permission and subscription status
                      </small>
                    </div>
                    <div className="text-end">
                      <span className={`badge bg-${permissionStatus.color} mb-1`}>
                        {permissionStatus.text}
                      </span>
                      <br />
                      <small className={`text-${isSubscribed ? 'success' : 'muted'}`}>
                        {isSubscribed ? 'Subscribed' : 'Not subscribed'}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      className={`btn ${isSubscribed ? 'btn-outline-danger' : 'btn-primary'}`}
                      onClick={handleToggleNotifications}
                      disabled={pushLoading}
                    >
                      {pushLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {isSubscribed ? 'Unsubscribing...' : 'Subscribing...'}
                        </>
                      ) : (
                        <>
                          {isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
                        </>
                      )}
                    </button>
                    
                    {isEnabled && (
                      <button
                        className="btn btn-outline-secondary"
                        onClick={handleTestNotification}
                        disabled={pushLoading}
                      >
                        Test
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {(pushError || prefsError) && (
                <div className="alert alert-danger">
                  <strong>Error:</strong> {pushError || prefsError}
                </div>
              )}

              {/* Notification Preferences */}
              {isEnabled && (
                <>
                  <hr />
                  <h6 className="mb-3">Notification Preferences</h6>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="notification-preference mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="orderUpdates"
                            checked={localPreferences.orderUpdates}
                            onChange={(e) => handlePreferenceChange('orderUpdates', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="orderUpdates">
                            <strong>Order Updates</strong>
                            <br />
                            <small className="text-muted">
                              Get notified when your order status changes
                            </small>
                          </label>
                        </div>
                      </div>

                      <div className="notification-preference mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="promotions"
                            checked={localPreferences.promotions}
                            onChange={(e) => handlePreferenceChange('promotions', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="promotions">
                            <strong>Promotions & Offers</strong>
                            <br />
                            <small className="text-muted">
                              Receive notifications about sales and special offers
                            </small>
                          </label>
                        </div>
                      </div>

                      <div className="notification-preference mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="securityAlerts"
                            checked={localPreferences.securityAlerts}
                            onChange={(e) => handlePreferenceChange('securityAlerts', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="securityAlerts">
                            <strong>Security Alerts</strong>
                            <br />
                            <small className="text-muted">
                              Important security notifications (recommended)
                            </small>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="notification-preference mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="chatMessages"
                            checked={localPreferences.chatMessages}
                            onChange={(e) => handlePreferenceChange('chatMessages', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="chatMessages">
                            <strong>Chat Messages</strong>
                            <br />
                            <small className="text-muted">
                              Get notified of new chat messages
                            </small>
                          </label>
                        </div>
                      </div>

                      <div className="notification-preference mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="inventoryAlerts"
                            checked={localPreferences.inventoryAlerts}
                            onChange={(e) => handlePreferenceChange('inventoryAlerts', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="inventoryAlerts">
                            <strong>Inventory Alerts</strong>
                            <br />
                            <small className="text-muted">
                              Get notified when items are back in stock
                            </small>
                          </label>
                        </div>
                      </div>

                      <div className="notification-preference mb-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="adminNotifications"
                            checked={localPreferences.adminNotifications}
                            onChange={(e) => handlePreferenceChange('adminNotifications', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="adminNotifications">
                            <strong>Admin Notifications</strong>
                            <br />
                            <small className="text-muted">
                              System and administrative notifications
                            </small>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={handleSavePreferences}
                      disabled={isSaving || prefsLoading}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Preferences'
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Information */}
              <hr />
              <div className="row">
                <div className="col-12">
                  <h6 className="mb-2">About Push Notifications</h6>
                  <ul className="list-unstyled small text-muted">
                    <li>• Notifications work even when the website is closed</li>
                    <li>• You can disable notifications at any time</li>
                    <li>• We respect your privacy and won't spam you</li>
                    <li>• You can customize which types of notifications you receive</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;