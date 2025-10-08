import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminProfile from '../AdminProfile';

// Mock the hooks
vi.mock('../../hooks/useAdminData', () => ({
    useAdminData: () => ({
        adminProfileData: {
            name: 'Test Admin',
            email: 'test@admin.com',
            role: 'Super Admin',
            avatar: null,
            lastLogin: '2024-01-15 14:30:00',
            permissions: ['users', 'products', 'orders']
        },
        dashboardStats: {
            totalRevenue: 125430.50,
            totalOrders: 1247,
            totalUsers: 8934,
            totalProducts: 456,
            revenueGrowth: 12.5,
            ordersGrowth: 8.3,
            usersGrowth: 15.2,
            productsGrowth: 5.7
        },
        recentOrders: [
            {
                id: 'TV-2024-001234',
                customer: 'John Smith',
                date: '2024-01-15',
                status: 'Processing',
                total: 2999.00,
                items: 2
            }
        ],
        products: [
            {
                id: 1,
                name: 'Test Product',
                category: 'Electronics',
                price: 999,
                stock: 10,
                status: 'Active'
            }
        ],
        categories: [
            {
                id: 1,
                name: 'Electronics',
                slug: 'electronics'
            }
        ],
        users: [
            {
                id: 1,
                name: 'Test User',
                email: 'test@user.com',
                status: 'Active'
            }
        ],
        notifications: [
            {
                id: 1,
                type: 'order',
                title: 'New Order',
                message: 'Order received',
                read: false
            },
            {
                id: 2,
                type: 'stock',
                title: 'Low Stock',
                message: 'Stock is low',
                read: true
            }
        ],
        activityLog: [
            {
                id: 1,
                action: 'Product Updated',
                details: 'Updated product price',
                user: 'Test Admin',
                timestamp: '2024-01-15 14:30:00',
                type: 'product'
            }
        ],
        formatCurrency: (amount) => `£${amount.toFixed(2)}`,
        getStatusColor: (status) => {
            switch (status.toLowerCase()) {
                case 'active': return 'success';
                case 'processing': return 'info';
                default: return 'secondary';
            }
        }
    })
}));

vi.mock('../../hooks/useAdminState', () => ({
    useAdminState: () => ({
        isEditingProfile: false,
        setIsEditingProfile: vi.fn(),
        passwordData: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        },
        setPasswordData: vi.fn(),
        exportData: {
            type: '',
            format: 'csv',
            dateRange: '30days',
            loading: false
        },
        setExportData: vi.fn(),
        handleAdminProfileInputChange: vi.fn(),
        handleSaveAdminProfile: vi.fn(),
        handleAdminAvatarChange: vi.fn(),
        handlePasswordInputChange: vi.fn(),
        handlePasswordChange: vi.fn(),
        toggleTwoFactor: vi.fn(),
        markNotificationAsRead: vi.fn(),
        markAllNotificationsAsRead: vi.fn(),
        deleteNotification: vi.fn(),
        handleExport: vi.fn(),
        handleTabChange: vi.fn(),
        handleAddProduct: vi.fn(),
        handleUpdateProduct: vi.fn(),
        handleSaveCategory: vi.fn(),
        handleDeleteCategory: vi.fn(),
        handleAddUser: vi.fn(),
        handleEditUser: vi.fn(),
        handleDeleteUser: vi.fn()
    })
}));

// Mock all admin components
vi.mock('../../components', () => ({
    AdminSidebar: ({ activeTab, setActiveTab, adminData }) => (
        <div data-testid="admin-sidebar">
            <div>Admin: {adminData.name}</div>
            <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
            <button onClick={() => setActiveTab('products')}>Products</button>
            <button onClick={() => setActiveTab('orders')}>Orders</button>
            <button onClick={() => setActiveTab('users')}>Users</button>
            <button onClick={() => setActiveTab('notifications')}>Notifications</button>
            <button onClick={() => setActiveTab('analytics')}>Analytics</button>
            <button onClick={() => setActiveTab('activity')}>Activity</button>
            <button onClick={() => setActiveTab('security')}>Security</button>
            <button onClick={() => setActiveTab('profile')}>Profile</button>
            <button onClick={() => setActiveTab('settings')}>Settings</button>
        </div>
    ),
    AdminHeader: ({ activeTab, adminData }) => (
        <div data-testid="admin-header">
            <div>Current Tab: {activeTab}</div>
            <div>Admin: {adminData.name}</div>
        </div>
    ),
    AdminDashboard: ({ dashboardStats }) => (
        <div data-testid="admin-dashboard">
            <div>Revenue: £{dashboardStats.totalRevenue}</div>
            <div>Orders: {dashboardStats.totalOrders}</div>
        </div>
    ),
    AdminProducts: ({ products }) => (
        <div data-testid="admin-products">
            <div>Products Count: {products.length}</div>
        </div>
    ),
    AdminOrders: ({ recentOrders }) => (
        <div data-testid="admin-orders">
            <div>Orders Count: {recentOrders.length}</div>
        </div>
    ),
    AdminUsers: ({ users }) => (
        <div data-testid="admin-users">
            <div>Users Count: {users.length}</div>
        </div>
    ),
    AdminAddProduct: ({ categories }) => (
        <div data-testid="admin-add-product">
            <div>Add Product Form</div>
        </div>
    ),
    AdminCategories: ({ categories }) => (
        <div data-testid="admin-categories">
            <div>Categories Count: {categories.length}</div>
        </div>
    ),
    AdminSettings: () => (
        <div data-testid="admin-settings">Settings Panel</div>
    ),
    AdminNotifications: ({ notifications }) => (
        <div data-testid="admin-notifications">
            <div>Notifications Count: {notifications.length}</div>
        </div>
    ),
    AdminAnalytics: ({ dashboardStats }) => (
        <div data-testid="admin-analytics">
            <div>Analytics Dashboard</div>
        </div>
    ),
    AdminActivityLog: ({ activityLog }) => (
        <div data-testid="admin-activity-log">
            <div>Activity Count: {activityLog.length}</div>
        </div>
    ),
    AdminSecurity: () => (
        <div data-testid="admin-security">Security Settings</div>
    ),
    AdminProfileSettings: ({ adminProfileData }) => (
        <div data-testid="admin-profile-settings">
            <div>Profile: {adminProfileData.name}</div>
        </div>
    )
}));

