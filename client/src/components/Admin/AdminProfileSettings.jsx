import React from 'react';

const AdminProfileSettings = ({ 
    adminProfileData, 
    isEditingProfile, 
    setIsEditingProfile, 
    handleAdminProfileInputChange, 
    handleSaveAdminProfile, 
    handleAdminAvatarChange 
}) => {
    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2>Profile Settings</h2>
                        <p className="text-muted">Manage your admin profile information</p>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                    >
                        {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
            </div>

            {/* Profile Information */}
            <div className="col-md-8">
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">Personal Information</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    value={adminProfileData.name}
                                    onChange={handleAdminProfileInputChange}
                                    disabled={!isEditingProfile}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    value={adminProfileData.email}
                                    onChange={handleAdminProfileInputChange}
                                    disabled={!isEditingProfile}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    name="phone"
                                    value={adminProfileData.phone}
                                    onChange={handleAdminProfileInputChange}
                                    disabled={!isEditingProfile}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Department</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="department"
                                    value={adminProfileData.department}
                                    onChange={handleAdminProfileInputChange}
                                    disabled={!isEditingProfile}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Role</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={adminProfileData.role}
                                    disabled
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Last Login</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={new Date(adminProfileData.lastLogin).toLocaleString()}
                                    disabled
                                />
                            </div>
                        </div>

                        {/* Notification Preferences */}
                        <hr className="my-4" />
                        <h6 className="mb-3">Notification Preferences</h6>
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="emailNotifications"
                                        checked={adminProfileData.emailNotifications}
                                        onChange={handleAdminProfileInputChange}
                                        disabled={!isEditingProfile}
                                    />
                                    <label className="form-check-label">
                                        Email Notifications
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="smsNotifications"
                                        checked={adminProfileData.smsNotifications}
                                        onChange={handleAdminProfileInputChange}
                                        disabled={!isEditingProfile}
                                    />
                                    <label className="form-check-label">
                                        SMS Notifications
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="loginAlerts"
                                        checked={adminProfileData.loginAlerts}
                                        onChange={handleAdminProfileInputChange}
                                        disabled={!isEditingProfile}
                                    />
                                    <label className="form-check-label">
                                        Login Alerts
                                    </label>
                                </div>
                            </div>
                        </div>

                        {isEditingProfile && (
                            <div className="d-flex gap-2 mt-4">
                                <button 
                                    className="btn btn-success"
                                    onClick={handleSaveAdminProfile}
                                >
                                    Save Changes
                                </button>
                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={() => setIsEditingProfile(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Picture & Permissions */}
            <div className="col-md-4">
                {/* Profile Picture */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Profile Picture</h5>
                    </div>
                    <div className="card-body text-center">
                        <div className="mb-3">
                            {adminProfileData.avatar ? (
                                <img
                                    src={adminProfileData.avatar}
                                    alt={adminProfileData.name}
                                    className="rounded-circle"
                                    width="120"
                                    height="120"
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center mx-auto" style={{ width: '120px', height: '120px' }}>
                                    <span className="text-white fw-bold" style={{ fontSize: '2rem' }}>
                                        {adminProfileData.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                            )}
                        </div>
                        {isEditingProfile && (
                            <div>
                                <input
                                    type="file"
                                    className="form-control mb-2"
                                    accept="image/*"
                                    onChange={handleAdminAvatarChange}
                                />
                                <small className="text-muted">Upload a new profile picture</small>
                            </div>
                        )}
                    </div>
                </div>

                {/* Permissions */}
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">Permissions</h5>
                    </div>
                    <div className="card-body">
                        <div className="list-group list-group-flush">
                            {adminProfileData.permissions.map(permission => (
                                <div key={permission} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span className="text-capitalize">{permission}</span>
                                    <span className="badge bg-success">Granted</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfileSettings;