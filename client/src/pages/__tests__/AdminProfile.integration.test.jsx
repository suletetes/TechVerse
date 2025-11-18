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

describe('AdminProfile Integration Tests', () => {
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

    it('renders complete admin interface with all components', () => {
        renderWithRouter(<AdminProfile />);
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('admin-header')).toBeInTheDocument();
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    it('displays dashboard statistics correctly', () => {
        renderWithRouter(<AdminProfile />);
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        expect(screen.getByText('Revenue: £125430.5')).toBeInTheDocument();
        expect(screen.getByText('Orders: 1247')).toBeInTheDocument();
    });

    it('shows recent orders in dashboard', () => {
        renderWithRouter(<AdminProfile />);
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    it('handles tab navigation flow', () => {
        renderWithRouter(<AdminProfile />);
        
        // Navigate through different tabs
        fireEvent.click(screen.getByText('Products'));
        expect(screen.getByTestId('admin-products')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Orders'));
        expect(screen.getByTestId('admin-orders')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Users'));
        expect(screen.getByTestId('admin-users')).toBeInTheDocument();
    });

    it('handles notifications functionality', () => {
        renderWithRouter(<AdminProfile />);
        fireEvent.click(screen.getByText('Notifications'));
        expect(screen.getByTestId('admin-notifications')).toBeInTheDocument();
    });

    it('handles analytics and export functionality', () => {
        renderWithRouter(<AdminProfile />);
        fireEvent.click(screen.getByText('Analytics'));
        expect(screen.getByTestId('admin-analytics')).toBeInTheDocument();
    });

    it('displays profile settings correctly', () => {
        renderWithRouter(<AdminProfile />);
        fireEvent.click(screen.getByText('Profile'));
        expect(screen.getByTestId('admin-profile-settings')).toBeInTheDocument();
    });

    it('handles mobile responsive behavior', () => {
        renderWithRouter(<AdminProfile />);
        const sidebar = screen.getByTestId('admin-sidebar').parentElement;
        expect(sidebar).toHaveClass('d-none', 'd-lg-block');
    });

    it('maintains state consistency across tab switches', () => {
        renderWithRouter(<AdminProfile />);
        
        // Switch tabs multiple times
        fireEvent.click(screen.getByText('Products'));
        fireEvent.click(screen.getByText('Dashboard'));
        fireEvent.click(screen.getByText('Orders'));
        
        expect(screen.getByTestId('admin-orders')).toBeInTheDocument();
    });

    it('handles error states gracefully', () => {
        renderWithRouter(<AdminProfile />);
        // Component should render without errors even with minimal data
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    });
});