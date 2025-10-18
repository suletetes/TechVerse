import { User, Product, Category, Order, Review } from '../models/index.js';
import connectDB from '../config/database.js';

// Sample data for seeding
const seedData = {
    categories: [
        {
            name: 'Laptops & Computers',
            description: 'High-performance laptops, desktops, and computing accessories for work, gaming, and creativity.',
            isActive: true,
            showInMenu: true,
            displayOrder: 1,
            isFeatured: true,
            image: {
                url: '/img/laptop-product.webp',
                alt: 'Laptops & Computers Category'
            },
            icon: 'computer',
            color: '#3B82F6'
        },
        {
            name: 'Smartphones & Tablets',
            description: 'Latest smartphones, tablets, and mobile accessories from top brands.',
            isActive: true,
            showInMenu: true,
            displayOrder: 2,
            isFeatured: true,
            image: {
                url: '/img/phone-product.webp',
                alt: 'Smartphones & Tablets Category'
            },
            icon: 'phone',
            color: '#10B981'
        },
        {
            name: 'Gaming',
            description: 'Gaming consoles, accessories, and peripherals for the ultimate gaming experience.',
            isActive: true,
            showInMenu: true,
            displayOrder: 3,
            isFeatured: true,
            image: {
                url: '/img/tv-product.webp',
                alt: 'Gaming Category'
            },
            icon: 'gaming',
            color: '#8B5CF6'
        },
        {
            name: 'Audio & Headphones',
            description: 'Premium headphones, speakers, and audio equipment for music lovers.',
            isActive: true,
            showInMenu: true,
            displayOrder: 4,
            isFeatured: true,
            icon: 'headphones',
            color: '#F59E0B'
        },
        {
            name: 'Smart Watches',
            description: 'Smartwatches and fitness trackers to keep you connected and healthy.',
            isActive: true,
            showInMenu: true,
            displayOrder: 5,
            isFeatured: false,
            icon: 'watch',
            color: '#EF4444'
        },
        {
            name: 'TV & Entertainment',
            description: 'Smart TVs, streaming devices, and home entertainment systems.',
            isActive: true,
            showInMenu: true,
            displayOrder: 6,
            isFeatured: false,
            image: {
                url: '/img/tv-product.webp',
                alt: 'TV & Entertainment Category'
            },
            icon: 'tv',
            color: '#6366F1'
        },
        {
            name: 'Accessories',
            description: 'Cases, chargers, cables, and other essential tech accessories.',
            isActive: true,
            showInMenu: true,
            displayOrder: 7,
            isFeatured: false,
            icon: 'accessories',
            color: '#64748B'
        }
    ],

    users: [
        {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@techverse.com',
            password: 'Admin123!',
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            accountStatus: 'active'
        },
        {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            password: 'User123!',
            role: 'user',
            isActive: true,
            isEmailVerified: true,
            accountStatus: 'active',
            addresses: [{
                type: 'home',
                firstName: 'John',
                lastName: 'Smith',
                address: '123 High Street',
                city: 'London',
                postcode: 'SW1A 1AA',
                country: 'United Kingdom',
                isDefault: true
            }]
        }
    ],

    products: [
        // Laptops & Computers
        {
            name: 'MacBook Pro 16-inch M3 Pro',
            description: 'The most powerful MacBook Pro ever is here. Featuring the groundbreaking M3 Pro chip, this laptop delivers exceptional performance for professionals, creators, and power users. With up to 18 hours of battery life, stunning Liquid Retina XDR display, and advanced connectivity options.',
            shortDescription: 'Powerful 16-inch MacBook Pro with M3 Pro chip for professional workflows.',
            price: 2499.00,
            compareAtPrice: 2699.00,
            brand: 'Apple',
            category: 'laptops-computers',
            images: [
                { url: '/img/laptop-product.webp', alt: 'MacBook Pro 16-inch M3 Pro', isPrimary: true },
                { url: '/img/laptop-product.jpg', alt: 'MacBook Pro 16-inch M3 Pro - Alternative view', isPrimary: false }
            ],
            stock: { quantity: 25, lowStockThreshold: 5 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 2.16,
            dimensions: { length: 35.57, width: 24.81, height: 1.68 },
            specifications: [
                { name: 'Processor', value: 'Apple M3 Pro chip', category: 'performance' },
                { name: 'Memory', value: '18GB unified memory', category: 'performance' },
                { name: 'Storage', value: '512GB SSD', category: 'storage' },
                { name: 'Display', value: '16.2-inch Liquid Retina XDR', category: 'display' },
                { name: 'Graphics', value: 'Integrated 18-core GPU', category: 'performance' },
                { name: 'Battery Life', value: 'Up to 18 hours', category: 'battery' },
                { name: 'Operating System', value: 'macOS Sonoma', category: 'software' }
            ],
            tags: ['laptop', 'apple', 'professional', 'm3-pro', 'creative'],
            sections: ['latest', 'featured'],
            seo: {
                title: 'MacBook Pro 16-inch M3 Pro - Professional Laptop | TechVerse',
                description: 'Buy the latest MacBook Pro 16-inch with M3 Pro chip. Perfect for professionals and creators. Free shipping available.',
                keywords: ['macbook pro', 'm3 pro', 'apple laptop', 'professional laptop']
            }
        },
        {
            name: 'Dell XPS 13 Plus',
            description: 'Experience the future of laptops with the Dell XPS 13 Plus. This ultra-premium laptop features a stunning 13.4-inch InfinityEdge display, 12th Gen Intel processors, and a revolutionary capacitive function row that adapts to your workflow.',
            shortDescription: 'Ultra-premium Dell XPS 13 Plus with cutting-edge design and performance.',
            price: 1299.00,
            compareAtPrice: 1499.00,
            brand: 'Dell',
            category: 'laptops-computers',
            images: [
                { url: '/img/laptop-product.webp', alt: 'Dell XPS 13 Plus', isPrimary: true }
            ],
            stock: { quantity: 18, lowStockThreshold: 5 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 1.26,
            specifications: [
                { name: 'Processor', value: 'Intel Core i7-1260P', category: 'performance' },
                { name: 'Memory', value: '16GB LPDDR5', category: 'performance' },
                { name: 'Storage', value: '512GB PCIe NVMe SSD', category: 'storage' },
                { name: 'Display', value: '13.4-inch FHD+ InfinityEdge', category: 'display' },
                { name: 'Graphics', value: 'Intel Iris Xe Graphics', category: 'performance' },
                { name: 'Battery Life', value: 'Up to 12 hours', category: 'battery' },
                { name: 'Operating System', value: 'Windows 11 Home', category: 'software' }
            ],
            tags: ['laptop', 'dell', 'ultrabook', 'premium', 'business'],
            sections: ['topSeller', 'quickPick']
        },

        // Smartphones & Tablets
        {
            name: 'iPhone 15 Pro',
            description: 'iPhone 15 Pro with titanium design and A17 Pro chip. The most advanced iPhone ever, featuring a titanium design, Action Button, and the most powerful chip in a smartphone. Capture stunning photos with the 48MP Main camera and enjoy all-day battery life.',
            shortDescription: 'Latest iPhone with titanium design and A17 Pro chip.',
            price: 999.00,
            compareAtPrice: 1099.00,
            brand: 'Apple',
            category: 'smartphones-tablets',
            images: [
                { url: '/img/phone-product.webp', alt: 'iPhone 15 Pro', isPrimary: true },
                { url: '/img/phone-product.jpg', alt: 'iPhone 15 Pro - Back view', isPrimary: false }
            ],
            stock: { quantity: 45, lowStockThreshold: 10 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 0.187,
            specifications: [
                { name: 'Processor', value: 'A17 Pro chip', category: 'performance' },
                { name: 'Storage', value: '128GB', category: 'storage' },
                { name: 'Display', value: '6.1-inch Super Retina XDR', category: 'display' },
                { name: 'Camera', value: '48MP Main, 12MP Ultra Wide, 12MP Telephoto', category: 'camera' },
                { name: 'Battery Life', value: 'Up to 23 hours video playback', category: 'battery' },
                { name: 'Operating System', value: 'iOS 17', category: 'software' },
                { name: 'Material', value: 'Titanium', category: 'design' }
            ],
            tags: ['smartphone', 'apple', 'iphone', 'titanium', 'a17-pro'],
            sections: ['latest', 'topSeller', 'featured'],
            seo: {
                title: 'iPhone 15 Pro - Titanium Design | TechVerse',
                description: 'Get the new iPhone 15 Pro with titanium design and A17 Pro chip. Advanced camera system and all-day battery life.',
                keywords: ['iphone 15 pro', 'titanium iphone', 'a17 pro', 'apple smartphone']
            }
        },
        {
            name: 'Samsung Galaxy S24 Ultra',
            description: 'The ultimate Android flagship with S Pen built-in. Features a 200MP camera, AI-powered photography, and the most advanced Galaxy experience yet. Perfect for productivity and creativity on the go.',
            shortDescription: 'Premium Android flagship with S Pen and 200MP camera.',
            price: 1199.00,
            brand: 'Samsung',
            category: 'smartphones-tablets',
            images: [
                { url: '/img/phone-product.webp', alt: 'Samsung Galaxy S24 Ultra', isPrimary: true }
            ],
            stock: { quantity: 32, lowStockThreshold: 8 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 0.232,
            specifications: [
                { name: 'Processor', value: 'Snapdragon 8 Gen 3', category: 'performance' },
                { name: 'Memory', value: '12GB RAM', category: 'performance' },
                { name: 'Storage', value: '256GB', category: 'storage' },
                { name: 'Display', value: '6.8-inch Dynamic AMOLED 2X', category: 'display' },
                { name: 'Camera', value: '200MP Main, 50MP Periscope Telephoto, 12MP Ultra Wide', category: 'camera' },
                { name: 'Battery', value: '5000mAh', category: 'battery' },
                { name: 'Operating System', value: 'Android 14 with One UI 6.1', category: 'software' },
                { name: 'Special Features', value: 'S Pen included', category: 'features' }
            ],
            tags: ['smartphone', 'samsung', 'galaxy', 's-pen', 'android', 'flagship'],
            sections: ['topSeller', 'quickPick']
        },
        {
            name: 'iPad Pro 12.9-inch M2',
            description: 'The most advanced iPad ever, now with the M2 chip. Perfect for professional workflows, creative projects, and entertainment. Features the stunning Liquid Retina XDR display and works seamlessly with Apple Pencil and Magic Keyboard.',
            shortDescription: 'Professional tablet with M2 chip and Liquid Retina XDR display.',
            price: 1099.00,
            brand: 'Apple',
            category: 'smartphones-tablets',
            images: [
                { url: '/img/tablet-product.webp', alt: 'iPad Pro 12.9-inch M2', isPrimary: true },
                { url: '/img/tablet-product.jpg', alt: 'iPad Pro 12.9-inch M2 - Side view', isPrimary: false },
                { url: '/img/tablet-lg.webp', alt: 'iPad Pro 12.9-inch M2 - Large view', isPrimary: false }
            ],
            stock: { quantity: 28, lowStockThreshold: 6 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 0.682,
            specifications: [
                { name: 'Processor', value: 'Apple M2 chip', category: 'performance' },
                { name: 'Memory', value: '8GB unified memory', category: 'performance' },
                { name: 'Storage', value: '128GB', category: 'storage' },
                { name: 'Display', value: '12.9-inch Liquid Retina XDR', category: 'display' },
                { name: 'Camera', value: '12MP Wide, 10MP Ultra Wide', category: 'camera' },
                { name: 'Battery Life', value: 'Up to 10 hours', category: 'battery' },
                { name: 'Operating System', value: 'iPadOS 17', category: 'software' },
                { name: 'Connectivity', value: 'Wi-Fi 6E, Bluetooth 5.3', category: 'connectivity' }
            ],
            tags: ['tablet', 'ipad', 'apple', 'm2-chip', 'professional', 'creative'],
            sections: ['latest', 'quickPick']
        },

        // Gaming
        {
            name: 'PlayStation 5 Console',
            description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers and 3D Audio, and an all-new generation of incredible PlayStation games.',
            shortDescription: 'Next-generation gaming console with ultra-fast SSD and 3D Audio.',
            price: 479.99,
            brand: 'Sony',
            category: 'gaming',
            images: [
                { url: '/img/tv-product.webp', alt: 'PlayStation 5 Console', isPrimary: true }
            ],
            stock: { quantity: 15, lowStockThreshold: 3 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 4.5,
            specifications: [
                { name: 'Processor', value: 'Custom AMD Zen 2', category: 'performance' },
                { name: 'Graphics', value: 'Custom AMD RDNA 2', category: 'performance' },
                { name: 'Memory', value: '16GB GDDR6', category: 'performance' },
                { name: 'Storage', value: '825GB Custom SSD', category: 'storage' },
                { name: 'Optical Drive', value: '4K UHD Blu-ray', category: 'features' },
                { name: 'Audio', value: 'Tempest 3D AudioTech', category: 'audio' },
                { name: 'Connectivity', value: 'Wi-Fi 6, Bluetooth 5.1, Gigabit Ethernet', category: 'connectivity' }
            ],
            tags: ['gaming', 'console', 'playstation', 'sony', 'ps5', '4k-gaming'],
            sections: ['topSeller', 'featured']
        },

        // TV & Entertainment
        {
            name: 'Samsung 65" Neo QLED 4K Smart TV',
            description: 'Immerse yourself in brilliant picture quality with Quantum Matrix Technology and Mini LEDs. This premium smart TV delivers exceptional contrast, vibrant colors, and smart features powered by Tizen OS.',
            shortDescription: '65-inch Neo QLED 4K Smart TV with Quantum Matrix Technology.',
            price: 1799.00,
            compareAtPrice: 1999.00,
            brand: 'Samsung',
            category: 'tv-entertainment',
            images: [
                { url: '/img/tv-product.webp', alt: 'Samsung 65" Neo QLED 4K Smart TV', isPrimary: true },
                { url: '/img/tv-product.jpg', alt: 'Samsung 65" Neo QLED 4K Smart TV - Room setup', isPrimary: false }
            ],
            stock: { quantity: 12, lowStockThreshold: 3 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 25.8,
            specifications: [
                { name: 'Screen Size', value: '65 inches', category: 'display' },
                { name: 'Resolution', value: '4K Ultra HD (3840 x 2160)', category: 'display' },
                { name: 'Display Technology', value: 'Neo QLED with Quantum Matrix', category: 'display' },
                { name: 'HDR', value: 'HDR10, HDR10+, HLG', category: 'display' },
                { name: 'Smart Platform', value: 'Tizen OS', category: 'software' },
                { name: 'Connectivity', value: '4x HDMI 2.1, 2x USB, Wi-Fi 6, Bluetooth', category: 'connectivity' },
                { name: 'Audio', value: '40W 2.2.2 Channel with Object Tracking Sound', category: 'audio' }
            ],
            tags: ['tv', 'smart-tv', 'samsung', 'neo-qled', '4k', 'hdr', '65-inch'],
            sections: ['weeklyDeal', 'featured']
        },

        // Additional products for comprehensive sections
        {
            name: 'AirPods Pro (2nd generation)',
            description: 'AirPods Pro feature up to 2x more Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio with dynamic head tracking for immersive sound.',
            shortDescription: 'Premium wireless earbuds with Active Noise Cancellation.',
            price: 249.00,
            compareAtPrice: 279.00,
            brand: 'Apple',
            category: 'audio-headphones',
            images: [
                { url: '/img/phone-product.webp', alt: 'AirPods Pro (2nd generation)', isPrimary: true }
            ],
            stock: { quantity: 50, lowStockThreshold: 15 },
            status: 'active',
            visibility: 'public',
            featured: false,
            weight: 0.056,
            specifications: [
                { name: 'Driver', value: 'Custom high-excursion Apple driver', category: 'audio' },
                { name: 'Noise Cancellation', value: 'Active Noise Cancellation', category: 'audio' },
                { name: 'Battery Life', value: 'Up to 6 hours (ANC on)', category: 'battery' },
                { name: 'Charging Case', value: 'Up to 30 hours total', category: 'battery' },
                { name: 'Connectivity', value: 'Bluetooth 5.3', category: 'connectivity' },
                { name: 'Water Resistance', value: 'IPX4', category: 'durability' }
            ],
            tags: ['headphones', 'apple', 'airpods', 'wireless', 'noise-cancellation'],
            sections: ['latest', 'quickPick']
        },
        {
            name: 'Sony WH-1000XM5 Headphones',
            description: 'Industry-leading noise canceling with Dual Noise Sensor technology. Next-level music with Edge-AI, for the ultimate listening experience.',
            shortDescription: 'Premium over-ear headphones with industry-leading noise cancellation.',
            price: 399.00,
            brand: 'Sony',
            category: 'audio-headphones',
            images: [
                { url: '/img/phone-product.webp', alt: 'Sony WH-1000XM5 Headphones', isPrimary: true }
            ],
            stock: { quantity: 25, lowStockThreshold: 8 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 0.250,
            specifications: [
                { name: 'Driver', value: '30mm driver unit', category: 'audio' },
                { name: 'Noise Cancellation', value: 'Dual Noise Sensor Technology', category: 'audio' },
                { name: 'Battery Life', value: 'Up to 30 hours', category: 'battery' },
                { name: 'Quick Charge', value: '3 min charge = 3 hours playback', category: 'battery' },
                { name: 'Connectivity', value: 'Bluetooth 5.2, NFC', category: 'connectivity' },
                { name: 'Voice Assistant', value: 'Alexa, Google Assistant', category: 'features' }
            ],
            tags: ['headphones', 'sony', 'over-ear', 'noise-cancellation', 'premium'],
            sections: ['topSeller', 'featured']
        },
        {
            name: 'Apple Watch Series 9',
            description: 'The most advanced Apple Watch yet. Featuring the new S9 chip, Double Tap gesture, and the brightest Apple Watch display ever.',
            shortDescription: 'Advanced smartwatch with S9 chip and Double Tap gesture.',
            price: 399.00,
            brand: 'Apple',
            category: 'smart-watches',
            images: [
                { url: '/img/phone-product.webp', alt: 'Apple Watch Series 9', isPrimary: true }
            ],
            stock: { quantity: 35, lowStockThreshold: 10 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 0.042,
            specifications: [
                { name: 'Processor', value: 'S9 SiP', category: 'performance' },
                { name: 'Display', value: '45mm Retina LTPO OLED', category: 'display' },
                { name: 'Storage', value: '64GB', category: 'storage' },
                { name: 'Battery Life', value: 'Up to 18 hours', category: 'battery' },
                { name: 'Water Resistance', value: '50 meters', category: 'durability' },
                { name: 'Connectivity', value: 'Wi-Fi, Bluetooth 5.3, GPS', category: 'connectivity' },
                { name: 'Health Features', value: 'ECG, Blood Oxygen, Heart Rate', category: 'health' }
            ],
            tags: ['smartwatch', 'apple', 'fitness', 'health', 's9-chip'],
            sections: ['latest', 'topSeller']
        },
        {
            name: 'Microsoft Surface Laptop 5',
            description: 'Sleek and powerful laptop with 12th Gen Intel Core processors. Perfect balance of style, speed, and all-day battery life for productivity and creativity.',
            shortDescription: 'Sleek Windows laptop with 12th Gen Intel processors.',
            price: 999.00,
            compareAtPrice: 1199.00,
            brand: 'Microsoft',
            category: 'laptops-computers',
            images: [
                { url: '/img/laptop-product.webp', alt: 'Microsoft Surface Laptop 5', isPrimary: true }
            ],
            stock: { quantity: 20, lowStockThreshold: 5 },
            status: 'active',
            visibility: 'public',
            featured: false,
            weight: 1.27,
            specifications: [
                { name: 'Processor', value: 'Intel Core i5-1235U', category: 'performance' },
                { name: 'Memory', value: '8GB LPDDR5x RAM', category: 'performance' },
                { name: 'Storage', value: '256GB SSD', category: 'storage' },
                { name: 'Display', value: '13.5-inch PixelSense touchscreen', category: 'display' },
                { name: 'Graphics', value: 'Intel Iris Xe Graphics', category: 'performance' },
                { name: 'Battery Life', value: 'Up to 18 hours', category: 'battery' },
                { name: 'Operating System', value: 'Windows 11 Home', category: 'software' }
            ],
            tags: ['laptop', 'microsoft', 'surface', 'touchscreen', 'productivity'],
            sections: ['weeklyDeal', 'quickPick']
        },
        {
            name: 'Nintendo Switch OLED',
            description: 'Play at home or on the go with a vibrant 7-inch OLED screen. Enjoy enhanced audio, a wide adjustable stand, and 64 GB of internal storage.',
            shortDescription: 'Portable gaming console with vibrant 7-inch OLED screen.',
            price: 349.99,
            brand: 'Nintendo',
            category: 'gaming',
            images: [
                { url: '/img/tv-product.webp', alt: 'Nintendo Switch OLED', isPrimary: true }
            ],
            stock: { quantity: 30, lowStockThreshold: 8 },
            status: 'active',
            visibility: 'public',
            featured: true,
            weight: 0.42,
            specifications: [
                { name: 'Display', value: '7-inch OLED multi-touch capacitive', category: 'display' },
                { name: 'Resolution', value: '1280 x 720 (handheld), 1920 x 1080 (docked)', category: 'display' },
                { name: 'Storage', value: '64GB internal', category: 'storage' },
                { name: 'Battery Life', value: '4.5 - 9 hours', category: 'battery' },
                { name: 'Connectivity', value: 'Wi-Fi, Bluetooth 4.1', category: 'connectivity' },
                { name: 'Audio', value: 'Enhanced audio in handheld mode', category: 'audio' }
            ],
            tags: ['gaming', 'nintendo', 'switch', 'oled', 'portable', 'handheld'],
            sections: ['latest', 'quickPick']
        },
        {
            name: 'Google Pixel 8 Pro',
            description: 'The most helpful Pixel phone yet, with Google AI built-in. Features advanced camera capabilities, 7 years of security updates, and the powerful Google Tensor G3 chip.',
            shortDescription: 'AI-powered Android flagship with advanced camera and 7 years of updates.',
            price: 999.00,
            brand: 'Google',
            category: 'smartphones-tablets',
            images: [
                { url: '/img/phone-product.webp', alt: 'Google Pixel 8 Pro', isPrimary: true }
            ],
            stock: { quantity: 22, lowStockThreshold: 6 },
            status: 'active',
            visibility: 'public',
            featured: false,
            weight: 0.213,
            specifications: [
                { name: 'Processor', value: 'Google Tensor G3', category: 'performance' },
                { name: 'Memory', value: '12GB RAM', category: 'performance' },
                { name: 'Storage', value: '128GB', category: 'storage' },
                { name: 'Display', value: '6.7-inch LTPO OLED', category: 'display' },
                { name: 'Camera', value: '50MP Main, 48MP Ultra Wide, 48MP Telephoto', category: 'camera' },
                { name: 'Battery', value: '5050mAh', category: 'battery' },
                { name: 'Operating System', value: 'Android 14', category: 'software' },
                { name: 'Updates', value: '7 years of OS and security updates', category: 'software' }
            ],
            tags: ['smartphone', 'google', 'pixel', 'ai', 'android', 'camera'],
            sections: ['latest', 'weeklyDeal']
        },
        {
            name: 'LG 55" C3 OLED 4K Smart TV',
            description: 'Self-lit OLED pixels deliver perfect blacks and infinite contrast. Powered by the α9 Gen6 AI Processor 4K for enhanced picture and sound quality.',
            shortDescription: '55-inch OLED 4K Smart TV with perfect blacks and AI processing.',
            price: 1299.00,
            compareAtPrice: 1499.00,
            brand: 'LG',
            category: 'tv-entertainment',
            images: [
                { url: '/img/tv-product.webp', alt: 'LG 55" C3 OLED 4K Smart TV', isPrimary: true }
            ],
            stock: { quantity: 15, lowStockThreshold: 4 },
            status: 'active',
            visibility: 'public',
            featured: false,
            weight: 18.9,
            specifications: [
                { name: 'Screen Size', value: '55 inches', category: 'display' },
                { name: 'Display Technology', value: 'OLED evo', category: 'display' },
                { name: 'Resolution', value: '4K Ultra HD (3840 x 2160)', category: 'display' },
                { name: 'HDR', value: 'Dolby Vision IQ, HDR10, HLG', category: 'display' },
                { name: 'Processor', value: 'α9 Gen6 AI Processor 4K', category: 'performance' },
                { name: 'Smart Platform', value: 'webOS 23', category: 'software' },
                { name: 'Gaming', value: '4x HDMI 2.1, VRR, ALLM', category: 'gaming' }
            ],
            tags: ['tv', 'oled', 'lg', '4k', 'smart-tv', 'gaming', '55-inch'],
            sections: ['weeklyDeal', 'topSeller']
        }
    ]
};

// Helper function to assign products to sections for realistic homepage content
const assignProductsToSections = async (products) => {
    const sectionAssignments = {
        latest: [], // 8 products - newest and trending
        topSeller: [], // 6 products - best selling items
        quickPick: [], // 4 products - curated selections
        weeklyDeal: [], // 2 products - special offers
        featured: [] // 10 products - promoted items
    };

    // Assign products based on their existing sections or characteristics
    for (const product of products) {
        if (product.sections && product.sections.length > 0) {
            for (const section of product.sections) {
                if (sectionAssignments[section]) {
                    sectionAssignments[section].push(product);
                }
            }
        }
    }

    // Log section assignments
    console.log('   📊 Section assignment summary:');
    for (const [section, sectionProducts] of Object.entries(sectionAssignments)) {
        console.log(`      ${section}: ${sectionProducts.length} products`);
        sectionProducts.forEach(product => {
            console.log(`         - ${product.name}`);
        });
    }

    return sectionAssignments;
};

// Helper function to generate sample JSON output
const generateSampleJSON = async () => {
    console.log('\n📄 Generating sample seeded product JSON...');
    
    try {
        // Get sample products from each section
        const sampleData = {
            latest: await Product.find({ sections: 'latest' })
                .populate('category', 'name slug')
                .limit(3)
                .select('name price images rating sections category')
                .lean(),
            topSeller: await Product.find({ sections: 'topSeller' })
                .populate('category', 'name slug')
                .limit(3)
                .select('name price images rating sections category')
                .lean(),
            quickPick: await Product.find({ sections: 'quickPick' })
                .populate('category', 'name slug')
                .limit(2)
                .select('name price images rating sections category')
                .lean(),
            weeklyDeal: await Product.find({ sections: 'weeklyDeal' })
                .populate('category', 'name slug')
                .limit(2)
                .select('name price images rating sections category')
                .lean(),
            featured: await Product.find({ sections: 'featured' })
                .populate('category', 'name slug')
                .limit(3)
                .select('name price images rating sections category')
                .lean()
        };

        // Write sample JSON file
        const fs = await import('fs');
        const path = await import('path');
        
        const sampleFilePath = path.join(process.cwd(), 'sample-seeded-products.json');
        fs.writeFileSync(sampleFilePath, JSON.stringify(sampleData, null, 2));
        
        console.log(`   ✅ Sample JSON generated: ${sampleFilePath}`);
        console.log('   📋 Sample includes products from all sections for testing');
        
        return sampleData;
    } catch (error) {
        console.error('   ❌ Error generating sample JSON:', error.message);
    }
};

// Seed function
export const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        console.log('🔌 Connecting to database...');
        await connectDB();

        // Test the connection
        console.log('🧪 Testing database connection...');
        const testCount = await Category.countDocuments();
        console.log(`   Current categories in DB: ${testCount}`);

        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Product.deleteMany({}),
            Category.deleteMany({}),
            Order.deleteMany({}),
            Review.deleteMany({})
        ]);

        console.log('📁 Creating categories...');
        const categoryMap = new Map();

        for (const categoryData of seedData.categories) {
            try {
                console.log(`   Creating category: ${categoryData.name}...`);
                const category = await Category.create(categoryData);
                // Map both the generated slug and a simple name-based key
                categoryMap.set(category.slug, category._id);
                categoryMap.set(categoryData.name.toLowerCase(), category._id);
                console.log(`   ✅ Created category: ${category.name} (slug: ${category.slug})`);
            } catch (error) {
                console.error(`   ❌ Failed to create category ${categoryData.name}:`, error.message);
                throw error;
            }
        }

        console.log('👥 Creating users...');
        const users = [];
        for (const userData of seedData.users) {
            const user = await User.create(userData);
            users.push(user);
            console.log(`   ✅ Created user: ${user.email} (${user.role})`);
        }

        const adminUser = users.find(u => u.role === 'admin');
        
        if (!adminUser) {
            throw new Error('Admin user not found! Cannot proceed with product seeding.');
        }
        
        console.log(`📦 Creating products... (Admin user: ${adminUser.email})`);
        const products = [];
        for (const productData of seedData.products) {
            const categoryId = categoryMap.get(productData.category);

            if (categoryId) {
                console.log(`   Creating product: ${productData.name}...`);
                try {
                    const product = await Product.create({
                        ...productData,
                        category: categoryId,
                        createdBy: adminUser._id,
                        updatedBy: adminUser._id
                    });
                    products.push(product);
                    console.log(`   ✅ Created product: ${product.name} (sections: ${product.sections?.join(', ') || 'none'})`);
                } catch (error) {
                    console.error(`   ❌ Failed to create product: ${productData.name}`);
                    console.error(`   Error: ${error.message}`);
                    throw error;
                }
            } else {
                console.log(`   ⚠️  Skipping product ${productData.name} - category not found: ${productData.category}`);
            }
        }

        console.log('\n🏷️  Assigning products to homepage sections...');
        await assignProductsToSections(products);

        // Generate sample JSON for verification
        await generateSampleJSON();

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Seeding Summary:');
        console.log(`   Categories: ${await Category.countDocuments()}`);
        console.log(`   Users: ${await User.countDocuments()}`);
        console.log(`   Products: ${await Product.countDocuments()}`);

        // Show section distribution
        console.log('\n🏷️  Homepage Section Distribution:');
        const sections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
        for (const section of sections) {
            const count = await Product.countDocuments({ sections: section });
            console.log(`   ${section}: ${count} products`);
        }

        console.log('\n👤 Test Accounts Created:');
        console.log('   Admin: admin@techverse.com / Admin123!');
        console.log('   User: john.smith@example.com / User123!');

        console.log('\n🔗 API Testing URLs:');
        console.log('   Latest Products: GET /api/products?section=latest&limit=8');
        console.log('   Top Sellers: GET /api/products?section=topSeller&limit=6');
        console.log('   Quick Picks: GET /api/products?section=quickPick&limit=4');
        console.log('   Weekly Deals: GET /api/products?section=weeklyDeal&limit=2');
        console.log('   Featured: GET /api/products?section=featured&limit=10');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    seedDatabase();
}

export default seedData;