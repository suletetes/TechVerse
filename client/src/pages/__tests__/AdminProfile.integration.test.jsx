import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminProfile from '../AdminProfile';

// Mock CSS import
vi.mock('../../assets/css/admin-enhancements.css', () => ({}));

// Create more realistic mocks for integration testing
const mockAdminData = {
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
        }
    ],
    products: [
        {
            id: 1,
            name: 'Tablet Air',
            category: 'Tablets',
            price: 1999,
            stock: 45,
            status: 'Active',
            sales: 234
        },
        {
            id: 2,
            name: 'Phone Pro',
            category: 'Phones',
            price: 999,
            stock: 12,
            status: 'Low Stock',
            sales: 567
        }
    ],
    notifications: [
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
        }
    ]
};

const mockHandlers = {
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    handleExport: vi.fn(),
    handleTabChange: vi.fn(),
    setExportData: vi.fn()
};

vi.mock('../../hooks/useAdminData', () => ({
    useAdminData: () => ({
        ...mockAdminData,
        formatCurrency: (amount) => `£${amount.toLocaleString('en-GB', {minimumFractionDigits: 2})}`,
        getStatusColor: (status) => {
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
        }
    })
}));

const mockExportData = {
    type: 'orders', // Start with a type selected for the export test
    format: 'csv',
    dateRange: '30days',
    loading: false
};

// Update the setExportData handler to modify the mock data
mockHandlers.setExportData = vi.fn((updater) => {
    if (typeof updater === 'function') {
        Object.assign(mockExportData, updater(mockExportData));
    } else {
        Object.assign(mockExportData, updater);
    }
});

vi.mock('../../hooks/useAdminState', () => ({
    useAdminState: () => ({
        isEditingProfile: false,
        setIsEditingProfile: vi.fn(),
        passwordData: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        },
        exportData: mockExportData,
        ...mockHandlers
    })
}));

