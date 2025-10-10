import React from 'react';
import { Link } from 'react-router-dom';

const ProfileSidebar = ({ activeTab, onTabChange }) => {
    return (
        <div className="store-card fill-card">
            <div className="list-group list-group-flush">
                <button
                    className={`list-group-item list-group-item-action border-0 ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => onTabChange('profile')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    Profile
                </button>
                <button
                    className={`list-group-item list-group-item-action border-0 ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => onTabChange('orders')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
                    </svg>
                    Orders
                </button>
                <button
                    className={`list-group-item list-group-item-action border-0 ${activeTab === 'addresses' ? 'active' : ''}`}
                    onClick={() => onTabChange('addresses')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    Addresses
                </button>
                {/*<Link
                    to="/wishlist"
                    className="list-group-item list-group-item-action border-0"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    Wishlist
                </Link>*/}
                <button
                    className={`list-group-item list-group-item-action border-0 ${activeTab === 'payments' ? 'active' : ''}`}
                    onClick={() => onTabChange('payments')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                    </svg>
                    Payment Methods
                </button>
                <button
                    className={`list-group-item list-group-item-action border-0 ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => onTabChange('activity')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                    </svg>
                    Activity & Alerts
                </button>
                <button
                    className={`list-group-item list-group-item-action border-0 ${activeTab === 'preferences' ? 'active' : ''}`}
                    onClick={() => onTabChange('preferences')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
                    </svg>
                    Preferences
                </button>
                <hr />
                <Link
                    to="/login"
                    className="list-group-item list-group-item-action border-0 text-danger"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H4v16h10v-2h2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10Z" />
                    </svg>
                    Sign Out
                </Link>
            </div>
        </div>
    );
};

export default ProfileSidebar;