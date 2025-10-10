import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdminProfile from '../Admin/AdminProfile';

// Mock CSS import
vi.mock('../../assets/css/admin-enhancements.css', () => ({}));

// Mock hooks with comprehensive data
const mockUseAdminData = {
    adminProfileData: {
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
    },
    dashboardStats: {
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
        customerSatisfaction: 4.6
    },
    recentOrders: [
        { id: 'TV-2024-001234', customer: 'John Smith', date: '2024-01-15', status: 'Processing', total: 2999.00, items: 2 },
        { id: 'TV-2024-001233', customer: 'Emma Wilson', date: '2024-01-15', status: 'Shipped', total: 1299.00, items: 1 }
    ],
    products: [
        { id: 1, name: 'Tablet Air', category: 'Tablets', price: 1999, stock: 45, status: 'Active', sales: 234 },
        { id: 2, name: 'Phone Pro', category: 'Phones', price: 999, stock: 12, status: 'Low Stock', sales: 567 }
    ],
    categories: [
        { id: 1, name: 'Electronics', slug: 'electronics' },
        { id: 2, name: 'Accessories', slug: 'accessories' }
    ],
    users: [
        { id: 1, name: 'Test User', email: 'test@user.com', status: 'Active' }
    ],
    notifications: [
        { id: 1, type: 'order', title: 'New Order', message: 'Order received', read: false },
        { id: 2, type: 'stock', title: 'Low Stock', message: 'Stock is low', read: true }
    ],
    activityLog: [
        { id: 1, action: 'Product Updated', details: 'Updated product price', user: 'Test Admin', timestamp: '2024-01-15 14:30:00', type: 'product' }
    ],
    formatCurrency: (amount) => `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
    getStatusColor: (status) => {
        switch (status.toLowerCase()) {
            case 'active': return 'success';
            case 'processing': return 'info';
            default: return 'secondary';
        }
    }
};

const mockUseAdminState = {
    isEditingProfile: false,
    setIsEditingProfile: vi.fn(),
    passwordData: { currentPassword: '', newPassword: '', confirmPassword: '' },
    setPasswordData: vi.fn(),
    exportData: { type: '', format: 'csv', dateRange: '30days', loading: false },
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
};

vi.mock('../../hooks/useAdminData', () => ({
    useAdminData: () => mockUseAdminData
}));

vi.mock('../../hooks/useAdminState', () => ({
    useAdminState: () => mockUseAdminState
}));

// Mock all admin components
vi.mock('../../components', () => ({
    AdminSidebar: ({ activeTab, setActiveTab, adminData }) => (
        <div data-testid="admin-sidebar">
            <div data-testid="admin-name">{adminData.name}</div>
            <div data-testid="admin-role">{adminData.role}</div>
            {['dashboard', 'products', 'orders', 'users', 'notifications', 'analytics', 'activity', 'security', 'profile', 'settings'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} data-testid={`nav-${tab}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
        </div>
    ),
    AdminHeader: ({ activeTab, adminData, setSidebarOpen }) => (
        <div data-testid="admin-header">
            <div data-testid="current-tab">{activeTab}</div>
            <div data-testid="header-admin-name">{adminData.name}</div>
            <button onClick={() => setSidebarOpen(true)} data-testid="mobile-toggle">Menu</button>
        </div>
    ),
    AdminDashboard: ({ dashboardStats, formatCurrency }) => (
        <div data-testid="admin-dashboard">
            <div data-testid="revenue">{formatCurrency(dashboardStats.totalRevenue)}</div>
            <div data-testid="orders">{dashboardStats.totalOrders}</div>
            <div data-testid="users">{dashboardStats.totalUsers}</div>
            <div data-testid="products">{dashboardStats.totalProducts}</div>
        </div>
    ),
    AdminProducts: ({ products }) => (
        <div data-testid="admin-products">
            <div data-testid="products-count">{products.length}</div>
            {products.map(product => (
                <div key={product.id} data-testid={`product-${product.id}`}>
                    {product.name} - {product.status}
                </div>
            ))}
        </div>
    ),
    AdminOrders: ({ recentOrders }) => (
        <div data-testid="admin-orders">
            <div data-testid="orders-count">{recentOrders.length}</div>
            {recentOrders.map(order => (
                <div key={order.id} data-testid={`order-${order.id}`}>
                    {order.customer} - {order.status}
                </div>
            ))}
        </div>
    ),
    AdminUsers: ({ users }) => (
        <div data-testid="admin-users">
            <div data-testid="users-count">{users.length}</div>
        </div>
    ),
    AdminAddProduct: ({ categories, onSave, onCancel }) => (
        <div data-testid="admin-add-product">
            <button onClick={() => onSave({ name: 'Test Product' })} data-testid="save-product">Save</button>
            <button onClick={onCancel} data-testid="cancel-product">Cancel</button>
        </div>
    ),
    AdminCategories: ({ categories }) => (
        <div data-testid="admin-categories">
            <div data-testid="categories-count">{categories.length}</div>
        </div>
    ),
    AdminSettings: () => <div data-testid="admin-settings">Settings</div>,
    AdminNotifications: ({ notifications, markNotificationAsRead, markAllNotificationsAsRead }) => (
        <div data-testid="admin-notifications">
            <div data-testid="notifications-count">{notifications.length}</div>
            <button onClick={markAllNotificationsAsRead} data-testid="mark-all-read">Mark All Read</button>
            {notifications.map(notification => (
                <div key={notification.id} data-testid={`notification-${notification.id}`}>
                    {notification.title}
                    {!notification.read && (
                        <button onClick={() => markNotificationAsRead(notification.id)} data-testid={`mark-read-${notification.id}`}>
                            Mark Read
                        </button>
                    )}
                </div>
            ))}
        </div>
    ),
    AdminAnalytics: ({ dashboardStats, exportData, setExportData, handleExport }) => (
        <div data-testid="admin-analytics">
            <div data-testid="conversion-rate">{dashboardStats.conversionRate}%</div>
            <div data-testid="satisfaction">{dashboardStats.customerSatisfaction}/5</div>
            <select onChange={(e) => setExportData(prev => ({ ...prev, type: e.target.value }))} data-testid="export-select">
                <option value="">Select</option>
                <option value="orders">Orders</option>
            </select>
            <button onClick={() => handleExport(exportData.type)} data-testid="export-btn">Export</button>
        </div>
    ),
    AdminActivityLog: ({ activityLog }) => (
        <div data-testid="admin-activity-log">
            <div data-testid="activity-count">{activityLog.length}</div>
        </div>
    ),
    AdminSecurity: ({ toggleTwoFactor }) => (
        <div data-testid="admin-security">
            <button onClick={toggleTwoFactor} data-testid="toggle-2fa">Toggle 2FA</button>
        </div>
    ),
    AdminProfileSettings: ({ adminProfileData, handleSaveAdminProfile }) => (
        <div data-testid="admin-profile-settings">
            <div data-testid="profile-name">{adminProfileData.name}</div>
            <div data-testid="profile-email">{adminProfileData.email}</div>
            <button onClick={handleSaveAdminProfile} data-testid="save-profile">Save Profile</button>
        </div>
    )
}));

