import React from "react";

const AdminSettings = ({ adminData, passwordData, setPasswordData, handlePasswordInputChange, handlePasswordChange }) => (
    <div className="store-card fill-card">
        <h3 className="tc-6533 bold-text mb-4">Admin Settings</h3>
        {/* Admin Profile */}
        <div className="mb-4">
            <h5 className="tc-6533 mb-3">Admin Profile</h5>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Name</label>
                    <input type="text" className="form-control" value={adminData.name} readOnly />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Role</label>
                    <input type="text" className="form-control" value={adminData.role} readOnly />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Email</label>
                    <input type="email" className="form-control" value={adminData.email} readOnly />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Last Login</label>
                    <input type="text" className="form-control" value={adminData.lastLogin} readOnly />
                </div>
            </div>
        </div>
        {/* Permissions */}
        <div className="mb-4">
            <h5 className="tc-6533 mb-3">Permissions</h5>
            <div className="row">
                {adminData.permissions.map((permission) => (
                    <div key={permission} className="col-md-3 mb-2">
                        <div className="form-check">
                            <input className="form-check-input" type="checkbox" defaultChecked disabled />
                            <label className="form-check-label tc-6533 text-capitalize">
                                {permission}
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        {/* Password Management */}
        <div className="mb-4">
            <h5 className="tc-6533 mb-3 d-flex align-items-center">
                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-warning">
                    <path fill="currentColor" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                </svg>
                Change Password
            </h5>
            <div className="card border-0 bg-light rounded-3">
                <div className="card-body p-4">
                    <form onSubmit={handlePasswordChange}>
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label tc-6533 fw-semibold">Current Password *</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    className="form-control"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label tc-6533 fw-semibold">New Password *</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    className="form-control"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder="Enter new password"
                                    minLength="8"
                                    required
                                />
                                <small className="text-muted">Minimum 8 characters</small>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label tc-6533 fw-semibold">Confirm New Password *</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-control"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                            <button
                                type="submit"
                                className="btn btn-warning btn-rd px-4"
                                disabled={
                                    !passwordData.currentPassword ||
                                    !passwordData.newPassword ||
                                    !passwordData.confirmPassword ||
                                    passwordData.newPassword !== passwordData.confirmPassword
                                }
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="white">
                                    <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                                </svg>
                                Change Password
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-rd px-4"
                                onClick={() => setPasswordData({
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: ''
                                })}
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        {/* System Settings */}
        <div className="mb-4">
            <h5 className="tc-6533 mb-3 d-flex align-items-center">
                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-primary">
                    <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                </svg>
                System Settings
            </h5>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Site Name</label>
                    <input type="text" className="form-control" defaultValue="TechVerse" />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Currency</label>
                    <select className="form-select">
                        <option value="GBP">GBP (£)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                    </select>
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Tax Rate (%)</label>
                    <input type="number" className="form-control" defaultValue="20" />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Free Shipping Threshold</label>
                    <input type="number" className="form-control" defaultValue="50" />
                </div>
            </div>
        </div>
        <div className="d-flex gap-2">
            <button className="btn btn-c-2101 btn-rd">Save Changes</button>
            <button className="btn btn-outline-secondary btn-rd">Reset</button>
        </div>
    </div>
);

export default AdminSettings;
