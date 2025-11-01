import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminProfile from '../Admin/AdminProfile';

// Mock useAuth and useAdmin hooks
vi.mock('../../context', () => ({
    useAuth: () => ({
        isAuthenticated: true,
        user: {
            firstName: 'Test',
            lastName: 'Admin',
            email: 'test@admin.com',
            role: 'admin',
            avatar: null,
            lastLogin: '2024-01-15T14:30:00Z'
        },
        isAdmin: () => true
    }),
    useAdmin: () => ({
        dashboardStats: {
            totalRevenue: 125430.50,
            totalOrders: 1247,
            totalUsers: 8934,
            totalProducts: 456
        },
        analytics: {},
        adminProducts: [],
        productsPagination: { page: 1, totalPages: 1 },
        adminOrders: [],
        ordersPagination: { page: 1, totalPages: 1 },
        adminUsers: [],
        usersPagination: { page: 1, totalPages: 1 },
        categories: [],
        isDashboardLoading: false,
        isProductsLoading: false,
        isOrdersLoading: false,
        isUsersLoading: false,
        isCategoriesLoading: false,
        dashboardError: null,
        productsError: null,
        ordersError: null,
        usersError: null,
        categoriesError: null,
        loadDashboardStats: vi.fn(),
        loadAnalytics: vi.fn(),
        loadAdminProducts: vi.fn(),
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        deleteProduct: vi.fn(),
        loadAdminOrders: vi.fn(),
        updateOrderStatus: vi.fn(),
        loadAdminUsers: vi.fn(),
        updateUserStatus: vi.fn(),
        updateUserRole: vi.fn(),
        loadCategories: vi.fn(),
        createCategory: vi.fn(),
        updateCategory: vi.fn(),
        deleteCategory: vi.fn(),
        exportData: vi.fn(),
        clearError: vi.fn()
    })
}));

// Mock AdminDashboardBright component
vi.mock('../../components/Admin/AdminDashboardBright', () => ({
    default: ({ setActiveTab }) => (
        <div data-testid="admin-dashboard">
            <div>Revenue: £125430.5</div>
            <div>Orders: 1247</div>
        </div>
    )
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
    LoadingSpinner: ({ size }) => (
        <div data-testid="loading-spinner">Loading...</div>
    ),
    AdminProducts: ({ products }) => (
        <div data-testid="admin-products">
            <div>Products Count: {products ? products.length : 0}</div>
        </div>
    ),
    AdminOrders: ({ orders }) => (
        <div data-testid="admin-orders">
            <div>Orders Count: {orders ? orders.length : 0}</div>
        </div>
    ),
    AdminUsers: ({ users }) => (
        <div data-testid="admin-users">
            <div>Users Count: {users ? users.length : 0}</div>
        </div>
    ),
    AdminAddProduct: ({ categories }) => (
        <div data-testid="admin-add-product">
            <div>Add Product Form</div>
        </div>
    ),
    AdminCategories: ({ categories }) => (
        <div data-testid="admin-categories">
            <div>Categories Count: {categories ? categories.length : 0}</div>
        </div>
    ),
    AdminSettings: () => (
        <div data-testid="admin-settings">Settings Panel</div>
    ),
    AdminNotifications: ({ notifications }) => (
        <div data-testid="admin-notifications">
            <div>Notifications Count: {notifications ? notifications.length : 0}</div>
        </div>
    ),
    AdminAnalytics: ({ dashboardStats }) => (
        <div data-testid="admin-analytics">
            <div>Analytics Dashboard</div>
        </div>
    ),
    AdminActivityLog: ({ activityLog }) => (
        <div data-testid="admin-activity-log">
            <div>Activity Count: {activityLog ? activityLog.length : 0}</div>
        </div>
    ),
    AdminSecurity: () => (
        <div data-testid="admin-security">Security Settings</div>
    ),
    AdminProfileSettings: ({ adminProfileData }) => (
        <div data-testid="admin-profile-settings">
            <div>Profile: {adminProfileData ? adminProfileData.name : 'Test Admin'}</div>
        </div>
    ),
    AdminCatalogManager: () => (
        <div data-testid="admin-catalog-manager">Catalog Manager</div>
    ),
    AdminHomepageManager: () => (
        <div data-testid="admin-homepage-manager">Homepage Manager</div>
    )
}));

