// Sample data for seeding the database
export const categories = [
  {
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Latest smartphones and mobile devices',
    icon: 'phone.svg',
    color: '#007bff',
    displayOrder: 1,
    isFeatured: true
  },
  {
    name: 'Laptops',
    slug: 'laptops',
    description: 'High-performance laptops and notebooks',
    icon: 'computer.svg',
    color: '#28a745',
    displayOrder: 2,
    isFeatured: true
  },
  {
    name: 'Tablets',
    slug: 'tablets',
    description: 'Tablets and portable devices',
    icon: 'tablet.svg',
    color: '#ffc107',
    displayOrder: 3,
    isFeatured: true
  },
  {
    name: 'TVs',
    slug: 'tvs',
    description: 'Smart TVs and entertainment systems',
    icon: 'tv.svg',
    color: '#dc3545',
    displayOrder: 4,
    isFeatured: true
  },
  {
    name: 'Headphones',
    slug: 'headphones',
    description: 'Audio devices and headphones',
    icon: 'headphones.svg',
    color: '#6f42c1',
    displayOrder: 5,
    isFeatured: false
  },
  {
    name: 'Cameras',
    slug: 'cameras',
    description: 'Digital cameras and photography equipment',
    icon: 'camera.svg',
    color: '#fd7e14',
    displayOrder: 6,
    isFeatured: false
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Gaming consoles and accessories',
    icon: 'gaming.svg',
    color: '#20c997',
    displayOrder: 7,
    isFeatured: false
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Tech accessories and peripherals',
    icon: 'accessories.svg',
    color: '#6c757d',
    displayOrder: 8,
    isFeatured: false
  }
];

