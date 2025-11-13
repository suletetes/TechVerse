import React, { useState, useEffect } from 'react';
import { UserProfileProvider } from '../../context/UserProfileContext';
import { useAuth } from '../../context';
import { LoadingSpinner } from '../Common';
import ProfileTab from './ProfileTab';
import OrdersTab from './OrdersTab';
import ActivityTab from './ActivityTab';

const UserProfileLayout = ({ initialTab = 'profile' }) => {
    const { user, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState(initialTab);

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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <UserProfileProvider>
                        <ProfileTab />
                    </UserProfileProvider>
                );
            case 'orders':
                return <OrdersTab />;
            case 'activity':
                return <ActivityTab />;
            default:
                return (
                    <UserProfileProvider>
                        <ProfileTab />
                    </UserProfileProvider>
                );
        }
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="user-profile-bloc">
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
                                <button
                                    className={`nav-link text-start ${activeTab === 'activity' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                                    </svg>
                                    Activity
                                </button>
                                
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