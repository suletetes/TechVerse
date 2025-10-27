import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context';
import { useUserProfile } from '../../context/UserProfileContext';
import { LoadingSpinner } from '../Common';

const ProfileTab = ({ onPasswordChange, handleAvatarChange }) => {
    const { user } = useAuth();
    const { profile, loading } = useUserProfile();

    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        avatar: ''
    });

    // Load user data when component mounts
    useEffect(() => {
        const userData = profile || user;
        if (userData) {
            // Convert ISO date to yyyy-MM-dd format for HTML date input
            let formattedDate = '';
            if (userData.dateOfBirth) {
                try {
                    const date = new Date(userData.dateOfBirth);
                    formattedDate = date.toISOString().split('T')[0];
                } catch (error) {
                    console.warn('Invalid date format:', userData.dateOfBirth);
                }
            }

            setProfileData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phone: userData.phone || '',
                dateOfBirth: formattedDate,
                gender: userData.gender || '',
                avatar: userData.avatar || ''
            });
        }
    }, [user, profile]);

    const profileCompleteness = useMemo(() => {
        // Safety check to ensure profileData exists
        if (!profileData || typeof profileData !== 'object') {
            return 0;
        }

        const fields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth'];
        const completedFields = fields.filter(field => profileData[field]?.trim());
        return Math.round((completedFields.length / fields.length) * 100);
    }, [profileData]);

    if (loading || !profileData) {
        return (
            <div className="store-card fill-card d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <LoadingSpinner size="lg" />
                <div className="ms-3">
                    <p className="tc-6533 mb-0">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="store-card fill-card">
            {/* Profile Completeness Indicator */}
            <div className="mb-4 p-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="tc-6533 mb-0">Profile Completeness</h6>
                    <span className="badge bg-primary">{profileCompleteness}%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                    <div
                        className="progress-bar bg-primary"
                        style={{ width: `${profileCompleteness}%` }}
                    ></div>
                </div>
                {profileCompleteness < 100 && (
                    <small className="text-muted mt-1 d-block">
                        Complete your profile to unlock personalized recommendations and exclusive offers!
                    </small>
                )}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Personal Information</h3>
                <div className="btn-group">
                    <button
                        className="btn btn-outline-primary btn-rd"
                        onClick={() => window.location.href = '/profile/edit?section=profile'}
                    >
                        Edit Profile
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-primary dropdown-toggle dropdown-toggle-split btn-rd"
                        data-bs-toggle="dropdown"
                    >
                        <span className="visually-hidden">Toggle Dropdown</span>
                    </button>
                    <ul className="dropdown-menu">
                        <li><a className="dropdown-item" href="/profile/edit?section=profile">👤 Personal Info</a></li>
                        <li><a className="dropdown-item" href="/profile/edit?section=address">📍 Addresses</a></li>
                        <li><a className="dropdown-item" href="/profile/edit?section=payment">💳 Payment Methods</a></li>
                    </ul>
                </div>
            </div>

            {/* Avatar Section */}
            <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                    <div className="avatar-container">
                        {profileData.avatar ? (
                            <img
                                src={profileData.avatar}
                                alt="Profile"
                                className="rounded-circle"
                                width="120"
                                height="120"
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <div
                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                style={{ width: '120px', height: '120px' }}
                            >
                                <span className="text-white h2 mb-0">
                                    {(profileData?.firstName || 'U')?.[0]}{(profileData?.lastName || 'U')?.[0]}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <h4 className="tc-6533 mt-3 mb-1">{profileData?.firstName || 'User'} {profileData?.lastName || ''}</h4>
                <p className="tc-6533 mb-0">TechVerse Member since 2023</p>
            </div>

            {/* Profile Form - Read Only */}
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        className="form-control"
                        value={profileData.firstName || ''}
                        disabled={true}
                    />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        className="form-control"
                        value={profileData.lastName || ''}
                        disabled={true}
                    />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={profileData.email || ''}
                        disabled={true}
                    />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={profileData.phone || ''}
                        disabled={true}
                        placeholder="07700900123"
                    />
                    <small className="text-muted">Enter UK mobile number (e.g., 07700900123)</small>
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Date of Birth</label>
                    <input
                        type="date"
                        name="dateOfBirth"
                        className="form-control"
                        value={profileData.dateOfBirth || ''}
                        disabled={true}
                    />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Gender</label>
                    <select
                        name="gender"
                        className="form-select"
                        value={profileData.gender || 'prefer-not-to-say'}
                        disabled={true}
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                </div>
            </div>

            {/* Account Actions */}
            <div className="mt-4 pt-4 border-top">
                <h5 className="tc-6533 mb-3">Account Security</h5>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <button
                            className="btn btn-outline-secondary btn-rd w-100 d-flex align-items-center justify-content-center"
                            onClick={onPasswordChange}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            </svg>
                            Change Password
                        </button>
                    </div>
                    <div className="col-md-6 mb-3">
                        <button className="btn btn-outline-secondary btn-rd w-100 d-flex align-items-center justify-content-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11V12z" />
                            </svg>
                            Two-Factor Authentication
                        </button>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="alert alert-info d-flex align-items-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                <path fill="currentColor" d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2Z" />
                            </svg>
                            <small>Last password change: Never. We recommend changing your password regularly for security.</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;