export const products = [
  // Smartphones
  {
    name: 'iPhone 15 Pro',
    description: 'The most advanced iPhone yet with titanium design, A17 Pro chip, and professional camera system.',
    shortDescription: 'Premium smartphone with titanium design and A17 Pro chip.',
    price: 999,
    comparePrice: 1099,
    brand: 'Apple',
    categorySlug: 'smartphones',
    images: [
      { url: '/img/phone-product.jpg', alt: 'iPhone 15 Pro', isPrimary: true },
      { url: '/img/phone-product.webp', alt: 'iPhone 15 Pro WebP' }
    ],
    stock: { quantity: 50, lowStockThreshold: 10 },
    specifications: [
      { name: 'Display', value: '6.1-inch Super Retina XDR', category: 'display' },
      { name: 'Chip', value: 'A17 Pro', category: 'performance' },
      { name: 'Storage', value: '128GB', category: 'storage' },
      { name: 'Camera', value: '48MP Main + 12MP Ultra Wide + 12MP Telephoto', category: 'camera' }
    ],
    features: ['Face ID', 'Wireless Charging', '5G Ready', 'Water Resistant'],
    tags: ['premium', 'flagship', 'ios'],
    status: 'active',
    visibility: 'public',
    featured: true,
    rating: { average: 4.8, count: 156 },
    sales: { totalSold: 89, revenue: 88911 }
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Ultimate Android flagship with S Pen, 200MP camera, and AI-powered features.',
    shortDescription: 'Premium Android phone with S Pen and 200MP camera.',
    price: 1199,
    comparePrice: 1299,
    brand: 'Samsung',
    categorySlug: 'smartphones',
    images: [
      { url: '/img/phone-product.jpg', alt: 'Galaxy S24 Ultra', isPrimary: true }
    ],
    stock: { quantity: 35, lowStockThreshold: 10 },
    specifications: [
      { name: 'Display', value: '6.8-inch Dynamic AMOLED 2X', category: 'display' },
      { name: 'Processor', value: 'Snapdragon 8 Gen 3', category: 'performance' },
      { name: 'Storage', value: '256GB', category: 'storage' },
      { name: 'Camera', value: '200MP Main + 50MP Periscope + 12MP Ultra Wide + 10MP Telephoto', category: 'camera' }
    ],
    features: ['S Pen', 'Wireless Charging', '5G Ready', 'Water Resistant', 'AI Features'],
    tags: ['premium', 'flagship', 'android', 's-pen'],
    status: 'active',
    visibility: 'public',
    featured: true,
    rating: { average: 4.7, count: 98 },
    sales: { totalSold: 67, revenue: 80333 }
  },

  // Laptops
  {
    name: 'MacBook Pro 16-inch M3',
    description: 'Professional laptop with M3 chip, stunning Liquid Retina XDR display, and all-day battery life.',
    shortDescription: 'Professional laptop with M3 chip and XDR display.',
    price: 2499,
    comparePrice: 2699,
    brand: 'Apple',
    categorySlug: 'laptops',
    images: [
      { url: '/img/laptop-product.jpg', alt: 'MacBook Pro 16-inch', isPrimary: true },
      { url: '/img/laptop-product.webp', alt: 'MacBook Pro 16-inch WebP' }
    ],
    stock: { quantity: 25, lowStockThreshold: 5 },
    specifications: [
      { name: 'Display', value: '16.2-inch Liquid Retina XDR', category: 'display' },
      { name: 'Chip', value: 'Apple M3 Pro', category: 'performance' },
      { name: 'Memory', value: '18GB Unified Memory', category: 'memory' },
      { name: 'Storage', value: '512GB SSD', category: 'storage' }
    ],
    features: ['Touch ID', 'Magic Keyboard', 'Force Touch Trackpad', 'Thunderbolt 4'],
    tags: ['professional', 'creative', 'macos'],
    status: 'active',
    visibility: 'public',
    featured: true,
    rating: { average: 4.9, count: 78 },
    sales: { totalSold: 34, revenue: 84966 }
  },
  {
    name: 'Dell XPS 13 Plus',
    description: 'Ultra-thin laptop with InfinityEdge display, 12th Gen Intel processors, and premium design.',
    shortDescription: 'Ultra-thin laptop with InfinityEdge display.',
    price: 1299,
    comparePrice: 1499,
    brand: 'Dell',
    categorySlug: 'laptops',
    images: [
      { url: '/img/laptop-product.jpg', alt: 'Dell XPS 13 Plus', isPrimary: true }
    ],
    stock: { quantity: 40, lowStockThreshold: 8 },
    specifications: [
      { name: 'Display', value: '13.4-inch InfinityEdge', category: 'display' },
      { name: 'Processor', value: 'Intel Core i7-1280P', category: 'performance' },
      { name: 'Memory', value: '16GB LPDDR5', category: 'memory' },
      { name: 'Storage', value: '512GB SSD', category: 'storage' }
    ],
    features: ['Fingerprint Reader', 'Backlit Keyboard', 'Wi-Fi 6E', 'Thunderbolt 4'],
    tags: ['ultrabook', 'business', 'windows'],
    status: 'active',
    visibility: 'public',
    featured: false,
    rating: { average: 4.5, count: 45 },
    sales: { totalSold: 28, revenue: 36372 }
  },

  // Tablets
  {
    name: 'iPad Pro 12.9-inch M2',
    description: 'Most advanced iPad with M2 chip, Liquid Retina XDR display, and Apple Pencil support.',
    shortDescription: 'Advanced iPad with M2 chip and XDR display.',
    price: 1099,
    comparePrice: 1199,
    brand: 'Apple',
    categorySlug: 'tablets',
    images: [
      { url: '/img/tablet-product.jpg', alt: 'iPad Pro 12.9-inch', isPrimary: true },
      { url: '/img/tablet-product.webp', alt: 'iPad Pro 12.9-inch WebP' }
    ],
    stock: { quantity: 30, lowStockThreshold: 8 },
    specifications: [
      { name: 'Display', value: '12.9-inch Liquid Retina XDR', category: 'display' },
      { name: 'Chip', value: 'Apple M2', category: 'performance' },
      { name: 'Storage', value: '128GB', category: 'storage' },
      { name: 'Camera', value: '12MP Wide + 10MP Ultra Wide', category: 'camera' }
    ],
    features: ['Apple Pencil Support', 'Magic Keyboard Compatible', 'Face ID', '5G Ready'],
    tags: ['professional', 'creative', 'ipados'],
    status: 'active',
    visibility: 'public',
    featured: true,
    rating: { average: 4.8, count: 92 },
    sales: { totalSold: 56, revenue: 61544 }
  },

  // TVs
  {
    name: 'Samsung 65" Neo QLED 8K',
    description: '8K Neo QLED TV with Quantum Matrix Technology, Neural Quantum Processor, and Dolby Atmos.',
    shortDescription: '8K Neo QLED TV with Quantum Matrix Technology.',
    price: 2999,
    comparePrice: 3499,
    brand: 'Samsung',
    categorySlug: 'tvs',
    images: [
      { url: '/img/tv-product.jpg', alt: 'Samsung Neo QLED 8K', isPrimary: true },
      { url: '/img/tv-product.webp', alt: 'Samsung Neo QLED 8K WebP' }
    ],
    stock: { quantity: 15, lowStockThreshold: 3 },
    specifications: [
      { name: 'Screen Size', value: '65 inches', category: 'display' },
      { name: 'Resolution', value: '8K (7680 x 4320)', category: 'display' },
      { name: 'Processor', value: 'Neural Quantum Processor 8K', category: 'performance' },
      { name: 'HDR', value: 'HDR10+, Quantum HDR', category: 'display' }
    ],
    features: ['Smart TV', 'Voice Control', 'Gaming Mode', 'Dolby Atmos'],
    tags: ['8k', 'smart-tv', 'premium', 'gaming'],
    status: 'active',
    visibility: 'public',
    featured: true,
    rating: { average: 4.6, count: 34 },
    sales: { totalSold: 12, revenue: 35988 }
  },

  // More products for variety
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise canceling headphones with exceptional sound quality.',
    shortDescription: 'Premium noise canceling headphones.',
    price: 399,
    comparePrice: 449,
    brand: 'Sony',
    categorySlug: 'headphones',
    images: [
      { url: '/img/headphones.svg', alt: 'Sony WH-1000XM5', isPrimary: true }
    ],
    stock: { quantity: 75, lowStockThreshold: 15 },
    specifications: [
      { name: 'Driver', value: '30mm', category: 'audio' },
      { name: 'Battery Life', value: '30 hours', category: 'battery' },
      { name: 'Connectivity', value: 'Bluetooth 5.2', category: 'connectivity' }
    ],
    features: ['Active Noise Canceling', 'Quick Charge', 'Multipoint Connection'],
    tags: ['wireless', 'noise-canceling', 'premium'],
    status: 'active',
    visibility: 'public',
    featured: false,
    rating: { average: 4.7, count: 156 },
    sales: { totalSold: 89, revenue: 35511 }
  },

  {
    name: 'Canon EOS R6 Mark II',
    description: 'Full-frame mirrorless camera with advanced autofocus and 4K video recording.',
    shortDescription: 'Professional mirrorless camera with 4K video.',
    price: 2499,
    brand: 'Canon',
    categorySlug: 'cameras',
    images: [
      { url: '/img/camera.svg', alt: 'Canon EOS R6 Mark II', isPrimary: true }
    ],
    stock: { quantity: 20, lowStockThreshold: 5 },
    specifications: [
      { name: 'Sensor', value: '24.2MP Full-Frame CMOS', category: 'sensor' },
      { name: 'Video', value: '4K UHD at 60fps', category: 'video' },
      { name: 'ISO Range', value: '100-102400', category: 'performance' }
    ],
    features: ['In-Body Image Stabilization', 'Dual Pixel CMOS AF', 'Weather Sealing'],
    tags: ['professional', 'mirrorless', 'full-frame'],
    status: 'active',
    visibility: 'public',
    featured: false,
    rating: { average: 4.8, count: 67 },
    sales: { totalSold: 23, revenue: 57477 }
  }
];