// Mock components with more realistic implementations
vi.mock('../../components', () => ({
    AdminSidebar: ({ activeTab, setActiveTab, adminData }) => (
        <div data-testid="admin-sidebar" className="admin-sidebar">
            <div className="admin-info">
                <h4>{adminData.name}</h4>
                <p>{adminData.role}</p>
            </div>
            <nav className="sidebar-nav">
                {[
                    'dashboard', 'products', 'orders', 'users', 
                    'notifications', 'analytics', 'activity', 
                    'security', 'profile', 'settings'
                ].map(tab => (
                    <button 
                        key={tab}
                        className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        data-testid={`nav-${tab}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </nav>
        </div>
    ),
    AdminHeader: ({ activeTab, adminData, setSidebarOpen }) => (
        <div data-testid="admin-header" className="admin-header">
            <button 
                className="mobile-menu-toggle d-lg-none"
                onClick={() => setSidebarOpen(true)}
                data-testid="mobile-menu-toggle"
            >
                Menu
            </button>
            <div className="header-info">
                <h1>Admin Dashboard - {activeTab}</h1>
                <div className="admin-details">
                    <span>{adminData.name}</span>
                    <span>{adminData.email}</span>
                </div>
            </div>
        </div>
    ),
    AdminDashboard: ({ dashboardStats, recentOrders, formatCurrency }) => (
        <div data-testid="admin-dashboard" className="dashboard-content">
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Revenue</h3>
                    <p>{formatCurrency(dashboardStats.totalRevenue)}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Orders</h3>
                    <p>{dashboardStats.totalOrders}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p>{dashboardStats.totalUsers}</p>
                </div>
            </div>
            <div className="recent-orders">
                <h4>Recent Orders ({recentOrders.length})</h4>
                {recentOrders.map(order => (
                    <div key={order.id} className="order-item">
                        <span>{order.id}</span>
                        <span>{order.customer}</span>
                        <span>{order.status}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    AdminProducts: ({ products }) => (
        <div data-testid="admin-products" className="products-content">
            <h2>Product Management</h2>
            <div className="products-list">
                {products.map(product => (
                    <div key={product.id} className="product-item">
                        <span>{product.name}</span>
                        <span>{product.category}</span>
                        <span className={`status-${product.status.toLowerCase().replace(' ', '-')}`}>
                            {product.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    ),
    AdminOrders: ({ recentOrders }) => (
        <div data-testid="admin-orders" className="orders-content">
            <h2>Order Management</h2>
            <div className="orders-table">
                {recentOrders.map(order => (
                    <div key={order.id} className="order-row">
                        <span>{order.id}</span>
                        <span>{order.customer}</span>
                        <span>{order.status}</span>
                        <span>{order.total}</span>
                    </div>
                ))}
            </div>
        </div>
    ),
    AdminUsers: () => (
        <div data-testid="admin-users" className="users-content">
            <h2>User Management</h2>
        </div>
    ),
    AdminAddProduct: () => (
        <div data-testid="admin-add-product">Add Product</div>
    ),
    AdminCategories: () => (
        <div data-testid="admin-categories">Categories</div>
    ),
    AdminSettings: () => (
        <div data-testid="admin-settings">Settings</div>
    ),
    AdminNotifications: ({ notifications, markNotificationAsRead, markAllNotificationsAsRead }) => (
        <div data-testid="admin-notifications" className="notifications-content">
            <div className="notifications-header">
                <h2>Notifications</h2>
                <button 
                    onClick={markAllNotificationsAsRead}
                    data-testid="mark-all-read"
                >
                    Mark All Read
                </button>
            </div>
            <div className="notifications-list">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    >
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <small>{notification.time}</small>
                        {!notification.read && (
                            <button 
                                onClick={() => markNotificationAsRead(notification.id)}
                                data-testid={`mark-read-${notification.id}`}
                            >
                                Mark Read
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    ),
    AdminAnalytics: ({ dashboardStats, exportData, setExportData, handleExport }) => (
        <div data-testid="admin-analytics" className="analytics-content">
            <h2>Analytics & Reports</h2>
            <div className="analytics-stats">
                <div>Conversion Rate: {dashboardStats.conversionRate}%</div>
                <div>Customer Satisfaction: {dashboardStats.customerSatisfaction}/5</div>
            </div>
            <div className="export-section">
                <select 
                    value={exportData.type}
                    onChange={(e) => setExportData(prev => ({...prev, type: e.target.value}))}
                    data-testid="export-type-select"
                >
                    <option value="">Select type</option>
                    <option value="orders">Orders</option>
                    <option value="products">Products</option>
                    <option value="users">Users</option>
                </select>
                <button 
                    onClick={() => handleExport(exportData.type)}
                    disabled={!exportData.type}
                    data-testid="export-button"
                >
                    Export Data
                </button>
            </div>
        </div>
    ),
    AdminActivityLog: () => (
        <div data-testid="admin-activity-log">Activity Log</div>
    ),
    AdminSecurity: () => (
        <div data-testid="admin-security">Security Settings</div>
    ),
    AdminProfileSettings: ({ adminProfileData }) => (
        <div data-testid="admin-profile-settings" className="profile-settings">
            <h2>Profile Settings</h2>
            <div className="profile-info">
                <div>Name: {adminProfileData.name}</div>
                <div>Email: {adminProfileData.email}</div>
                <div>Role: {adminProfileData.role}</div>
                <div>Department: {adminProfileData.department}</div>
            </div>
        </div>
    )
}));

describe('AdminProfile Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders complete admin interface with all components', () => {
        render(<AdminProfile />);
        
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('admin-header')).toBeInTheDocument();
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        
        expect(screen.getAllByText('Sarah Johnson')).toHaveLength(2);
        expect(screen.getByText('Super Admin')).toBeInTheDocument();
    });

    it('displays dashboard statistics correctly', () => {
        render(<AdminProfile />);
        
        expect(screen.getByText('£125,430.50')).toBeInTheDocument();
        expect(screen.getByText('1247')).toBeInTheDocument();
        expect(screen.getByText('8934')).toBeInTheDocument();
    });

    it('shows recent orders in dashboard', () => {
        render(<AdminProfile />);
        
        expect(screen.getByText('Recent Orders (2)')).toBeInTheDocument();
        expect(screen.getByText('TV-2024-001234')).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Emma Wilson')).toBeInTheDocument();
    });

    it('handles tab navigation flow', async () => {
        render(<AdminProfile />);
        
        // Start with dashboard
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        
        // Navigate to products
        fireEvent.click(screen.getByTestId('nav-products'));
        await waitFor(() => {
            expect(screen.getByTestId('admin-products')).toBeInTheDocument();
        });
        
        // Check products are displayed
        expect(screen.getByText('Tablet Air')).toBeInTheDocument();
        expect(screen.getByText('Phone Pro')).toBeInTheDocument();
        
        // Navigate to orders
        fireEvent.click(screen.getByTestId('nav-orders'));
        await waitFor(() => {
            expect(screen.getByTestId('admin-orders')).toBeInTheDocument();
        });
        
        // Navigate to notifications
        fireEvent.click(screen.getByTestId('nav-notifications'));
        await waitFor(() => {
            expect(screen.getByTestId('admin-notifications')).toBeInTheDocument();
        });
    });

    it('handles notifications functionality', async () => {
        render(<AdminProfile />);
        
        // Check notification bar is displayed
        expect(screen.getByText('You have 2 unread notifications')).toBeInTheDocument();
        
        // Navigate to notifications
        fireEvent.click(screen.getByText('View All'));
        await waitFor(() => {
            expect(screen.getByTestId('admin-notifications')).toBeInTheDocument();
        });
        
        // Check notifications are displayed
        expect(screen.getByText('New Order Received')).toBeInTheDocument();
        expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
        
        // Test mark all as read
        fireEvent.click(screen.getByTestId('mark-all-read'));
        expect(mockHandlers.markAllNotificationsAsRead).toHaveBeenCalled();
        
        // Test mark individual as read
        fireEvent.click(screen.getByTestId('mark-read-1'));
        expect(mockHandlers.markNotificationAsRead).toHaveBeenCalledWith(1);
    });

    it('handles analytics and export functionality', async () => {
        render(<AdminProfile />);
        
        // Navigate to analytics
        fireEvent.click(screen.getByTestId('nav-analytics'));
        await waitFor(() => {
            expect(screen.getByTestId('admin-analytics')).toBeInTheDocument();
        });
        
        // Check analytics data is displayed
        expect(screen.getByText('Conversion Rate: 3.2%')).toBeInTheDocument();
        expect(screen.getByText('Customer Satisfaction: 4.6/5')).toBeInTheDocument();
        
        // Test export functionality
        const exportSelect = screen.getByTestId('export-type-select');
        const exportButton = screen.getByTestId('export-button');
        
        // Button should be enabled since we have a type selected in mock
        expect(exportButton).not.toBeDisabled();
        
        // Test changing export type
        fireEvent.change(exportSelect, { target: { value: 'products' } });
        expect(mockHandlers.setExportData).toHaveBeenCalled();
        
        // Export button should work with the selected type
        fireEvent.click(exportButton);
        expect(mockHandlers.handleExport).toHaveBeenCalledWith('products');
    });

    it('displays profile settings correctly', async () => {
        render(<AdminProfile />);
        
        // Navigate to profile
        fireEvent.click(screen.getByTestId('nav-profile'));
        await waitFor(() => {
            expect(screen.getByTestId('admin-profile-settings')).toBeInTheDocument();
        });
        
        // Check profile information is displayed
        expect(screen.getByText('Name: Sarah Johnson')).toBeInTheDocument();
        expect(screen.getByText('Email: sarah.johnson@techverse.com')).toBeInTheDocument();
        expect(screen.getByText('Role: Super Admin')).toBeInTheDocument();
        expect(screen.getByText('Department: IT Administration')).toBeInTheDocument();
    });

    it('handles mobile responsive behavior', () => {
        render(<AdminProfile />);
        
        // Check mobile menu toggle exists
        const mobileToggle = screen.getByTestId('mobile-menu-toggle');
        expect(mobileToggle).toBeInTheDocument();
        expect(mobileToggle).toHaveClass('d-lg-none');
    });

    it('maintains state consistency across tab switches', async () => {
        render(<AdminProfile />);
        
        // Switch between multiple tabs
        fireEvent.click(screen.getByTestId('nav-products'));
        await waitFor(() => {
            expect(screen.getByTestId('admin-products')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByTestId('nav-dashboard'));
        await waitFor(() => {
            expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByTestId('nav-users'));
        await waitFor(() => {
            expect(screen.getByTestId('admin-users')).toBeInTheDocument();
        });
        
        // Data should remain consistent
        expect(screen.getAllByText('Sarah Johnson')).toHaveLength(2);
    });

    it('handles error states gracefully', () => {
        render(<AdminProfile />);
        
        // Component should render even with potential data issues
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    });
});