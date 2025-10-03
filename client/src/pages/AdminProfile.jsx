import React, {useState} from 'react';

import {
    AdminSidebar,
    AdminHeader,
    AdminDashboard,
    AdminProducts,
    AdminOrders,
    AdminUsers,
    AdminAddProduct,
    AdminCategories,
    AdminSettings
} from "../components"

// Import admin-specific CSS
import '../assets/css/admin-enhancements.css';

const AdminProfile = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editProductId, setEditProductId] = useState(null);
    const [dateRange, setDateRange] = useState('7days');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
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
    
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    
    // Enhanced state management
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
    
    const [bulkActions, setBulkActions] = useState({
        selectedOrders: [],
        selectedProducts: [],
        selectedUsers: []
    });
    
    const [filters, setFilters] = useState({
        orders: { status: 'all', dateFrom: '', dateTo: '', customer: '' },
        products: { category: 'all', status: 'all', priceMin: '', priceMax: '' },
        users: { status: 'all', joinedFrom: '', joinedTo: '', orderCount: 'all' }
    });
    
    const [exportData, setExportData] = useState({
        type: '',
        format: 'csv',
        dateRange: '30days',
        loading: false
    });
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        price: '',
        originalPrice: '',
        stock: '',
        description: '',
        shortDescription: '',
        brand: '',
        model: '',
        sku: '',
        weight: '',
        dimensions: {
            length: '',
            width: '',
            height: ''
        },
        // Product options like in Product.jsx
        colorOptions: [
            { id: 'silver', name: 'Silver', class: 'silver-dot', available: true },
            { id: 'blue', name: 'Blue', class: 'blue-dot', available: true },
            { id: 'white', name: 'White', class: 'white-dot', available: true },
            { id: 'black', name: 'Black', class: '', available: true }
        ],
        storageOptions: [
            { id: '128GB', name: '128GB', price: 0, available: true },
            { id: '256GB', name: '256GB', price: 100, available: true },
            { id: '512GB', name: '512GB', price: 200, available: true }
        ],
        // Media gallery like in Product.jsx
        mediaGallery: [],
        // Technical specifications
        technicalSpecs: {
            display: '',
            resolution: '',
            processor: '',
            ram: '',
            camera: '',
            batteryLife: '',
            connectivity: '',
            operatingSystem: ''
        },
        // Key features
        keyFeatures: ['', '', '', ''],
        // SEO and metadata
        seoTitle: '',
        seoDescription: '',
        tags: [],
        // Pricing and inventory
        costPrice: '',
        profitMargin: '',
        minOrderQuantity: 1,
        maxOrderQuantity: 100,
        // Shipping
        shippingWeight: '',
        shippingDimensions: {
            length: '',
            width: '',
            height: ''
        },
        freeShipping: false,
        // Status and visibility
        status: 'draft', // draft, active, inactive
        featured: false,
        onSale: false,
        salePrice: '',
        saleStartDate: '',
        saleEndDate: '',
        // Images
        mainImage: null,
        additionalImages: [],
        // Variants
        hasVariants: false,
        variants: []
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Mock admin data (derived from adminProfileData for backward compatibility)
    const adminData = {
        name: adminProfileData.name,
        role: adminProfileData.role,
        email: adminProfileData.email,
        avatar: adminProfileData.avatar,
        lastLogin: adminProfileData.lastLogin,
        permissions: adminProfileData.permissions
    };

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
        // Additional metrics
        avgOrderValue: 100.58,
        conversionRate: 3.2,
        returnRate: 2.1,
        customerSatisfaction: 4.6,
        topSellingCategory: 'Electronics',
        lowStockItems: 8,
        pendingOrders: 23,
        activeUsers: 1234,
        // Performance metrics
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
            sortOrder: 1,
            seoTitle: 'Tablets - Latest iPad and Android Tablets',
            seoDescription: 'Shop the latest tablets from top brands including iPad, Samsung Galaxy Tab, and more.',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            specificationTemplate: {
                groups: [
                    {
                        id: 'display',
                        name: 'Display',
                        fields: [
                            { id: 'screenSize', name: 'Screen Size', type: 'text', required: true },
                            { id: 'resolution', name: 'Resolution', type: 'text', required: true },
                            { id: 'displayType', name: 'Display Type', type: 'select', required: false, options: ['LCD', 'OLED', 'AMOLED', 'Retina'] }
                        ]
                    },
                    {
                        id: 'performance',
                        name: 'Performance',
                        fields: [
                            { id: 'processor', name: 'Processor', type: 'text', required: true },
                            { id: 'ram', name: 'RAM', type: 'select', required: true, options: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
                            { id: 'storage', name: 'Storage', type: 'select', required: true, options: ['64GB', '128GB', '256GB', '512GB', '1TB'] }
                        ]
                    },
                    {
                        id: 'connectivity',
                        name: 'Connectivity',
                        fields: [
                            { id: 'wifi', name: 'Wi-Fi', type: 'text', required: false },
                            { id: 'bluetooth', name: 'Bluetooth', type: 'text', required: false },
                            { id: 'cellular', name: 'Cellular', type: 'boolean', required: false }
                        ]
                    }
                ]
            },
            optionsTemplate: [
                {
                    id: 'colors',
                    name: 'Colors',
                    type: 'color',
                    enabled: true,
                    required: false,
                    options: [
                        { id: 'silver', name: 'Silver', value: '#C0C0C0' },
                        { id: 'space-gray', name: 'Space Gray', value: '#4A4A4A' },
                        { id: 'gold', name: 'Gold', value: '#FFD700' },
                        { id: 'rose-gold', name: 'Rose Gold', value: '#E8B4B8' }
                    ]
                },
                {
                    id: 'storage',
                    name: 'Storage',
                    type: 'select',
                    enabled: true,
                    required: true,
                    options: [
                        { id: '64gb', name: '64GB', value: '64GB' },
                        { id: '128gb', name: '128GB', value: '128GB' },
                        { id: '256gb', name: '256GB', value: '256GB' },
                        { id: '512gb', name: '512GB', value: '512GB' }
                    ]
                }
            ]
        },
        {
            id: 2,
            name: 'Smartphones',
            slug: 'smartphones',
            description: 'Latest mobile phones and smartphones',
            image: 'img/category-phones.jpg',
            parentId: null,
            isActive: true,
            sortOrder: 2,
            seoTitle: 'Smartphones - iPhone, Samsung, Google Pixel',
            seoDescription: 'Discover the latest smartphones from Apple, Samsung, Google, and more top brands.',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            specificationTemplate: {
                groups: [
                    {
                        id: 'display',
                        name: 'Display',
                        fields: [
                            { id: 'screenSize', name: 'Screen Size', type: 'text', required: true },
                            { id: 'resolution', name: 'Resolution', type: 'text', required: true },
                            { id: 'refreshRate', name: 'Refresh Rate', type: 'select', required: false, options: ['60Hz', '90Hz', '120Hz', '144Hz'] }
                        ]
                    },
                    {
                        id: 'camera',
                        name: 'Camera',
                        fields: [
                            { id: 'rearCamera', name: 'Rear Camera', type: 'text', required: true },
                            { id: 'frontCamera', name: 'Front Camera', type: 'text', required: true },
                            { id: 'videoRecording', name: 'Video Recording', type: 'select', required: false, options: ['1080p', '4K', '8K'] }
                        ]
                    },
                    {
                        id: 'battery',
                        name: 'Battery & Charging',
                        fields: [
                            { id: 'batteryCapacity', name: 'Battery Capacity', type: 'text', required: false },
                            { id: 'fastCharging', name: 'Fast Charging', type: 'boolean', required: false },
                            { id: 'wirelessCharging', name: 'Wireless Charging', type: 'boolean', required: false }
                        ]
                    }
                ]
            },
            optionsTemplate: [
                {
                    id: 'colors',
                    name: 'Colors',
                    type: 'color',
                    enabled: true,
                    required: false,
                    options: [
                        { id: 'black', name: 'Black', value: '#000000' },
                        { id: 'white', name: 'White', value: '#FFFFFF' },
                        { id: 'blue', name: 'Blue', value: '#007AFF' },
                        { id: 'red', name: 'Red', value: '#FF3B30' },
                        { id: 'green', name: 'Green', value: '#34C759' }
                    ]
                },
                {
                    id: 'storage',
                    name: 'Storage',
                    type: 'select',
                    enabled: true,
                    required: true,
                    options: [
                        { id: '128gb', name: '128GB', value: '128GB' },
                        { id: '256gb', name: '256GB', value: '256GB' },
                        { id: '512gb', name: '512GB', value: '512GB' },
                        { id: '1tb', name: '1TB', value: '1TB' }
                    ]
                }
            ]
        },
        {
            id: 3,
            name: 'Headphones',
            slug: 'headphones',
            description: 'Premium audio headphones and earbuds',
            image: 'img/category-headphones.jpg',
            parentId: null,
            isActive: true,
            sortOrder: 3,
            seoTitle: 'Headphones - Wireless, Noise Cancelling, Gaming',
            seoDescription: 'Shop premium headphones from top audio brands. Wireless, noise-cancelling, and gaming headphones.',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            specificationTemplate: {
                groups: [
                    {
                        id: 'audio',
                        name: 'Audio',
                        fields: [
                            { id: 'driverSize', name: 'Driver Size', type: 'text', required: false },
                            { id: 'frequencyResponse', name: 'Frequency Response', type: 'text', required: false },
                            { id: 'impedance', name: 'Impedance', type: 'text', required: false }
                        ]
                    },
                    {
                        id: 'features',
                        name: 'Features',
                        fields: [
                            { id: 'noiseCancellation', name: 'Noise Cancellation', type: 'boolean', required: false },
                            { id: 'wireless', name: 'Wireless', type: 'boolean', required: false },
                            { id: 'batteryLife', name: 'Battery Life', type: 'text', required: false }
                        ]
                    },
                    {
                        id: 'connectivity',
                        name: 'Connectivity',
                        fields: [
                            { id: 'bluetooth', name: 'Bluetooth Version', type: 'select', required: false, options: ['5.0', '5.1', '5.2', '5.3'] },
                            { id: 'wiredConnection', name: 'Wired Connection', type: 'select', required: false, options: ['3.5mm', 'USB-C', 'Lightning', 'None'] }
                        ]
                    }
                ]
            },
            optionsTemplate: [
                {
                    id: 'colors',
                    name: 'Colors',
                    type: 'color',
                    enabled: true,
                    required: false,
                    options: [
                        { id: 'black', name: 'Black', value: '#000000' },
                        { id: 'white', name: 'White', value: '#FFFFFF' },
                        { id: 'silver', name: 'Silver', value: '#C0C0C0' }
                    ]
                },
                {
                    id: 'size',
                    name: 'Size',
                    type: 'select',
                    enabled: true,
                    required: false,
                    options: [
                        { id: 'small', name: 'Small', value: 'S' },
                        { id: 'medium', name: 'Medium', value: 'M' },
                        { id: 'large', name: 'Large', value: 'L' }
                    ]
                }
            ]
        },
        {
            id: 4,
            name: 'Laptops',
            slug: 'laptops',
            description: 'High-performance laptops and notebooks for work and gaming',
            image: 'img/category-laptops.jpg',
            parentId: null,
            isActive: true,
            sortOrder: 4,
            seoTitle: 'Laptops - Gaming, Business, and Ultrabooks',
            seoDescription: 'Shop the latest laptops from top brands. Gaming laptops, business notebooks, and ultrabooks.',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            specificationTemplate: {
                groups: [
                    {
                        id: 'display',
                        name: 'Display',
                        fields: [
                            { id: 'screenSize', name: 'Screen Size', type: 'select', required: true, options: ['13.3"', '14"', '15.6"', '16"', '17.3"'] },
                            { id: 'resolution', name: 'Resolution', type: 'select', required: true, options: ['1920x1080 (FHD)', '2560x1440 (QHD)', '3840x2160 (4K)'] },
                            { id: 'displayType', name: 'Display Type', type: 'select', required: false, options: ['IPS', 'OLED', 'TN', 'VA'] },
                            { id: 'refreshRate', name: 'Refresh Rate', type: 'select', required: false, options: ['60Hz', '120Hz', '144Hz', '165Hz', '240Hz'] }
                        ]
                    },
                    {
                        id: 'performance',
                        name: 'Performance',
                        fields: [
                            { id: 'processor', name: 'Processor', type: 'text', required: true },
                            { id: 'ram', name: 'RAM', type: 'select', required: true, options: ['8GB', '16GB', '32GB', '64GB'] },
                            { id: 'storage', name: 'Storage', type: 'text', required: true },
                            { id: 'graphics', name: 'Graphics Card', type: 'text', required: false }
                        ]
                    },
                    {
                        id: 'connectivity',
                        name: 'Connectivity & Ports',
                        fields: [
                            { id: 'wifi', name: 'Wi-Fi', type: 'select', required: false, options: ['Wi-Fi 6', 'Wi-Fi 6E', 'Wi-Fi 7'] },
                            { id: 'bluetooth', name: 'Bluetooth', type: 'select', required: false, options: ['5.0', '5.1', '5.2', '5.3'] },
                            { id: 'ports', name: 'Ports', type: 'textarea', required: false },
                            { id: 'webcam', name: 'Webcam', type: 'text', required: false }
                        ]
                    },
                    {
                        id: 'physical',
                        name: 'Physical Specifications',
                        fields: [
                            { id: 'weight', name: 'Weight', type: 'text', required: false },
                            { id: 'thickness', name: 'Thickness', type: 'text', required: false },
                            { id: 'batteryLife', name: 'Battery Life', type: 'text', required: false },
                            { id: 'keyboard', name: 'Keyboard Type', type: 'select', required: false, options: ['Standard', 'Backlit', 'RGB Backlit', 'Mechanical'] }
                        ]
                    }
                ]
            },
            optionsTemplate: [
                {
                    id: 'colors',
                    name: 'Colors',
                    type: 'color',
                    enabled: true,
                    required: false,
                    options: [
                        { id: 'silver', name: 'Silver', value: '#C0C0C0' },
                        { id: 'space-gray', name: 'Space Gray', value: '#4A4A4A' },
                        { id: 'black', name: 'Black', value: '#000000' },
                        { id: 'white', name: 'White', value: '#FFFFFF' }
                    ]
                },
                {
                    id: 'ram',
                    name: 'RAM Configuration',
                    type: 'select',
                    enabled: true,
                    required: true,
                    options: [
                        { id: '8gb', name: '8GB', value: '8GB' },
                        { id: '16gb', name: '16GB', value: '16GB' },
                        { id: '32gb', name: '32GB', value: '32GB' }
                    ]
                },
                {
                    id: 'storage',
                    name: 'Storage Options',
                    type: 'select',
                    enabled: true,
                    required: true,
                    options: [
                        { id: '256gb', name: '256GB SSD', value: '256GB SSD' },
                        { id: '512gb', name: '512GB SSD', value: '512GB SSD' },
                        { id: '1tb', name: '1TB SSD', value: '1TB SSD' },
                        { id: '2tb', name: '2TB SSD', value: '2TB SSD' }
                    ]
                }
            ]
        },
        {
            id: 5,
            name: 'Televisions',
            slug: 'televisions',
            description: 'Smart TVs, OLED, QLED, and 4K televisions for home entertainment',
            image: 'img/category-tvs.jpg',
            parentId: null,
            isActive: true,
            sortOrder: 5,
            seoTitle: 'Televisions - Smart TV, OLED, QLED, 4K TVs',
            seoDescription: 'Shop the latest smart TVs with 4K, OLED, and QLED technology from top brands.',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            specificationTemplate: {
                groups: [
                    {
                        id: 'display',
                        name: 'Display Technology',
                        fields: [
                            { id: 'screenSize', name: 'Screen Size', type: 'select', required: true, options: ['32"', '43"', '50"', '55"', '65"', '75"', '85"'] },
                            { id: 'resolution', name: 'Resolution', type: 'select', required: true, options: ['1920x1080 (Full HD)', '3840x2160 (4K UHD)', '7680x4320 (8K)'] },
                            { id: 'displayType', name: 'Display Type', type: 'select', required: true, options: ['LED', 'OLED', 'QLED', 'Mini LED', 'Micro LED'] },
                            { id: 'hdr', name: 'HDR Support', type: 'select', required: false, options: ['HDR10', 'HDR10+', 'Dolby Vision', 'HLG'] },
                            { id: 'refreshRate', name: 'Refresh Rate', type: 'select', required: false, options: ['60Hz', '120Hz', '144Hz'] }
                        ]
                    },
                    {
                        id: 'smart',
                        name: 'Smart TV Features',
                        fields: [
                            { id: 'operatingSystem', name: 'Operating System', type: 'select', required: false, options: ['Android TV', 'webOS', 'Tizen', 'Roku TV', 'Fire TV'] },
                            { id: 'voiceControl', name: 'Voice Control', type: 'select', required: false, options: ['Google Assistant', 'Alexa', 'Bixby', 'None'] },
                            { id: 'wifi', name: 'Wi-Fi', type: 'select', required: false, options: ['Wi-Fi 5', 'Wi-Fi 6', 'Wi-Fi 6E'] },
                            { id: 'bluetooth', name: 'Bluetooth', type: 'boolean', required: false }
                        ]
                    },
                    {
                        id: 'audio',
                        name: 'Audio',
                        fields: [
                            { id: 'speakers', name: 'Speaker Configuration', type: 'text', required: false },
                            { id: 'audioOutput', name: 'Audio Output Power', type: 'text', required: false },
                            { id: 'audioTech', name: 'Audio Technology', type: 'select', required: false, options: ['Dolby Atmos', 'DTS:X', 'Dolby Digital Plus', 'Standard'] }
                        ]
                    },
                    {
                        id: 'connectivity',
                        name: 'Connectivity',
                        fields: [
                            { id: 'hdmiPorts', name: 'HDMI Ports', type: 'select', required: false, options: ['2', '3', '4', '5+'] },
                            { id: 'usbPorts', name: 'USB Ports', type: 'select', required: false, options: ['1', '2', '3', '4+'] },
                            { id: 'ethernet', name: 'Ethernet Port', type: 'boolean', required: false },
                            { id: 'opticalAudio', name: 'Optical Audio Out', type: 'boolean', required: false }
                        ]
                    },
                    {
                        id: 'gaming',
                        name: 'Gaming Features',
                        fields: [
                            { id: 'gameMode', name: 'Game Mode', type: 'boolean', required: false },
                            { id: 'vrr', name: 'Variable Refresh Rate (VRR)', type: 'boolean', required: false },
                            { id: 'allm', name: 'Auto Low Latency Mode (ALLM)', type: 'boolean', required: false },
                            { id: 'inputLag', name: 'Input Lag', type: 'text', required: false }
                        ]
                    }
                ]
            },
            optionsTemplate: [
                {
                    id: 'screenSize',
                    name: 'Screen Size',
                    type: 'select',
                    enabled: true,
                    required: true,
                    options: [
                        { id: '32inch', name: '32"', value: '32"' },
                        { id: '43inch', name: '43"', value: '43"' },
                        { id: '50inch', name: '50"', value: '50"' },
                        { id: '55inch', name: '55"', value: '55"' },
                        { id: '65inch', name: '65"', value: '65"' },
                        { id: '75inch', name: '75"', value: '75"' },
                        { id: '85inch', name: '85"', value: '85"' }
                    ]
                },
                {
                    id: 'mountType',
                    name: 'Mount Type',
                    type: 'select',
                    enabled: true,
                    required: false,
                    options: [
                        { id: 'table-stand', name: 'Table Stand', value: 'Table Stand' },
                        { id: 'wall-mount', name: 'Wall Mount', value: 'Wall Mount' },
                        { id: 'both', name: 'Both Included', value: 'Both' }
                    ]
                }
            ]
        },
        {
            id: 6,
            name: 'Watches',
            slug: 'watches',
            description: 'Smartwatches and fitness trackers for health and connectivity',
            image: 'img/category-watches.jpg',
            parentId: null,
            isActive: true,
            sortOrder: 6,
            seoTitle: 'Smartwatches - Apple Watch, Samsung Galaxy Watch, Fitness Trackers',
            seoDescription: 'Shop the latest smartwatches and fitness trackers with health monitoring and smart features.',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            specificationTemplate: {
                groups: [
                    {
                        id: 'display',
                        name: 'Display',
                        fields: [
                            { id: 'displaySize', name: 'Display Size', type: 'text', required: true },
                            { id: 'displayType', name: 'Display Type', type: 'select', required: false, options: ['AMOLED', 'OLED', 'LCD', 'E-ink'] },
                            { id: 'resolution', name: 'Resolution', type: 'text', required: false },
                            { id: 'alwaysOn', name: 'Always-On Display', type: 'boolean', required: false }
                        ]
                    },
                    {
                        id: 'health',
                        name: 'Health & Fitness',
                        fields: [
                            { id: 'heartRate', name: 'Heart Rate Monitor', type: 'boolean', required: false },
                            { id: 'gps', name: 'GPS', type: 'boolean', required: false },
                            { id: 'waterResistance', name: 'Water Resistance', type: 'select', required: false, options: ['IPX7', '5ATM', '10ATM', 'None'] },
                            { id: 'sleepTracking', name: 'Sleep Tracking', type: 'boolean', required: false },
                            { id: 'stressMonitoring', name: 'Stress Monitoring', type: 'boolean', required: false }
                        ]
                    },
                    {
                        id: 'connectivity',
                        name: 'Connectivity',
                        fields: [
                            { id: 'bluetooth', name: 'Bluetooth', type: 'select', required: false, options: ['5.0', '5.1', '5.2', '5.3'] },
                            { id: 'wifi', name: 'Wi-Fi', type: 'boolean', required: false },
                            { id: 'cellular', name: 'Cellular', type: 'boolean', required: false },
                            { id: 'nfc', name: 'NFC', type: 'boolean', required: false }
                        ]
                    },
                    {
                        id: 'battery',
                        name: 'Battery & Charging',
                        fields: [
                            { id: 'batteryLife', name: 'Battery Life', type: 'text', required: false },
                            { id: 'chargingType', name: 'Charging Type', type: 'select', required: false, options: ['Wireless', 'Magnetic', 'USB-C', 'Proprietary'] },
                            { id: 'fastCharging', name: 'Fast Charging', type: 'boolean', required: false }
                        ]
                    }
                ]
            },
            optionsTemplate: [
                {
                    id: 'caseSize',
                    name: 'Case Size',
                    type: 'select',
                    enabled: true,
                    required: true,
                    options: [
                        { id: '38mm', name: '38mm', value: '38mm' },
                        { id: '40mm', name: '40mm', value: '40mm' },
                        { id: '42mm', name: '42mm', value: '42mm' },
                        { id: '44mm', name: '44mm', value: '44mm' },
                        { id: '45mm', name: '45mm', value: '45mm' },
                        { id: '49mm', name: '49mm', value: '49mm' }
                    ]
                },
                {
                    id: 'caseColor',
                    name: 'Case Color',
                    type: 'color',
                    enabled: true,
                    required: false,
                    options: [
                        { id: 'silver', name: 'Silver', value: '#C0C0C0' },
                        { id: 'gold', name: 'Gold', value: '#FFD700' },
                        { id: 'space-gray', name: 'Space Gray', value: '#4A4A4A' },
                        { id: 'black', name: 'Black', value: '#000000' }
                    ]
                },
                {
                    id: 'bandType',
                    name: 'Band Type',
                    type: 'select',
                    enabled: true,
                    required: false,
                    options: [
                        { id: 'sport', name: 'Sport Band', value: 'Sport Band' },
                        { id: 'leather', name: 'Leather Band', value: 'Leather Band' },
                        { id: 'metal', name: 'Metal Band', value: 'Metal Band' },
                        { id: 'fabric', name: 'Fabric Band', value: 'Fabric Band' }
                    ]
                }
            ]
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
        const { name, value, type, checked } = e.target;

        // Handle nested objects (dimensions, technicalSpecs, etc.)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setNewProduct(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
            return;
        }

        // Handle checkboxes
        if (type === 'checkbox') {
            setNewProduct(prev => ({
                ...prev,
                [name]: checked
            }));
            return;
        }

        // Handle character limits
        if (name === 'description' && value.length > 1000) return;
        if (name === 'shortDescription' && value.length > 200) return;
        if (name === 'seoDescription' && value.length > 160) return;

        // Handle price validation
        const priceFields = ['price', 'originalPrice', 'costPrice', 'salePrice'];
        if (priceFields.includes(name) && value && parseFloat(value) < 0) return;

        // Handle stock validation
        const stockFields = ['stock', 'minOrderQuantity', 'maxOrderQuantity'];
        if (stockFields.includes(name) && value && parseInt(value) < 0) return;

        setNewProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleArrayInputChange = (arrayName, index, value) => {
        setNewProduct(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].map((item, i) => i === index ? value : item)
        }));
    };

    const addArrayItem = (arrayName, defaultValue = '') => {
        setNewProduct(prev => ({
            ...prev,
            [arrayName]: [...prev[arrayName], defaultValue]
        }));
    };

    const removeArrayItem = (arrayName, index) => {
        setNewProduct(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_, i) => i !== index)
        }));
    };

    const handleTagInput = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const newTag = e.target.value.trim();
            if (!newProduct.tags.includes(newTag)) {
                setNewProduct(prev => ({
                    ...prev,
                    tags: [...prev.tags, newTag]
                }));
            }
            e.target.value = '';
        }
    };

    const removeTag = (tagToRemove) => {
        setNewProduct(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setNewProduct(prev => ({
                    ...prev,
                    mainImage: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdditionalImagesChange = (e) => {
        const files = Array.from(e.target.files);
        const imagePromises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve({
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    alt: file.name,
                    title: file.name.split('.')[0]
                });
                reader.readAsDataURL(file);
            });
        });

        Promise.all(imagePromises).then(images => {
            setNewProduct(prev => ({
                ...prev,
                additionalImages: [...prev.additionalImages, ...images]
            }));
        });
    };

    const removeAdditionalImage = (imageId) => {
        setNewProduct(prev => ({
            ...prev,
            additionalImages: prev.additionalImages.filter(img => img.id !== imageId)
        }));
    };

    const buildMediaGallery = () => {
        const gallery = [];
        
        // Add main image
        if (newProduct.mainImage) {
            gallery.push({
                id: 'main-image',
                type: 'image',
                src: newProduct.mainImage,
                thumbnail: newProduct.mainImage,
                alt: `${newProduct.name} - Main View`,
                title: 'Main View'
            });
        }

        // Add additional images
        newProduct.additionalImages.forEach((img, index) => {
            gallery.push({
                id: `additional-${index}`,
                type: 'image',
                src: img.src,
                thumbnail: img.src,
                alt: img.alt,
                title: img.title
            });
        });

        return gallery;
    };

    const validateProduct = () => {
        const errors = [];

        // Basic validation
        if (!newProduct.name.trim()) errors.push('Product name is required');
        if (!newProduct.category) errors.push('Category is required');
        if (!newProduct.price || parseFloat(newProduct.price) <= 0) errors.push('Valid price is required');
        if (!newProduct.stock || parseInt(newProduct.stock) < 0) errors.push('Valid stock quantity is required');
        if (!newProduct.description.trim()) errors.push('Product description is required');
        if (!newProduct.shortDescription.trim()) errors.push('Short description is required');
        if (!newProduct.mainImage) errors.push('Main product image is required');

        // Advanced validation
        if (newProduct.originalPrice && parseFloat(newProduct.originalPrice) <= parseFloat(newProduct.price)) {
            errors.push('Original price must be higher than current price');
        }
        if (newProduct.costPrice && parseFloat(newProduct.costPrice) >= parseFloat(newProduct.price)) {
            errors.push('Cost price should be lower than selling price');
        }
        if (newProduct.salePrice && parseFloat(newProduct.salePrice) >= parseFloat(newProduct.price)) {
            errors.push('Sale price must be lower than regular price');
        }
        if (newProduct.minOrderQuantity > newProduct.maxOrderQuantity) {
            errors.push('Minimum order quantity cannot exceed maximum');
        }

        // SEO validation
        if (newProduct.seoTitle && newProduct.seoTitle.length > 60) {
            errors.push('SEO title should be 60 characters or less');
        }
        if (newProduct.seoDescription && newProduct.seoDescription.length > 160) {
            errors.push('SEO description should be 160 characters or less');
        }

        return errors;
    };

    const calculateProfitMargin = () => {
        const price = parseFloat(newProduct.price) || 0;
        const cost = parseFloat(newProduct.costPrice) || 0;
        if (price > 0 && cost > 0) {
            return (((price - cost) / price) * 100).toFixed(1);
        }
        return 0;
    };

    const handleAddProduct = (productData) => {
        // Add the product to the products array (in real app, this would be an API call)
        console.log('Adding product:', productData);
        
        // Show success message
        alert('Product added successfully!');
        
        // Navigate back to products list
        setActiveTab('products');
    };

    const handleUpdateProduct = (productData) => {
        // Update the product in the products array (in real app, this would be an API call)
        console.log('Updating product:', productData);
        
        // Show success message
        alert('Product updated successfully!');
        
        // Navigate back to products list
        setActiveTab('products');
        setEditProductId(null);
    };

    const handleTabChange = (tab, productId = null) => {
        setActiveTab(tab);
        if (tab === 'edit-product') {
            setEditProductId(productId);
        } else {
            setEditProductId(null);
        }
    };

    const handleSaveCategory = (categoryData, action) => {
        if (action === 'create') {
            setCategories(prev => [...prev, categoryData]);
            alert('Category created successfully!');
        } else if (action === 'update') {
            setCategories(prev => prev.map(cat => 
                cat.id === categoryData.id ? categoryData : cat
            ));
            alert('Category updated successfully!');
        }
    };

    const handleDeleteCategory = (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            setCategories(prev => prev.filter(cat => cat.id !== categoryId));
            alert('Category deleted successfully!');
        }
    };

    const handleAddUser = (userData) => {
        setUsers(prev => [...prev, userData]);
        alert('User created successfully!');
    };

    const handleEditUser = (userData) => {
        setUsers(prev => prev.map(user => 
            user.id === userData.id ? userData : user
        ));
        alert('User updated successfully!');
    };

    const handleDeleteUser = (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            setUsers(prev => prev.filter(user => user.id !== userId));
            alert('User deleted successfully!');
        }
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

    // Enhanced helper functions
    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
    };

    const markAllNotificationsAsRead = () => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true }))
        );
    };

    const deleteNotification = (notificationId) => {
        setNotifications(prev => 
            prev.filter(notif => notif.id !== notificationId)
        );
    };

    const handleBulkAction = (type, action, selectedIds) => {
        console.log(`Bulk ${action} for ${type}:`, selectedIds);
        
        switch (action) {
            case 'delete':
                if (confirm(`Are you sure you want to delete ${selectedIds.length} ${type}?`)) {
                    alert(`${selectedIds.length} ${type} deleted successfully!`);
                    // Clear selection
                    setBulkActions(prev => ({
                        ...prev,
                        [`selected${type.charAt(0).toUpperCase() + type.slice(1)}`]: []
                    }));
                }
                break;
            case 'export':
                handleExport(type, selectedIds);
                break;
            case 'updateStatus':
                const newStatus = prompt('Enter new status:');
                if (newStatus) {
                    alert(`Status updated for ${selectedIds.length} ${type}!`);
                }
                break;
            default:
                break;
        }
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

    const handleQuickAction = (action, itemId, itemType) => {
        switch (action) {
            case 'view':
                alert(`Viewing ${itemType} ${itemId}`);
                break;
            case 'edit':
                alert(`Editing ${itemType} ${itemId}`);
                break;
            case 'duplicate':
                alert(`Duplicating ${itemType} ${itemId}`);
                break;
            case 'archive':
                if (confirm(`Archive this ${itemType}?`)) {
                    alert(`${itemType} ${itemId} archived successfully!`);
                }
                break;
            default:
                break;
        }
    };

    const getFilteredData = (dataType, data) => {
        const filter = filters[dataType];
        if (!filter) return data;

        return data.filter(item => {
            // Apply filters based on data type
            switch (dataType) {
                case 'orders':
                    if (filter.status !== 'all' && item.status.toLowerCase() !== filter.status.toLowerCase()) return false;
                    if (filter.customer && !item.customer.toLowerCase().includes(filter.customer.toLowerCase())) return false;
                    if (filter.dateFrom && new Date(item.date) < new Date(filter.dateFrom)) return false;
                    if (filter.dateTo && new Date(item.date) > new Date(filter.dateTo)) return false;
                    break;
                case 'products':
                    if (filter.category !== 'all' && item.category.toLowerCase() !== filter.category.toLowerCase()) return false;
                    if (filter.status !== 'all' && item.status.toLowerCase() !== filter.status.toLowerCase()) return false;
                    if (filter.priceMin && item.price < parseFloat(filter.priceMin)) return false;
                    if (filter.priceMax && item.price > parseFloat(filter.priceMax)) return false;
                    break;
                case 'users':
                    if (filter.status !== 'all' && item.status.toLowerCase() !== filter.status.toLowerCase()) return false;
                    if (filter.joinedFrom && new Date(item.joinDate) < new Date(filter.joinedFrom)) return false;
                    if (filter.joinedTo && new Date(item.joinDate) > new Date(filter.joinedTo)) return false;
                    if (filter.orderCount !== 'all') {
                        const count = parseInt(filter.orderCount);
                        if (count === 0 && item.orders > 0) return false;
                        if (count === 1 && item.orders !== 1) return false;
                        if (count === 5 && item.orders < 5) return false;
                    }
                    break;
                default:
                    break;
            }
            return true;
        });
    };

    const updateFilter = (dataType, filterKey, value) => {
        setFilters(prev => ({
            ...prev,
            [dataType]: {
                ...prev[dataType],
                [filterKey]: value
            }
        }));
    };

    const clearFilters = (dataType) => {
        setFilters(prev => ({
            ...prev,
            [dataType]: dataType === 'orders' 
                ? { status: 'all', dateFrom: '', dateTo: '', customer: '' }
                : dataType === 'products'
                ? { category: 'all', status: 'all', priceMin: '', priceMax: '' }
                : { status: 'all', joinedFrom: '', joinedTo: '', orderCount: 'all' }
        }));
    };

    // Admin profile management functions
    const handleAdminProfileInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAdminProfileData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveAdminProfile = () => {
        console.log('Saving admin profile:', adminProfileData);
        setIsEditingProfile(false);
        alert('Profile updated successfully!');
    };

    const handleAdminAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAdminProfileData(prev => ({
                    ...prev,
                    avatar: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleTwoFactor = () => {
        if (adminProfileData.twoFactorEnabled) {
            if (confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
                setAdminProfileData(prev => ({
                    ...prev,
                    twoFactorEnabled: false
                }));
                alert('Two-factor authentication disabled.');
            }
        } else {
            // In real app, this would redirect to 2FA setup
            alert('Two-factor authentication setup would be initiated here.');
            setAdminProfileData(prev => ({
                ...prev,
                twoFactorEnabled: true
            }));
        }
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

                            {activeTab === 'dashboard' && (
                                <AdminDashboard
                                    dashboardStats={dashboardStats}
                                    dateRange={dateRange}
                                    setDateRange={setDateRange}
                                    recentOrders={recentOrders}
                                    setActiveTab={setActiveTab}
                                    getStatusColor={getStatusColor}
                                    formatCurrency={formatCurrency}
                                    notifications={notifications}
                                    activityLog={activityLog}
                                />
                            )}
                            {activeTab === 'products' && (
                                <AdminProducts
                                    products={products}
                                    setActiveTab={handleTabChange}
                                    getStatusColor={getStatusColor}
                                    formatCurrency={formatCurrency}
                                />
                            )}
                            {activeTab === 'add-product' && (
                                <AdminAddProduct
                                    categories={categories}
                                    onSave={handleAddProduct}
                                    onCancel={() => handleTabChange('products')}
                                />
                            )}
                            {activeTab === 'edit-product' && (
                                <AdminAddProduct
                                    categories={categories}
                                    editProduct={products.find(p => p.id === editProductId)}
                                    onSave={handleUpdateProduct}
                                    onCancel={() => handleTabChange('products')}
                                />
                            )}
                            {activeTab === 'categories' && (
                                <AdminCategories
                                    categories={categories}
                                    setActiveTab={handleTabChange}
                                    onSave={handleSaveCategory}
                                    onDelete={handleDeleteCategory}
                                />
                            )}
                            {activeTab === 'orders' && (
                                <AdminOrders
                                    recentOrders={getFilteredData('orders', recentOrders)}
                                    getStatusColor={getStatusColor}
                                    formatCurrency={formatCurrency}
                                    bulkActions={bulkActions}
                                    setBulkActions={setBulkActions}
                                    handleBulkAction={handleBulkAction}
                                    handleQuickAction={handleQuickAction}
                                    filters={filters.orders}
                                    updateFilter={updateFilter}
                                    clearFilters={clearFilters}
                                    handleExport={handleExport}
                                />
                            )}
                            {activeTab === 'users' && (
                                <AdminUsers
                                    users={users}
                                    getStatusColor={getStatusColor}
                                    formatCurrency={formatCurrency}
                                    onAddUser={handleAddUser}
                                    onEditUser={handleEditUser}
                                    onDeleteUser={handleDeleteUser}
                                />
                            )}
                            {activeTab === 'notifications' && (
                                <div className="row">
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0">Notifications</h5>
                                                <div className="d-flex gap-2">
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={markAllNotificationsAsRead}
                                                    >
                                                        Mark All Read
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => setNotifications([])}
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="card-body p-0">
                                                {notifications.length === 0 ? (
                                                    <div className="text-center py-5">
                                                        <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                                                            <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                                                        </svg>
                                                        <p className="text-muted">No notifications</p>
                                                    </div>
                                                ) : (
                                                    <div className="list-group list-group-flush">
                                                        {notifications.map(notification => (
                                                            <div 
                                                                key={notification.id} 
                                                                className={`list-group-item d-flex justify-content-between align-items-start ${!notification.read ? 'bg-light' : ''}`}
                                                            >
                                                                <div className="d-flex align-items-start">
                                                                    <div className={`rounded-circle p-2 me-3 ${
                                                                        notification.type === 'order' ? 'bg-primary bg-opacity-10 text-primary' :
                                                                        notification.type === 'stock' ? 'bg-warning bg-opacity-10 text-warning' :
                                                                        'bg-info bg-opacity-10 text-info'
                                                                    }`}>
                                                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                                                            {notification.type === 'order' && (
                                                                                <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                                                                            )}
                                                                            {notification.type === 'stock' && (
                                                                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                                            )}
                                                                            {notification.type === 'user' && (
                                                                                <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                                            )}
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <h6 className="mb-1">{notification.title}</h6>
                                                                        <p className="mb-1 text-muted">{notification.message}</p>
                                                                        <small className="text-muted">{notification.time}</small>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex gap-1">
                                                                    {!notification.read && (
                                                                        <button 
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            onClick={() => markNotificationAsRead(notification.id)}
                                                                        >
                                                                            Mark Read
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => deleteNotification(notification.id)}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'analytics' && (
                                <div className="row">
                                    <div className="col-12 mb-4">
                                        <h2>Analytics & Reports</h2>
                                        <p className="text-muted">Detailed insights and performance metrics</p>
                                    </div>
                                    
                                    {/* Performance Metrics */}
                                    <div className="col-md-4 mb-4">
                                        <div className="card">
                                            <div className="card-body text-center">
                                                <h5 className="card-title">Conversion Rate</h5>
                                                <h2 className="text-success">{dashboardStats.conversionRate}%</h2>
                                                <small className="text-muted">+0.3% from last month</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4 mb-4">
                                        <div className="card">
                                            <div className="card-body text-center">
                                                <h5 className="card-title">Avg Order Value</h5>
                                                <h2 className="text-primary">{formatCurrency(dashboardStats.avgOrderValue)}</h2>
                                                <small className="text-muted">+£5.20 from last month</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4 mb-4">
                                        <div className="card">
                                            <div className="card-body text-center">
                                                <h5 className="card-title">Customer Satisfaction</h5>
                                                <h2 className="text-warning">{dashboardStats.customerSatisfaction}/5</h2>
                                                <small className="text-muted">Based on 1,247 reviews</small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Export Options */}
                                    <div className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="mb-0">Export Data</h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Data Type</label>
                                                        <select 
                                                            className="form-select"
                                                            value={exportData.type}
                                                            onChange={(e) => setExportData(prev => ({...prev, type: e.target.value}))}
                                                        >
                                                            <option value="">Select type</option>
                                                            <option value="orders">Orders</option>
                                                            <option value="products">Products</option>
                                                            <option value="users">Users</option>
                                                            <option value="analytics">Analytics</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Format</label>
                                                        <select 
                                                            className="form-select"
                                                            value={exportData.format}
                                                            onChange={(e) => setExportData(prev => ({...prev, format: e.target.value}))}
                                                        >
                                                            <option value="csv">CSV</option>
                                                            <option value="xlsx">Excel</option>
                                                            <option value="pdf">PDF</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Date Range</label>
                                                        <select 
                                                            className="form-select"
                                                            value={exportData.dateRange}
                                                            onChange={(e) => setExportData(prev => ({...prev, dateRange: e.target.value}))}
                                                        >
                                                            <option value="7days">Last 7 days</option>
                                                            <option value="30days">Last 30 days</option>
                                                            <option value="90days">Last 90 days</option>
                                                            <option value="1year">Last year</option>
                                                            <option value="all">All time</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">&nbsp;</label>
                                                        <button 
                                                            className="btn btn-primary w-100"
                                                            onClick={() => handleExport(exportData.type)}
                                                            disabled={!exportData.type || exportData.loading}
                                                        >
                                                            {exportData.loading ? 'Exporting...' : 'Export Data'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'activity' && (
                                <div className="row">
                                    <div className="col-12 mb-4">
                                        <h2>Activity Log</h2>
                                        <p className="text-muted">Recent system activities and changes</p>
                                    </div>
                                    
                                    {/* Activity Filters */}
                                    <div className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="row">
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Activity Type</label>
                                                        <select className="form-select">
                                                            <option value="all">All Activities</option>
                                                            <option value="order">Orders</option>
                                                            <option value="product">Products</option>
                                                            <option value="user">Users</option>
                                                            <option value="system">System</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Date Range</label>
                                                        <select className="form-select">
                                                            <option value="today">Today</option>
                                                            <option value="week">This Week</option>
                                                            <option value="month">This Month</option>
                                                            <option value="custom">Custom Range</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Admin User</label>
                                                        <select className="form-select">
                                                            <option value="all">All Admins</option>
                                                            <option value="sarah">Sarah Johnson</option>
                                                            <option value="mike">Mike Wilson</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">&nbsp;</label>
                                                        <button className="btn btn-primary w-100">Apply Filters</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity Timeline */}
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0">Recent Activities</h5>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-outline-primary">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                                            <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                                                        </svg>
                                                        Export
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-secondary">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                                            <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                                                        </svg>
                                                        Refresh
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="card-body p-0">
                                                {activityLog.length === 0 ? (
                                                    <div className="text-center py-5">
                                                        <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                        </svg>
                                                        <p className="text-muted">No recent activity</p>
                                                    </div>
                                                ) : (
                                                    <div className="list-group list-group-flush">
                                                        {activityLog.map(activity => (
                                                            <div key={activity.id} className="list-group-item border-start-0 border-end-0">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div className="d-flex align-items-start">
                                                                        <div className={`rounded-circle p-2 me-3 ${
                                                                            activity.type === 'order' ? 'bg-primary bg-opacity-10 text-primary' :
                                                                            activity.type === 'product' ? 'bg-success bg-opacity-10 text-success' :
                                                                            activity.type === 'user' ? 'bg-info bg-opacity-10 text-info' :
                                                                            'bg-warning bg-opacity-10 text-warning'
                                                                        }`}>
                                                                            <svg width="16" height="16" viewBox="0 0 24 24">
                                                                                {activity.type === 'order' && (
                                                                                    <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z"/>
                                                                                )}
                                                                                {activity.type === 'product' && (
                                                                                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                                                )}
                                                                                {activity.type === 'user' && (
                                                                                    <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                                                )}
                                                                                {activity.type === 'system' && (
                                                                                    <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                                                                                )}
                                                                            </svg>
                                                                        </div>
                                                                        <div className="flex-grow-1">
                                                                            <div className="d-flex align-items-center mb-1">
                                                                                <h6 className="mb-0 me-2">{activity.action}</h6>
                                                                                <span className={`badge badge-sm ${
                                                                                    activity.type === 'order' ? 'bg-primary' :
                                                                                    activity.type === 'product' ? 'bg-success' :
                                                                                    activity.type === 'user' ? 'bg-info' :
                                                                                    'bg-warning'
                                                                                }`}>
                                                                                    {activity.type}
                                                                                </span>
                                                                            </div>
                                                                            <p className="mb-1 text-muted small">{activity.details}</p>
                                                                            <div className="d-flex align-items-center text-muted small">
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                                    <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                                                </svg>
                                                                                <span className="me-3">{activity.user}</span>
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 17.5L8.5 15 12 12.5 15.5 15 12 17.5z"/>
                                                                                </svg>
                                                                                <span>{activity.timestamp}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-end">
                                                                        <button className="btn btn-sm btn-outline-secondary">
                                                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                                                <path fill="currentColor" d="M12 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z"/>
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {activityLog.length > 0 && (
                                                <div className="card-footer bg-light">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <small className="text-muted">Showing {activityLog.length} of 150 activities</small>
                                                        <button className="btn btn-sm btn-outline-primary">Load More</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'security' && (
                                <div className="row">
                                    <div className="col-12 mb-4">
                                        <h2>Security & Sessions</h2>
                                        <p className="text-muted">Manage your security settings and active sessions</p>
                                    </div>
                                    
                                    {/* Active Sessions */}
                                    <div className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0 d-flex align-items-center">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-primary">
                                                        <path fill="currentColor" d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
                                                    </svg>
                                                    Active Sessions
                                                </h5>
                                                <button className="btn btn-sm btn-outline-danger">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                                        <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4M15.5,17L20.5,12L15.5,7V10.5H9.5V13.5H15.5V17Z"/>
                                                    </svg>
                                                    End All Sessions
                                                </button>
                                            </div>
                                            <div className="card-body p-0">
                                                <div className="list-group list-group-flush">
                                                    <div className="list-group-item d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center">
                                                            <div className="rounded-circle bg-success bg-opacity-10 text-success p-2 me-3">
                                                                <svg width="16" height="16" viewBox="0 0 24 24">
                                                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-1">Current Session</h6>
                                                                <div className="d-flex align-items-center text-muted small">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 17.5L8.5 15 12 12.5 15.5 15 12 17.5z"/>
                                                                    </svg>
                                                                    <span className="me-3">Chrome on macOS</span>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                        <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                                    </svg>
                                                                    <span className="me-3">London, UK</span>
                                                                    <span>Active now</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="badge bg-success">Current</span>
                                                    </div>
                                                    <div className="list-group-item d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center">
                                                            <div className="rounded-circle bg-info bg-opacity-10 text-info p-2 me-3">
                                                                <svg width="16" height="16" viewBox="0 0 24 24">
                                                                    <path fill="currentColor" d="M7 1C5.9 1 5 1.9 5 3V5H3C1.9 5 1 5.9 1 7V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V7C23 5.9 22.1 5 21 5H19V3C19 1.9 18.1 1 17 1H7M7 3H17V7H7V3M3 7H21V19H3V7Z"/>
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-1">Mobile Session</h6>
                                                                <div className="d-flex align-items-center text-muted small">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 17.5L8.5 15 12 12.5 15.5 15 12 17.5z"/>
                                                                    </svg>
                                                                    <span className="me-3">Safari on iOS</span>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                        <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                                    </svg>
                                                                    <span className="me-3">London, UK</span>
                                                                    <span>2 hours ago</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="btn btn-sm btn-outline-danger">End Session</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Logs */}
                                    <div className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0 d-flex align-items-center">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-warning">
                                                        <path fill="currentColor" d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10V11.5H13.8V10C13.8,8.7 12.8,8.2 12,8.2Z"/>
                                                    </svg>
                                                    Security Events
                                                </h5>
                                                <div className="d-flex gap-2">
                                                    <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                                                        <option>All Events</option>
                                                        <option>Login Attempts</option>
                                                        <option>Password Changes</option>
                                                        <option>Permission Changes</option>
                                                    </select>
                                                    <button className="btn btn-sm btn-outline-primary">Export</button>
                                                </div>
                                            </div>
                                            <div className="card-body p-0">
                                                <div className="list-group list-group-flush">
                                                    <div className="list-group-item">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="d-flex align-items-start">
                                                                <div className="rounded-circle bg-success bg-opacity-10 text-success p-2 me-3">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                                                        <path fill="currentColor" d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-1">Successful Login</h6>
                                                                    <p className="mb-1 text-muted small">Admin login from Chrome on macOS</p>
                                                                    <div className="d-flex align-items-center text-muted small">
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                            <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                                        </svg>
                                                                        <span className="me-3">IP: 192.168.1.100</span>
                                                                        <span>London, UK</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <small className="text-muted">2024-01-15 14:30:00</small>
                                                        </div>
                                                    </div>
                                                    <div className="list-group-item">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="d-flex align-items-start">
                                                                <div className="rounded-circle bg-info bg-opacity-10 text-info p-2 me-3">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                                                        <path fill="currentColor" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-1">Password Changed</h6>
                                                                    <p className="mb-1 text-muted small">Admin password updated successfully</p>
                                                                    <div className="d-flex align-items-center text-muted small">
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                            <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                                        </svg>
                                                                        <span className="me-3">IP: 192.168.1.100</span>
                                                                        <span>London, UK</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <small className="text-muted">2024-01-14 16:45:00</small>
                                                        </div>
                                                    </div>
                                                    <div className="list-group-item">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="d-flex align-items-start">
                                                                <div className="rounded-circle bg-warning bg-opacity-10 text-warning p-2 me-3">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                                                        <path fill="currentColor" d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-1">Failed Login Attempt</h6>
                                                                    <p className="mb-1 text-muted small">Invalid password attempt</p>
                                                                    <div className="d-flex align-items-center text-muted small">
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                                            <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                                        </svg>
                                                                        <span className="me-3">IP: 203.0.113.45</span>
                                                                        <span>Unknown Location</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <small className="text-muted">2024-01-13 09:22:00</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-footer bg-light">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <small className="text-muted">Showing recent security events</small>
                                                    <button className="btn btn-sm btn-outline-primary">View All Events</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Recommendations */}
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="mb-0 d-flex align-items-center">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2 text-success">
                                                        <path fill="currentColor" d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                                                    </svg>
                                                    Security Recommendations
                                                </h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <div className="d-flex align-items-center p-3 bg-success bg-opacity-10 rounded-3">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-success me-3">
                                                                <path fill="currentColor" d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                                                            </svg>
                                                            <div>
                                                                <h6 className="mb-1">Two-Factor Authentication</h6>
                                                                <small className="text-muted">Enabled and active</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <div className="d-flex align-items-center p-3 bg-success bg-opacity-10 rounded-3">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-success me-3">
                                                                <path fill="currentColor" d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                                                            </svg>
                                                            <div>
                                                                <h6 className="mb-1">Strong Password</h6>
                                                                <small className="text-muted">Password meets security requirements</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <div className="d-flex align-items-center p-3 bg-warning bg-opacity-10 rounded-3">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-warning me-3">
                                                                <path fill="currentColor" d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                                                            </svg>
                                                            <div>
                                                                <h6 className="mb-1">Password Age</h6>
                                                                <small className="text-muted">Consider updating your password (90 days old)</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <div className="d-flex align-items-center p-3 bg-info bg-opacity-10 rounded-3">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-info me-3">
                                                                <path fill="currentColor" d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
                                                            </svg>
                                                            <div>
                                                                <h6 className="mb-1">Login Notifications</h6>
                                                                <small className="text-muted">Enabled for security monitoring</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'settings' && (
                                <AdminSettings
                                    adminData={adminData}
                                    passwordData={passwordData}
                                    setPasswordData={setPasswordData}
                                    handlePasswordInputChange={handlePasswordInputChange}
                                    handlePasswordChange={handlePasswordChange}
                                    adminProfileData={adminProfileData}
                                    setAdminProfileData={setAdminProfileData}
                                    isEditingProfile={isEditingProfile}
                                    setIsEditingProfile={setIsEditingProfile}
                                    handleAdminProfileInputChange={handleAdminProfileInputChange}
                                    handleSaveAdminProfile={handleSaveAdminProfile}
                                    handleAdminAvatarChange={handleAdminAvatarChange}
                                    toggleTwoFactor={toggleTwoFactor}
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
