import React, { useState } from 'react';

const ProfileTab = ({ userData, onPasswordChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState(userData);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = () => {
        console.log('Saving profile:', profileData);
        setIsEditing(false);
        // Handle save logic here
    };

    return (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Personal Information</h3>
                {!isEditing ? (
                    <button
                        className="btn btn-outline-primary btn-rd"
                        onClick={() => setIsEditing(true)}
                    >
                        Edit Profile
                    </button>
                ) : (
                    <div>
                        <button
                            className="btn btn-outline-secondary btn-rd me-2"
                            onClick={() => setIsEditing(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-c-2101 btn-rd"
                            onClick={handleSaveProfile}
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Form */}
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        className="form-control"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        className="form-control"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={profileData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                    />
                </div>
            </div>

            {/* Account Actions */}
            <div className="mt-4 pt-4 border-top">
                <h5 className="tc-6533 mb-3">Account Security</h5>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <button
                            className="btn btn-outline-secondary btn-rd w-100"
                            onClick={onPasswordChange}
                        >
                            Change Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;