describe('AdminProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(<AdminProfile />);
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    });

    it('displays admin information correctly', () => {
        render(<AdminProfile />);
        expect(screen.getAllByText('Admin: Test Admin')).toHaveLength(2);
        expect(screen.getByText('Current Tab: dashboard')).toBeInTheDocument();
    });

    it('renders dashboard by default', () => {
        render(<AdminProfile />);
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        expect(screen.getByText('Revenue: £125430.5')).toBeInTheDocument();
        expect(screen.getByText('Orders: 1247')).toBeInTheDocument();
    });

    it('switches tabs correctly', () => {
        render(<AdminProfile />);
        
        // Click on products tab
        fireEvent.click(screen.getByText('Products'));
        expect(screen.getByTestId('admin-products')).toBeInTheDocument();
        expect(screen.getByText('Products Count: 1')).toBeInTheDocument();

        // Click on orders tab
        fireEvent.click(screen.getByText('Orders'));
        expect(screen.getByTestId('admin-orders')).toBeInTheDocument();
        expect(screen.getByText('Orders Count: 1')).toBeInTheDocument();

        // Click on users tab
        fireEvent.click(screen.getByText('Users'));
        expect(screen.getByTestId('admin-users')).toBeInTheDocument();
        expect(screen.getByText('Users Count: 1')).toBeInTheDocument();
    });

    it('displays notifications bar when there are unread notifications', () => {
        render(<AdminProfile />);
        expect(screen.getByText('You have 1 unread notifications')).toBeInTheDocument();
        expect(screen.getByText('View All')).toBeInTheDocument();
        expect(screen.getByText('Mark All Read')).toBeInTheDocument();
    });

    it('handles notification actions', () => {
        render(<AdminProfile />);
        
        // Click View All notifications
        fireEvent.click(screen.getByText('View All'));
        expect(screen.getByTestId('admin-notifications')).toBeInTheDocument();
        expect(screen.getByText('Notifications Count: 2')).toBeInTheDocument();
    });

    it('renders all admin tabs correctly', () => {
        render(<AdminProfile />);

        const tabs = [
            { button: 'Analytics', testId: 'admin-analytics' },
            { button: 'Activity', testId: 'admin-activity-log' },
            { button: 'Security', testId: 'admin-security' },
            { button: 'Profile', testId: 'admin-profile-settings' },
            { button: 'Settings', testId: 'admin-settings' }
        ];

        tabs.forEach(({ button, testId }) => {
            fireEvent.click(screen.getByText(button));
            expect(screen.getByTestId(testId)).toBeInTheDocument();
        });
    });

    it('handles mobile sidebar correctly', () => {
        render(<AdminProfile />);
        
        // Check that sidebar has correct classes for mobile
        const sidebar = screen.getByTestId('admin-sidebar').parentElement;
        expect(sidebar).toHaveClass('d-none', 'd-lg-block');
    });

    it('renders correct admin data in components', () => {
        render(<AdminProfile />);
        
        // Switch to profile tab to check admin data
        fireEvent.click(screen.getByText('Profile'));
        expect(screen.getByText('Profile: Test Admin')).toBeInTheDocument();
    });

    it('handles default case in tab switching', () => {
        render(<AdminProfile />);
        
        // The default case should render dashboard
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    it('applies correct CSS classes', () => {
        render(<AdminProfile />);
        
        const container = screen.getByTestId('admin-sidebar').closest('.min-vh-100');
        expect(container).toHaveClass('min-vh-100');
        // The bg-light class is on the root container
        const rootContainer = container.closest('.bg-light');
        expect(rootContainer).toHaveClass('bg-light');
    });
});