export const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@techverse.com',
    password: 'admin123',
    role: 'admin',
    isEmailVerified: true,
    accountStatus: 'active'
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'user',
    isEmailVerified: true,
    accountStatus: 'active'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'user',
    isEmailVerified: true,
    accountStatus: 'active'
  }
];

export const stores = [
  {
    name: 'TechVerse London',
    address: {
      street: '123 Oxford Street',
      city: 'London',
      postcode: 'W1D 2HX',
      country: 'United Kingdom'
    },
    coordinates: {
      latitude: 51.5154,
      longitude: -0.1419
    },
    contact: {
      phone: '+44 20 7946 0958',
      email: 'london@techverse.com'
    },
    hours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { open: '11:00', close: '17:00' }
    },
    services: ['pickup', 'repair', 'consultation', 'trade-in'],
    displayOrder: 1
  },
  {
    name: 'TechVerse Manchester',
    address: {
      street: '456 Market Street',
      city: 'Manchester',
      postcode: 'M1 1AA',
      country: 'United Kingdom'
    },
    coordinates: {
      latitude: 53.4808,
      longitude: -2.2426
    },
    contact: {
      phone: '+44 161 123 4567',
      email: 'manchester@techverse.com'
    },
    hours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '17:00' },
      sunday: { closed: true }
    },
    services: ['pickup', 'repair', 'consultation'],
    displayOrder: 2
  }
];

