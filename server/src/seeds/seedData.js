import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Product, Category, Order, Review } from '../models/index.js';
import { connectDB } from '../config/database.js';

// Sample data for seeding
const seedData = {
  categories: [
    // Root categories
    {
      name: 'Laptops & Computers',
      slug: 'laptops-computers',
      description: 'High-performance laptops, desktops, and computer accessories',
      icon: 'laptop',
      color: '#3B82F6',
      isFeatured: true,
      displayOrder: 1,
      attributes: [
        { name: 'Processor', type: 'select', options: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9'], filterable: true },
        { name: 'RAM', type: 'select', options: ['4GB', '8GB', '16GB', '32GB', '64GB'], filterable: true },
        { name: 'Storage', type: 'select', options: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD', '1TB HDD'], filterable: true },
        { name: 'Screen Size', type: 'select', options: ['13\"', '14\"', '15.6\"', '17.3\"'], filterable: true }
      ]
    },
    {
      name: 'Smartphones & Tablets',
      slug: 'smartphones-tablets',
      description: 'Latest smartphones, tablets, and mobile accessories',
      icon: 'smartphone',
      color: '#10B981',
      isFeatured: true,
      displayOrder: 2,
      attributes: [
        { name: 'Storage Capacity', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'], filterable: true },
        { name: 'Screen Size', type: 'select', options: ['5.4\"', '6.1\"', '6.7\"', '10.9\"', '11\"', '12.9\"'], filterable: true },
        { name: 'Operating System', type: 'select', options: ['iOS', 'Android', 'iPadOS'], filterable: true }
      ]
    },
    {
      name: 'Gaming',
      slug: 'gaming',
      description: 'Gaming consoles, accessories, and PC gaming gear',
      icon: 'gamepad',
      color: '#8B5CF6',
      isFeatured: true,
      displayOrder: 3,
      attributes: [
        { name: 'Platform', type: 'select', options: ['PlayStation 5', 'Xbox Series X/S', 'Nintendo Switch', 'PC'], filterable: true },
        { name: 'Genre', type: 'select', options: ['Action', 'Adventure', 'RPG', 'Sports', 'Racing', 'Strategy'], filterable: true }
      ]
    },
    {
      name: 'Audio & Headphones',
      slug: 'audio-headphones',
      description: 'Premium headphones, speakers, and audio equipment',
      icon: 'headphones',
      color: '#F59E0B',
      isFeatured: true,
      displayOrder: 4,
      attributes: [
        { name: 'Type', type: 'select', options: ['Over-ear', 'On-ear', 'In-ear', 'Earbuds'], filterable: true },
        { name: 'Connectivity', type: 'select', options: ['Wired', 'Wireless', 'Bluetooth', 'USB-C'], filterable: true },
        { name: 'Noise Cancellation', type: 'boolean', filterable: true }
      ]
    },
    {
      name: 'Smart Home',
      slug: 'smart-home',
      description: 'Smart home devices, IoT gadgets, and home automation',
      icon: 'home',
      color: '#EF4444',
      isFeatured: false,
      displayOrder: 5,
      attributes: [
        { name: 'Compatibility', type: 'multiselect', options: ['Alexa', 'Google Assistant', 'HomeKit', 'SmartThings'], filterable: true },
        { name: 'Connectivity', type: 'select', options: ['Wi-Fi', 'Zigbee', 'Z-Wave', 'Bluetooth'], filterable: true }
      ]
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Tech accessories, cables, cases, and peripherals',
      icon: 'cable',
      color: '#6B7280',
      isFeatured: false,
      displayOrder: 6
    }
  ],

  subcategories: [
    // Laptop subcategories
    { name: 'Gaming Laptops', parent: 'laptops-computers', displayOrder: 1 },
    { name: 'Business Laptops', parent: 'laptops-computers', displayOrder: 2 },
    { name: 'Ultrabooks', parent: 'laptops-computers', displayOrder: 3 },
    { name: 'Desktop PCs', parent: 'laptops-computers', displayOrder: 4 },
    
    // Smartphone subcategories
    { name: 'iPhones', parent: 'smartphones-tablets', displayOrder: 1 },
    { name: 'Android Phones', parent: 'smartphones-tablets', displayOrder: 2 },
    { name: 'iPads', parent: 'smartphones-tablets', displayOrder: 3 },
    { name: 'Android Tablets', parent: 'smartphones-tablets', displayOrder: 4 },
    
    // Gaming subcategories
    { name: 'Gaming Consoles', parent: 'gaming', displayOrder: 1 },
    { name: 'Gaming Accessories', parent: 'gaming', displayOrder: 2 },
    { name: 'PC Gaming', parent: 'gaming', displayOrder: 3 },
    
    // Audio subcategories
    { name: 'Wireless Headphones', parent: 'audio-headphones', displayOrder: 1 },
    { name: 'Wired Headphones', parent: 'audio-headphones', displayOrder: 2 },
    { name: 'Speakers', parent: 'audio-headphones', displayOrder: 3 },
    { name: 'Earbuds', parent: 'audio-headphones', displayOrder: 4 }
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
      accountStatus: 'active',
      phone: '+44 20 7946 0958',
      preferences: {
        newsletter: true,
        notifications: true,
        emailMarketing: false,
        theme: 'light',
        currency: 'GBP'
      }
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
      phone: '+44 20 7946 0959',
      dateOfBirth: new Date('1985-06-15'),
      addresses: [{
        type: 'home',
        firstName: 'John',
        lastName: 'Smith',
        address: '123 High Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom',
        phone: '+44 20 7946 0959',
        isDefault: true
      }],
      totalOrders: 5,
      totalSpent: 2450.99,
      averageOrderValue: 490.20
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      password: 'User123!',
      role: 'user',
      isActive: true,
      isEmailVerified: true,
      accountStatus: 'active',
      phone: '+44 161 496 0202',
      dateOfBirth: new Date('1990-03-22'),
      addresses: [{
        type: 'home',
        firstName: 'Sarah',
        lastName: 'Johnson',
        address: '456 Oak Avenue',
        city: 'Manchester',
        postcode: 'M1 1AA',
        country: 'United Kingdom',
        phone: '+44 161 496 0202',
        isDefault: true
      }],
      totalOrders: 3,
      totalSpent: 1299.97,
      averageOrderValue: 433.32
    },
    {
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@example.com',
      password: 'User123!',
      role: 'user',
      isActive: true,
      isEmailVerified: true,
      accountStatus: 'active',
      phone: '+44 131 496 0345',
      dateOfBirth: new Date('1988-11-08'),
      addresses: [{
        type: 'home',
        firstName: 'Michael',
        lastName: 'Brown',
        address: '789 Rose Street',
        city: 'Edinburgh',
        postcode: 'EH2 2NG',
        country: 'United Kingdom',
        phone: '+44 131 496 0345',
        isDefault: true
      }],
      totalOrders: 7,
      totalSpent: 3250.45,
      averageOrderValue: 464.35
    },
    {
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@example.com',
      password: 'User123!',
      role: 'user',
      isActive: true,
      isEmailVerified: true,
      accountStatus: 'active',
      phone: '+44 29 2018 1234',
      dateOfBirth: new Date('1992-07-14'),
      addresses: [{
        type: 'home',
        firstName: 'Emma',
        lastName: 'Wilson',
        address: '321 Castle Street',
        city: 'Cardiff',
        postcode: 'CF10 1BH',
        country: 'United Kingdom',
        phone: '+44 29 2018 1234',
        isDefault: true
      }],
      totalOrders: 2,
      totalSpent: 899.98,
      averageOrderValue: 449.99
    }
  ],

  products: [
    // Laptops
    {
      name: 'MacBook Pro 16-inch M3 Pro',
      description: 'The most powerful MacBook Pro ever is here. With the blazing-fast M3 Pro chip — built on 3-nanometer technology — MacBook Pro delivers exceptional performance and battery life.',
      shortDescription: 'Powerful 16-inch MacBook Pro with M3 Pro chip, perfect for professionals and creators.',
      price: 2499.00,
      comparePrice: 2699.00,
      cost: 1899.00,
      brand: 'Apple',
      category: 'laptops-computers',
      subcategory: 'ultrabooks',
      images: [
        { url: '/images/products/macbook-pro-16-1.jpg', alt: 'MacBook Pro 16-inch front view', isPrimary: true },
        { url: '/images/products/macbook-pro-16-2.jpg', alt: 'MacBook Pro 16-inch side view' },
        { url: '/images/products/macbook-pro-16-3.jpg', alt: 'MacBook Pro 16-inch keyboard' }
      ],
      stock: { quantity: 25, lowStockThreshold: 5 },
      variants: [
        {\n          name: 'Storage',\n          options: [\n            { value: '512GB SSD', priceModifier: 0, stock: 15 },\n            { value: '1TB SSD', priceModifier: 200, stock: 10 }\n          ]\n        },\n        {\n          name: 'Memory',\n          options: [\n            { value: '18GB', priceModifier: 0, stock: 20 },\n            { value: '36GB', priceModifier: 400, stock: 5 }\n          ]\n        }\n      ],\n      specifications: [\n        { name: 'Processor', value: 'Apple M3 Pro chip', category: 'performance' },\n        { name: 'Memory', value: '18GB unified memory', category: 'performance' },\n        { name: 'Storage', value: '512GB SSD', category: 'storage' },\n        { name: 'Display', value: '16.2-inch Liquid Retina XDR display', category: 'display' },\n        { name: 'Graphics', value: 'Integrated 18-core GPU', category: 'performance' },\n        { name: 'Battery Life', value: 'Up to 22 hours', category: 'battery' },\n        { name: 'Weight', value: '2.16 kg', category: 'physical' }\n      ],\n      features: [\n        'M3 Pro chip with 12-core CPU',\n        '18-core GPU for graphics-intensive tasks',\n        '16.2-inch Liquid Retina XDR display',\n        'Up to 22 hours battery life',\n        'Three Thunderbolt 4 ports',\n        'MagSafe 3 charging',\n        'Force Touch trackpad',\n        'Touch ID'\n      ],\n      tags: ['laptop', 'apple', 'macbook', 'professional', 'creative'],\n      weight: { value: 2.16, unit: 'kg' },\n      dimensions: { length: 35.57, width: 24.81, height: 1.68, unit: 'cm' },\n      status: 'active',\n      visibility: 'public',\n      featured: true,\n      seo: {\n        title: 'MacBook Pro 16-inch M3 Pro - Professional Laptop | TechVerse',\n        description: 'Buy the latest MacBook Pro 16-inch with M3 Pro chip. Exceptional performance for professionals and creators. Free delivery available.',\n        keywords: ['macbook pro', 'apple laptop', 'm3 pro', '16 inch', 'professional laptop']\n      }\n    },\n    {\n      name: 'Dell XPS 13 Plus',\n      description: 'The Dell XPS 13 Plus redefines premium with a stunning 13.4-inch InfinityEdge display, 12th Gen Intel processors, and an innovative capacitive function row.',\n      shortDescription: 'Premium ultrabook with 13.4-inch display and 12th Gen Intel processors.',\n      price: 1299.00,\n      comparePrice: 1499.00,\n      cost: 999.00,\n      brand: 'Dell',\n      category: 'laptops-computers',\n      subcategory: 'ultrabooks',\n      images: [\n        { url: '/images/products/dell-xps-13-1.jpg', alt: 'Dell XPS 13 Plus front view', isPrimary: true },\n        { url: '/images/products/dell-xps-13-2.jpg', alt: 'Dell XPS 13 Plus keyboard' }\n      ],\n      stock: { quantity: 18, lowStockThreshold: 3 },\n      variants: [\n        {\n          name: 'Processor',\n          options: [\n            { value: 'Intel Core i5-1240P', priceModifier: 0, stock: 10 },\n            { value: 'Intel Core i7-1260P', priceModifier: 300, stock: 8 }\n          ]\n        },\n        {\n          name: 'Memory',\n          options: [\n            { value: '16GB LPDDR5', priceModifier: 0, stock: 12 },\n            { value: '32GB LPDDR5', priceModifier: 500, stock: 6 }\n          ]\n        }\n      ],\n      specifications: [\n        { name: 'Processor', value: '12th Gen Intel Core i5-1240P', category: 'performance' },\n        { name: 'Memory', value: '16GB LPDDR5', category: 'performance' },\n        { name: 'Storage', value: '512GB PCIe NVMe SSD', category: 'storage' },\n        { name: 'Display', value: '13.4-inch FHD+ InfinityEdge', category: 'display' },\n        { name: 'Graphics', value: 'Intel Iris Xe Graphics', category: 'performance' },\n        { name: 'Weight', value: '1.26 kg', category: 'physical' }\n      ],\n      features: [\n        '13.4-inch FHD+ InfinityEdge display',\n        'Capacitive function row',\n        'Zero-lattice keyboard',\n        'Invisible haptic touchpad',\n        'Thunderbolt 4 ports',\n        'Wi-Fi 6E connectivity'\n      ],\n      tags: ['laptop', 'dell', 'xps', 'ultrabook', 'business'],\n      weight: { value: 1.26, unit: 'kg' },\n      status: 'active',\n      visibility: 'public',\n      featured: true\n    },\n\n    // Smartphones\n    {\n      name: 'iPhone 15 Pro',\n      description: 'iPhone 15 Pro. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action Button, and the most powerful iPhone camera system ever.',\n      shortDescription: 'Latest iPhone with titanium design and A17 Pro chip.',\n      price: 999.00,\n      comparePrice: 1099.00,\n      cost: 699.00,\n      brand: 'Apple',\n      category: 'smartphones-tablets',\n      subcategory: 'iphones',\n      images: [\n        { url: '/images/products/iphone-15-pro-1.jpg', alt: 'iPhone 15 Pro Natural Titanium', isPrimary: true },\n        { url: '/images/products/iphone-15-pro-2.jpg', alt: 'iPhone 15 Pro camera system' },\n        { url: '/images/products/iphone-15-pro-3.jpg', alt: 'iPhone 15 Pro Action Button' }\n      ],\n      stock: { quantity: 45, lowStockThreshold: 10 },\n      variants: [\n        {\n          name: 'Storage',\n          options: [\n            { value: '128GB', priceModifier: 0, stock: 20 },\n            { value: '256GB', priceModifier: 100, stock: 15 },\n            { value: '512GB', priceModifier: 300, stock: 8 },\n            { value: '1TB', priceModifier: 500, stock: 2 }\n          ]\n        },\n        {\n          name: 'Color',\n          options: [\n            { value: 'Natural Titanium', priceModifier: 0, stock: 15 },\n            { value: 'Blue Titanium', priceModifier: 0, stock: 12 },\n            { value: 'White Titanium', priceModifier: 0, stock: 10 },\n            { value: 'Black Titanium', priceModifier: 0, stock: 8 }\n          ]\n        }\n      ],\n      specifications: [\n        { name: 'Chip', value: 'A17 Pro chip', category: 'performance' },\n        { name: 'Display', value: '6.1-inch Super Retina XDR', category: 'display' },\n        { name: 'Camera', value: '48MP Main | 12MP Ultra Wide | 12MP Telephoto', category: 'camera' },\n        { name: 'Video', value: '4K Dolby Vision up to 60 fps', category: 'camera' },\n        { name: 'Battery', value: 'Up to 23 hours video playback', category: 'battery' },\n        { name: 'Storage', value: '128GB', category: 'storage' },\n        { name: 'Material', value: 'Titanium', category: 'physical' }\n      ],\n      features: [\n        'A17 Pro chip with 6-core GPU',\n        'Titanium design',\n        'Action Button',\n        'Pro camera system with 5x Telephoto',\n        'USB-C with USB 3 support',\n        'Face ID',\n        'MagSafe and Qi wireless charging',\n        'Water resistant to 6 metres'\n      ],\n      tags: ['smartphone', 'apple', 'iphone', '5g', 'pro'],\n      weight: { value: 187, unit: 'g' },\n      status: 'active',\n      visibility: 'public',\n      featured: true\n    },\n    {\n      name: 'Samsung Galaxy S24 Ultra',\n      description: 'Meet Galaxy S24 Ultra, the ultimate creative companion. With the most megapixels on a smartphone and AI photo editing, capture memories in stunning detail.',\n      shortDescription: 'Premium Android flagship with S Pen and advanced AI features.',\n      price: 1249.00,\n      comparePrice: 1399.00,\n      cost: 899.00,\n      brand: 'Samsung',\n      category: 'smartphones-tablets',\n      subcategory: 'android-phones',\n      images: [\n        { url: '/images/products/galaxy-s24-ultra-1.jpg', alt: 'Samsung Galaxy S24 Ultra Titanium Gray', isPrimary: true },\n        { url: '/images/products/galaxy-s24-ultra-2.jpg', alt: 'Galaxy S24 Ultra S Pen' }\n      ],\n      stock: { quantity: 32, lowStockThreshold: 8 },\n      variants: [\n        {\n          name: 'Storage',\n          options: [\n            { value: '256GB', priceModifier: 0, stock: 15 },\n            { value: '512GB', priceModifier: 200, stock: 12 },\n            { value: '1TB', priceModifier: 400, stock: 5 }\n          ]\n        },\n        {\n          name: 'Color',\n          options: [\n            { value: 'Titanium Gray', priceModifier: 0, stock: 12 },\n            { value: 'Titanium Black', priceModifier: 0, stock: 10 },\n            { value: 'Titanium Violet', priceModifier: 0, stock: 8 },\n            { value: 'Titanium Yellow', priceModifier: 0, stock: 2 }\n          ]\n        }\n      ],\n      specifications: [\n        { name: 'Processor', value: 'Snapdragon 8 Gen 3', category: 'performance' },\n        { name: 'Display', value: '6.8-inch Dynamic AMOLED 2X', category: 'display' },\n        { name: 'Camera', value: '200MP Main | 50MP Telephoto | 10MP Telephoto | 12MP Ultra Wide', category: 'camera' },\n        { name: 'Memory', value: '12GB RAM', category: 'performance' },\n        { name: 'Battery', value: '5000mAh', category: 'battery' },\n        { name: 'S Pen', value: 'Built-in S Pen', category: 'features' }\n      ],\n      features: [\n        '200MP camera with AI photo editing',\n        'Built-in S Pen',\n        '6.8-inch Dynamic AMOLED 2X display',\n        'Titanium frame',\n        '5G connectivity',\n        'Wireless charging and PowerShare',\n        'IP68 water resistance',\n        'Samsung DeX support'\n      ],\n      tags: ['smartphone', 'samsung', 'galaxy', 'android', 's-pen'],\n      weight: { value: 232, unit: 'g' },\n      status: 'active',\n      visibility: 'public',\n      featured: true\n    },\n\n    // Gaming\n    {\n      name: 'PlayStation 5',\n      description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers and 3D Audio.',\n      shortDescription: 'Next-generation gaming console with ultra-fast SSD and immersive features.',\n      price: 479.99,\n      comparePrice: 499.99,\n      cost: 399.99,\n      brand: 'Sony',\n      category: 'gaming',\n      subcategory: 'gaming-consoles',\n      images: [\n        { url: '/images/products/ps5-1.jpg', alt: 'PlayStation 5 console', isPrimary: true },\n        { url: '/images/products/ps5-2.jpg', alt: 'PS5 DualSense controller' }\n      ],\n      stock: { quantity: 15, lowStockThreshold: 5 },\n      variants: [\n        {\n          name: 'Edition',\n          options: [\n            { value: 'Standard Edition', priceModifier: 0, stock: 10 },\n            { value: 'Digital Edition', priceModifier: -100, stock: 5 }\n          ]\n        }\n      ],\n      specifications: [\n        { name: 'CPU', value: 'AMD Zen 2-based CPU with 8 cores at 3.5GHz', category: 'performance' },\n        { name: 'GPU', value: 'AMD RDNA 2-based GPU', category: 'performance' },\n        { name: 'Memory', value: '16GB GDDR6/256-bit', category: 'performance' },\n        { name: 'Storage', value: '825GB SSD', category: 'storage' },\n        { name: 'Optical Drive', value: '4K UHD Blu-ray', category: 'features' },\n        { name: 'Audio', value: 'Tempest 3D AudioTech', category: 'audio' }\n      ],\n      features: [\n        'Ultra-high speed SSD',\n        'Ray tracing support',\n        '4K gaming up to 120fps',\n        'DualSense wireless controller',\n        'Haptic feedback',\n        'Adaptive triggers',\n        '3D Audio technology',\n        'Backwards compatibility with PS4 games'\n      ],\n      tags: ['gaming', 'console', 'playstation', 'sony', '4k'],\n      weight: { value: 4.5, unit: 'kg' },\n      status: 'active',\n      visibility: 'public',\n      featured: true\n    },\n\n    // Audio\n    {\n      name: 'Sony WH-1000XM5',\n      description: 'Industry-leading noise canceling with Dual Noise Sensor technology. Next-level music with Edge-AI, for the ultimate listening experience.',\n      shortDescription: 'Premium wireless noise-canceling headphones with industry-leading technology.',\n      price: 379.00,\n      comparePrice: 399.00,\n      cost: 249.00,\n      brand: 'Sony',\n      category: 'audio-headphones',\n      subcategory: 'wireless-headphones',\n      images: [\n        { url: '/images/products/sony-wh1000xm5-1.jpg', alt: 'Sony WH-1000XM5 Black', isPrimary: true },\n        { url: '/images/products/sony-wh1000xm5-2.jpg', alt: 'Sony WH-1000XM5 Silver' }\n      ],\n      stock: { quantity: 28, lowStockThreshold: 5 },\n      variants: [\n        {\n          name: 'Color',\n          options: [\n            { value: 'Black', priceModifier: 0, stock: 18 },\n            { value: 'Silver', priceModifier: 0, stock: 10 }\n          ]\n        }\n      ],\n      specifications: [\n        { name: 'Driver Unit', value: '30mm', category: 'audio' },\n        { name: 'Frequency Response', value: '4 Hz-40,000 Hz', category: 'audio' },\n        { name: 'Battery Life', value: '30 hours with ANC', category: 'battery' },\n        { name: 'Charging', value: 'USB-C, 3 min for 3 hours playback', category: 'battery' },\n        { name: 'Weight', value: '250g', category: 'physical' },\n        { name: 'Connectivity', value: 'Bluetooth 5.2, NFC', category: 'connectivity' }\n      ],\n      features: [\n        'Industry-leading noise canceling',\n        '30-hour battery life',\n        'Multipoint connection',\n        'Speak-to-chat technology',\n        'Quick Attention mode',\n        'LDAC and DSEE Extreme',\n        'Touch sensor controls',\n        'Carry case included'\n      ],\n      tags: ['headphones', 'wireless', 'noise-canceling', 'sony', 'premium'],\n      weight: { value: 250, unit: 'g' },\n      status: 'active',\n      visibility: 'public',\n      featured: true\n    },\n    {\n      name: 'AirPods Pro (2nd generation)',\n      description: 'AirPods Pro feature up to 2x more Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio with dynamic head tracking.',\n      shortDescription: 'Apple\\'s premium wireless earbuds with advanced noise cancellation.',\n      price: 229.00,\n      comparePrice: 249.00,\n      cost: 159.00,\n      brand: 'Apple',\n      category: 'audio-headphones',\n      subcategory: 'earbuds',\n      images: [\n        { url: '/images/products/airpods-pro-2-1.jpg', alt: 'AirPods Pro 2nd generation', isPrimary: true },\n        { url: '/images/products/airpods-pro-2-2.jpg', alt: 'AirPods Pro with MagSafe case' }\n      ],\n      stock: { quantity: 35, lowStockThreshold: 8 },\n      specifications: [\n        { name: 'Chip', value: 'Apple H2 chip', category: 'performance' },\n        { name: 'Battery Life', value: '6 hours (AirPods), 30 hours (with case)', category: 'battery' },\n        { name: 'Charging', value: 'Lightning, MagSafe, Qi wireless', category: 'battery' },\n        { name: 'Water Resistance', value: 'IPX4 (AirPods and case)', category: 'features' },\n        { name: 'Audio', value: 'Adaptive EQ, Spatial Audio', category: 'audio' }\n      ],\n      features: [\n        'Up to 2x more Active Noise Cancellation',\n        'Adaptive Transparency',\n        'Personalized Spatial Audio',\n        'MagSafe Charging Case',\n        'Touch control',\n        'Find My support',\n        'IPX4 water resistance',\n        'Multiple ear tip sizes'\n      ],\n      tags: ['earbuds', 'wireless', 'apple', 'airpods', 'noise-canceling'],\n      weight: { value: 56, unit: 'g' },\n      status: 'active',\n      visibility: 'public',\n      featured: false\n    },\n\n    // Smart Home\n    {\n      name: 'Amazon Echo Dot (5th Gen)',\n      description: 'Our most popular smart speaker with Alexa. Crisp vocals and balanced bass for full sound. Voice control your music, smart home, and more.',\n      shortDescription: 'Compact smart speaker with Alexa voice control.',\n      price: 49.99,\n      comparePrice: 54.99,\n      cost: 29.99,\n      brand: 'Amazon',\n      category: 'smart-home',\n      images: [\n        { url: '/images/products/echo-dot-5-1.jpg', alt: 'Amazon Echo Dot 5th Gen Charcoal', isPrimary: true }\n      ],\n      stock: { quantity: 50, lowStockThreshold: 10 },\n      variants: [\n        {\n          name: 'Color',\n          options: [\n            { value: 'Charcoal', priceModifier: 0, stock: 20 },\n            { value: 'Glacier White', priceModifier: 0, stock: 15 },\n            { value: 'Deep Sea Blue', priceModifier: 0, stock: 15 }\n          ]\n        }\n      ],\n      specifications: [\n        { name: 'Speaker', value: '1.73\" front-firing speaker', category: 'audio' },\n        { name: 'Connectivity', value: 'Wi-Fi, Bluetooth', category: 'connectivity' },\n        { name: 'Voice Control', value: 'Alexa built-in', category: 'features' },\n        { name: 'Smart Home Hub', value: 'Built-in Zigbee hub', category: 'features' },\n        { name: 'Dimensions', value: '100 x 100 x 89 mm', category: 'physical' }\n      ],\n      features: [\n        'Alexa voice control',\n        'Built-in Zigbee smart home hub',\n        'Room-filling sound',\n        'Voice recognition technology',\n        'Music streaming from multiple services',\n        'Smart home device control',\n        'Drop In and Announcements',\n        'Privacy controls'\n      ],\n      tags: ['smart-speaker', 'alexa', 'amazon', 'voice-control', 'smart-home'],\n      weight: { value: 304, unit: 'g' },\n      status: 'active',\n      visibility: 'public',\n      featured: false\n    },\n\n    // Accessories\n    {\n      name: 'Anker PowerCore 10000 PD Redux',\n      description: 'Ultra-compact 10,000mAh portable charger with 18W Power Delivery. Charge iPhone 12 and later models at high speed.',\n      shortDescription: 'Compact 10,000mAh power bank with fast charging support.',\n      price: 39.99,\n      comparePrice: 49.99,\n      cost: 24.99,\n      brand: 'Anker',\n      category: 'accessories',\n      images: [\n        { url: '/images/products/anker-powercore-1.jpg', alt: 'Anker PowerCore 10000 PD Redux', isPrimary: true }\n      ],\n      stock: { quantity: 75, lowStockThreshold: 15 },\n      variants: [\n        {\n          name: 'Color',\n          options: [\n            { value: 'Black', priceModifier: 0, stock: 40 },\n            { value: 'White', priceModifier: 0, stock: 35 }\n          ]\n        }\n      ],\n      specifications: [\n        { name: 'Capacity', value: '10,000mAh / 37Wh', category: 'battery' },\n        { name: 'Input', value: 'USB-C 18W', category: 'charging' },\n        { name: 'Output', value: 'USB-C 18W PD, USB-A 12W', category: 'charging' },\n        { name: 'Dimensions', value: '106 × 52 × 25 mm', category: 'physical' },\n        { name: 'Weight', value: '194g', category: 'physical' }\n      ],\n      features: [\n        '18W Power Delivery fast charging',\n        'Charges iPhone 12 to 50% in 30 minutes',\n        'Ultra-compact design',\n        'MultiProtect safety system',\n        'LED power indicator',\n        'USB-C and USB-A ports',\n        '18-month warranty'\n      ],\n      tags: ['power-bank', 'portable-charger', 'anker', 'fast-charging', 'usb-c'],\n      weight: { value: 194, unit: 'g' },\n      status: 'active',\n      visibility: 'public',\n      featured: false\n    }\n  ]\n};\n\n// Seed function\nexport const seedDatabase = async () => {\n  try {\n    console.log('🌱 Starting database seeding...');\n\n    // Connect to database\n    await connectDB();\n\n    // Clear existing data\n    console.log('🗑️  Clearing existing data...');\n    await Promise.all([\n      User.deleteMany({}),\n      Product.deleteMany({}),\n      Category.deleteMany({}),\n      Order.deleteMany({}),\n      Review.deleteMany({})\n    ]);\n\n    // Create categories first\n    console.log('📁 Creating categories...');\n    const categoryMap = new Map();\n    \n    // Create root categories\n    for (const categoryData of seedData.categories) {\n      const category = await Category.create(categoryData);\n      categoryMap.set(categoryData.slug, category._id);\n      console.log(`   ✅ Created category: ${category.name}`);\n    }\n\n    // Create subcategories\n    for (const subcatData of seedData.subcategories) {\n      const parentId = categoryMap.get(subcatData.parent);\n      if (parentId) {\n        const subcategory = await Category.create({\n          ...subcatData,\n          parent: parentId,\n          isActive: true,\n          showInMenu: true\n        });\n        categoryMap.set(subcategory.slug, subcategory._id);\n        console.log(`   ✅ Created subcategory: ${subcategory.name}`);\n      }\n    }\n\n    // Create users\n    console.log('👥 Creating users...');\n    const users = [];\n    for (const userData of seedData.users) {\n      const user = await User.create(userData);\n      users.push(user);\n      console.log(`   ✅ Created user: ${user.email} (${user.role})`);\n    }\n\n    // Get admin user for product creation\n    const adminUser = users.find(u => u.role === 'admin');\n\n    // Create products\n    console.log('📦 Creating products...');\n    const products = [];\n    for (const productData of seedData.products) {\n      const categoryId = categoryMap.get(productData.category);\n      const subcategoryId = productData.subcategory ? categoryMap.get(productData.subcategory) : null;\n      \n      if (categoryId) {\n        const product = await Product.create({\n          ...productData,\n          category: categoryId,\n          subcategory: subcategoryId,\n          createdBy: adminUser._id,\n          updatedBy: adminUser._id\n        });\n        products.push(product);\n        console.log(`   ✅ Created product: ${product.name}`);\n      }\n    }\n\n    // Create sample orders\n    console.log('🛒 Creating sample orders...');\n    const regularUsers = users.filter(u => u.role === 'user');\n    \n    for (let i = 0; i < 10; i++) {\n      const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];\n      const orderProducts = products.slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 products per order\n      \n      const items = orderProducts.map(product => ({\n        product: product._id,\n        name: product.name,\n        price: product.price,\n        quantity: Math.floor(Math.random() * 2) + 1,\n        image: product.primaryImage?.url || product.images[0]?.url,\n        sku: product.sku\n      }));\n\n      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);\n      const tax = Math.round(subtotal * 0.2 * 100) / 100; // 20% VAT\n      const shipping = subtotal > 50 ? 0 : 4.99; // Free shipping over £50\n      const total = subtotal + tax + shipping;\n\n      const statuses = ['delivered', 'shipped', 'processing', 'confirmed'];\n      const status = statuses[Math.floor(Math.random() * statuses.length)];\n      \n      const orderData = {\n        user: user._id,\n        items,\n        subtotal,\n        tax,\n        shipping: { cost: shipping, method: 'Standard Delivery' },\n        total,\n        status,\n        shippingAddress: user.addresses[0],\n        billingAddress: user.addresses[0],\n        payment: {\n          method: 'card',\n          status: status === 'delivered' ? 'completed' : 'pending',\n          amount: total,\n          currency: 'GBP',\n          paidAt: status !== 'pending' ? new Date() : undefined\n        },\n        confirmedAt: status !== 'pending' ? new Date() : undefined,\n        shippedAt: ['shipped', 'delivered'].includes(status) ? new Date() : undefined,\n        deliveredAt: status === 'delivered' ? new Date() : undefined\n      };\n\n      const order = await Order.create(orderData);\n      console.log(`   ✅ Created order: ${order.orderNumber} for ${user.email}`);\n    }\n\n    // Create sample reviews\n    console.log('⭐ Creating sample reviews...');\n    const reviewTexts = [\n      {\n        title: 'Excellent product!',\n        comment: 'Really impressed with the quality and performance. Highly recommended!',\n        rating: 5,\n        pros: ['Great performance', 'Excellent build quality', 'Fast delivery'],\n        cons: []\n      },\n      {\n        title: 'Good value for money',\n        comment: 'Solid product that does what it promises. Good value for the price point.',\n        rating: 4,\n        pros: ['Good value', 'Reliable performance'],\n        cons: ['Could be faster']\n      },\n      {\n        title: 'Decent but not perfect',\n        comment: 'It\\'s okay but has some minor issues. Still usable for daily tasks.',\n        rating: 3,\n        pros: ['Affordable', 'Easy to use'],\n        cons: ['Some performance issues', 'Build quality could be better']\n      },\n      {\n        title: 'Outstanding quality',\n        comment: 'Exceeded my expectations in every way. Premium feel and excellent performance.',\n        rating: 5,\n        pros: ['Premium quality', 'Excellent performance', 'Great design'],\n        cons: []\n      },\n      {\n        title: 'Very satisfied',\n        comment: 'Great purchase, works perfectly and arrived quickly. Would buy again.',\n        rating: 4,\n        pros: ['Fast shipping', 'Works as expected', 'Good customer service'],\n        cons: ['Slightly expensive']\n      }\n    ];\n\n    for (const product of products.slice(0, 5)) { // Add reviews to first 5 products\n      const numReviews = Math.floor(Math.random() * 3) + 2; // 2-4 reviews per product\n      \n      for (let i = 0; i < numReviews; i++) {\n        const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];\n        const reviewTemplate = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];\n        \n        const review = await Review.create({\n          user: user._id,\n          product: product._id,\n          ...reviewTemplate,\n          verified: Math.random() > 0.3, // 70% verified reviews\n          verifiedPurchase: Math.random() > 0.4, // 60% verified purchases\n          status: 'approved'\n        });\n        \n        console.log(`   ✅ Created review for ${product.name} by ${user.firstName}`);\n      }\n    }\n\n    // Update product ratings\n    console.log('📊 Updating product ratings...');\n    for (const product of products) {\n      await product.updateRating();\n    }\n\n    // Update category product counts\n    console.log('🔢 Updating category product counts...');\n    await Category.updateAllProductCounts();\n\n    console.log('\\n🎉 Database seeding completed successfully!');\n    console.log('\\n📊 Seeding Summary:');\n    console.log(`   Categories: ${await Category.countDocuments()}`);\n    console.log(`   Users: ${await User.countDocuments()}`);\n    console.log(`   Products: ${await Product.countDocuments()}`);\n    console.log(`   Orders: ${await Order.countDocuments()}`);\n    console.log(`   Reviews: ${await Review.countDocuments()}`);\n    \n    console.log('\\n👤 Test Accounts Created:');\n    console.log('   Admin: admin@techverse.com / Admin123!');\n    console.log('   User: john.smith@example.com / User123!');\n    console.log('   User: sarah.johnson@example.com / User123!');\n    \n    process.exit(0);\n    \n  } catch (error) {\n    console.error('❌ Error seeding database:', error);\n    process.exit(1);\n  }\n};\n\n// Run seeding if this file is executed directly\nif (import.meta.url === `file://${process.argv[1]}`) {\n  seedDatabase();\n}\n\nexport default seedData;"