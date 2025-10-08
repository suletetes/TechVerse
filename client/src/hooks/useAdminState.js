import { useState } from 'react';

export const useAdminState = (setActiveTab, setEditProductId) => {
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [exportData, setExportData] = useState({
        type: '',
        format: 'csv',
        dateRange: '30days',
        loading: false
    });

    // Admin profile management functions
    const handleAdminProfileInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        // This would update adminProfileData in a real implementation
        console.log('Profile input change:', { name, value, type, checked });
    };

    const handleSaveAdminProfile = () => {
        console.log('Saving admin profile...');
        setIsEditingProfile(false);
        alert('Profile updated successfully!');
    };

    const handleAdminAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('Avatar updated:', e.target.result);
                // This would update adminProfileData.avatar in a real implementation
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();

        // Validation
        if (!passwordData.currentPassword) {
            alert('Please enter your current password');
            return;
        }
        if (!passwordData.newPassword) {
            alert('Please enter a new password');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            alert('New password must be at least 8 characters long');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New password and confirmation do not match');
            return;
        }

        console.log('Changing password...');
        alert('Password changed successfully!');

        // Reset form
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const toggleTwoFactor = () => {
        console.log('Toggling two-factor authentication...');
        alert('Two-factor authentication setting would be toggled here.');
    };

    // Enhanced helper functions
    const markNotificationAsRead = (notificationId) => {
        console.log('Marking notification as read:', notificationId);
    };

    const markAllNotificationsAsRead = () => {
        console.log('Marking all notifications as read...');
    };

    const deleteNotification = (notificationId) => {
        console.log('Deleting notification:', notificationId);
    };

    const handleExport = async (type, selectedIds = null) => {
        setExportData(prev => ({ ...prev, loading: true, type }));
        
        // Simulate export process
        setTimeout(() => {
            const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.${exportData.format}`;
            console.log(`Exporting ${type} to ${filename}`, selectedIds);
            alert(`Export completed: ${filename}`);
            setExportData(prev => ({ ...prev, loading: false }));
        }, 2000);
    };

    const handleTabChange = (tab, productId = null) => {
        setActiveTab(tab);
        if (tab === 'edit-product') {
            setEditProductId(productId);
        } else {
            setEditProductId(null);
        }
    };

    const handleAddProduct = (productData) => {
        console.log('Adding product:', productData);
        alert('Product added successfully!');
        setActiveTab('products');
    };

    const handleUpdateProduct = (productData) => {
        console.log('Updating product:', productData);
        alert('Product updated successfully!');
        setActiveTab('products');
        setEditProductId(null);
    };

    const handleSaveCategory = (categoryData, action) => {
        if (action === 'create') {
            console.log('Creating category:', categoryData);
            alert('Category created successfully!');
        } else if (action === 'update') {
            console.log('Updating category:', categoryData);
            alert('Category updated successfully!');
        }
    };

    const handleDeleteCategory = (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            console.log('Deleting category:', categoryId);
            alert('Category deleted successfully!');
        }
    };

    const handleAddUser = (userData) => {
        console.log('Adding user:', userData);
        alert('User created successfully!');
    };

    const handleEditUser = (userData) => {
        console.log('Editing user:', userData);
        alert('User updated successfully!');
    };

    const handleDeleteUser = (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            console.log('Deleting user:', userId);
            alert('User deleted successfully!');
        }
    };

    return {
        isEditingProfile,
        setIsEditingProfile,
        passwordData,
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
    };
};