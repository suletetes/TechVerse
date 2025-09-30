import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const UserProfile = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [orderFilters, setOrderFilters] = useState({
        status: 'all',
        dateRange: 'all',
        searchTerm: ''
    });
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([
        {
            id: 1,
            type: 'card',
            brand: 'visa',
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
            holderName: 'John Smith'
        },
        {
            id: 2,
            type: 'card',
            brand: 'mastercard',
            last4: '8888',
            expiryMonth: 8,
            expiryYear: 2026,
            isDefault: false,
            holderName: 'John Smith'
        }
    ]);
    const [recentlyViewed, setRecentlyViewed] = useState([
        {
            id: 1,
            name: 'Tablet Air',
            price: 1999,
            image: 'img/tablet-product.jpg',
            viewedAt: '2024-01-15T10:30:00Z',
            category: 'Tablets'
        },
        {
            id: 2,
            name: 'Phone Pro Max',
            price: 1199,
            image: 'img/phone-product.jpg',
            viewedAt: '2024-01-14T15:45:00Z',
            category: 'Phones'
        },
        {
            id: 3,
            name: 'Laptop Ultra',
            price: 2499,
            image: 'img/laptop-product.jpg',
            viewedAt: '2024-01-13T09:20:00Z',
            category: 'Laptops'
        }
    ]);
    const [wishlistCategories, setWishlistCategories] = useState([
        { id: 'default', name: 'My Wishlist', count: 5, isDefault: true },
        { id: 'gifts', name: 'Gift Ideas', count: 3, isDefault: false },
        { id: 'price-watch', name: 'Price Watch', count: 2, isDefault: false }
    ]);
    const [priceAlerts, setPriceAlerts] = useState([
        {
            id: 1,
            productName: 'Tablet Air',
            currentPrice: 1999,
            targetPrice: 1800,
            isActive: true,
            createdAt: '2024-01-10'
        },
        {
            id: 2,
            productName: 'Watch Series 9',
            currentPrice: 399,
            targetPrice: 350,
            isActive: true,
            createdAt: '2024-01-08'
        }
    ]);
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
    const [profileData, setProfileData] = useState({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+44 7700 900123',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        avatar: null,
        completeness: 85 // Profile completeness percentage
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
            image: 'img/tablet-product.jpg',
            trackingNumber: 'TRK123456789',
            canReturn: true,
            canReorder: true
        },
        {
            id: 'TV-2024-001233',
            date: '2024-01-10',
            status: 'Processing',
            total: 999.00,
            items: 1,
            image: 'img/phone-product.jpg',
            trackingNumber: null,
            canReturn: false,
            canReorder: false
        },
        {
            id: 'TV-2024-001232',
            date: '2024-01-05',
            status: 'Shipped',
            total: 2599.00,
            items: 2,
            image: 'img/laptop-product.jpg',
            trackingNumber: 'TRK987654321',
            canReturn: false,
            canReorder: false
        },
        {
            id: 'TV-2024-001231',
            date: '2023-12-20',
            status: 'Delivered',
            total: 1299.00,
            items: 1,
            image: 'img/watch-product.jpg',
            trackingNumber: 'TRK555666777',
            canReturn: false,
            canReorder: true
        },
        {
            id: 'TV-2024-001230',
            date: '2023-12-15',
            status: 'Cancelled',
            total: 799.00,
            items: 1,
            image: 'img/headphones-product.jpg',
            trackingNumber: null,
            canReturn: false,
            canReorder: true
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

    // Password validation functions
    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) errors.push('At least 8 characters');
        if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
        if (!/\d/.test(password)) errors.push('One number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
        return errors;
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear errors when user starts typing
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        const errors = {};

        // Validate current password (in real app, this would be verified server-side)
        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }

        // Validate new password
        const newPasswordErrors = validatePassword(passwordData.newPassword);
        if (newPasswordErrors.length > 0) {
            errors.newPassword = newPasswordErrors.join(', ');
        }

        // Validate password confirmation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        // Check if new password is different from current
        if (passwordData.currentPassword === passwordData.newPassword) {
            errors.newPassword = 'New password must be different from current password';
        }

        setPasswordErrors(errors);

        if (Object.keys(errors).length === 0) {
            // Handle password change logic here
            console.log('Password change successful');
            alert('Password changed successfully!');
            setShowPasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const getPasswordStrength = (password) => {
        const errors = validatePassword(password);
        if (password.length === 0) return { strength: 0, label: '', color: '' };
        if (errors.length === 0) return { strength: 100, label: 'Strong', color: 'success' };
        if (errors.length <= 2) return { strength: 75, label: 'Good', color: 'info' };
        if (errors.length <= 3) return { strength: 50, label: 'Fair', color: 'warning' };
        return { strength: 25, label: 'Weak', color: 'danger' };
    };

    // Profile completeness calculation
    const calculateProfileCompleteness = () => {
        const fields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'avatar'];
        const completed = fields.filter(field => {
            if (field === 'avatar') return profileData.avatar !== null;
            return profileData[field] && profileData[field].trim() !== '';
        }).length;
        return Math.round((completed / fields.length) * 100);
    };

    // Filter orders based on current filters
    const getFilteredOrders = () => {
        return orders.filter(order => {
            // Status filter
            if (orderFilters.status !== 'all' && order.status.toLowerCase() !== orderFilters.status.toLowerCase()) {
                return false;
            }

            // Search filter
            if (orderFilters.searchTerm && !order.id.toLowerCase().includes(orderFilters.searchTerm.toLowerCase())) {
                return false;
            }

            // Date range filter
            if (orderFilters.dateRange !== 'all') {
                const orderDate = new Date(order.date);
                const now = new Date();
                const diffTime = Math.abs(now - orderDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                switch (orderFilters.dateRange) {
                    case '30days':
                        return diffDays <= 30;
                    case '90days':
                        return diffDays <= 90;
                    case '1year':
                        return diffDays <= 365;
                    default:
                        return true;
                }
            }

            return true;
        });
    };

    // Handle order actions
    const handleOrderAction = (orderId, action) => {
        const order = orders.find(o => o.id === orderId);
        switch (action) {
            case 'track':
                alert(`Tracking order ${orderId}. Tracking number: ${order.trackingNumber}`);
                break;
            case 'return':
                alert(`Initiating return for order ${orderId}`);
                break;
            case 'reorder':
                alert(`Adding items from order ${orderId} to cart`);
                break;
            default:
                break;
        }
    };

    // Handle address actions
    const handleAddressAction = (addressId, action) => {
        switch (action) {
            case 'edit':
                setEditingAddress(addresses.find(a => a.id === addressId));
                setShowAddressModal(true);
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this address?')) {
                    setAddresses(addresses.filter(a => a.id !== addressId));
                }
                break;
            case 'setDefault':
                setAddresses(addresses.map(a => ({
                    ...a,
                    isDefault: a.id === addressId
                })));
                break;
            default:
                break;
        }
    };

    // Handle payment method actions
    const handlePaymentMethodAction = (methodId, action) => {
        switch (action) {
            case 'setDefault':
                setPaymentMethods(paymentMethods.map(pm => ({
                    ...pm,
                    isDefault: pm.id === methodId
                })));
                break;
            case 'delete':
                if (confirm('Are you sure you want to remove this payment method?')) {
                    setPaymentMethods(paymentMethods.filter(pm => pm.id !== methodId));
                }
                break;
            default:
                break;
        }
    };

    // Handle recently viewed actions
    const handleRecentlyViewedAction = (productId, action) => {
        switch (action) {
            case 'remove':
                setRecentlyViewed(recentlyViewed.filter(p => p.id !== productId));
                break;
            case 'addToWishlist':
                alert('Added to wishlist!');
                break;
            case 'view':
                alert(`Viewing product ${productId}`);
                break;
            default:
                break;
        }
    };

    // Handle wishlist category actions
    const handleWishlistCategoryAction = (categoryId, action) => {
        switch (action) {
            case 'rename':
                const newName = prompt('Enter new category name:');
                if (newName) {
                    setWishlistCategories(wishlistCategories.map(cat =>
                        cat.id === categoryId ? { ...cat, name: newName } : cat
                    ));
                }
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this category? Items will be moved to the default wishlist.')) {
                    setWishlistCategories(wishlistCategories.filter(cat => cat.id !== categoryId));
                }
                break;
            default:
                break;
        }
    };

    // Handle price alert actions
    const handlePriceAlertAction = (alertId, action) => {
        switch (action) {
            case 'edit':
                const newTarget = prompt('Enter new target price:');
                if (newTarget && !isNaN(newTarget)) {
                    setPriceAlerts(priceAlerts.map(alert =>
                        alert.id === alertId ? { ...alert, targetPrice: parseFloat(newTarget) } : alert
                    ));
                }
                break;
            case 'toggle':
                setPriceAlerts(priceAlerts.map(alert =>
                    alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
                ));
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this price alert?')) {
                    setPriceAlerts(priceAlerts.filter(alert => alert.id !== alertId));
                }
                break;
            default:
                break;
        }
    };

    const renderProfileTab = () => (
        <div className="store-card fill-card">
            {/* Profile Completeness Indicator */}
            <div className="mb-4 p-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="tc-6533 mb-0">Profile Completeness</h6>
                    <span className="badge bg-primary">{calculateProfileCompleteness()}%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                    <div
                        className="progress-bar bg-primary"
                        style={{ width: `${calculateProfileCompleteness()}%` }}
                    ></div>
                </div>
                {calculateProfileCompleteness() < 100 && (
                    <small className="text-muted mt-1 d-block">
                        Complete your profile to unlock personalized recommendations and exclusive offers!
                    </small>
                )}
            </div>

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
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <div
                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                style={{ width: '120px', height: '120px' }}
                            >
                                <span className="text-white h2 mb-0">
                                    {profileData.firstName[0]}{profileData.lastName[0]}
                                </span>
                            </div>
                        )}
                    </div>
                    {isEditing && (
                        <div className="position-absolute bottom-0 end-0">
                            <label className="btn btn-sm btn-primary rounded-circle" style={{ width: '36px', height: '36px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
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
                        <button
                            className="btn btn-outline-secondary btn-rd w-100 d-flex align-items-center justify-content-center"
                            onClick={() => setShowPasswordModal(true)}
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

    const renderOrdersTab = () => (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Order History</h3>
                <span className="badge bg-secondary">{getFilteredOrders().length} orders</span>
            </div>

            {/* Order Filters */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by order ID..."
                        value={orderFilters.searchTerm}
                        onChange={(e) => setOrderFilters({ ...orderFilters, searchTerm: e.target.value })}
                    />
                </div>
                <div className="col-md-4 mb-3">
                    <select
                        className="form-select"
                        value={orderFilters.status}
                        onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value })}
                    >
                        <option value="all">All Status</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="col-md-4 mb-3">
                    <select
                        className="form-select"
                        value={orderFilters.dateRange}
                        onChange={(e) => setOrderFilters({ ...orderFilters, dateRange: e.target.value })}
                    >
                        <option value="all">All Time</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                        <option value="1year">Last Year</option>
                    </select>
                </div>
            </div>

            {getFilteredOrders().length === 0 ? (
                <div className="text-center py-5">
                    <h5 className="tc-6533 mb-3">No orders yet</h5>
                    <p className="tc-6533 mb-4">Start shopping to see your orders here</p>
                    <Link to="/" className="btn btn-c-2101 btn-rd">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {getFilteredOrders().map((order) => (
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
                                        <div className="d-flex gap-1 flex-wrap">
                                            <button className="btn btn-sm btn-outline-primary btn-rd">
                                                View Details
                                            </button>
                                            {order.trackingNumber && (
                                                <button
                                                    className="btn btn-sm btn-outline-info btn-rd"
                                                    onClick={() => handleOrderAction(order.id, 'track')}
                                                >
                                                    Track
                                                </button>
                                            )}
                                            {order.canReturn && (
                                                <button
                                                    className="btn btn-sm btn-outline-warning btn-rd"
                                                    onClick={() => handleOrderAction(order.id, 'return')}
                                                >
                                                    Return
                                                </button>
                                            )}
                                            {order.canReorder && (
                                                <button
                                                    className="btn btn-sm btn-outline-secondary btn-rd"
                                                    onClick={() => handleOrderAction(order.id, 'reorder')}
                                                >
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
                                        <li>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleAddressAction(address.id, 'edit')}
                                            >
                                                Edit
                                            </button>
                                        </li>
                                        {!address.isDefault && (
                                            <li>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => handleAddressAction(address.id, 'setDefault')}
                                                >
                                                    Set as Default
                                                </button>
                                            </li>
                                        )}
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button
                                                className="dropdown-item text-danger"
                                                onClick={() => handleAddressAction(address.id, 'delete')}
                                            >
                                                Delete
                                            </button>
                                        </li>
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

    const renderPaymentMethodsTab = () => (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Payment Methods</h3>
                <button className="btn btn-c-2101 btn-rd">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add Payment Method
                </button>
            </div>

            <div className="row">
                {paymentMethods.map((method) => (
                    <div key={method.id} className="col-md-6 mb-4">
                        <div className="border rounded p-3 h-100">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="d-flex align-items-center">
                                    <div className="me-3">
                                        {method.brand === 'visa' && (
                                            <div className="bg-primary text-white px-2 py-1 rounded small fw-bold">VISA</div>
                                        )}
                                        {method.brand === 'mastercard' && (
                                            <div className="bg-warning text-dark px-2 py-1 rounded small fw-bold">MC</div>
                                        )}
                                    </div>
                                    <div>
                                        <h6 className="tc-6533 mb-1">•••• •••• •••• {method.last4}</h6>
                                        {method.isDefault && (
                                            <span className="badge bg-primary">Default</span>
                                        )}
                                    </div>
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
                                        {!method.isDefault && (
                                            <li>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => handlePaymentMethodAction(method.id, 'setDefault')}
                                                >
                                                    Set as Default
                                                </button>
                                            </li>
                                        )}
                                        <li>
                                            <button
                                                className="dropdown-item text-danger"
                                                onClick={() => handlePaymentMethodAction(method.id, 'delete')}
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 bold-text">{method.holderName}</p>
                                <p className="mb-1 text-muted">Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}</p>
                                <div className="d-flex align-items-center mt-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-success">
                                        <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                    </svg>
                                    <small className="text-muted">Secured with 256-bit encryption</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Security Notice */}
            <div className="alert alert-info mt-4">
                <div className="d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                    </svg>
                    <div>
                        <h6 className="alert-heading mb-1">Your payment information is secure</h6>
                        <small className="mb-0">We use industry-standard encryption to protect your payment details. Your card information is never stored on our servers.</small>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderActivityTab = () => (
        <div className="store-card fill-card">
            <h3 className="tc-6533 bold-text mb-4">Activity & Alerts</h3>

            {/* Recently Viewed Products */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="tc-6533 mb-0">Recently Viewed Products</h5>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setRecentlyViewed([])}
                    >
                        Clear All
                    </button>
                </div>

                {recentlyViewed.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded">
                        <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                            <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                        </svg>
                        <p className="text-muted mb-0">No recently viewed products</p>
                    </div>
                ) : (
                    <div className="row">
                        {recentlyViewed.map((product) => (
                            <div key={product.id} className="col-md-4 mb-3">
                                <div className="border rounded p-3 h-100">
                                    <div className="d-flex align-items-center mb-2">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="rounded me-3"
                                            width="50"
                                            height="50"
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <div className="flex-grow-1">
                                            <h6 className="tc-6533 mb-1">{product.name}</h6>
                                            <p className="text-muted small mb-0">£{product.price}</p>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            {new Date(product.viewedAt).toLocaleDateString()}
                                        </small>
                                        <div className="d-flex gap-1">
                                            <button className="btn btn-sm btn-outline-primary">
                                                View
                                            </button>
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Wishlist Categories */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="tc-6533 mb-0">Wishlist Categories</h5>
                    <button className="btn btn-sm btn-c-2101">
                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                        New Category
                    </button>
                </div>

                <div className="row">
                    {wishlistCategories.map((category) => (
                        <div key={category.id} className="col-md-4 mb-3">
                            <div className="border rounded p-3 h-100">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h6 className="tc-6533 mb-1">{category.name}</h6>
                                        <p className="text-muted small mb-0">{category.count} items</p>
                                        {category.isDefault && (
                                            <span className="badge bg-primary mt-1">Default</span>
                                        )}
                                    </div>
                                    {!category.isDefault && (
                                        <div className="dropdown">
                                            <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                                ⋮
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li><button className="dropdown-item">Rename</button></li>
                                                <li><button className="dropdown-item text-danger">Delete</button></li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <Link to="/wishlist" className="btn btn-sm btn-outline-primary w-100">
                                    View Items
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price Alerts */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="tc-6533 mb-0">Price Alerts</h5>
                    <span className="badge bg-info">{priceAlerts.filter(alert => alert.isActive).length} active</span>
                </div>

                {priceAlerts.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded">
                        <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                            <path fill="currentColor" d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z" />
                        </svg>
                        <p className="text-muted mb-2">No price alerts set</p>
                        <small className="text-muted">Add products to your wishlist and set price alerts to get notified when prices drop!</small>
                    </div>
                ) : (
                    <div className="row">
                        {priceAlerts.map((alert) => (
                            <div key={alert.id} className="col-12 mb-3">
                                <div className="border rounded p-3">
                                    <div className="row align-items-center">
                                        <div className="col-md-6">
                                            <h6 className="tc-6533 mb-1">{alert.productName}</h6>
                                            <div className="d-flex align-items-center gap-3">
                                                <span className="text-muted small">Current: £{alert.currentPrice}</span>
                                                <span className="text-success small">Target: £{alert.targetPrice}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="progress" style={{ height: '8px' }}>
                                                <div
                                                    className="progress-bar bg-success"
                                                    style={{ width: `${Math.min((alert.currentPrice / alert.targetPrice) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <small className="text-muted">
                                                {alert.currentPrice <= alert.targetPrice ? 'Target reached!' : `£${alert.currentPrice - alert.targetPrice} to go`}
                                            </small>
                                        </div>
                                        <div className="col-md-3 text-end">
                                            <div className="d-flex gap-1 justify-content-end">
                                                <button className="btn btn-sm btn-outline-primary">Edit</button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setPriceAlerts(priceAlerts.map(a =>
                                                        a.id === alert.id ? { ...a, isActive: !a.isActive } : a
                                                    ))}
                                                >
                                                    {alert.isActive ? 'Pause' : 'Resume'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notification Settings */}
            <div className="border-top pt-4">
                <h5 className="tc-6533 mb-3">Notification Preferences</h5>
                <div className="row">
                    <div className="col-md-6">
                        <div className="form-check mb-3">
                            <input className="form-check-input" type="checkbox" id="priceDropNotifications" defaultChecked />
                            <label className="form-check-label tc-6533" htmlFor="priceDropNotifications">
                                <strong>Price Drop Alerts</strong><br />
                                <small className="text-muted">Get notified when wishlist items go on sale</small>
                            </label>
                        </div>
                        <div className="form-check mb-3">
                            <input className="form-check-input" type="checkbox" id="stockNotifications" defaultChecked />
                            <label className="form-check-label tc-6533" htmlFor="stockNotifications">
                                <strong>Stock Alerts</strong><br />
                                <small className="text-muted">Know when out-of-stock items are available</small>
                            </label>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-check mb-3">
                            <input className="form-check-input" type="checkbox" id="newProductNotifications" />
                            <label className="form-check-label tc-6533" htmlFor="newProductNotifications">
                                <strong>New Product Alerts</strong><br />
                                <small className="text-muted">Discover new products in your favorite categories</small>
                            </label>
                        </div>
                        <div className="form-check mb-3">
                            <input className="form-check-input" type="checkbox" id="reviewNotifications" />
                            <label className="form-check-label tc-6533" htmlFor="reviewNotifications">
                                <strong>Review Reminders</strong><br />
                                <small className="text-muted">Remind me to review purchased products</small>
                            </label>
                        </div>
                    </div>
                </div>
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

            {/* Recently Viewed Products */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Recently Viewed Products</h5>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="trackViewing" defaultChecked />
                    <label className="form-check-label tc-6533" htmlFor="trackViewing">
                        Track my browsing history for personalized recommendations
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="showRecentlyViewed" defaultChecked />
                    <label className="form-check-label tc-6533" htmlFor="showRecentlyViewed">
                        Show recently viewed products on homepage
                    </label>
                </div>
                <button className="btn btn-sm btn-outline-secondary">
                    Clear Browsing History
                </button>
            </div>

            {/* Wishlist Preferences */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Wishlist & Alerts</h5>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="priceDropAlerts" defaultChecked />
                    <label className="form-check-label tc-6533" htmlFor="priceDropAlerts">
                        Email me when wishlist items go on sale
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="stockAlerts" defaultChecked />
                    <label className="form-check-label tc-6533" htmlFor="stockAlerts">
                        Notify me when out-of-stock items become available
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="newProductAlerts" />
                    <label className="form-check-label tc-6533" htmlFor="newProductAlerts">
                        Alert me about new products in my favorite categories
                    </label>
                </div>
            </div>

            {/* Subscription Management */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Subscription Management</h5>
                <div className="border rounded p-3">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h6 className="tc-6533 mb-1">TechVerse Premium</h6>
                            <p className="text-muted mb-2">Free shipping, exclusive deals, and early access to new products</p>
                            <div className="d-flex align-items-center gap-3">
                                <span className="badge bg-success">Active</span>
                                <small className="text-muted">Next billing: February 15, 2024</small>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <p className="tc-6533 h5 mb-1">£9.99/month</p>
                            <div className="d-flex gap-2 justify-content-end">
                                <button className="btn btn-sm btn-outline-secondary">Manage</button>
                                <button className="btn btn-sm btn-outline-danger">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3">
                    <h6 className="tc-6533 mb-2">Auto-Reorder Subscriptions</h6>
                    <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" id="autoReorderEnabled" />
                        <label className="form-check-label tc-6533" htmlFor="autoReorderEnabled">
                            Enable auto-reorder for frequently purchased items
                        </label>
                    </div>
                    <small className="text-muted">We'll automatically reorder items you buy regularly and notify you before each order.</small>
                </div>
            </div>

            {/* Transaction History */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Recent Transactions</h5>
                <div className="table-responsive">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Jan 15, 2024</td>
                                <td>Order #TV-2024-001234</td>
                                <td>£3,597.60</td>
                                <td><span className="badge bg-success">Completed</span></td>
                            </tr>
                            <tr>
                                <td>Jan 15, 2024</td>
                                <td>TechVerse Premium</td>
                                <td>£9.99</td>
                                <td><span className="badge bg-success">Completed</span></td>
                            </tr>
                            <tr>
                                <td>Jan 10, 2024</td>
                                <td>Order #TV-2024-001233</td>
                                <td>£999.00</td>
                                <td><span className="badge bg-warning">Processing</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="text-center mt-3">
                    <button className="btn btn-sm btn-outline-primary">View All Transactions</button>
                </div>
            </div>

            {/* Address Validation */}
            <div className="mb-4">
                <h5 className="tc-6533 mb-3">Delivery Preferences</h5>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="addressValidation" defaultChecked />
                    <label className="form-check-label tc-6533" htmlFor="addressValidation">
                        Automatically validate and suggest address corrections
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="deliveryInstructions" defaultChecked />
                    <label className="form-check-label tc-6533" htmlFor="deliveryInstructions">
                        Save delivery instructions for future orders
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="safePlaceDelivery" />
                    <label className="form-check-label tc-6533" htmlFor="safePlaceDelivery">
                        Allow safe place delivery when I'm not home
                    </label>
                </div>

                <div className="mt-3">
                    <label className="form-label tc-6533 bold-text">Preferred Delivery Time</label>
                    <select className="form-select">
                        <option value="any">Any time</option>
                        <option value="morning">Morning (9AM - 12PM)</option>
                        <option value="afternoon">Afternoon (12PM - 6PM)</option>
                        <option value="evening">Evening (6PM - 9PM)</option>
                    </select>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="border border-danger rounded p-3">
                <h6 className="text-danger mb-3">Danger Zone</h6>
                <p className="tc-6533 mb-3">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-danger btn-rd">
                        Download My Data
                    </button>
                    <button className="btn btn-outline-danger btn-rd">
                        Delete Account
                    </button>
                </div>
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
                                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                        </svg>
                                        Profile
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'orders' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('orders')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
                                        </svg>
                                        Orders
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'addresses' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('addresses')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg>
                                        Addresses
                                    </button>
                                    <Link
                                        to="/wishlist"
                                        className="list-group-item list-group-item-action border-0"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                        Wishlist
                                    </Link>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'payments' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('payments')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                                        </svg>
                                        Payment Methods
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'activity' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('activity')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                                        </svg>
                                        Activity & Alerts
                                    </button>
                                    <button
                                        className={`list-group-item list-group-item-action border-0 ${activeTab === 'preferences' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('preferences')}
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
                        </div>

                        {/* Main Content */}
                        <div className="col-lg-9">
                            {activeTab === 'profile' && renderProfileTab()}
                            {activeTab === 'orders' && renderOrdersTab()}
                            {activeTab === 'addresses' && renderAddressesTab()}
                            {activeTab === 'payments' && renderPaymentMethodsTab()}
                            {activeTab === 'activity' && renderActivityTab()}
                            {activeTab === 'preferences' && renderPreferencesTab()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title tc-6533 fw-bold">Change Password</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordData({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: ''
                                        });
                                        setPasswordErrors({});
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="modal-body">
                                    {/* Current Password */}
                                    <div className="mb-3">
                                        <label className="form-label tc-6533 fw-semibold">Current Password</label>
                                        <div className="input-group">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                name="currentPassword"
                                                className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter your current password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => togglePasswordVisibility('current')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24">
                                                    {showPasswords.current ? (
                                                        <path fill="currentColor" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                                                    ) : (
                                                        <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                        {passwordErrors.currentPassword && (
                                            <div className="invalid-feedback d-block">
                                                {passwordErrors.currentPassword}
                                            </div>
                                        )}
                                    </div>

                                    {/* New Password */}
                                    <div className="mb-3">
                                        <label className="form-label tc-6533 fw-semibold">New Password</label>
                                        <div className="input-group">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                name="newPassword"
                                                className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter your new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => togglePasswordVisibility('new')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24">
                                                    {showPasswords.new ? (
                                                        <path fill="currentColor" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                                                    ) : (
                                                        <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                        {passwordErrors.newPassword && (
                                            <div className="invalid-feedback d-block">
                                                {passwordErrors.newPassword}
                                            </div>
                                        )}

                                        {/* Password Strength Indicator */}
                                        {passwordData.newPassword && (
                                            <div className="mt-2">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <small className="text-muted">Password Strength:</small>
                                                    <small className={`text-${getPasswordStrength(passwordData.newPassword).color}`}>
                                                        {getPasswordStrength(passwordData.newPassword).label}
                                                    </small>
                                                </div>
                                                <div className="progress" style={{ height: '4px' }}>
                                                    <div
                                                        className={`progress-bar bg-${getPasswordStrength(passwordData.newPassword).color}`}
                                                        style={{ width: `${getPasswordStrength(passwordData.newPassword).strength}%` }}
                                                    ></div>
                                                </div>
                                                <div className="mt-2">
                                                    <small className="text-muted">Requirements:</small>
                                                    <ul className="list-unstyled mt-1">
                                                        {validatePassword(passwordData.newPassword).map((error, index) => (
                                                            <li key={index} className="small text-muted">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                    <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10.5A1.5,1.5 0 0,1 10.5,9A1.5,1.5 0 0,1 12,7.5A1.5,1.5 0 0,1 13.5,9A1.5,1.5 0 0,1 12,10.5Z" />
                                                                </svg>
                                                                {error}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="mb-3">
                                        <label className="form-label tc-6533 fw-semibold">Confirm New Password</label>
                                        <div className="input-group">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                name="confirmPassword"
                                                className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Confirm your new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24">
                                                    {showPasswords.confirm ? (
                                                        <path fill="currentColor" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                                                    ) : (
                                                        <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                        {passwordErrors.confirmPassword && (
                                            <div className="invalid-feedback d-block">
                                                {passwordErrors.confirmPassword}
                                            </div>
                                        )}
                                        {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                                            <div className="text-success mt-1">
                                                <small>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                        <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                                                    </svg>
                                                    Passwords match
                                                </small>
                                            </div>
                                        )}
                                    </div>

                                    {/* Security Tips */}
                                    <div className="alert alert-info">
                                        <h6 className="alert-heading">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                                <path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                            </svg>
                                            Security Tips
                                        </h6>
                                        <ul className="mb-0 small">
                                            <li>Use a unique password you don't use elsewhere</li>
                                            <li>Include a mix of letters, numbers, and symbols</li>
                                            <li>Avoid personal information like names or dates</li>
                                            <li>Consider using a password manager</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-rd"
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            setPasswordData({
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: ''
                                            });
                                            setPasswordErrors({});
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-c-2101 btn-rd"
                                        disabled={
                                            !passwordData.currentPassword ||
                                            !passwordData.newPassword ||
                                            !passwordData.confirmPassword ||
                                            validatePassword(passwordData.newPassword).length > 0 ||
                                            passwordData.newPassword !== passwordData.confirmPassword
                                        }
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="white">
                                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                        </svg>
                                        Change Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;