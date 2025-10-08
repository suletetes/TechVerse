import { useState } from 'react';

export const useAdminData = () => {
    // Admin profile state management
    const [adminProfileData, setAdminProfileData] = useState({
        name: 'Sarah Johnson',
        email: 'sarah.johnson@techverse.com',
        phone: '+44 7700 900456',
        role: 'Super Admin',
        department: 'IT Administration',
        avatar: null,
        lastLogin: '2024-01-15 14:30:00',
        permissions: ['users', 'products', 'orders', 'analytics', 'settings'],
        twoFactorEnabled: true,
        emailNotifications: true,
        smsNotifications: false,
        loginAlerts: true
    });

    // Enhanced dashboard stats
    const dashboardStats = {
        totalRevenue: 125430.50,
        totalOrders: 1247,
        totalUsers: 8934,
        totalProducts: 456,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
        usersGrowth: 15.2,
        productsGrowth: 5.7,
        avgOrderValue: 100.58,
        conversionRate: 3.2,
        returnRate: 2.1,
        customerSatisfaction: 4.6,
        topSellingCategory: 'Electronics',
        lowStockItems: 8,
        pendingOrders: 23,
        activeUsers: 1234,
        pageLoadTime: 1.2,
        serverUptime: 99.9,
        errorRate: 0.1
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

    // Mock categories data
    const [categories, setCategories] = useState([
        {
            id: 1,
            name: 'Tablets',
            slug: 'tablets',
            description: 'Portable computing devices with touchscreen displays',
            image: 'img/category-tablets.jpg',
            parentId: null,
            isActive: true,
            sortOrder: 1
        },
        {
            id: 2,
            name: 'Smartphones',
            slug: 'smartphones',
            description: 'Latest mobile phones and smartphones',
            image: 'img/category-phones.jpg',
            parentId: null,
            isActive: true,
            sortOrder: 2
        },
        {
            id: 3,
            name: 'Headphones',
            slug: 'headphones',
            description: 'Premium audio headphones and earbuds',
            image: 'img/category-headphones.jpg',
            parentId: null,
            isActive: true,
            sortOrder: 3
        }
    ]);

    // Mock users data
    const [users, setUsers] = useState([
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
    ]);

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'order',
            title: 'New Order Received',
            message: 'Order #TV-2024-001235 from John Doe',
            time: '2 minutes ago',
            read: false,
            priority: 'high'
        },
        {
            id: 2,
            type: 'stock',
            title: 'Low Stock Alert',
            message: 'Phone Pro has only 12 units left',
            time: '15 minutes ago',
            read: false,
            priority: 'medium'
        },
        {
            id: 3,
            type: 'user',
            title: 'New User Registration',
            message: '5 new users registered today',
            time: '1 hour ago',
            read: true,
            priority: 'low'
        }
    ]);

    const [activityLog, setActivityLog] = useState([
        {
            id: 1,
            action: 'Product Updated',
            details: 'Updated price for Tablet Air',
            user: 'Sarah Johnson',
            timestamp: '2024-01-15 14:30:00',
            type: 'product'
        },
        {
            id: 2,
            action: 'Order Processed',
            details: 'Processed order #TV-2024-001234',
            user: 'Mike Wilson',
            timestamp: '2024-01-15 14:15:00',
            type: 'order'
        },
        {
            id: 3,
            action: 'User Account Created',
            details: 'New admin user added: Jane Smith',
            user: 'Sarah Johnson',
            timestamp: '2024-01-15 13:45:00',
            type: 'user'
        }
    ]);

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

    return {
        adminProfileData,
        setAdminProfileData,
        dashboardStats,
        recentOrders,
        products,
        categories,
        setCategories,
        users,
        setUsers,
        notifications,
        setNotifications,
        activityLog,
        setActivityLog,
        formatCurrency,
        getStatusColor
    };
};