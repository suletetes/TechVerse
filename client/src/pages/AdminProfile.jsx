import React, { useState } from 'react';
import {
    AdminSidebar,
    AdminHeader,
    AdminDashboard,
    AdminProducts,
    AdminOrders,
    AdminUsers,
    AdminAddProduct,
    AdminCategories,
    AdminCatalogManager,
    AdminSettings,
    AdminNotifications,
    AdminAnalytics,
    AdminActivityLog,
    AdminSecurity,
    AdminProfileSettings
} from "../components";

// Import admin-specific CSS
import '../assets/css/admin-enhancements.css';

// Import hooks and data
import { useAdminData } from '../hooks/index.js';
import { useAdminState } from '../hooks/index.js';

const AdminProfile = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editProductId, setEditProductId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Use custom hooks for data and state management
    const {
        adminProfileData,
        dashboardStats,
        recentOrders,
        products,
        categories,
        users,
        notifications,
        activityLog,
        formatCurrency,
        getStatusColor
    } = useAdminData();

    const {
        isEditingProfile,
        setIsEditingProfile,
        passwordData,
        setPasswordData,
        exportData,
        setExportData,
        handleAdminProfileInputChange,
        handleSaveAdminProfile,
        handleAdminAvatarChange,
        handlePasswordInputChange,
        handlePasswordChange,
        toggleTwoFactor,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        handleExport,
        handleTabChange,
        handleAddProduct,
        handleUpdateProduct,
        handleSaveCategory,
        handleDeleteCategory,
        handleAddUser,
        handleEditUser,
        handleDeleteUser
    } = useAdminState(setActiveTab, setEditProductId);

    // Admin data for backward compatibility
    const adminData = {
        name: adminProfileData.name,
        role: adminProfileData.role,
        email: adminProfileData.email,
        avatar: adminProfileData.avatar,
        lastLogin: adminProfileData.lastLogin,
        permissions: adminProfileData.permissions
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <AdminDashboard
                        dashboardStats={dashboardStats}
                        dateRange="7days"
                        setDateRange={() => {}}
                        recentOrders={recentOrders}
                        setActiveTab={setActiveTab}
                        getStatusColor={getStatusColor}
                        formatCurrency={formatCurrency}
                        notifications={notifications}
                        activityLog={activityLog}
                    />
                );
            
            case 'products':
                return (
                    <AdminProducts
                        products={products}
                        categories={categories}
                        specifications={{}}
                        setActiveTab={handleTabChange}
                        getStatusColor={getStatusColor}
                        formatCurrency={formatCurrency}
                        onUpdateProduct={(productId, updates) => {
                            console.log('Updating product:', productId, updates);
                            alert('Product updated successfully! (Demo mode)');
                        }}
                        onDeleteProduct={(productId) => {
                            console.log('Deleting product:', productId);
                            alert('Product deleted successfully! (Demo mode)');
                        }}
                        onDuplicateProduct={(product) => {
                            console.log('Duplicating product:', product);
                            alert('Product duplicated successfully! (Demo mode)');
                        }}
                    />
                );
            
            case 'add-product':
                return (
                    <AdminAddProduct
                        categories={categories}
                        onSave={handleAddProduct}
                        onCancel={() => handleTabChange('products')}
                    />
                );
            
            case 'edit-product':
                return (
                    <AdminAddProduct
                        categories={categories}
                        editProduct={products.find(p => p.id === editProductId)}
                        onSave={handleUpdateProduct}
                        onCancel={() => handleTabChange('products')}
                    />
                );
            
            case 'categories':
                return (
                    <AdminCategories
                        categories={categories}
                        setActiveTab={handleTabChange}
                        onSave={handleSaveCategory}
                        onDelete={handleDeleteCategory}
                    />
                );
            
            case 'catalog':
                return (
                    <AdminCatalogManager
                        categories={categories}
                        products={products}
                        specifications={{}}
                        onSaveCategory={handleSaveCategory}
                        onDeleteCategory={handleDeleteCategory}
                        onSaveSpecifications={(categoryName, specs) => {
                            console.log('Saving specifications for', categoryName, specs);
                            alert(`Specifications saved for ${categoryName}!`);
                        }}
                    />
                );
            
            case 'orders':
                return (
                    <AdminOrders
                        recentOrders={recentOrders}
                        getStatusColor={getStatusColor}
                        formatCurrency={formatCurrency}
                        bulkActions={{}}
                        setBulkActions={() => {}}
                        handleBulkAction={() => {}}
                        handleQuickAction={() => {}}
                        filters={{}}
                        updateFilter={() => {}}
                        clearFilters={() => {}}
                        handleExport={handleExport}
                    />
                );
            
            case 'users':
                return (
                    <AdminUsers
                        users={users}
                        getStatusColor={getStatusColor}
                        formatCurrency={formatCurrency}
                        onAddUser={handleAddUser}
                        onEditUser={handleEditUser}
                        onDeleteUser={handleDeleteUser}
                    />
                );
            
            case 'notifications':
                return (
                    <AdminNotifications
                        notifications={notifications}
                        markNotificationAsRead={markNotificationAsRead}
                        markAllNotificationsAsRead={markAllNotificationsAsRead}
                        deleteNotification={deleteNotification}
                    />
                );
            
            case 'analytics':
                return (
                    <AdminAnalytics
                        dashboardStats={dashboardStats}
                        formatCurrency={formatCurrency}
                        exportData={exportData}
                        setExportData={setExportData}
                        handleExport={handleExport}
                    />
                );
            
            case 'activity':
                return (
                    <AdminActivityLog
                        activityLog={activityLog}
                    />
                );
            
            case 'security':
                return (
                    <AdminSecurity
                        adminProfileData={adminProfileData}
                        toggleTwoFactor={toggleTwoFactor}
                        passwordData={passwordData}
                        handlePasswordInputChange={handlePasswordInputChange}
                        handlePasswordChange={handlePasswordChange}
                    />
                );
            
            case 'profile':
                return (
                    <AdminProfileSettings
                        adminProfileData={adminProfileData}
                        isEditingProfile={isEditingProfile}
                        setIsEditingProfile={setIsEditingProfile}
                        handleAdminProfileInputChange={handleAdminProfileInputChange}
                        handleSaveAdminProfile={handleSaveAdminProfile}
                        handleAdminAvatarChange={handleAdminAvatarChange}
                    />
                );
            
            case 'settings':
                return (
                    <AdminSettings
                        adminData={adminData}
                        passwordData={passwordData}
                        setPasswordData={setPasswordData}
                        handlePasswordInputChange={handlePasswordInputChange}
                        handlePasswordChange={handlePasswordChange}
                        adminProfileData={adminProfileData}
                        isEditingProfile={isEditingProfile}
                        setIsEditingProfile={setIsEditingProfile}
                        handleAdminProfileInputChange={handleAdminProfileInputChange}
                        handleSaveAdminProfile={handleSaveAdminProfile}
                        handleAdminAvatarChange={handleAdminAvatarChange}
                        toggleTwoFactor={toggleTwoFactor}
                    />
                );
            
            default:
                return (
                    <AdminDashboard
                        dashboardStats={dashboardStats}
                        dateRange="7days"
                        setDateRange={() => {}}
                        recentOrders={recentOrders}
                        setActiveTab={setActiveTab}
                        getStatusColor={getStatusColor}
                        formatCurrency={formatCurrency}
                        notifications={notifications}
                        activityLog={activityLog}
                    />
                );
        }
    };

    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid p-0">
                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
                        style={{ zIndex: 1040 }}
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}
                
                <div className="row g-0 min-vh-100">
                    {/* Sidebar Navigation */}
                    <div
                        className={`col-lg-3 col-xl-2 ${sidebarOpen ? 'position-fixed start-0 top-0 h-100 bg-white d-lg-block shadow-lg' : 'd-none d-lg-block'}`}
                        style={{ zIndex: 1050, width: sidebarOpen ? '280px' : 'auto' }}
                    >
                        <AdminSidebar
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            adminData={adminData}
                        />
                    </div>
                    
                    {/* Main Content */}
                    <div className="col-lg-9 col-xl-10">
                        <AdminHeader
                            activeTab={activeTab}
                            adminData={adminData}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                        />
                        
                        <div className="p-4">
                            {/* Enhanced Notifications Bar */}
                            {notifications.filter(n => !n.read).length > 0 && (
                                <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
                                    <div className="d-flex align-items-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                                        </svg>
                                        <span>You have {notifications.filter(n => !n.read).length} unread notifications</span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setActiveTab('notifications')}
                                        >
                                            View All
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={markAllNotificationsAsRead}
                                        >
                                            Mark All Read
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Render Active Tab Content */}
                            {renderActiveTab()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;