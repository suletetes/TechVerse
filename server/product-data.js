// Comprehensive product data for all categories
export const productData = {
  phones: [
    {
      name: 'iPhone 15 Pro',
      subtitle: 'Titanium. So strong. So light. So Pro.',
      description: 'iPhone 15 Pro features a titanium design, A17 Pro chip, Action Button, and advanced camera system. The most powerful iPhone ever with professional-grade capabilities.',
      shortDescription: 'Latest iPhone with titanium design and A17 Pro chip.',
      price: 999,
      originalPrice: 1099,
      compareAtPrice: 1099,
      brand: 'Apple',
      sku: 'IPHONE-15-PRO-001',
      stock: { quantity: 45, lowStockThreshold: 10, trackQuantity: true },
      featured: true,
      sections: ['latest', 'topSeller', 'featured'],
      tags: ['smartphone', 'apple', 'iphone', 'a17-pro', 'titanium', '5g'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'midnight', priceModifier: 0, stock: 15 },
            { value: 'starlight', priceModifier: 0, stock: 12 },
            { value: 'blue', priceModifier: 0, stock: 10 },
            { value: 'purple', priceModifier: 0, stock: 8 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '128GB', priceModifier: 0, stock: 20 },
            { value: '256GB', priceModifier: 100, stock: 15 },
            { value: '512GB', priceModifier: 300, stock: 8 },
            { value: '1TB', priceModifier: 600, stock: 2 }
          ]
        }
      ],
      images: [
        { url: '/img/iphone-15-pro-main.jpg', alt: 'iPhone 15 Pro', isPrimary: true },
        { url: '/img/iphone-15-pro-side.jpg', alt: 'iPhone 15 Pro - Side View', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '6.1 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '2556 x 1179 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'A17 Pro chip', category: 'Performance' },
        { name: 'Main Camera', value: '48MP f/1.78 aperture', category: 'Camera System' },
        { name: 'Battery Life', value: 'Up to 23 hours video playback', category: 'Battery & Connectivity' }
      ],
      features: ['Advanced camera system', 'All-day battery life', 'Premium titanium build', 'Face ID security']
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      subtitle: 'Galaxy AI is here. Epic in every way.',
      description: 'Meet Galaxy S24 Ultra, the ultimate creative companion. With the new S Pen, capture, edit and share content seamlessly. Experience the power of Galaxy AI.',
      shortDescription: 'Premium Android flagship with S Pen and Galaxy AI features.',
      price: 1199,
      originalPrice: 1299,
      compareAtPrice: 1299,
      brand: 'Samsung',
      sku: 'GALAXY-S24-ULTRA-001',
      stock: { quantity: 32, lowStockThreshold: 10, trackQuantity: true },
      featured: true,
      sections: ['latest', 'topSeller'],
      tags: ['smartphone', 'samsung', 'galaxy', 's-pen', 'android', '5g'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'titanium-black', priceModifier: 0, stock: 12 },
            { value: 'titanium-gray', priceModifier: 0, stock: 10 },
            { value: 'titanium-violet', priceModifier: 0, stock: 8 },
            { value: 'titanium-yellow', priceModifier: 0, stock: 2 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '256GB', priceModifier: 0, stock: 15 },
            { value: '512GB', priceModifier: 200, stock: 12 },
            { value: '1TB', priceModifier: 500, stock: 5 }
          ]
        }
      ],
      images: [
        { url: '/img/galaxy-s24-ultra-main.jpg', alt: 'Samsung Galaxy S24 Ultra', isPrimary: true },
        { url: '/img/galaxy-s24-ultra-spen.jpg', alt: 'Galaxy S24 Ultra with S Pen', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '6.8 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '3120 x 1440 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'Snapdragon 8 Gen 3', category: 'Performance' },
        { name: 'Main Camera', value: '200MP f/1.7 aperture', category: 'Camera System' },
        { name: 'Battery Life', value: '5000mAh battery', category: 'Battery & Connectivity' }
      ],
      features: ['S Pen included', 'Galaxy AI features', '200MP camera', 'All-day battery', '5G connectivity']
    }
  ],
  
  tablets: [
    {
      name: 'iPad Pro 12.9-inch',
      subtitle: 'Supercharged by M2.',
      description: 'iPad Pro features the M2 chip with an 8-core CPU and 10-core GPU, delivering incredible performance for demanding workflows.',
      shortDescription: 'Professional tablet with M2 chip and Liquid Retina XDR display.',
      price: 1099,
      originalPrice: 1199,
      compareAtPrice: 1199,
      brand: 'Apple',
      sku: 'IPAD-PRO-12-M2-001',
      stock: { quantity: 28, lowStockThreshold: 10, trackQuantity: true },
      featured: true,
      sections: ['latest', 'featured'],
      tags: ['tablet', 'apple', 'ipad', 'm2-chip', 'professional'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'silver', priceModifier: 0, stock: 15 },
            { value: 'space-gray', priceModifier: 0, stock: 13 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '128GB', priceModifier: 0, stock: 12 },
            { value: '256GB', priceModifier: 200, stock: 10 },
            { value: '512GB', priceModifier: 400, stock: 4 },
            { value: '1TB', priceModifier: 800, stock: 2 }
          ]
        }
      ],
      images: [
        { url: '/img/ipad-pro-12-main.jpg', alt: 'iPad Pro 12.9-inch', isPrimary: true },
        { url: '/img/ipad-pro-12-pencil.jpg', alt: 'iPad Pro with Apple Pencil', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '12.9 inches', category: 'Display & Design' },
        { name: 'Display Technology', value: 'Liquid Retina XDR', category: 'Display & Design' },
        { name: 'Processor', value: 'M2 chip', category: 'Performance' },
        { name: 'Front Camera', value: '12MP Ultra Wide', category: 'Camera & Audio' },
        { name: 'Battery Life', value: 'Up to 10 hours', category: 'Battery & Power' }
      ],
      features: ['M2 chip performance', 'Liquid Retina XDR display', 'Apple Pencil support', 'Magic Keyboard compatible']
    }
  ],
  
  computers: [
    {
      name: 'MacBook Pro 14-inch',
      subtitle: 'Mind-blowing. Head-turning.',
      description: 'MacBook Pro with M3 Pro chip delivers exceptional performance for demanding workflows. Features a stunning Liquid Retina XDR display.',
      shortDescription: 'Professional laptop with M3 Pro chip and advanced display.',
      price: 1999,
      originalPrice: 2199,
      compareAtPrice: 2199,
      brand: 'Apple',
      sku: 'MBP-14-M3-PRO-001',
      stock: { quantity: 15, lowStockThreshold: 5, trackQuantity: true },
      featured: true,
      sections: ['latest', 'featured'],
      tags: ['laptop', 'apple', 'macbook', 'm3-pro', 'professional'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'space-black', priceModifier: 0, stock: 8 },
            { value: 'silver', priceModifier: 0, stock: 7 }
          ]
        },
        {
          name: 'Configuration',
          options: [
            { value: 'M3 Pro / 18GB / 512GB SSD', priceModifier: 0, stock: 10 },
            { value: 'M3 Pro / 36GB / 1TB SSD', priceModifier: 500, stock: 5 }
          ]
        }
      ],
      images: [
        { url: '/img/macbook-pro-14-main.jpg', alt: 'MacBook Pro 14-inch', isPrimary: true },
        { url: '/img/macbook-pro-14-open.jpg', alt: 'MacBook Pro 14-inch Open', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '14.2 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '3024 x 1964 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'M3 Pro chip', category: 'Performance' },
        { name: 'Memory', value: '18GB unified memory', category: 'Performance' },
        { name: 'Battery Life', value: 'Up to 18 hours', category: 'Battery & Power' }
      ],
      features: ['M3 Pro chip', 'Liquid Retina XDR display', 'All-day battery life', 'Advanced thermal design']
    }
  ],
  
  tvs: [
    {
      name: 'Samsung 65" QLED 4K Smart TV',
      subtitle: 'Quantum Dot technology meets smart features.',
      description: 'Experience brilliant colors and sharp details with Quantum Dot technology. Smart TV features with built-in streaming apps.',
      shortDescription: '65-inch QLED 4K Smart TV with Quantum Dot technology.',
      price: 1299,
      originalPrice: 1499,
      compareAtPrice: 1499,
      brand: 'Samsung',
      sku: 'SAMSUNG-QLED-65-001',
      stock: { quantity: 12, lowStockThreshold: 5, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['tv', 'samsung', 'qled', '4k', 'smart-tv'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'black', priceModifier: 0, stock: 8 },
            { value: 'silver', priceModifier: 0, stock: 4 }
          ]
        },
        {
          name: 'Screen Size',
          options: [
            { value: '55"', priceModifier: -300, stock: 15 },
            { value: '65"', priceModifier: 0, stock: 12 },
            { value: '75"', priceModifier: 700, stock: 6 }
          ]
        }
      ],
      images: [
        { url: '/img/samsung-qled-65-main.jpg', alt: 'Samsung 65" QLED TV', isPrimary: true },
        { url: '/img/samsung-qled-65-side.jpg', alt: 'Samsung QLED TV Side View', isPrimary: false }
      ],
      specifications: [
        { name: 'Screen Size', value: '65 inches', category: 'Display Technology' },
        { name: 'Resolution', value: '4K UHD (3840 x 2160)', category: 'Display Technology' },
        { name: 'Display Type', value: 'QLED', category: 'Display Technology' },
        { name: 'HDR Support', value: 'HDR10+, Dolby Vision', category: 'Display Technology' },
        { name: 'Operating System', value: 'Tizen Smart TV', category: 'Smart Features & OS' }
      ],
      features: ['Quantum Dot technology', '4K UHD resolution', 'Smart TV platform', 'HDR support']
    }
  ],
  
  gaming: [
    {
      name: 'PlayStation 5',
      subtitle: 'Play Has No Limits.',
      description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, and 3D Audio.',
      shortDescription: 'Next-generation gaming console with ultra-fast SSD.',
      price: 499,
      originalPrice: 499,
      compareAtPrice: 549,
      brand: 'Sony',
      sku: 'PS5-CONSOLE-001',
      stock: { quantity: 8, lowStockThreshold: 5, trackQuantity: true },
      featured: true,
      sections: ['topSeller', 'featured'],
      tags: ['gaming', 'sony', 'playstation', 'console', 'ps5'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'white', priceModifier: 0, stock: 6 },
            { value: 'black', priceModifier: 50, stock: 2 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '825GB SSD', priceModifier: 0, stock: 8 }
          ]
        }
      ],
      images: [
        { url: '/img/ps5-console-main.jpg', alt: 'PlayStation 5 Console', isPrimary: true },
        { url: '/img/ps5-controller.jpg', alt: 'PS5 DualSense Controller', isPrimary: false }
      ],
      specifications: [
        { name: 'Processor', value: 'Custom AMD Zen 2', category: 'Performance' },
        { name: 'Graphics', value: 'Custom AMD RDNA 2', category: 'Performance' },
        { name: 'Memory', value: '16GB GDDR6', category: 'Performance' },
        { name: 'Storage', value: '825GB Custom SSD', category: 'Storage & Media' },
        { name: 'Performance Target', value: '4K gaming up to 120fps', category: 'Performance' }
      ],
      features: ['Ultra-fast SSD loading', 'Ray tracing support', 'Haptic feedback controller', '3D Audio technology']
    }
  ],
  
  watches: [
    {
      name: 'Apple Watch Series 9',
      subtitle: 'Smarter. Brighter. Mightier.',
      description: 'Apple Watch Series 9 features the S9 chip, a brighter display, and new Double Tap gesture. The most advanced Apple Watch yet.',
      shortDescription: 'Advanced smartwatch with S9 chip and Double Tap gesture.',
      price: 399,
      originalPrice: 429,
      compareAtPrice: 429,
      brand: 'Apple',
      sku: 'APPLE-WATCH-S9-001',
      stock: { quantity: 25, lowStockThreshold: 10, trackQuantity: true },
      featured: true,
      sections: ['latest', 'featured'],
      tags: ['smartwatch', 'apple', 'watch', 'fitness', 'health'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'midnight', priceModifier: 0, stock: 10 },
            { value: 'starlight', priceModifier: 0, stock: 8 },
            { value: 'silver', priceModifier: 0, stock: 7 }
          ]
        },
        {
          name: 'Case Material',
          options: [
            { value: 'aluminum', priceModifier: 0, stock: 20 },
            { value: 'stainless-steel', priceModifier: 300, stock: 5 }
          ]
        }
      ],
      images: [
        { url: '/img/apple-watch-s9-main.jpg', alt: 'Apple Watch Series 9', isPrimary: true },
        { url: '/img/apple-watch-s9-bands.jpg', alt: 'Apple Watch with Different Bands', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '45mm', category: 'Display & Design' },
        { name: 'Display Type', value: 'Always-On Retina LTPO OLED', category: 'Display & Design' },
        { name: 'Processor', value: 'S9 SiP', category: 'Performance & Battery' },
        { name: 'Health Sensors', value: 'ECG, Blood Oxygen, Heart Rate', category: 'Health & Fitness' },
        { name: 'Battery Life', value: 'Up to 18 hours', category: 'Performance & Battery' }
      ],
      features: ['S9 chip performance', 'Double Tap gesture', 'Always-On display', 'Comprehensive health tracking']
    }
  ],
  
  audio: [
    {
      name: 'AirPods Pro (2nd generation)',
      subtitle: 'Adaptive Audio. Now playing.',
      description: 'AirPods Pro feature Adaptive Audio, Personalized Spatial Audio, and up to 2x more Active Noise Cancellation.',
      shortDescription: 'Premium wireless earbuds with adaptive audio and noise cancellation.',
      price: 249,
      originalPrice: 279,
      compareAtPrice: 279,
      brand: 'Apple',
      sku: 'AIRPODS-PRO-2-001',
      stock: { quantity: 35, lowStockThreshold: 15, trackQuantity: true },
      featured: true,
      sections: ['topSeller', 'featured'],
      tags: ['headphones', 'apple', 'airpods', 'wireless', 'noise-cancellation'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'white', priceModifier: 0, stock: 35 }
          ]
        },
        {
          name: 'Model',
          options: [
            { value: 'pro', priceModifier: 0, stock: 35 }
          ]
        }
      ],
      images: [
        { url: '/img/airpods-pro-2-main.jpg', alt: 'AirPods Pro 2nd generation', isPrimary: true },
        { url: '/img/airpods-pro-2-case.jpg', alt: 'AirPods Pro with Case', isPrimary: false }
      ],
      specifications: [
        { name: 'Driver Type', value: 'Custom high-excursion driver', category: 'Audio Technology' },
        { name: 'Noise Cancellation', value: 'Active Noise Cancellation', category: 'Features & Controls' },
        { name: 'Battery Life', value: 'Up to 6 hours (ANC on)', category: 'Battery & Connectivity' },
        { name: 'Charging Case', value: 'Up to 30 hours total', category: 'Battery & Connectivity' },
        { name: 'Connectivity', value: 'Bluetooth 5.3', category: 'Battery & Connectivity' }
      ],
      features: ['Adaptive Audio', 'Active Noise Cancellation', 'Spatial Audio', 'Sweat and water resistant']
    }
  ]
};

export default productData;