import React, {useState} from 'react';

import {
    AdminSidebar,
    AdminHeader,
    AdminDashboard,
    AdminProducts,
    AdminOrders,
    AdminUsers,
    AdminAddProduct,
    AdminSettings
} from "../components"

const AdminProfile = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dateRange, setDateRange] = useState('7days');

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        image: null
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Mock admin data
    const adminData = {
        name: 'Sarah Johnson',
        role: 'Super Admin',
        email: 'sarah.johnson@techverse.com',
        avatar: null,
        lastLogin: '2024-01-15 14:30:00',
        permissions: ['users', 'products', 'orders', 'analytics', 'settings']
    };

    // Mock dashboard stats
    const dashboardStats = {
        totalRevenue: 125430.50,
        totalOrders: 1247,
        totalUsers: 8934,
        totalProducts: 456,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
        usersGrowth: 15.2,
        productsGrowth: 5.7
    };

    // Mock recent orders
    const recentOrders = [
        {
            id: 'TV-2024-001234',
            customer: 'John Smith',
            date: '2024-01-15',
            status: 'Processing',
            total: 2999.00,
            items: 2
        },
        {
            id: 'TV-2024-001233',
            customer: 'Emma Wilson',
            date: '2024-01-15',
            status: 'Shipped',
            total: 1299.00,
            items: 1
        },
        {
            id: 'TV-2024-001232',
            customer: 'Michael Brown',
            date: '2024-01-14',
            status: 'Delivered',
            total: 899.00,
            items: 3
        },
        {
            id: 'TV-2024-001231',
            customer: 'Lisa Davis',
            date: '2024-01-14',
            status: 'Cancelled',
            total: 1599.00,
            items: 1
        }
    ];

    // Mock products data
    const products = [
        {
            id: 1,
            name: 'Tablet Air',
            category: 'Tablets',
            price: 1999,
            stock: 45,
            status: 'Active',
            sales: 234,
            image: 'img/tablet-product.jpg'
        },
        {
            id: 2,
            name: 'Phone Pro',
            category: 'Phones',
            price: 999,
            stock: 12,
            status: 'Low Stock',
            sales: 567,
            image: 'img/phone-product.jpg'
        },
        {
            id: 3,
            name: 'Ultra Laptop',
            category: 'Laptops',
            price: 2599,
            stock: 0,
            status: 'Out of Stock',
            sales: 123,
            image: 'img/laptop-product.jpg'
        }
    ];

    // Mock users data
    const users = [
        {
            id: 1,
            name: 'John Smith',
            email: 'john.smith@email.com',
            joinDate: '2023-12-01',
            orders: 5,
            totalSpent: 4567.89,
            status: 'Active'
        },
        {
            id: 2,
            name: 'Emma Wilson',
            email: 'emma.wilson@email.com',
            joinDate: '2023-11-15',
            orders: 12,
            totalSpent: 8934.56,
            status: 'VIP'
        },
        {
            id: 3,
            name: 'Michael Brown',
            email: 'michael.brown@email.com',
            joinDate: '2024-01-10',
            orders: 1,
            totalSpent: 299.99,
            status: 'New'
        }
    ];

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered':
            case 'active':
            case 'vip':
                return 'success';
            case 'shipped':
            case 'processing':
                return 'info';
            case 'low stock':
            case 'new':
                return 'warning';
            case 'cancelled':
            case 'out of stock':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const formatCurrency = (amount) => `£${amount.toLocaleString('en-GB', {minimumFractionDigits: 2})}`;

    const handleProductInputChange = (e) => {
        const {name, value} = e.target;

        // Handle description character limit
        if (name === 'description' && value.length > 500) {
            return; // Don't update if over limit
        }

        // Handle price validation
        if (name === 'price' && value && parseFloat(value) < 0) {
            return; // Don't allow negative prices
        }

        // Handle stock validation
        if (name === 'stock' && value && parseInt(value) < 0) {
            return; // Don't allow negative stock
        }

        setNewProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProductImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setNewProduct(prev => ({
                    ...prev,
                    image: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddProduct = (e) => {
        e.preventDefault();

        // Validation
        if (!newProduct.name.trim()) {
            alert('Please enter a product name');
            return;
        }
        if (!newProduct.category) {
            alert('Please select a category');
            return;
        }
        if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
            alert('Please enter a valid price');
            return;
        }
        if (!newProduct.stock || parseInt(newProduct.stock) < 0) {
            alert('Please enter a valid stock quantity');
            return;
        }
        if (!newProduct.description.trim()) {
            alert('Please enter a product description');
            return;
        }
        if (newProduct.description.length > 500) {
            alert('Description must be 500 characters or less');
            return;
        }

        // Create new product object
        const productData = {
            id: Date.now(), // Simple ID generation for demo
            name: newProduct.name.trim(),
            category: newProduct.category,
            price: parseFloat(newProduct.price),
            stock: parseInt(newProduct.stock),
            description: newProduct.description.trim(),
            image: newProduct.image || 'img/default-product.jpg',
            status: parseInt(newProduct.stock) > 10 ? 'Active' : parseInt(newProduct.stock) > 0 ? 'Low Stock' : 'Out of Stock',
            sales: 0,
            dateAdded: new Date().toISOString().split('T')[0]
        };

        console.log('Adding product:', productData);

        // Here you would typically make an API call to save the product
        // For demo purposes, we'll just show success message
        alert(`Product "${productData.name}" added successfully!`);

        // Reset form and redirect to products
        setNewProduct({
            name: '',
            category: '',
            price: '',
            stock: '',
            description: '',
            image: null
        });
        setActiveTab('products');
    };

    const handlePasswordInputChange = (e) => {
        const {name, value} = e.target;
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

        // Here you would typically make an API call to change the password
        console.log('Changing password...');
        alert('Password changed successfully!');

        // Reset form
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid p-0">
                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
                        style={{zIndex: 1040}}
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}
                <div className="row g-0 min-vh-100">
                    {/* Sidebar Navigation */}
                    <div
                        className={`col-lg-3 col-xl-2 ${sidebarOpen ? 'position-fixed start-0 top-0 h-100 bg-white d-lg-block shadow-lg' : 'd-none d-lg-block'}`}
                        style={{zIndex: 1050, width: sidebarOpen ? '280px' : 'auto'}}>
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
                            {activeTab === 'dashboard' && (
                                <AdminDashboard
                                    dashboardStats={dashboardStats}
                                    dateRange={dateRange}
                                    setDateRange={setDateRange}
                                    recentOrders={recentOrders}
                                    setActiveTab={setActiveTab}
                                    getStatusColor={getStatusColor}
                                    formatCurrency={formatCurrency}
                                />
                            )}
                            {activeTab === 'products' && (
                                <AdminProducts
                                    products={products}
                                    setActiveTab={setActiveTab}
                                    getStatusColor={getStatusColor}
                                    formatCurrency={formatCurrency}
                                />
                            )}
                            {activeTab === 'add-product' && (
                                <AdminAddProduct
                                    newProduct={newProduct}
                                    setNewProduct={setNewProduct}
                                    handleProductInputChange={handleProductInputChange}
                                    handleProductImageChange={handleProductImageChange}
                                    handleAddProduct={handleAddProduct}
                                    setActiveTab={setActiveTab}
                                />
                            )}
                            {activeTab === 'orders' && (
                                <AdminOrders
                                    recentOrders={recentOrders}
                                    getStatusColor={getStatusColor}
                                    formatCurrency={formatCurrency}
                                />
                            )}
                            {activeTab === 'users' && (
                                <AdminUsers
                                    users={users}
                                    getStatusColor={getStatusColor}
                                    formatCurrency={formatCurrency}
                                />
                            )}
                            {activeTab === 'settings' && (
                                <AdminSettings
                                    adminData={adminData}
                                    passwordData={passwordData}
                                    setPasswordData={setPasswordData}
                                    handlePasswordInputChange={handlePasswordInputChange}
                                    handlePasswordChange={handlePasswordChange}
                                />
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminProfile;
