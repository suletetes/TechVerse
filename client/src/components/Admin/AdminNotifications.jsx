import React from 'react';

const AdminNotifications = ({ 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification 
}) => {
    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Notifications</h5>
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={markAllNotificationsAsRead}
                            >
                                Mark All Read
                            </button>
                            <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setNotifications([])}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {notifications.length === 0 ? (
                            <div className="text-center py-5">
                                <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                                    <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                                </svg>
                                <p className="text-muted">No notifications</p>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {notifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`list-group-item d-flex justify-content-between align-items-start ${!notification.read ? 'bg-light' : ''}`}
                                    >
                                        <div className="d-flex align-items-start">
                                            <div className={`rounded-circle p-2 me-3 ${
                                                notification.type === 'order' ? 'bg-primary bg-opacity-10 text-primary' :
                                                notification.type === 'stock' ? 'bg-warning bg-opacity-10 text-warning' :
                                                'bg-info bg-opacity-10 text-info'
                                            }`}>
                                                <svg width="16" height="16" viewBox="0 0 24 24">
                                                    {notification.type === 'order' && (
                                                        <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                                                    )}
                                                    {notification.type === 'stock' && (
                                                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                    )}
                                                    {notification.type === 'user' && (
                                                        <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                    )}
                                                </svg>
                                            </div>
                                            <div>
                                                <h6 className="mb-1">{notification.title}</h6>
                                                <p className="mb-1 text-muted">{notification.message}</p>
                                                <small className="text-muted">{notification.time}</small>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-1">
                                            {!notification.read && (
                                                <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => markNotificationAsRead(notification.id)}
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => deleteNotification(notification.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;