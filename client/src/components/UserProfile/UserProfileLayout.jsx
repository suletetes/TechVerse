import React, { useState, useEffect } from 'react';
import {
    ProfileSidebar,
    ProfileTab,
    OrdersTab,
    AddressesTab,
    PaymentMethodsTab,
    ActivityTab,
    PreferencesTab,
    PasswordChangeModal,
    AddAddressModal,
    AddPaymentMethodModal
} from './';

const UserProfileLayout = ({ initialTab }) => {
    // Set initial state based on initialTab prop
    const [activeTab, setActiveTab] = useState(() => {
        if (initialTab && ['profile', 'orders', 'addresses', 'payments', 'activity', 'preferences'].includes(initialTab)) {
            return initialTab;
        }
        return 'profile';
    });
    const [isEditing, setIsEditing] = useState(false);

    // Update active tab when initialTab prop changes (for navigation)
    useEffect(() => {
        if (initialTab && ['profile', 'orders', 'addresses', 'payments', 'activity', 'preferences'].includes(initialTab)) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
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
            image: '/img/tablet-product.jpg',
            viewedAt: '2024-01-15T10:30:00Z',
            category: 'Tablets'
        },
        {
            id: 2,
            name: 'Phone Pro Max',
            price: 1199,
            image: '/img/phone-product.jpg',
            viewedAt: '2024-01-14T15:45:00Z',
            category: 'Phones'
        },
        {
            id: 3,
            name: 'Laptop Ultra',
            price: 2499,
            image: '/img/laptop-product.jpg',
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
        completeness: 85
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




    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    // Handler functions
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

        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }

        const newPasswordErrors = validatePassword(passwordData.newPassword);
        if (newPasswordErrors.length > 0) {
            errors.newPassword = newPasswordErrors.join(', ');
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            errors.newPassword = 'New password must be different from current password';
        }

        setPasswordErrors(errors);

        if (Object.keys(errors).length === 0) {
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

    const calculateProfileCompleteness = () => {
        const fields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'avatar'];
        const completed = fields.filter(field => {
            if (field === 'avatar') return profileData.avatar !== null;
            return profileData[field] && profileData[field].trim() !== '';
        }).length;
        return Math.round((completed / fields.length) * 100);
    };



    const handleAddressAction = (addressId, action) => {
        switch (action) {
            case 'add':
                setEditingAddress(null);
                setShowAddAddressModal(true);
                break;
            case 'edit':
                setEditingAddress(addresses.find(a => a.id === addressId));
                setShowAddAddressModal(true);
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

    const handleSaveAddress = (addressData) => {
        if (editingAddress) {
            // Update existing address
            setAddresses(addresses.map(a => 
                a.id === editingAddress.id ? addressData : a
            ));
        } else {
            // Add new address
            if (addressData.isDefault) {
                // Remove default from other addresses
                setAddresses([
                    ...addresses.map(a => ({ ...a, isDefault: false })),
                    addressData
                ]);
            } else {
                setAddresses([...addresses, addressData]);
            }
        }
        setEditingAddress(null);
    };

    const handlePaymentMethodAction = (methodId, action) => {
        switch (action) {
            case 'add':
                setShowAddPaymentModal(true);
                break;
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

    const handleSavePaymentMethod = (paymentMethodData) => {
        if (paymentMethodData.isDefault) {
            // Remove default from other payment methods
            setPaymentMethods([
                ...paymentMethods.map(pm => ({ ...pm, isDefault: false })),
                paymentMethodData
            ]);
        } else {
            setPaymentMethods([...paymentMethods, paymentMethodData]);
        }
    };

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

    const renderActiveTab = () => {
        const commonProps = {
            profileData,
            setProfileData,
            isEditing,
            setIsEditing,
            handleInputChange,
            handleSaveProfile,
            handleAvatarChange,
            calculateProfileCompleteness,
            onPasswordChange: () => setShowPasswordModal(true)
        };

        switch (activeTab) {
            case 'profile':
                return <ProfileTab {...commonProps} />;
            case 'orders':
                return <OrdersTab />;
            case 'addresses':
                return (
                    <AddressesTab 
                        addresses={addresses}
                        handleAddressAction={handleAddressAction}
                    />
                );
            case 'payments':
                return (
                    <PaymentMethodsTab 
                        paymentMethods={paymentMethods}
                        handlePaymentMethodAction={handlePaymentMethodAction}
                    />
                );
            case 'activity':
                return (
                    <ActivityTab 
                        recentlyViewed={recentlyViewed}
                        setRecentlyViewed={setRecentlyViewed}
                        wishlistCategories={wishlistCategories}
                        priceAlerts={priceAlerts}
                        setPriceAlerts={setPriceAlerts}
                        handleRecentlyViewedAction={handleRecentlyViewedAction}
                        handleWishlistCategoryAction={handleWishlistCategoryAction}
                        handlePriceAlertAction={handlePriceAlertAction}
                    />
                );
            case 'preferences':
                return <PreferencesTab />;
            default:
                return <ProfileTab {...commonProps} />;
        }
    };

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
                            <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                        </div>

                        {/* Main Content */}
                        <div className="col-lg-9">
                            {renderActiveTab()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
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

            {showAddAddressModal && (
                <AddAddressModal 
                    onClose={() => {
                        setShowAddAddressModal(false);
                        setEditingAddress(null);
                    }}
                    onSave={handleSaveAddress}
                    editingAddress={editingAddress}
                />
            )}
            {showAddPaymentModal && (
                <AddPaymentMethodModal 
                    onClose={() => setShowAddPaymentModal(false)}
                    onSave={handleSavePaymentMethod}
                />
            )}
        </div>
    );
};

export default UserProfileLayout;