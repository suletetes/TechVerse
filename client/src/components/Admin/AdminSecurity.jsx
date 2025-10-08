import React from 'react';

const AdminSecurity = ({ 
    adminProfileData, 
    toggleTwoFactor, 
    passwordData, 
    handlePasswordInputChange, 
    handlePasswordChange 
}) => {
    return (
        <div className="row">
            <div className="col-12 mb-4">
                <h2>Security & Sessions</h2>
                <p className="text-muted">Manage your security settings and active sessions</p>
            </div>
            
            {/* Active Sessions */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 d-flex align-items-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-primary">
                                <path fill="currentColor" d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
                            </svg>
                            Active Sessions
                        </h5>
                        <button className="btn btn-sm btn-outline-danger">
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4M15.5,17L20.5,12L15.5,7V10.5H9.5V13.5H15.5V17Z"/>
                            </svg>
                            End All Sessions
                        </button>
                    </div>
                    <div className="card-body p-0">
                        <div className="list-group list-group-flush">
                            <div className="list-group-item d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-success bg-opacity-10 text-success p-2 me-3">
                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Current Session</h6>
                                        <div className="d-flex align-items-center text-muted small">
                                            <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 17.5L8.5 15 12 12.5 15.5 15 12 17.5z"/>
                                            </svg>
                                            <span className="me-3">Chrome on macOS</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                            </svg>
                                            <span className="me-3">London, UK</span>
                                            <span>Active now</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="badge bg-success">Current</span>
                            </div>
                            <div className="list-group-item d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-info bg-opacity-10 text-info p-2 me-3">
                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M7 1C5.9 1 5 1.9 5 3V5H3C1.9 5 1 5.9 1 7V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V7C23 5.9 22.1 5 21 5H19V3C19 1.9 18.1 1 17 1H7M7 3H17V7H7V3M3 7H21V19H3V7Z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h6 className="mb-1">Mobile Session</h6>
                                        <div className="d-flex align-items-center text-muted small">
                                            <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 17.5L8.5 15 12 12.5 15.5 15 12 17.5z"/>
                                            </svg>
                                            <span className="me-3">Safari on iOS</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                            </svg>
                                            <span className="me-3">London, UK</span>
                                            <span>2 hours ago</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-outline-danger">End Session</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="col-md-6 mb-4">
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">Security Settings</h5>
                    </div>
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 className="mb-1">Two-Factor Authentication</h6>
                                <small className="text-muted">Add an extra layer of security to your account</small>
                            </div>
                            <div className="form-check form-switch">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    checked={adminProfileData.twoFactorEnabled}
                                    onChange={toggleTwoFactor}
                                />
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 className="mb-1">Email Notifications</h6>
                                <small className="text-muted">Receive security alerts via email</small>
                            </div>
                            <div className="form-check form-switch">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    checked={adminProfileData.emailNotifications}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-1">Login Alerts</h6>
                                <small className="text-muted">Get notified of new login attempts</small>
                            </div>
                            <div className="form-check form-switch">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    checked={adminProfileData.loginAlerts}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="col-md-6 mb-4">
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">Change Password</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handlePasswordChange}>
                            <div className="mb-3">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordInputChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                Update Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSecurity;