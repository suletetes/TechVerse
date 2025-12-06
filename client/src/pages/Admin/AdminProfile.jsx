import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useAdmin } from '../../context';
import API_BASE_URL from '../../api/config.js';
import { LoadingSpinner, Toast } from '../../components/Common';
import { tokenManager } from '../../utils/tokenManager.js';
import {
    AdminSidebar,
    // AdminHeader removed
    AdminDashboard,
    AdminProducts,
    AdminOrders,
    AdminUsers,
    AdminAddProduct,
    AdminCategories,
    AdminCatalogManager,
    AdminHomepageManager,
    AdminSettings,
    AdminNotifications,
    AdminAnalytics,
    // AdminActivityLog,
    AdminSecurity,
    AdminProfileSettings
} from "../../components";
import AdminProductsNew from "../../components/Admin/AdminProductsNew";
import AdminOrdersNew from "../../components/Admin/AdminOrdersNew";
import AdminUsersNew from "../../components/Admin/AdminUsersNew";
import AdminDashboardBright from "../../components/Admin/AdminDashboardBright";
import DebugRoles from "./DebugRoles";
import AdminRoles from "./AdminRoles";
import { ensureCsrfToken } from "../../utils/csrfUtils";

// Import admin-specific CSS
import '../../assets/css/admin-enhancements.css';

