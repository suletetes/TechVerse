// Additional products to expand the catalog to 100+ products
import { generateVariantsForCategory } from './src/utils/variantGenerator.js';

export const additionalProducts = {
  // Additional phones (to reach 25 total)
  phones: [
    {
      name: 'iPhone 14 Pro',
      subtitle: 'Pro. Beyond.',
      description: 'iPhone 14 Pro with A16 Bionic chip, Dynamic Island, and Pro camera system. Advanced features for professional users.',
      shortDescription: 'Previous generation Pro iPhone with A16 Bionic.',
      price: 899,
      originalPrice: 999,
      compareAtPrice: 999,
      brand: 'Apple',
      sku: 'IPHONE-14-PRO-001',
      stock: { quantity: 30, lowStockThreshold: 10, trackQuantity: true },
      featured: false,
      sections: [],
      tags: ['smartphone', 'apple', 'iphone', 'a16-bionic', 'pro'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'deep-purple', name: 'Deep Purple', cssClass: 'color-deep-purple', priceModifier: 0, stock: 8 },
            { value: 'gold', name: 'Gold', cssClass: 'color-gold', priceModifier: 0, stock: 8 },
            { value: 'silver', name: 'Silver', cssClass: 'color-silver', priceModifier: 0, stock: 7 },
            { value: 'space-black', name: 'Space Black', cssClass: 'color-space-black', priceModifier: 0, stock: 7 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '128GB', name: '128GB', priceModifier: 0, stock: 15 },
            { value: '256GB', name: '256GB', priceModifier: 100, stock: 10 },
            { value: '512GB', name: '512GB', priceModifier: 300, stock: 5 }
          ]
        }
      ],
      images: [
        { url: '/img/iphone-14-pro-main.jpg', alt: 'iPhone 14 Pro', isPrimary: true },
        { url: '/img/iphone-14-pro-colors.jpg', alt: 'iPhone 14 Pro Colors', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '6.1 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '2556 x 1179 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'A16 Bionic chip', category: 'Performance' },
        { name: 'Main Camera', value: '48MP f/1.78 aperture', category: 'Camera System' },
        { name: 'Battery Life', value: 'Up to 23 hours video playback', category: 'Battery & Connectivity' }
      ],
      features: ['Dynamic Island', 'Pro camera system', 'A16 Bionic chip', 'Always-On display']
    },
    {
      name: 'Samsung Galaxy S23',
      subtitle: 'Share the epic.',
      description: 'Galaxy S23 with enhanced camera capabilities and refined design. Capture stunning photos and videos with advanced AI features.',
      shortDescription: 'Compact Galaxy flagship with enhanced cameras.',
      price: 799,
      originalPrice: 899,
      compareAtPrice: 899,
      brand: 'Samsung',
      sku: 'GALAXY-S23-001',
      stock: { quantity: 40, lowStockThreshold: 12, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['smartphone', 'samsung', 'galaxy', 'android', 'camera'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'phantom-black', name: 'Phantom Black', cssClass: 'color-phantom-black', priceModifier: 0, stock: 12 },
            { value: 'cream', name: 'Cream', cssClass: 'color-cream', priceModifier: 0, stock: 10 },
            { value: 'green', name: 'Green', cssClass: 'color-green', priceModifier: 0, stock: 10 },
            { value: 'lavender', name: 'Lavender', cssClass: 'color-lavender', priceModifier: 0, stock: 8 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '128GB', name: '128GB', priceModifier: 0, stock: 20 },
            { value: '256GB', name: '256GB', priceModifier: 100, stock: 20 }
          ]
        }
      ],
      images: [
        { url: '/img/galaxy-s23-main.jpg', alt: 'Samsung Galaxy S23', isPrimary: true },
        { url: '/img/galaxy-s23-camera.jpg', alt: 'Galaxy S23 Camera', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '6.1 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '2340 x 1080 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'Snapdragon 8 Gen 2', category: 'Performance' },
        { name: 'Main Camera', value: '50MP f/1.8 aperture', category: 'Camera System' },
        { name: 'Battery Life', value: '3900mAh battery', category: 'Battery & Connectivity' }
      ],
      features: ['Enhanced night mode', 'AI-powered camera', 'Compact design', 'Fast charging']
    },
    {
      name: 'OnePlus 12',
      subtitle: 'Never Settle.',
      description: 'OnePlus 12 with Snapdragon 8 Gen 3, Hasselblad camera system, and ultra-fast charging. Flagship performance at competitive price.',
      shortDescription: 'Flagship Android with Hasselblad cameras and fast charging.',
      price: 799,
      originalPrice: 849,
      compareAtPrice: 849,
      brand: 'OnePlus',
      sku: 'ONEPLUS-12-001',
      stock: { quantity: 25, lowStockThreshold: 8, trackQuantity: true },
      featured: false,
      sections: [],
      tags: ['smartphone', 'oneplus', 'android', 'hasselblad', 'fast-charging'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'silky-black', name: 'Silky Black', cssClass: 'color-silky-black', priceModifier: 0, stock: 10 },
            { value: 'flowy-emerald', name: 'Flowy Emerald', cssClass: 'color-flowy-emerald', priceModifier: 0, stock: 8 },
            { value: 'pale-blue', name: 'Pale Blue', cssClass: 'color-pale-blue', priceModifier: 0, stock: 7 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '256GB', name: '256GB', priceModifier: 0, stock: 15 },
            { value: '512GB', name: '512GB', priceModifier: 100, stock: 10 }
          ]
        }
      ],
      images: [
        { url: '/img/oneplus-12-main.jpg', alt: 'OnePlus 12', isPrimary: true },
        { url: '/img/oneplus-12-camera.jpg', alt: 'OnePlus 12 Camera System', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '6.82 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '3168 x 1440 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'Snapdragon 8 Gen 3', category: 'Performance' },
        { name: 'Main Camera', value: '50MP f/1.6 aperture', category: 'Camera System' },
        { name: 'Battery Life', value: '5400mAh battery', category: 'Battery & Connectivity' }
      ],
      features: ['Hasselblad camera system', '100W fast charging', 'OxygenOS', 'Premium build quality']
    }
  ],

  // Computers (to reach 20 total)
  computers: [
    {
      name: 'MacBook Air 13-inch M2',
      subtitle: 'Supercharged by M2.',
      description: 'MacBook Air with M2 chip delivers incredible performance and all-day battery life in a remarkably thin and light design.',
      shortDescription: 'Thin and light laptop with M2 chip.',
      price: 1199,
      originalPrice: 1299,
      compareAtPrice: 1299,
      brand: 'Apple',
      sku: 'MACBOOK-AIR-13-M2-001',
      stock: { quantity: 35, lowStockThreshold: 12, trackQuantity: true },
      featured: true,
      sections: ['topSeller', 'featured'],
      tags: ['laptop', 'apple', 'macbook', 'm2-chip', 'ultrabook'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'midnight', name: 'Midnight', cssClass: 'color-midnight', priceModifier: 0, stock: 12 },
            { value: 'starlight', name: 'Starlight', cssClass: 'color-starlight', priceModifier: 0, stock: 10 },
            { value: 'space-gray', name: 'Space Gray', cssClass: 'color-space-gray', priceModifier: 0, stock: 8 },
            { value: 'silver', name: 'Silver', cssClass: 'color-silver', priceModifier: 0, stock: 5 }
          ]
        },
        {
          name: 'Configuration',
          options: [
            { value: 'M2 / 8GB / 256GB SSD', name: 'M2 / 8GB / 256GB SSD', priceModifier: 0, stock: 20 },
            { value: 'M2 / 16GB / 512GB SSD', name: 'M2 / 16GB / 512GB SSD', priceModifier: 400, stock: 15 }
          ]
        }
      ],
      images: [
        { url: '/img/macbook-air-m2-main.jpg', alt: 'MacBook Air M2', isPrimary: true },
        { url: '/img/macbook-air-m2-colors.jpg', alt: 'MacBook Air M2 Colors', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '13.6 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '2560 x 1664 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'M2 chip', category: 'Performance' },
        { name: 'Memory', value: '8GB unified memory', category: 'Performance' },
        { name: 'Battery Life', value: 'Up to 18 hours', category: 'Battery & Power' }
      ],
      features: ['M2 chip performance', 'All-day battery life', 'Fanless design', 'MagSafe charging']
    },
    {
      name: 'Dell XPS 13 Plus',
      subtitle: 'Smaller. Smarter. Stunning.',
      description: 'Dell XPS 13 Plus with Intel processors and InfinityEdge display. Premium ultrabook for professionals and creators.',
      shortDescription: 'Premium Windows ultrabook with InfinityEdge display.',
      price: 999,
      originalPrice: 1199,
      compareAtPrice: 1199,
      brand: 'Dell',
      sku: 'DELL-XPS-13-PLUS-001',
      stock: { quantity: 28, lowStockThreshold: 10, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['laptop', 'dell', 'xps', 'ultrabook', 'windows', 'business'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'platinum-silver', name: 'Platinum Silver', cssClass: 'color-silver', priceModifier: 0, stock: 15 },
            { value: 'frost-white', name: 'Frost White', cssClass: 'color-white', priceModifier: 0, stock: 13 }
          ]
        },
        {
          name: 'Configuration',
          options: [
            { value: 'i5 / 8GB / 256GB SSD', name: 'Intel i5 / 8GB / 256GB SSD', priceModifier: 0, stock: 18 },
            { value: 'i7 / 16GB / 512GB SSD', name: 'Intel i7 / 16GB / 512GB SSD', priceModifier: 300, stock: 10 }
          ]
        }
      ],
      images: [
        { url: '/img/dell-xps-13-main.jpg', alt: 'Dell XPS 13', isPrimary: true },
        { url: '/img/dell-xps-13-display.jpg', alt: 'Dell XPS 13 InfinityEdge Display', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '13.4 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '1920 x 1200 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'Intel Core i5/i7', category: 'Performance' },
        { name: 'Operating System', value: 'Windows 11', category: 'Software & Features' },
        { name: 'Battery Life', value: 'Up to 12 hours', category: 'Battery & Power' }
      ],
      features: ['InfinityEdge display', 'Premium build quality', 'Windows 11', 'Business features']
    }
  ],

  // Gaming consoles and accessories (to reach 10 total)
  gaming: [
    {
      name: 'Xbox Series X',
      subtitle: 'Power your dreams.',
      description: 'Xbox Series X delivers 4K gaming at up to 120fps with Quick Resume and Smart Delivery. The most powerful Xbox ever.',
      shortDescription: 'Most powerful Xbox console with 4K gaming.',
      price: 499,
      originalPrice: 499,
      compareAtPrice: 549,
      brand: 'Microsoft',
      sku: 'XBOX-SERIES-X-001',
      stock: { quantity: 15, lowStockThreshold: 5, trackQuantity: true },
      featured: true,
      sections: ['topSeller', 'featured'],
      tags: ['gaming', 'microsoft', 'xbox', 'console', '4k-gaming'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'matte-black', name: 'Matte Black', cssClass: 'color-black', priceModifier: 0, stock: 15 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '1TB SSD', name: '1TB SSD', priceModifier: 0, stock: 15 }
          ]
        }
      ],
      images: [
        { url: '/img/xbox-series-x-main.jpg', alt: 'Xbox Series X', isPrimary: true },
        { url: '/img/xbox-series-x-controller.jpg', alt: 'Xbox Wireless Controller', isPrimary: false }
      ],
      specifications: [
        { name: 'Processor', value: 'Custom AMD Zen 2', category: 'Performance' },
        { name: 'Graphics', value: 'Custom AMD RDNA 2', category: 'Performance' },
        { name: 'Memory', value: '16GB GDDR6', category: 'Performance' },
        { name: 'Storage', value: '1TB Custom NVMe SSD', category: 'Storage & Media' },
        { name: 'Performance Target', value: '4K gaming up to 120fps', category: 'Performance' }
      ],
      features: ['4K gaming capability', 'Quick Resume', 'Smart Delivery', 'Backward compatibility']
    },
    {
      name: 'Nintendo Switch OLED',
      subtitle: 'Play at home or on the go.',
      description: 'Nintendo Switch OLED with vibrant 7-inch OLED screen, enhanced audio, and versatile gaming modes.',
      shortDescription: 'Hybrid gaming console with OLED display.',
      price: 349,
      originalPrice: 349,
      compareAtPrice: 379,
      brand: 'Nintendo',
      sku: 'NINTENDO-SWITCH-OLED-001',
      stock: { quantity: 25, lowStockThreshold: 8, trackQuantity: true },
      featured: true,
      sections: ['topSeller', 'featured'],
      tags: ['gaming', 'nintendo', 'switch', 'portable', 'oled'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'white', name: 'White', cssClass: 'color-white', priceModifier: 0, stock: 15 },
            { value: 'neon-blue-red', name: 'Neon Blue/Red', cssClass: 'color-blue', priceModifier: 0, stock: 10 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '64GB', name: '64GB', priceModifier: 0, stock: 25 }
          ]
        }
      ],
      images: [
        { url: '/img/nintendo-switch-oled-main.jpg', alt: 'Nintendo Switch OLED', isPrimary: true },
        { url: '/img/nintendo-switch-oled-dock.jpg', alt: 'Nintendo Switch OLED with Dock', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '7 inches (handheld)', category: 'Display & Design' },
        { name: 'Display Technology', value: 'OLED', category: 'Display & Design' },
        { name: 'Processor', value: 'Custom NVIDIA Tegra', category: 'Performance' },
        { name: 'Storage', value: '64GB internal', category: 'Storage & Media' },
        { name: 'Battery Life', value: '4.5-9 hours', category: 'Performance' }
      ],
      features: ['OLED display', 'Hybrid gaming', 'Joy-Con controllers', 'Expandable storage']
    }
  ],

  // Audio products (to reach 15 total)
  audio: [
    {
      name: 'Sony WH-1000XM4',
      subtitle: 'Industry-leading noise canceling.',
      description: 'Sony WH-1000XM4 wireless headphones with industry-leading noise canceling, exceptional sound quality, and all-day comfort.',
      shortDescription: 'Premium wireless headphones with noise canceling.',
      price: 349,
      originalPrice: 399,
      compareAtPrice: 399,
      brand: 'Sony',
      sku: 'SONY-WH-1000XM4-001',
      stock: { quantity: 30, lowStockThreshold: 10, trackQuantity: true },
      featured: true,
      sections: ['topSeller', 'featured'],
      tags: ['headphones', 'sony', 'wireless', 'noise-canceling', 'premium'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'black', name: 'Black', cssClass: 'color-black', priceModifier: 0, stock: 18 },
            { value: 'silver', name: 'Silver', cssClass: 'color-silver', priceModifier: 0, stock: 12 }
          ]
        }
      ],
      images: [
        { url: '/img/sony-wh-1000xm5-main.jpg', alt: 'Sony WH-1000XM5', isPrimary: true },
        { url: '/img/sony-wh-1000xm5-wearing.jpg', alt: 'Sony WH-1000XM5 Being Worn', isPrimary: false }
      ],
      specifications: [
        { name: 'Driver Type', value: '30mm dynamic drivers', category: 'Audio Technology' },
        { name: 'Noise Cancellation', value: 'Industry-leading ANC', category: 'Features & Controls' },
        { name: 'Battery Life', value: 'Up to 30 hours', category: 'Battery & Connectivity' },
        { name: 'Connectivity', value: 'Bluetooth 5.2', category: 'Battery & Connectivity' },
        { name: 'Quick Charge', value: '3 min = 3 hours playback', category: 'Battery & Connectivity' }
      ],
      features: ['Industry-leading noise canceling', '30-hour battery life', 'Multipoint connection', 'Touch controls']
    },
    {
      name: 'Bose QuietComfort 45',
      subtitle: 'Quiet comfort. All day long.',
      description: 'Bose QuietComfort 45 headphones with world-class noise canceling and premium comfort for all-day listening.',
      shortDescription: 'Comfortable wireless headphones with excellent noise canceling.',
      price: 329,
      originalPrice: 379,
      compareAtPrice: 379,
      brand: 'Bose',
      sku: 'BOSE-QC45-001',
      stock: { quantity: 25, lowStockThreshold: 8, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['headphones', 'bose', 'wireless', 'noise-canceling', 'comfort'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'black', name: 'Black', cssClass: 'color-black', priceModifier: 0, stock: 15 },
            { value: 'white-smoke', name: 'White Smoke', cssClass: 'color-white', priceModifier: 0, stock: 10 }
          ]
        }
      ],
      images: [
        { url: '/img/bose-qc45-main.jpg', alt: 'Bose QuietComfort 45', isPrimary: true },
        { url: '/img/bose-qc45-comfort.jpg', alt: 'Bose QC45 Comfort Features', isPrimary: false }
      ],
      specifications: [
        { name: 'Driver Type', value: 'TriPort acoustic architecture', category: 'Audio Technology' },
        { name: 'Noise Cancellation', value: 'Active Noise Cancelling', category: 'Features & Controls' },
        { name: 'Battery Life', value: 'Up to 24 hours', category: 'Battery & Connectivity' },
        { name: 'Connectivity', value: 'Bluetooth 5.1', category: 'Battery & Connectivity' },
        { name: 'Quick Charge', value: '15 min = 3 hours playback', category: 'Battery & Connectivity' }
      ],
      features: ['World-class noise canceling', 'All-day comfort', 'Clear voice calls', 'Simple controls']
    }
  ],

  // Cameras (8 products)
  cameras: [
    {
      name: 'Canon EOS R5',
      subtitle: 'Revolutionary imaging performance.',
      description: 'Canon EOS R5 mirrorless camera with 45MP full-frame sensor, 8K video recording, and advanced autofocus system.',
      shortDescription: 'Professional mirrorless camera with 8K video.',
      price: 3899,
      originalPrice: 4199,
      compareAtPrice: 4199,
      brand: 'Canon',
      sku: 'CANON-EOS-R5-001',
      stock: { quantity: 12, lowStockThreshold: 5, trackQuantity: true },
      featured: true,
      sections: ['featured'],
      tags: ['camera', 'canon', 'mirrorless', 'professional', '8k-video'],
      variants: [
        {
          name: 'Kit Type',
          options: [
            { value: 'body-only', name: 'Body Only', priceModifier: 0, stock: 6 },
            { value: 'with-24-105mm-lens', name: 'With 24-105mm Lens', priceModifier: 1300, stock: 6 }
          ]
        }
      ],
      images: [
        { url: '/img/canon-eos-r5-main.jpg', alt: 'Canon EOS R5', isPrimary: true },
        { url: '/img/canon-eos-r5-lens.jpg', alt: 'Canon EOS R5 with Lens', isPrimary: false }
      ],
      specifications: [
        { name: 'Sensor Type', value: '45MP Full-Frame CMOS', category: 'Image Quality & Performance' },
        { name: 'Video Recording', value: '8K RAW up to 29.97fps', category: 'Video Capabilities' },
        { name: 'Autofocus Points', value: '1053 AF points', category: 'Focus & Exposure' },
        { name: 'ISO Range', value: '100-51200 (expandable)', category: 'Focus & Exposure' },
        { name: 'Battery Life', value: '320 shots (CIPA)', category: 'Power & Storage' }
      ],
      features: ['45MP full-frame sensor', '8K video recording', 'Dual Pixel CMOS AF II', 'In-body image stabilization']
    },
    {
      name: 'Sony Alpha a7 IV',
      subtitle: 'Hybrid excellence.',
      description: 'Sony Alpha a7 IV full-frame mirrorless camera with 33MP sensor, 4K video, and advanced hybrid autofocus.',
      shortDescription: 'Versatile full-frame mirrorless camera.',
      price: 2499,
      originalPrice: 2699,
      compareAtPrice: 2699,
      brand: 'Sony',
      sku: 'SONY-A7-IV-001',
      stock: { quantity: 18, lowStockThreshold: 6, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['camera', 'sony', 'mirrorless', 'full-frame', 'hybrid'],
      variants: [
        {
          name: 'Kit Type',
          options: [
            { value: 'body-only', name: 'Body Only', priceModifier: 0, stock: 10 },
            { value: 'with-28-70mm-lens', name: 'With 28-70mm Lens', priceModifier: 600, stock: 8 }
          ]
        }
      ],
      images: [
        { url: '/img/sony-a7-iv-main.jpg', alt: 'Sony Alpha a7 IV', isPrimary: true },
        { url: '/img/sony-a7-iv-video.jpg', alt: 'Sony a7 IV Video Features', isPrimary: false }
      ],
      specifications: [
        { name: 'Sensor Type', value: '33MP Full-Frame CMOS', category: 'Image Quality & Performance' },
        { name: 'Video Recording', value: '4K up to 60fps', category: 'Video Capabilities' },
        { name: 'Autofocus Points', value: '759 phase-detection AF points', category: 'Focus & Exposure' },
        { name: 'ISO Range', value: '100-51200 (expandable)', category: 'Focus & Exposure' },
        { name: 'Battery Life', value: '520 shots (CIPA)', category: 'Power & Storage' }
      ],
      features: ['33MP full-frame sensor', '4K 60p video', 'Real-time tracking AF', 'In-body stabilization']
    }
  ],

  // Accessories (20 products)
  accessories: [
    {
      name: 'Apple MagSafe Charger',
      subtitle: 'Snap on. Charge up.',
      description: 'Apple MagSafe Charger provides fast wireless charging for iPhone 12 and later models with perfect magnetic alignment.',
      shortDescription: 'Magnetic wireless charger for iPhone.',
      price: 39,
      originalPrice: 39,
      compareAtPrice: 49,
      brand: 'Apple',
      sku: 'APPLE-MAGSAFE-CHARGER-001',
      stock: { quantity: 50, lowStockThreshold: 20, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['accessory', 'apple', 'magsafe', 'wireless-charger', 'iphone'],
      variants: [
        {
          name: 'Cable Length',
          options: [
            { value: '1m', name: '1 meter', priceModifier: 0, stock: 50 }
          ]
        }
      ],
      images: [
        { url: '/img/apple-magsafe-charger-main.jpg', alt: 'Apple MagSafe Charger', isPrimary: true },
        { url: '/img/apple-magsafe-charger-iphone.jpg', alt: 'MagSafe Charger with iPhone', isPrimary: false }
      ],
      specifications: [
        { name: 'Charging Power', value: 'Up to 15W', category: 'Charging & Power' },
        { name: 'Compatibility', value: 'iPhone 12 and later', category: 'Compatibility' },
        { name: 'Cable Length', value: '1 meter', category: 'Design & Build' },
        { name: 'Connector Type', value: 'USB-C', category: 'Connectivity' }
      ],
      features: ['Magnetic alignment', 'Fast wireless charging', 'Compatible with cases', 'USB-C connector']
    },
    {
      name: 'Anker PowerCore 10000',
      subtitle: 'Portable power for everyone.',
      description: 'Anker PowerCore 10000 portable charger with high-speed charging technology and compact design.',
      shortDescription: 'Compact 10000mAh portable battery pack.',
      price: 29,
      originalPrice: 35,
      compareAtPrice: 35,
      brand: 'Anker',
      sku: 'ANKER-POWERCORE-10000-001',
      stock: { quantity: 75, lowStockThreshold: 25, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['accessory', 'anker', 'power-bank', 'portable-charger', 'battery'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'black', name: 'Black', cssClass: 'color-black', priceModifier: 0, stock: 40 },
            { value: 'white', name: 'White', cssClass: 'color-white', priceModifier: 0, stock: 35 }
          ]
        }
      ],
      images: [
        { url: '/img/anker-powercore-10000-main.jpg', alt: 'Anker PowerCore 10000', isPrimary: true },
        { url: '/img/anker-powercore-10000-size.jpg', alt: 'PowerCore 10000 Size Comparison', isPrimary: false }
      ],
      specifications: [
        { name: 'Battery Capacity', value: '10000mAh', category: 'Power & Capacity' },
        { name: 'Output Power', value: '12W max', category: 'Charging & Power' },
        { name: 'Input Power', value: '10W max', category: 'Charging & Power' },
        { name: 'Ports', value: '1x USB-A, 1x Micro-USB', category: 'Connectivity' },
        { name: 'Weight', value: '180g', category: 'Design & Build' }
      ],
      features: ['Compact design', 'High-speed charging', 'MultiProtect safety', 'Universal compatibility']
    }
  ],

  // Home & Smart Devices (10 products)
  'home-smart-devices': [
    {
      name: 'Apple HomePod',
      subtitle: 'Profound sound.',
      description: 'Apple HomePod delivers rich, immersive sound with Spatial Audio and works seamlessly with your Apple devices.',
      shortDescription: 'Premium smart speaker with Spatial Audio.',
      price: 299,
      originalPrice: 329,
      compareAtPrice: 329,
      brand: 'Apple',
      sku: 'APPLE-HOMEPOD-001',
      stock: { quantity: 20, lowStockThreshold: 8, trackQuantity: true },
      featured: true,
      sections: ['featured'],
      tags: ['smart-speaker', 'apple', 'homepod', 'siri', 'spatial-audio'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'white', name: 'White', cssClass: 'color-white', priceModifier: 0, stock: 12 },
            { value: 'midnight', name: 'Midnight', cssClass: 'color-midnight', priceModifier: 0, stock: 8 }
          ]
        }
      ],
      images: [
        { url: '/img/apple-homepod-main.jpg', alt: 'Apple HomePod', isPrimary: true },
        { url: '/img/apple-homepod-room.jpg', alt: 'HomePod in Living Room', isPrimary: false }
      ],
      specifications: [
        { name: 'Audio Technology', value: 'Spatial Audio with Dolby Atmos', category: 'Audio Performance' },
        { name: 'Voice Assistant', value: 'Siri', category: 'Smart Features' },
        { name: 'Connectivity', value: 'Wi-Fi 802.11n', category: 'Connectivity & Control' },
        { name: 'Smart Home', value: 'HomeKit hub', category: 'Smart Features' },
        { name: 'Dimensions', value: '168mm x 142mm', category: 'Design & Build' }
      ],
      features: ['Spatial Audio', 'Siri voice control', 'HomeKit hub', 'Room-filling sound']
    },
    {
      name: 'Amazon Echo Dot (5th Gen)',
      subtitle: 'Our most popular smart speaker.',
      description: 'Amazon Echo Dot with improved audio, Alexa voice control, and smart home integration in a compact design.',
      shortDescription: 'Compact smart speaker with Alexa.',
      price: 49,
      originalPrice: 59,
      compareAtPrice: 59,
      brand: 'Amazon',
      sku: 'AMAZON-ECHO-DOT-5-001',
      stock: { quantity: 60, lowStockThreshold: 20, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['smart-speaker', 'amazon', 'echo', 'alexa', 'compact'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'charcoal', name: 'Charcoal', cssClass: 'color-black', priceModifier: 0, stock: 20 },
            { value: 'glacier-white', name: 'Glacier White', cssClass: 'color-white', priceModifier: 0, stock: 20 },
            { value: 'deep-sea-blue', name: 'Deep Sea Blue', cssClass: 'color-blue', priceModifier: 0, stock: 20 }
          ]
        }
      ],
      images: [
        { url: '/img/amazon-echo-dot-5-main.jpg', alt: 'Amazon Echo Dot 5th Gen', isPrimary: true },
        { url: '/img/amazon-echo-dot-5-colors.jpg', alt: 'Echo Dot Color Options', isPrimary: false }
      ],
      specifications: [
        { name: 'Audio', value: 'Improved bass and clarity', category: 'Audio Performance' },
        { name: 'Voice Assistant', value: 'Alexa', category: 'Smart Features' },
        { name: 'Connectivity', value: 'Wi-Fi, Bluetooth', category: 'Connectivity & Control' },
        { name: 'Smart Home', value: 'Zigbee hub built-in', category: 'Smart Features' },
        { name: 'Dimensions', value: '100mm x 89mm', category: 'Design & Build' }
      ],
      features: ['Improved audio', 'Alexa voice control', 'Smart home hub', 'Compact design']
    }
  ],

  // Fitness & Health (8 products)
  'fitness-health': [
    {
      name: 'Fitbit Charge 5',
      subtitle: 'Your health & fitness tracker.',
      description: 'Fitbit Charge 5 advanced fitness tracker with built-in GPS, stress management tools, and 6+ day battery life.',
      shortDescription: 'Advanced fitness tracker with GPS and health monitoring.',
      price: 149,
      originalPrice: 179,
      compareAtPrice: 179,
      brand: 'Fitbit',
      sku: 'FITBIT-CHARGE-5-001',
      stock: { quantity: 35, lowStockThreshold: 12, trackQuantity: true },
      featured: true,
      sections: ['featured', 'topSeller'],
      tags: ['fitness-tracker', 'fitbit', 'gps', 'health-monitoring', 'wearable'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'black', name: 'Black', cssClass: 'color-black', priceModifier: 0, stock: 15 },
            { value: 'lunar-white', name: 'Lunar White', cssClass: 'color-white', priceModifier: 0, stock: 12 },
            { value: 'steel-blue', name: 'Steel Blue', cssClass: 'color-blue', priceModifier: 0, stock: 8 }
          ]
        },
        {
          name: 'Band Material',
          options: [
            { value: 'sport-band', name: 'Sport Band', priceModifier: 0, stock: 25 },
            { value: 'leather-band', name: 'Leather Band', priceModifier: 50, stock: 10 }
          ]
        }
      ],
      images: [
        { url: '/img/fitbit-charge-5-main.jpg', alt: 'Fitbit Charge 5', isPrimary: true },
        { url: '/img/fitbit-charge-5-features.jpg', alt: 'Fitbit Charge 5 Health Features', isPrimary: false }
      ],
      specifications: [
        { name: 'Display', value: 'Color AMOLED touchscreen', category: 'Display & Interface' },
        { name: 'GPS', value: 'Built-in GPS', category: 'Tracking & Sensors' },
        { name: 'Battery Life', value: 'Up to 7 days', category: 'Battery & Charging' },
        { name: 'Water Resistance', value: '50 meters', category: 'Durability & Design' },
        { name: 'Health Sensors', value: 'Heart rate, SpO2, stress', category: 'Health & Fitness Features' }
      ],
      features: ['Built-in GPS', 'Stress management', 'Sleep tracking', '6+ day battery life']
    },
    {
      name: 'Garmin Forerunner 255',
      subtitle: 'Run your best.',
      description: 'Garmin Forerunner 255 GPS running watch with advanced training metrics, multi-band GPS, and up to 14-day battery life.',
      shortDescription: 'Advanced GPS running watch with training metrics.',
      price: 349,
      originalPrice: 399,
      compareAtPrice: 399,
      brand: 'Garmin',
      sku: 'GARMIN-FORERUNNER-255-001',
      stock: { quantity: 22, lowStockThreshold: 8, trackQuantity: true },
      featured: false,
      sections: [],
      tags: ['running-watch', 'garmin', 'gps', 'training', 'sports'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'black', name: 'Black', cssClass: 'color-black', priceModifier: 0, stock: 8 },
            { value: 'light-pink', name: 'Light Pink', cssClass: 'color-pink', priceModifier: 0, stock: 7 },
            { value: 'tidal-blue', name: 'Tidal Blue', cssClass: 'color-blue', priceModifier: 0, stock: 7 }
          ]
        },
        {
          name: 'Size',
          options: [
            { value: '46mm', name: '46mm', priceModifier: 0, stock: 12 },
            { value: '41mm', name: '41mm', priceModifier: 0, stock: 10 }
          ]
        }
      ],
      images: [
        { url: '/img/garmin-forerunner-255-main.jpg', alt: 'Garmin Forerunner 255', isPrimary: true },
        { url: '/img/garmin-forerunner-255-running.jpg', alt: 'Forerunner 255 During Run', isPrimary: false }
      ],
      specifications: [
        { name: 'Display', value: 'Memory-in-pixel (MIP)', category: 'Display & Interface' },
        { name: 'GPS', value: 'Multi-band GPS', category: 'Tracking & Sensors' },
        { name: 'Battery Life', value: 'Up to 14 days smartwatch mode', category: 'Battery & Charging' },
        { name: 'Water Rating', value: '5 ATM', category: 'Durability & Design' },
        { name: 'Training Features', value: 'VO2 max, training load, recovery', category: 'Health & Fitness Features' }
      ],
      features: ['Multi-band GPS', 'Training readiness', 'Race predictor', '14-day battery life']
    }
  ]
};

export default additionalProducts;