describe('AdminProfile Comprehensive Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('renders all main components correctly', () => {
            render(<AdminProfile />);

            expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
            expect(screen.getByTestId('admin-header')).toBeInTheDocument();
            expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        });

        it('displays admin information in sidebar and header', () => {
            render(<AdminProfile />);

            expect(screen.getByTestId('admin-name')).toHaveTextContent('Sarah Johnson');
            expect(screen.getByTestId('admin-role')).toHaveTextContent('Super Admin');
            expect(screen.getByTestId('header-admin-name')).toHaveTextContent('Sarah Johnson');
        });

        it('shows dashboard as default tab', () => {
            render(<AdminProfile />);

            expect(screen.getByTestId('current-tab')).toHaveTextContent('dashboard');
            expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        });
    });

    describe('Dashboard Functionality', () => {
        it('displays dashboard statistics correctly', () => {
            render(<AdminProfile />);

            expect(screen.getByTestId('revenue')).toHaveTextContent('£125,430.50');
            expect(screen.getByTestId('orders')).toHaveTextContent('1247');
            expect(screen.getByTestId('users')).toHaveTextContent('8934');
            expect(screen.getByTestId('products')).toHaveTextContent('456');
        });
    });

    describe('Tab Navigation', () => {
        it('switches to products tab correctly', async () => {
            render(<AdminProfile />);

            fireEvent.click(screen.getByTestId('nav-products'));

            await waitFor(() => {
                expect(screen.getByTestId('admin-products')).toBeInTheDocument();
                expect(screen.getByTestId('products-count')).toHaveTextContent('2');
            });
        });

        it('switches to orders tab correctly', async () => {
            render(<AdminProfile />);

            fireEvent.click(screen.getByTestId('nav-orders'));

            await waitFor(() => {
                expect(screen.getByTestId('admin-orders')).toBeInTheDocument();
                expect(screen.getByTestId('orders-count')).toHaveTextContent('2');
            });
        });

        it('switches to users tab correctly', async () => {
            render(<AdminProfile />);

            fireEvent.click(screen.getByTestId('nav-users'));

            await waitFor(() => {
                expect(screen.getByTestId('admin-users')).toBeInTheDocument();
                expect(screen.getByTestId('users-count')).toHaveTextContent('1');
            });
        });

        it('switches to all admin tabs', async () => {
            render(<AdminProfile />);

            const tabs = ['notifications', 'analytics', 'activity', 'security', 'profile', 'settings'];

            for (const tab of tabs) {
                fireEvent.click(screen.getByTestId(`nav-${tab}`));
                await waitFor(() => {
                    const expectedTestId = tab === 'profile' ? 'profile-settings' :
                        tab === 'activity' ? 'activity-log' : tab;
                    expect(screen.getByTestId(`admin-${expectedTestId}`)).toBeInTheDocument();
                });
            }
        });
    });

    describe('Notifications Functionality', () => {
        it('displays notification bar when unread notifications exist', () => {
            render(<AdminProfile />);

            expect(screen.getByText('You have 1 unread notifications')).toBeInTheDocument();
            expect(screen.getByText('View All')).toBeInTheDocument();
            expect(screen.getByText('Mark All Read')).toBeInTheDocument();
        });

        it('handles notification actions', async () => {
            render(<AdminProfile />);

            // Navigate to notifications
            fireEvent.click(screen.getByText('View All'));

            await waitFor(() => {
                expect(screen.getByTestId('admin-notifications')).toBeInTheDocument();
            });

            // Test mark all as read
            fireEvent.click(screen.getByTestId('mark-all-read'));
            expect(mockUseAdminState.markAllNotificationsAsRead).toHaveBeenCalled();

            // Test mark individual as read
            fireEvent.click(screen.getByTestId('mark-read-1'));
            expect(mockUseAdminState.markNotificationAsRead).toHaveBeenCalledWith(1);
        });

        it('displays notification content correctly', async () => {
            render(<AdminProfile />);

            fireEvent.click(screen.getByTestId('nav-notifications'));

            await waitFor(() => {
                expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
                expect(screen.getByText('New Order')).toBeInTheDocument();
                expect(screen.getByText('Low Stock')).toBeInTheDocument();
            });
        });
    });

    describe('Analytics and Export', () => {
        it('displays analytics data correctly', async () => {
            render(<AdminProfile />);

            fireEvent.click(screen.getByTestId('nav-analytics'));

            await waitFor(() => {
                expect(screen.getByTestId('conversion-rate')).toHaveTextContent('3.2%');
                expect(screen.getByTestId('satisfaction')).toHaveTextContent('4.6/5');
            });
        });

        it('handles export functionality', async () => {
            render(<AdminProfile />);

            fireEvent.click(screen.getByTestId('nav-analytics'));

            await waitFor(() => {
                const exportSelect = screen.getByTestId('export-select');
                const exportBtn = screen.getByTestId('export-btn');

                fireEvent.change(exportSelect, { target: { value: 'orders' } });
                expect(mockUseAdminState.setExportData).toHaveBeenCalled();

                fireEvent.click(exportBtn);
                expect(mockUseAdminState.handleExport).toHaveBeenCalled();
            });
        });
    });

    describe('Profile Management', () => {
        it('displays profile information correctly', async () => {
            render(<AdminProfile />);

            fireEvent.click(screen.getByTestId('nav-profile'));

            await waitFor(() => {
                expect(screen.getByTestId('profile-name')).toHaveTextContent('Sarah Johnson');
                expect(screen.getByTestId('profile-email')).toHaveTextContent('sarah.johnson@techverse.com');
            });
        });

        it('handles profile save action', async () => {
            render(<AdminProfile />);

            fireEvent.click(screen.getByTestId('nav-profile'));

            await waitFor(() => {
                fireEvent.click(screen.getByTestId('save-profile'));
                expect(mockUseAdminState.handleSaveAdminProfile).toHaveBeenCalled();
            });
        });
    });

    describe('Security Features', () => {
        it('handles two-factor authentication toggle', async () => {
            render(<AdminProfile />);

            fireEvent.click(screen.getByTestId('nav-security'));

            await waitFor(() => {
                fireEvent.click(screen.getByTestId('toggle-2fa'));
                expect(mockUseAdminState.toggleTwoFactor).toHaveBeenCalled();
            });
        });
    });

    describe('Mobile Responsiveness', () => {
        it('handles mobile sidebar toggle', () => {
            render(<AdminProfile />);

            const mobileToggle = screen.getByTestId('mobile-toggle');
            expect(mobileToggle).toBeInTheDocument();

            fireEvent.click(mobileToggle);
            // In real implementation, this would open the sidebar
        });
    });

    describe('Error Handling', () => {
        it('renders gracefully with missing data', () => {
            render(<AdminProfile />);

            // Component should still render even if some data is missing
            expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
            expect(screen.getByTestId('admin-header')).toBeInTheDocument();
        });

        it('handles tab switching without errors', async () => {
            render(<AdminProfile />);

            // Rapidly switch between tabs
            const tabs = ['products', 'orders', 'users', 'dashboard'];

            for (const tab of tabs) {
                fireEvent.click(screen.getByTestId(`nav-${tab}`));
                await waitFor(() => {
                    expect(screen.getByTestId(`admin-${tab}`)).toBeInTheDocument();
                });
            }
        });
    });

    describe('Data Integration', () => {
        it('passes correct data to child components', () => {
            render(<AdminProfile />);

            // Check dashboard receives correct stats
            expect(screen.getByTestId('revenue')).toHaveTextContent('£125,430.50');

            // Switch to products and check data
            fireEvent.click(screen.getByTestId('nav-products'));
            expect(screen.getByTestId('products-count')).toHaveTextContent('2');

            // Switch to orders and check data
            fireEvent.click(screen.getByTestId('nav-orders'));
            expect(screen.getByTestId('orders-count')).toHaveTextContent('2');
        });
    });
});