export const pages = [
  {
    slug: 'delivery',
    title: 'Delivery Information',
    content: `
      <h2>Delivery Options</h2>
      <p>We offer several delivery options to suit your needs:</p>
      
      <h3>Standard Delivery (Free)</h3>
      <ul>
        <li>3-5 working days</li>
        <li>Free on orders over £50</li>
        <li>Tracking included</li>
      </ul>
      
      <h3>Express Delivery</h3>
      <ul>
        <li>Next working day delivery</li>
        <li>£9.99 charge</li>
        <li>Order before 2pm</li>
      </ul>
      
      <h3>Same Day Delivery</h3>
      <ul>
        <li>Available in London and Manchester</li>
        <li>£19.99 charge</li>
        <li>Order before 12pm</li>
      </ul>
      
      <h2>Delivery Areas</h2>
      <p>We deliver throughout the UK mainland. Some remote areas may incur additional charges.</p>
    `,
    excerpt: 'Information about our delivery options and charges.',
    seo: {
      title: 'Delivery Information - TechVerse',
      description: 'Learn about our delivery options including free standard delivery, express delivery, and same day delivery in London and Manchester.',
      keywords: ['delivery', 'shipping', 'free delivery', 'express delivery']
    }
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    content: `
      <h2>Privacy Policy</h2>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>
      
      <h3>Information We Collect</h3>
      <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us.</p>
      
      <h3>How We Use Your Information</h3>
      <ul>
        <li>To process and fulfill your orders</li>
        <li>To communicate with you about your account or orders</li>
        <li>To improve our services</li>
        <li>To send you marketing communications (with your consent)</li>
      </ul>
      
      <h3>Information Sharing</h3>
      <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
      
      <h3>Data Security</h3>
      <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
      
      <h3>Contact Us</h3>
      <p>If you have any questions about this Privacy Policy, please contact us at privacy@techverse.com.</p>
    `,
    excerpt: 'Our privacy policy explaining how we collect, use, and protect your personal information.',
    seo: {
      title: 'Privacy Policy - TechVerse',
      description: 'Read our privacy policy to understand how we collect, use, and protect your personal information.',
      keywords: ['privacy', 'data protection', 'personal information', 'GDPR']
    }
  },
  {
    slug: 'returns',
    title: 'Returns Policy',
    content: `
      <h2>Returns Policy</h2>
      
      <h3>30-Day Return Window</h3>
      <p>You have 30 days from the date of delivery to return most items for a full refund.</p>
      
      <h3>Return Conditions</h3>
      <ul>
        <li>Items must be in original condition</li>
        <li>Original packaging required</li>
        <li>All accessories and documentation included</li>
        <li>No signs of damage or wear</li>
      </ul>
      
      <h3>How to Return</h3>
      <ol>
        <li>Log into your account and go to Order History</li>
        <li>Select the item you wish to return</li>
        <li>Print the prepaid return label</li>
        <li>Package the item securely</li>
        <li>Drop off at any Post Office or arrange collection</li>
      </ol>
      
      <h3>Refund Processing</h3>
      <p>Refunds are processed within 3-5 working days of receiving your return. The refund will be credited to your original payment method.</p>
      
      <h3>Exceptions</h3>
      <p>Some items cannot be returned for hygiene reasons, including earphones and personal care devices.</p>
    `,
    excerpt: 'Information about our 30-day returns policy and how to return items.',
    seo: {
      title: 'Returns Policy - TechVerse',
      description: 'Learn about our 30-day returns policy, return conditions, and how to return items for a refund.',
      keywords: ['returns', 'refund', 'return policy', 'exchange']
    }
  }
];