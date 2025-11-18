import React, { useState, useEffect } from 'react';
import { UserProfileProvider } from '../../context/UserProfileContext';
import { useAuth } from '../../context';
import { LoadingSpinner, Toast } from '../Common';
import ProfileTab from './ProfileTab';
import OrdersTab from './OrdersTab';
import ActivityTab from './ActivityTab';
import { PasswordChangeModal } from './Modals';
import API_BASE_URL from '../../api/config.js';
import { tokenManager } from '../../utils/tokenManager.js';
import { ensureCsrfToken } from '../../utils/csrfUtils';

const UserProfileLayout = ({ initialTab = 'profile' }) => {
    const { user, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [toast, setToast] = useState(null);

    // Update active tab when initialTab prop changes
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc" id="user-profile-bloc">
                <div className="container bloc-md bloc-lg-md">
                    <div className="row">
                        <div className="col-12 text-center">
                            <h2 className="tc-6533">Please log in to view your profile</h2>
                            <a href="/login" className="btn btn-c-2101 btn-rd">Login</a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Password validation
    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 6) errors.push('At least 6 characters');
        if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
        if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
        if (!/\d/.test(password)) errors.push('One number');
        return errors;
    };

    // Get password strength
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: 'None', color: 'secondary' };
        
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (password.length >= 10) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
        
        if (strength < 40) return { strength, label: 'Weak', color: 'danger' };
        if (strength < 70) return { strength, label: 'Fair', color: 'warning' };
        if (strength < 90) return { strength, label: 'Good', color: 'info' };
        return { strength: 100, label: 'Strong', color: 'success' };
    };

    // Toggle password visibility
    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Handle password input change
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field
        setPasswordErrors(prev => ({
            ...prev,
            [name]: ''
        }));
    };

    // Handle password submit
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        const errors = {};
        
        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }
        
        if (!passwordData.newPassword) {
            errors.newPassword = 'New password is required';
        } else {
            const validationErrors = validatePassword(passwordData.newPassword);
            if (validationErrors.length > 0) {
                errors.newPassword = validationErrors.join(', ');
            }
        }
        
        if (!passwordData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your new password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        if (passwordData.currentPassword === passwordData.newPassword) {
            errors.newPassword = 'New password must be different from current password';
        }
        
        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }
        
        try {
            // Get CSRF token
            const csrfToken = await ensureCsrfToken();
            
            // Call API
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenManager.getToken()}`,
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password');
            }
            
            // Success - close modal and show toast
            setShowPasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPasswordErrors({});
            
            setToast({
                message: 'Password changed successfully! You will receive a confirmation email.',
                type: 'success'
            });
            
        } catch (error) {
            console.error('Error changing password:', error);
            setToast({
                message: error.message || 'Failed to change password. Please try again.',
                type: 'error'
            });
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <UserProfileProvider>
                        <ProfileTab onPasswordChange={() => setShowPasswordModal(true)} />
                    </UserProfileProvider>
                );
            case 'orders':
                return <OrdersTab />;
            case 'activity':
                return <ActivityTab />;
            default:
                return (
                    <UserProfileProvider>
                        <ProfileTab onPasswordChange={() => setShowPasswordModal(true)} />
                    </UserProfileProvider>
                );
        }
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="user-profile-bloc">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            
            {/* Password Change Modal */}
            {showPasswordModal && (
                <PasswordChangeModal
                    onClose={() => {
                        setShowPasswordModal(false);
                        setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                        });
                        setPasswordErrors({});
                    }}
                    passwordData={passwordData}
                    setPasswordData={setPasswordData}
                    passwordErrors={passwordErrors}
                    showPasswords={showPasswords}
                    handlePasswordSubmit={handlePasswordSubmit}
                    handlePasswordChange={handlePasswordChange}
                    togglePasswordVisibility={togglePasswordVisibility}
                    getPasswordStrength={getPasswordStrength}
                    validatePassword={validatePassword}
                />
            )}
            
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    <div className="col-12 mb-4">
                        <h1 className="tc-6533 bold-text">My Account</h1>
                        <p className="tc-6533">Manage your account settings and preferences</p>
                    </div>

                    <div className="col-lg-3 col-md-4 mb-4">
                        <div className="store-card fill-card">
                            <div className="nav flex-column nav-pills" role="tablist">
                                <button
                                    className={`nav-link text-start ${activeTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4Z"/>
                                    </svg>
                                    Profile
                                </button>
                                <button
                                    className={`nav-link text-start ${activeTab === 'orders' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('orders')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                                    </svg>
                                    Orders
                                </button>
                                {/* <button
                                    className={`nav-link text-start ${activeTab === 'activity' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                                    </svg>
                                    Activity
                                </button> */}
                                
                                {/* Quick Edit Links */}
                                <hr className="my-3" />
                                <div className="px-3">
                                    <h6 className="tc-6533 mb-2">Quick Edit</h6>
                                    <div className="d-grid gap-2">
                                        <a 
                                            href="/profile/edit?section=profile" 
                                            className="btn btn-outline-primary btn-sm"
                                        >
                                             Personal Info
                                        </a>
                                        <a 
                                            href="/profile/edit?section=address" 
                                            className="btn btn-outline-primary btn-sm"
                                        >
                                             Addresses
                                        </a>
                                      
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-9 col-md-8">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileLayout;