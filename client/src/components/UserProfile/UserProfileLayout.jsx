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
    ReviewModal
} from './';

const UserProfileLayout = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Sample data - in real app, this would come from context/props/API
    const userData = {
        profile: {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@email.com',
            phone: '+44 7700 900123',
            dateOfBirth: '1990-05-15',
            gender: 'male',
            avatar: null
        },
        orders: [
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
            }
        ],
        addresses: [
            {
                id: 1,
                type: 'Home',
                name: 'John Smith',
                address: '123 Tech Street',
                city: 'London',
                postcode: 'SW1A 1AA',
                country: 'United Kingdom',
                isDefault: true
            }
        ],
        paymentMethods: [
            {
                id: 1,
                type: 'card',
                brand: 'visa',
                last4: '4242',
                expiryMonth: 12,
                expiryYear: 2025,
                isDefault: true,
                holderName: 'John Smith'
            }
        ]
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileTab userData={userData.profile} onPasswordChange={() => setShowPasswordModal(true)} />;
            case 'orders':
                return <OrdersTab orders={userData.orders} onTrackOrder={() => setShowTrackingModal(true)} />;
            case 'addresses':
                return <AddressesTab addresses={userData.addresses} />;
            case 'payments':
                return <PaymentMethodsTab paymentMethods={userData.paymentMethods} />;
            case 'activity':
                return <ActivityTab />;
            case 'preferences':
                return <PreferencesTab />;
            default:
                return <ProfileTab userData={userData.profile} />;
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
                <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
            )}
            {showTrackingModal && (
                <OrderTrackingModal onClose={() => setShowTrackingModal(false)} />
            )}
            {showConfirmModal && (
                <OrderConfirmModal onClose={() => setShowConfirmModal(false)} />
            )}
            {showReviewModal && (
                <ReviewModal onClose={() => setShowReviewModal(false)} />
            )}
        </div>
    );
};

export default UserProfileLayout;