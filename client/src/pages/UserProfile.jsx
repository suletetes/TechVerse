import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const UserProfile = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+44 7700 900123',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        avatar: null
    });

    const [addresses, setAddresses] = useState([
        {
            id: 1,
            type: 'Home',
            name: 'John Smith',
            address: '123 Tech Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom',
            isDefault: true
        },
        {
            id: 2,
            type: 'Work',
            name: 'John Smith',
            address: '456 Business Ave',
            city: 'Manchester',
            postcode: 'M1 1AA',
            country: 'United Kingdom',
            isDefault: false
        }
    ]);

    const [orders] = useState([
        {
            id: 'TV-2024-001234',
            date: '2024-01-15',
            status: 'Delivered',
            total: 3597.60,
            items: 3,
            image: 'img/tablet-product.jpg'
        },
        {
            id: 'TV-2024-001233',
            date: '2024-01-10',
            status: 'Processing',
            total: 999.00,
            items: 1,
            image: 'img/phone-product.jpg'
        },
        {
            id: 'TV-2024-001232',
            date: '2024-01-05',
            status: 'Shipped',
            total: 2599.00,
            items: 2,
            image: 'img/laptop-product.jpg'
        }
    ]);

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

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfileData(prev => ({
                    ...prev,
                    avatar: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'success';
            case 'shipped': return 'info';
            case 'processing': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    };

    const renderProfileTab = () => (
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
                                style={{objectFit: 'cover'}}
                            />
                        ) : (
                            <div
                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                style={{width: '120px', height: '120px'}}
                            >
                                <span className="text-white h2 mb-0">
                                    {profileData.firstName[0]}{profileData.lastName[0]}
                                </span>
                            </div>
                        )}
                    </div>
                    {isEditing && (
                        <div className="position-absolute bottom-0 end-0">
                            <label className="btn btn-sm btn-primary rounded-circle" style={{width: '36px', height: '36px'}}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="d-none"
                                />
                            </label>
                        </div>
                    )}
                </div>
                <h4 className="tc-6533 mt-3 mb-1">{profileData.firstName} {profileData.lastName}</h4>
                <p className="tc-6533 mb-0">TechVerse Member since 2023</p>
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
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Date of Birth</label>
                    <input
                        type="date"
                        name="dateOfBirth"
                        className="form-control"
                        value={profileData.dateOfBirth}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                    />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Gender</label>
                    <select
                        name="gender"
                        className="form-select"
                        value={profileData.gender}
                        onChange={handleInputChange}
                        disabled={!isEditing}
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
                        <button className="btn btn-outline-secondary btn-rd w-100">
                            Change Password
                        </button>
                    </div>
                    <div className="col-md-6 mb-3">
                        <button className="btn btn-outline-secondary btn-rd w-100">
                            Two-Factor Authentication
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOrdersTab = () => (
        <div className="store-card fill-card">
            <h3 className="tc-6533 bold-text mb-4">Order History</h3>
            
            {orders.length === 0 ? (
                <div className="text-center py-5">
                    <h5 className="tc-6533 mb-3">No orders yet</h5>
                    <p className="tc-6533 mb-4">Start shopping to see your orders here</p>
                    <Link to="/" className="btn btn-c-2101 btn-rd">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {orders.map((order) => (
                        <div key={order.id} className="col-12 mb-3">
                            <div className="border rounded p-3">
                                <div className="row align-items-center">
                                    <div className="col-md-2 col-3 mb-3 mb-md-0">
                                        <img
                                            src={order.image}
                                            className="img-fluid rounded"
                                            alt="Order"
                                            width="60"
                                            height="60"
                                        />
                                    </div>
                                    <div className="col-md-3 col-9 mb-3 mb-md-0">
                                        <h6 className="tc-6533 mb-1">Order #{order.id}</h6>
                                        <p className="tc-6533 sm-text mb-1">{order.date}</p>
                                        <p className="tc-6533 sm-text mb-0">{order.items} items</p>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3 mb-md-0">
                                        <span className={`badge bg-${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3 mb-md-0">
                                        <p className="tc-6533 bold-text mb-0">£{order.total.toFixed(2)}</p>
                                    </div>
                                    <div className="col-md-3 col-12">
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-primary btn-rd flex-fill">
                                                View Details
                                            </button>
                                            {order.status === 'Delivered' && (
                                                <button className="btn btn-sm btn-outline-secondary btn-rd">
                                                    Reorder
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAddressesTab = () => (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Saved Addresses</h3>
                <button className="btn btn-c-2101 btn-rd">
                    Add New Address
                </button>
            </div>

            <div className="row">
                {addresses.map((address) => (
                    <div key={address.id} className="col-md-6 mb-4">
                        <div className="border rounded p-3 h-100">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h6 className="tc-6533 mb-1">{address.type}</h6>
                                    {address.isDefault && (
                                        <span className="badge bg-primary">Default</span>
                                    )}
                                </div>
                                <div className="dropdown">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                    >
                                        ⋮
                                    </button>
                                    <ul className="dropdown-menu">
                                        <li><a className="dropdown-item" href="#">Edit</a></li>
                                        <li><a className="dropdown-item" href="#">Set as Default</a></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><a className="dropdown-item text-danger" href="#">Delete</a></li>
                                    </ul>
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 bold-text">{address.name}</p>
                                <p className="mb-1">{address.address}</p>
                                <p className="mb-1">{address.city}</p>
                                <p className="mb-1">{address.postcode}</p>
                                <p className="mb-0">{address.country}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPreferencesTab = () => (
        <div className="store-card fill-card">
            <h3 className="tc-6533 bold-text mb-4">Preferences & Settings</h3>
            
            {/* Notification Preferences */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Notifications</h5>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="emailNotifications" defaultChecked />
                    <label className="form-check-label tc-6533" htmlFor="emailNotifications">
                        Email notifications for orders and promotions
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="smsNotifications" />
                    <label className="form-check-label tc-6533" htmlFor="smsNotifications">
                        SMS notifications for order updates
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="pushNotifications" defaultChecked />
                    <label className="form-check-label tc-6533" htmlFor="pushNotifications">
                        Push notifications
                    </label>
                </div>
            </div>

            {/* Privacy Settings */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Privacy</h5>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="profileVisibility" />
                    <label className="form-check-label tc-6533" htmlFor="profileVisibility">
                        Make my profile visible to other users
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="dataSharing" />
                    <label className="form-check-label tc-6533" htmlFor="dataSharing">
                        Allow data sharing for personalized recommendations
                    </label>
                </div>
            </div>

            {/* Language & Currency */}
            <div className="row mb-4">
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Language</label>
                    <select className="form-select">
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="es">Español</option>
                    </select>
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label tc-6533 bold-text">Currency</label>
                    <select className="form-select">
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                    </select>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="border border-danger rounded p-3">
                <h6 className="text-danger mb-3">Danger Zone</h6>
                <p className="tc-6533 mb-3">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="btn btn-outline-danger btn-rd">
                    Delete Account
                </button>
            </div>
        </div>
    );

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="profile-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Page Header */}
                    <div className="col-12 mb-4">
                        <h1 className="tc-6533 bold-text">My Account</h1>
                        <p className="tc-6533">Manage your profile, orders, and preferences</p>
                    </div>

                    <div className="row">
                        {/* Sidebar Navigation */}
                        <div className="col-lg-3 mb-4 mb-lg-0">
                            <div className="store-card fill-card">
                                <div className="list-group list-group-flush">
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'profile' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('profile')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                        Profile
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'orders' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('orders')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                                        </svg>
                                        Orders
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'addresses' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('addresses')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                        </svg>
                                        Addresses
                                    </button>
                                    <Link
                                        to="/wishlist"
                                        className="list-group-item list-group-item-action border-0"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                        </svg>
                                        Wishlist
                                    </Link>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'preferences' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('preferences')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                                        </svg>
                                        Preferences
                                    </button>
                                    <hr />
                                    <Link
                                        to="/login"
                                        className="list-group-item list-group-item-action border-0 text-danger"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H4v16h10v-2h2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10Z"/>
                                        </svg>
                                        Sign Out
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="col-lg-9">
                            {activeTab === 'profile' && renderProfileTab()}
                            {activeTab === 'orders' && renderOrdersTab()}
                            {activeTab === 'addresses' && renderAddressesTab()}
                            {activeTab === 'preferences' && renderPreferencesTab()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;