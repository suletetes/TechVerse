import React, { useState } from 'react';
import {
    ProfileSidebar,
    ProfileTab,
    OrdersTab,
    AddressesTab,
    PaymentMethodsTab,
    ActivityTab,
    PreferencesTab,
    PasswordChangeModal,
    OrderTrackingModal,
    OrderConfirmModal,
    ReviewModal,
    ReorderModal
} from './';

const UserProfileLayout = () => {
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

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewOrder, setReviewOrder] = useState(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmOrder, setConfirmOrder] = useState(null);
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [reorderOrder, setReorderOrder] = useState(null);

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

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'success';
            case 'shipped': return 'info';
            case 'processing': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
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

    const getFilteredOrders = () => {
        return orders.filter(order => {
            if (orderFilters.status !== 'all' && order.status.toLowerCase() !== orderFilters.status.toLowerCase()) {
                return false;
            }

            if (orderFilters.searchTerm && !order.id.toLowerCase().includes(orderFilters.searchTerm.toLowerCase())) {
                return false;
            }

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

    const handleReorder = (order) => {
        setReorderOrder(order);
        setShowReorderModal(true);
    };

    const handleReorderComplete = (selectedItems, quantities) => {
        console.log('Reorder completed:', selectedItems, quantities);
        // In real app: Add items to cart and optionally redirect
        // This could also trigger a cart update or show a success toast
    };

    const handleOrderAction = (orderId, action) => {
        const order = orders.find(o => o.id === orderId);
        switch (action) {
            case 'track':
                // Now handled by Link to /user/order/:id/tracking
                break;
            case 'confirm':
                setConfirmOrder(order);
                setShowConfirmModal(true);
                break;
            case 'return':
                if (confirm(`Are you sure you want to initiate a return for order ${orderId}?`)) {
                    alert(`Return request submitted for order ${orderId}. You will receive an email with return instructions.`);
                    // In real app: API call to initiate return
                }
                break;
            case 'reorder':
                handleReorder(order);
                break;
            case 'review':
                // Now handled by Link to /user/order/:id/review
                break;
            default:
                break;
        }
    };

    const getTrackingTimeline = (order) => {
        const baseTimeline = [
            {
                status: 'Order Placed',
                date: order.date,
                time: '14:30',
                completed: true,
                description: 'Your order has been confirmed and is being prepared'
            },
            {
                status: 'Payment Confirmed',
                date: order.date,
                time: '14:32',
                completed: true,
                description: 'Payment has been successfully processed'
            },
            {
                status: 'Processing',
                date: order.date,
                time: '15:45',
                completed: order.status !== 'Processing',
                description: 'Your items are being picked and packed'
            }
        ];

        if (order.status === 'Shipped' || order.status === 'Delivered') {
            baseTimeline.push({
                status: 'Shipped',
                date: new Date(new Date(order.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: '09:15',
                completed: true,
                description: `Package dispatched via courier. Tracking: ${order.trackingNumber}`
            });
        }

        if (order.status === 'Delivered') {
            baseTimeline.push({
                status: 'Out for Delivery',
                date: new Date(new Date(order.date).getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: '08:30',
                completed: true,
                description: 'Package is out for delivery in your area'
            });
            baseTimeline.push({
                status: 'Delivered',
                date: new Date(new Date(order.date).getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: '16:45',
                completed: true,
                description: 'Package delivered successfully'
            });
        }

        return baseTimeline;
    };

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
                return (
                    <OrdersTab 
                        orders={orders}
                        orderFilters={orderFilters}
                        setOrderFilters={setOrderFilters}
                        getFilteredOrders={getFilteredOrders}
                        handleOrderAction={handleOrderAction}
                        getStatusColor={getStatusColor}
                    />
                );
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
            {showTrackingModal && trackingOrder && (
                <OrderTrackingModal 
                    onClose={() => {
                        setShowTrackingModal(false);
                        setTrackingOrder(null);
                    }}
                    order={trackingOrder}
                    getTrackingTimeline={getTrackingTimeline}
                    getStatusColor={getStatusColor}
                />
            )}
            {showConfirmModal && confirmOrder && (
                <OrderConfirmModal 
                    onClose={() => {
                        setShowConfirmModal(false);
                        setConfirmOrder(null);
                    }}
                    order={confirmOrder}
                />
            )}
            {showReviewModal && reviewOrder && (
                <ReviewModal 
                    onClose={() => {
                        setShowReviewModal(false);
                        setReviewOrder(null);
                    }}
                    order={reviewOrder}
                />
            )}
            {showReorderModal && reorderOrder && (
                <ReorderModal 
                    onClose={() => {
                        setShowReorderModal(false);
                        setReorderOrder(null);
                    }}
                    order={reorderOrder}
                    onReorder={handleReorderComplete}
                />
            )}
        </div>
    );
};

export default UserProfileLayout;