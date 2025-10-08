import React from "react";

const AdminSettings = ({ 
    adminData, 
    passwordData, 
    setPasswordData, 
    handlePasswordInputChange, 
    handlePasswordChange,
    adminProfileData,
    isEditingProfile,
    setIsEditingProfile,
    handleAdminProfileInputChange,
    handleSaveAdminProfile,
    handleAdminAvatarChange,
    toggleTwoFactor
}) => (
    <div className="store-card fill-card">
        <h3 className="tc-6533 bold-text mb-4">Admin Settings</h3>
        
        {/* Admin Profile */}
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="tc-6533 mb-0 d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-primary">
                        <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    Admin Profile
                </h5>
                <button 
                    className={`btn btn-sm ${isEditingProfile ? 'btn-success' : 'btn-outline-primary'} btn-rd`}
                    onClick={isEditingProfile ? handleSaveAdminProfile : () => setIsEditingProfile(true)}
                >
                    {isEditingProfile ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="white">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            Save Changes
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                            </svg>
                            Edit Profile
                        </>
                    )}
                </button>
            </div>
            
            <div className="card border-0 bg-light rounded-3">
                <div className="card-body p-4">
                    {/* Avatar Section */}
                    <div className="text-center mb-4">
                        <div className="position-relative d-inline-block">
                            {adminProfileData?.avatar ? (
                                <img 
                                    src={adminProfileData.avatar} 
                                    alt="Admin Avatar" 
                                    className="rounded-circle border border-3 border-white shadow"
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                />
                            ) : (
                                <div 
                                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center border border-3 border-white shadow"
                                    style={{ width: '100px', height: '100px' }}
                                >
                                    <span className="text-white fw-bold fs-3">
                                        {adminProfileData?.name?.split(' ').map(n => n[0]).join('') || 'SJ'}
                                    </span>
                                </div>
                            )}
                            {isEditingProfile && (
                                <label className="position-absolute bottom-0 end-0 btn btn-sm btn-primary rounded-circle p-2" style={{ cursor: 'pointer' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                    <input 
                                        type="file" 
                                        className="d-none" 
                                        accept="image/*"
                                        onChange={handleAdminAvatarChange}
                                    />
                                </label>
                            )}
                        </div>
                        {isEditingProfile && (
                            <small className="text-muted d-block mt-2">Click the camera icon to change your avatar</small>
                        )}
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label tc-6533 fw-semibold">Full Name</label>
                            <input 
                                type="text" 
                                name="name"
                                className="form-control" 
                                value={adminProfileData?.name || ''} 
                                onChange={handleAdminProfileInputChange}
                                readOnly={!isEditingProfile}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label tc-6533 fw-semibold">Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                className="form-control" 
                                value={adminProfileData?.email || ''} 
                                onChange={handleAdminProfileInputChange}
                                readOnly={!isEditingProfile}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label tc-6533 fw-semibold">Phone Number</label>
                            <input 
                                type="tel" 
                                name="phone"
                                className="form-control" 
                                value={adminProfileData?.phone || ''} 
                                onChange={handleAdminProfileInputChange}
                                readOnly={!isEditingProfile}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label tc-6533 fw-semibold">Role</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={adminProfileData?.role || ''} 
                                readOnly
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label tc-6533 fw-semibold">Department</label>
                            <input 
                                type="text" 
                                name="department"
                                className="form-control" 
                                value={adminProfileData?.department || ''} 
                                onChange={handleAdminProfileInputChange}
                                readOnly={!isEditingProfile}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label tc-6533 fw-semibold">Last Login</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={adminProfileData?.lastLogin || ''} 
                                readOnly
                            />
                        </div>
                    </div>

                    {isEditingProfile && (
                        <div className="d-flex gap-2 mt-3">
                            <button 
                                className="btn btn-success btn-rd px-4"
                                onClick={handleSaveAdminProfile}
                            >
                                Save Changes
                            </button>
                            <button 
                                className="btn btn-outline-secondary btn-rd px-4"
                                onClick={() => setIsEditingProfile(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Security Settings */}
        <div className="mb-4">
            <h5 className="tc-6533 mb-3 d-flex align-items-center">
                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-warning">
                    <path fill="currentColor" d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10V11.5H13.8V10C13.8,8.7 12.8,8.2 12,8.2Z"/>
                </svg>
                Security Settings
            </h5>
            <div className="card border-0 bg-light rounded-3">
                <div className="card-body p-4">
                    {/* Two-Factor Authentication */}
                    <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded-3 border">
                        <div>
                            <h6 className="mb-1 tc-6533">Two-Factor Authentication</h6>
                            <small className="text-muted">Add an extra layer of security to your account</small>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className={`badge me-2 ${adminProfileData?.twoFactorEnabled ? 'bg-success' : 'bg-warning'}`}>
                                {adminProfileData?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <button 
                                className={`btn btn-sm ${adminProfileData?.twoFactorEnabled ? 'btn-outline-danger' : 'btn-success'} btn-rd`}
                                onClick={toggleTwoFactor}
                            >
                                {adminProfileData?.twoFactorEnabled ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    </div>

                    {/* Notification Preferences */}
                    <div className="mb-3">
                        <h6 className="tc-6533 mb-3">Notification Preferences</h6>
                        <div className="row">
                            <div className="col-md-4 mb-2">
                                <div className="form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        name="emailNotifications"
                                        checked={adminProfileData?.emailNotifications || false}
                                        onChange={handleAdminProfileInputChange}
                                    />
                                    <label className="form-check-label tc-6533">
                                        Email Notifications
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-4 mb-2">
                                <div className="form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        name="smsNotifications"
                                        checked={adminProfileData?.smsNotifications || false}
                                        onChange={handleAdminProfileInputChange}
                                    />
                                    <label className="form-check-label tc-6533">
                                        SMS Notifications
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-4 mb-2">
                                <div className="form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        name="loginAlerts"
                                        checked={adminProfileData?.loginAlerts || false}
                                        onChange={handleAdminProfileInputChange}
                                    />
                                    <label className="form-check-label tc-6533">
                                        Login Alerts
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
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