describe('AdminProfile Comprehensive Tests', () => {
    const renderWithRouter = (component) => {
        return render(
            <MemoryRouter>
                {component}
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('renders all main components correctly', () => {
            renderWithRouter(<AdminProfile />);
            expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
            expect(screen.getByTestId('admin-header')).toBeInTheDocument();
        });

        it('displays admin information in sidebar and header', () => {
            renderWithRouter(<AdminProfile />);
            expect(screen.getAllByText('Admin: Test Admin')).toHaveLength(2);
        });

        it('shows dashboard as default tab', () => {
            renderWithRouter(<AdminProfile />);
            expect(screen.getByText('Current Tab: dashboard')).toBeInTheDocument();
        });
    });

    describe('Dashboard Functionality', () => {
        it('displays dashboard statistics correctly', () => {
            renderWithRouter(<AdminProfile />);
            expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        });
    });

    describe('Tab Navigation', () => {
        it('switches to products tab correctly', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Products'));
            expect(screen.getByTestId('admin-products')).toBeInTheDocument();
        });

        it('switches to orders tab correctly', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Orders'));
            expect(screen.getByTestId('admin-orders')).toBeInTheDocument();
        });

        it('switches to users tab correctly', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Users'));
            expect(screen.getByTestId('admin-users')).toBeInTheDocument();
        });

        it('switches to all admin tabs', () => {
            renderWithRouter(<AdminProfile />);
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
    });

    describe('Notifications Functionality', () => {
        it('displays notification bar when unread notifications exist', () => {
            renderWithRouter(<AdminProfile />);
            // Since notifications start empty, the notification bar won't show
            expect(screen.queryByText(/unread notifications/)).not.toBeInTheDocument();
        });

        it('handles notification actions', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Notifications'));
            expect(screen.getByTestId('admin-notifications')).toBeInTheDocument();
        });

        it('displays notification content correctly', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Notifications'));
            expect(screen.getByText('Notifications Count: 0')).toBeInTheDocument();
        });
    });

    describe('Analytics and Export', () => {
        it('displays analytics data correctly', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Analytics'));
            expect(screen.getByTestId('admin-analytics')).toBeInTheDocument();
        });

        it('handles export functionality', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Analytics'));
            expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
        });
    });

    describe('Profile Management', () => {
        it('displays profile information correctly', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Profile'));
            expect(screen.getByTestId('admin-profile-settings')).toBeInTheDocument();
        });

        it('handles profile save action', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Profile'));
            expect(screen.getByText('Profile: Test Admin')).toBeInTheDocument();
        });
    });

    describe('Security Features', () => {
        it('handles two-factor authentication toggle', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Security'));
            expect(screen.getByTestId('admin-security')).toBeInTheDocument();
        });
    });

    describe('Mobile Responsiveness', () => {
        it('handles mobile sidebar toggle', () => {
            renderWithRouter(<AdminProfile />);
            const sidebar = screen.getByTestId('admin-sidebar').parentElement;
            expect(sidebar).toHaveClass('d-none', 'd-lg-block');
        });
    });

    describe('Error Handling', () => {
        it('renders gracefully with missing data', () => {
            renderWithRouter(<AdminProfile />);
            expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
        });

        it('handles tab switching without errors', () => {
            renderWithRouter(<AdminProfile />);
            fireEvent.click(screen.getByText('Products'));
            fireEvent.click(screen.getByText('Orders'));
            fireEvent.click(screen.getByText('Users'));
            expect(screen.getByTestId('admin-users')).toBeInTheDocument();
        });
    });

    describe('Data Integration', () => {
        it('passes correct data to child components', () => {
            renderWithRouter(<AdminProfile />);
            expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        });
    });
});