const AdminProfile = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, isAdmin } = useAuth();

    // Admin context
    const {
        // Dashboard data
        dashboardStats,
        analytics,

        // Products
        adminProducts,
        productsPagination,

        // Orders
        adminOrders,
        ordersPagination,

        // Users
        adminUsers,
        usersPagination,

        // Categories
        categories,

        // Loading states
        isDashboardLoading,
        isProductsLoading,
        isOrdersLoading,
        isUsersLoading,
        isCategoriesLoading,

        // Error states
        dashboardError,
        productsError,
        ordersError,
        usersError,
        categoriesError,

        // Methods
        loadDashboardStats,
        loadAnalytics,
        loadAdminProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        loadAdminOrders,
        updateOrderStatus,
        loadAdminUsers,
        updateUserStatus,
        updateUserRole,
        loadCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        exportData,
        clearError
    } = useAdmin();

    // Debug categories - REMOVED TO ELIMINATE LOG SPAM

    // Local state
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editProductId, setEditProductId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [localCategories, setLocalCategories] = useState([]);
    const [dateRange, setDateRange] = useState('7days');

    // Additional state for missing variables
    const [notifications, setNotifications] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [adminProfileData, setAdminProfileData] = useState({
        name: user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || '',
        email: user?.email || '',
        role: user?.role || 'admin',
        department: 'Administration',
        avatar: user?.avatar || '',
        phone: user?.phone || '',
        lastLogin: user?.lastLogin || new Date().toISOString()
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [toast, setToast] = useState(null);

    // Check authentication and admin access
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', {
                state: {
                    from: { pathname: '/admin' },
                    message: 'Please login to access the admin panel'
                }
            });
            return;
        }

        if (!isAdmin()) {
            navigate('/', {
                state: {
                    message: 'You do not have permission to access the admin panel'
                }
            });
            return;
        }
    }, [isAuthenticated, isAdmin, navigate]);

    // Sync categories from context to local state
    useEffect(() => {
        if (categories && Array.isArray(categories) && categories.length > 0) {
            setLocalCategories(categories);
        }
    }, [categories]);

    // Load categories when needed for add/edit product
    useEffect(() => {
        if ((activeTab === 'add-product' || activeTab === 'edit-product') && 
            !isCategoriesLoading && 
            (!categories || categories.length === 0)) {
            console.log('📂 Loading categories for product form...');
            loadCategories();
        }
    }, [activeTab, isCategoriesLoading, categories, loadCategories]);

    // Load initial data - only on mount
    useEffect(() => {
        if (isAuthenticated && isAdmin()) {
            loadDashboardStats({ period: dateRange });
            loadCategories();
            
            // Ensure CSRF token is available for admin operations
            ensureCsrfToken().then(token => {
                if (token) {
                    console.log('✅ CSRF token ready for admin operations');
                } else {
                    console.warn('⚠️ Failed to get CSRF token');
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isAdmin, dateRange]);



    // Load data based on active tab
    useEffect(() => {
        if (!isAuthenticated || !isAdmin()) return;

        switch (activeTab) {
            case 'products':
                // AdminProductsNew handles its own data loading
                break;
            case 'add-product':
            case 'edit-product':
                loadAdminProducts(); // Still needed for edit product
                loadCategories(); // Load categories for product form
                break;
            case 'orders':
                // AdminOrdersNew handles its own data loading
                break;
            case 'users':
                // AdminUsersNew handles its own data loading
                break;
            case 'analytics':
                loadAnalytics();
                break;
            default:
                break;
        }
    }, [activeTab, isAuthenticated, isAdmin]);

    // Show loading for initial load
    if (!isAuthenticated || (isAuthenticated && !user)) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Admin data for components - memoized to prevent unnecessary re-renders
    const adminData = useMemo(() => ({
        name: user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email,
        role: user?.role || 'admin',
        email: user?.email,
        avatar: user?.avatar,
        lastLogin: user?.lastLogin,
        permissions: user?.permissions || []
    }), [user]);

    // Utility functions - memoized to prevent re-creation
    const formatCurrency = useMemo(() => (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }, []);

    const getStatusColor = (status) => {
        const statusColors = {
            'pending': 'warning',
            'confirmed': 'info',
            'processing': 'primary',
            'shipped': 'success',
            'delivered': 'success',
            'cancelled': 'danger',
            'refunded': 'secondary',
            'active': 'success',
            'inactive': 'secondary',
            'suspended': 'danger'
        };
        return statusColors[status?.toLowerCase()] || 'secondary';
    };

    // Event handlers
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        clearError();
    };

    const handleAddProduct = async (productData) => {
        try {
            await createProduct(productData);
            setActiveTab('products');
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    const handleUpdateProduct = async (productData) => {
        try {
            await updateProduct(editProductId, productData);
            setActiveTab('products');
            setEditProductId(null);
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(productId);
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const handleEditProduct = (productId) => {
        setEditProductId(productId);
        setActiveTab('edit-product');
    };

    const handleDuplicateProduct = async (product) => {
        try {
            const duplicatedProduct = {
                ...product,
                name: `${product.name} (Copy)`,
                sku: `${product.sku || 'SKU'}-COPY-${Date.now()}`,
                status: 'draft'
            };
            delete duplicatedProduct._id;
            delete duplicatedProduct.id;
            
            await createProduct(duplicatedProduct);
            console.log('Product duplicated successfully');
        } catch (error) {
            console.error('Error duplicating product:', error);
        }
    };

    const handleSaveCategory = async (categoryData) => {
        try {
            if (categoryData.id) {
                await updateCategory(categoryData.id, categoryData);
            } else {
                await createCategory(categoryData);
            }
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategory(categoryId);
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    // Additional handler functions for missing functionality
    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    };

    const markAllNotificationsAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const handleAdminProfileInputChange = (e) => {
        const { name, value } = e.target;
        setAdminProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveAdminProfile = async () => {
        try {
            console.log('Saving admin profile:', adminProfileData);
            
            // API call with proper error handling
            const token = tokenManager.getToken();
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            const response = await fetch(`${API_BASE_URL}/admin/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(adminProfileData)
            });
            
            if (response.ok) {
                const result = await response.json();
                // Update the admin profile data with the returned profile
                if (result.success && result.data && result.data.profile) {
                    setAdminProfileData(result.data.profile);
                }
                setIsEditingProfile(false);
                
                // Show success message
                setToast({
                    message: 'Admin profile updated successfully!',
                    type: 'success'
                });
                console.log('✅ Admin profile saved successfully');
            } else {
                const errorData = await response.json();
                throw new Error(`Failed to update profile: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error saving admin profile:', error);
            
            // For now, still allow the edit to complete (since backend might not be ready)
            setIsEditingProfile(false);
            setToast({
                message: 'Profile updated locally. Note: Backend integration needed for persistence.',
                type: 'warning'
            });
        }
    };

    const handleAdminAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('Avatar file selected:', file);
            
            // Validate file type and size
            if (!file.type.startsWith('image/')) {
                setToast({
                    message: 'Please select an image file',
                    type: 'error'
                });
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setToast({
                    message: 'File size must be less than 5MB',
                    type: 'error'
                });
                return;
            }
            
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (event) => {
                setAdminProfileData(prev => ({
                    ...prev,
                    avatar: event.target.result
                }));
            };
            reader.readAsDataURL(file);
            
            console.log('✅ Avatar preview updated');
        }
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        try {
            // Validation
            if (!passwordData.currentPassword) {
                setToast({
                    message: 'Please enter your current password',
                    type: 'error'
                });
                return;
            }
            
            if (!passwordData.newPassword) {
                setToast({
                    message: 'Please enter a new password',
                    type: 'error'
                });
                return;
            }
            
            if (passwordData.newPassword.length < 6) {
                setToast({
                    message: 'New password must be at least 6 characters long',
                    type: 'error'
                });
                return;
            }
            
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
                setToast({
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                    type: 'error'
                });
                return;
            }
            
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                setToast({
                    message: 'New passwords do not match',
                    type: 'error'
                });
                return;
            }
            
            if (passwordData.currentPassword === passwordData.newPassword) {
                setToast({
                    message: 'New password must be different from current password',
                    type: 'error'
                });
                return;
            }
            
            // Get CSRF token
            const csrfToken = await ensureCsrfToken();
            
            // Call API to change password
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
            
            // Clear form
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            
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

    const toggleTwoFactor = () => {
        // Handle two-factor authentication toggle
        console.log('Toggling two-factor authentication');
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AdminDashboardBright setActiveTab={handleTabChange} />;

            case 'products':
                return (
                    <AdminProductsNew
                        setActiveTab={handleTabChange}
                    />
                );

            case 'add-product':
                return (
                    <AdminAddProduct
                        categories={localCategories || []}
                        onSave={handleAddProduct}
                        onCancel={() => handleTabChange('products')}
                        isLoading={isProductsLoading}
                    />
                );



            case 'edit-product':
                return (
                    <AdminAddProduct
                        categories={localCategories}
                        editProduct={Array.isArray(adminProducts) ? adminProducts.find(p => p._id === editProductId) : null}
                        onSave={handleUpdateProduct}
                        onCancel={() => handleTabChange('products')}
                        isLoading={isProductsLoading}
                    />
                );

            case 'categories':
                return (
                    <AdminCategories
                        categories={categories}
                        setActiveTab={handleTabChange}
                        onSave={handleSaveCategory}
                        onDelete={handleDeleteCategory}
                        isLoading={isCategoriesLoading}
                        error={categoriesError}
                    />
                );

            case 'catalog':
                return (
                    <AdminCatalogManager
                        categories={categories}
                        products={adminProducts}
                        specifications={{}}
                        onSaveCategory={handleSaveCategory}
                        onDeleteCategory={handleDeleteCategory}
                        onSaveSpecifications={(categoryName, specs) => {
                            console.log('Saving specifications for', categoryName, specs);
                            alert(`Specifications saved for ${categoryName}!`);
                        }}
                    />
                );

            case 'homepage':
                return (
                    <AdminHomepageManager />
                );

            case 'orders':
                return (
                    <AdminOrdersNew />
                );

            case 'users':
                return (
                    <AdminUsersNew />
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
                        analytics={analytics}
                        formatCurrency={formatCurrency}
                        onExportData={exportData}
                        isLoading={isDashboardLoading}
                    />
                );

            // case 'activity':
            //     return (
            //         <AdminActivityLog
            //             activityLog={activityLog}
            //         />
            //     );

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

            case 'roles':
                return <AdminRoles />;

            case 'debug-roles':
                return <DebugRoles />;

            default:
                return <AdminDashboardSimple />;
        }
    };

    return (
        <div className="admin-page min-vh-100 bg-light">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            
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
                        {/* AdminHeader removed for cleaner interface */}

                        <div className="p-4">
                            {/* Enhanced Notifications Bar */}
                            {notifications.filter(n => !n.read).length > 0 && (
                                <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
                                    <div className="d-flex align-items-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                            <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
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