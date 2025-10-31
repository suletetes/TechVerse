// Comprehensive product data for all categories
import { generateVariantsForCategory } from './src/utils/variantGenerator.js';

export const productData = {
  phones: [
    {
      name: 'iPhone 15 Pro',
      subtitle: 'Titanium. So strong. So light. So Pro.',
      description: 'iPhone 15 Pro features a titanium design, A17 Pro chip, Action Button, and advanced camera system. The most powerful iPhone ever with professional-grade capabilities.',
      shortDescription: 'Latest iPhone with titanium design and A17 Pro chip.',
      price: 999,
      originalPrice: 999,
      compareAtPrice: null,
      discountPercentage: 0,
      discountAmount: 0,
      hasDiscount: false,
      brand: 'Apple',
      sku: 'IPHONE-15-PRO-001',
      stock: { 
        quantity: 87, 
        lowStockThreshold: 15, 
        trackQuantity: true,
        status: 'in-stock',
        lastUpdated: new Date(),
        reserved: 0
      },
      featured: true,
      sections: ['latest', 'topSeller', 'featured'],
      tags: ['smartphone', 'apple', 'iphone', 'a17-pro', 'titanium', '5g'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'midnight', priceModifier: 0, stock: 25 },
            { value: 'starlight', priceModifier: 0, stock: 22 },
            { value: 'blue', priceModifier: 0, stock: 20 },
            { value: 'purple', priceModifier: 0, stock: 20 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '128GB', priceModifier: 0, stock: 35 },
            { value: '256GB', priceModifier: 100, stock: 28 },
            { value: '512GB', priceModifier: 300, stock: 18 },
            { value: '1TB', priceModifier: 600, stock: 6 }
          ]
        }
      ],
      images: [
        { url: '/img/iphone-15-pro-main.jpg', alt: 'iPhone 15 Pro - Latest iPhone with titanium design and A17 Pro chip', isPrimary: true, width: 800, height: 600, format: 'jpg' },
        { url: '/img/iphone-15-pro-back.jpg', alt: 'iPhone 15 Pro - Back view showing titanium frame and camera system', isPrimary: false, width: 800, height: 600, format: 'jpg' },
        { url: '/img/iphone-15-pro-side.jpg', alt: 'iPhone 15 Pro - Side profile with Action Button', isPrimary: false, width: 800, height: 600, format: 'jpg' },
        { url: '/img/iphone-15-pro-screen.jpg', alt: 'iPhone 15 Pro - Super Retina XDR display', isPrimary: false, width: 800, height: 600, format: 'jpg' }
      ],
      specifications: [
        // Display & Design
        { name: 'Display Size', value: '6.1 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '2556 x 1179 pixels', category: 'Display & Design' },
        { name: 'Display Technology', value: 'Super Retina XDR OLED', category: 'Display & Design' },
        { name: 'Brightness', value: '1000 nits (typical), 2000 nits (peak)', category: 'Display & Design' },
        { name: 'Color Gamut', value: 'P3 wide color', category: 'Display & Design' },
        { name: 'Dimensions', value: '146.6 × 70.6 × 8.25 mm', category: 'Display & Design' },
        { name: 'Weight', value: '187g', category: 'Display & Design' },
        { name: 'Build Materials', value: 'Titanium frame, Ceramic Shield front', category: 'Display & Design' },
        
        // Performance
        { name: 'Processor', value: 'A17 Pro chip', category: 'Performance' },
        { name: 'CPU', value: '6-core CPU with 2 performance and 4 efficiency cores', category: 'Performance' },
        { name: 'GPU', value: '6-core GPU', category: 'Performance' },
        { name: 'RAM', value: '8GB', category: 'Performance' },
        { name: 'Storage Options', value: '128GB, 256GB, 512GB, 1TB', category: 'Performance' },
        { name: 'Operating System', value: 'iOS 17', category: 'Performance' },
        
        // Camera System
        { name: 'Main Camera', value: '48MP f/1.78 aperture', category: 'Camera System' },
        { name: 'Ultra Wide Camera', value: '13MP f/2.2 aperture', category: 'Camera System' },
        { name: 'Telephoto Camera', value: '12MP f/2.8 aperture (3x zoom)', category: 'Camera System' },
        { name: 'Front Camera', value: '12MP f/1.9 aperture', category: 'Camera System' },
        { name: 'Video Recording', value: '4K at 24, 25, 30, or 60 fps', category: 'Camera System' },
        { name: 'Camera Features', value: 'Action mode, Cinematic mode, ProRAW', category: 'Camera System' },
        
        // Battery & Connectivity
        { name: 'Battery Life', value: 'Up to 23 hours video playback', category: 'Battery & Connectivity' },
        { name: 'Charging', value: 'USB-C with fast charging', category: 'Battery & Connectivity' },
        { name: 'Wireless Charging', value: 'MagSafe and Qi wireless charging', category: 'Battery & Connectivity' },
        { name: '5G Support', value: 'Sub-6 GHz and mmWave', category: 'Battery & Connectivity' },
        { name: 'Wi-Fi', value: 'Wi-Fi 6E (802.11ax)', category: 'Battery & Connectivity' },
        { name: 'Bluetooth', value: 'Bluetooth 5.3', category: 'Battery & Connectivity' }
      ],
      features: ['Advanced camera system', 'All-day battery life', 'Premium titanium build', 'Face ID security', 'A17 Pro chip', 'Action Button', 'USB-C connector', 'MagSafe charging'],
      seo: {
        title: 'iPhone 15 Pro - Apple Smartphone with Titanium Design | TechVerse',
        description: 'Buy iPhone 15 Pro by Apple. Latest iPhone with titanium design and A17 Pro chip. Features: Advanced camera system, All-day battery life. Starting at $999. Free shipping available.',
        keywords: ['iphone 15 pro', 'apple', 'iphone', 'smartphone', 'titanium iphone', 'a17 pro', 'ios', 'apple smartphone', 'premium phone', 'face id'],
        canonical: '/products/iphone-15-pro',
        robots: 'index, follow',
        structuredData: {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": "iPhone 15 Pro",
          "brand": { "@type": "Brand", "name": "Apple" },
          "description": "Latest iPhone with titanium design and A17 Pro chip.",
          "image": ["/img/iphone-15-pro-main.jpg"],
          "offers": {
            "@type": "Offer",
            "price": 999,
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "seller": { "@type": "Organization", "name": "TechVerse" }
          },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "89" },
          "sku": "IPHONE-15-PRO-001"
        },
        openGraph: {
          "og:type": "product",
          "og:title": "iPhone 15 Pro - Apple Smartphone with Titanium Design | TechVerse",
          "og:description": "Buy iPhone 15 Pro by Apple. Latest iPhone with titanium design and A17 Pro chip.",
          "og:image": "/img/iphone-15-pro-main.jpg",
          "og:url": "/products/iphone-15-pro",
          "product:price:amount": 999,
          "product:price:currency": "USD"
        }
      }
    },
    {
      name: 'iPhone 15 Pro Max',
      subtitle: 'The ultimate iPhone experience.',
      description: 'iPhone 15 Pro Max with the largest display and longest battery life. Features titanium design, A17 Pro chip, and advanced camera system with 5x telephoto.',
      shortDescription: 'Largest iPhone with A17 Pro chip and 5x telephoto camera.',
      price: 1199,
      originalPrice: 1299,
      compareAtPrice: 1299,
      brand: 'Apple',
      sku: 'IPHONE-15-PRO-MAX-001',
      stock: { quantity: 38, lowStockThreshold: 10, trackQuantity: true },
      featured: true,
      sections: ['latest', 'topSeller', 'featured'],
      tags: ['smartphone', 'apple', 'iphone', 'a17-pro', 'titanium', '5g', 'pro-max'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'midnight', priceModifier: 0, stock: 12 },
            { value: 'starlight', priceModifier: 0, stock: 10 },
            { value: 'blue', priceModifier: 0, stock: 8 },
            { value: 'purple', priceModifier: 0, stock: 8 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '256GB', priceModifier: 0, stock: 18 },
            { value: '512GB', priceModifier: 200, stock: 12 },
            { value: '1TB', priceModifier: 500, stock: 8 }
          ]
        }
      ],
      images: [
        { url: '/img/iphone-15-pro-max-main.jpg', alt: 'iPhone 15 Pro Max', isPrimary: true },
        { url: '/img/iphone-15-pro-max-camera.jpg', alt: 'iPhone 15 Pro Max Camera', isPrimary: false }
      ],
      specifications: [
        // Display & Design
        { name: 'Display Size', value: '6.7 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '2796 x 1290 pixels', category: 'Display & Design' },
        { name: 'Display Technology', value: 'Super Retina XDR OLED', category: 'Display & Design' },
        { name: 'Brightness', value: '1000 nits (typical), 2000 nits (peak)', category: 'Display & Design' },
        { name: 'Color Gamut', value: 'P3 wide color', category: 'Display & Design' },
        { name: 'Dimensions', value: '159.9 × 76.7 × 8.25 mm', category: 'Display & Design' },
        { name: 'Weight', value: '221g', category: 'Display & Design' },
        { name: 'Build Materials', value: 'Titanium frame, Ceramic Shield front', category: 'Display & Design' },
        
        // Performance
        { name: 'Processor', value: 'A17 Pro chip', category: 'Performance' },
        { name: 'CPU', value: '6-core CPU with 2 performance and 4 efficiency cores', category: 'Performance' },
        { name: 'GPU', value: '6-core GPU', category: 'Performance' },
        { name: 'RAM', value: '8GB', category: 'Performance' },
        { name: 'Storage Options', value: '256GB, 512GB, 1TB', category: 'Performance' },
        { name: 'Operating System', value: 'iOS 17', category: 'Performance' },
        
        // Camera System
        { name: 'Main Camera', value: '48MP f/1.78 aperture', category: 'Camera System' },
        { name: 'Ultra Wide Camera', value: '13MP f/2.2 aperture', category: 'Camera System' },
        { name: 'Telephoto Camera', value: '12MP f/2.8 (5x zoom)', category: 'Camera System' },
        { name: 'Front Camera', value: '12MP f/1.9 aperture', category: 'Camera System' },
        { name: 'Video Recording', value: '4K at 24, 25, 30, or 60 fps', category: 'Camera System' },
        { name: 'Camera Features', value: 'Action mode, Cinematic mode, ProRAW, 5x telephoto', category: 'Camera System' },
        
        // Battery & Connectivity
        { name: 'Battery Life', value: 'Up to 29 hours video playback', category: 'Battery & Connectivity' },
        { name: 'Charging', value: 'USB-C with fast charging', category: 'Battery & Connectivity' },
        { name: 'Wireless Charging', value: 'MagSafe and Qi wireless charging', category: 'Battery & Connectivity' },
        { name: '5G Support', value: 'Sub-6 GHz and mmWave', category: 'Battery & Connectivity' },
        { name: 'Wi-Fi', value: 'Wi-Fi 6E (802.11ax)', category: 'Battery & Connectivity' },
        { name: 'Bluetooth', value: 'Bluetooth 5.3', category: 'Battery & Connectivity' }
      ],
      features: ['5x telephoto camera', 'Largest iPhone display', 'All-day battery life', 'Premium titanium build']
    },
    {
      name: 'iPhone 15',
      subtitle: 'New camera. New design. Newphoria.',
      description: 'iPhone 15 features a stunning new design with Dynamic Island, 48MP main camera, and USB-C. Available in vibrant colors.',
      shortDescription: 'Latest iPhone with Dynamic Island and 48MP camera.',
      price: 799,
      originalPrice: 829,
      compareAtPrice: 829,
      brand: 'Apple',
      sku: 'IPHONE-15-001',
      stock: { quantity: 52, lowStockThreshold: 15, trackQuantity: true },
      featured: false,
      sections: ['latest', 'topSeller'],
      tags: ['smartphone', 'apple', 'iphone', 'dynamic-island', 'usb-c'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'pink', priceModifier: 0, stock: 15 },
            { value: 'yellow', priceModifier: 0, stock: 12 },
            { value: 'green', priceModifier: 0, stock: 12 },
            { value: 'blue', priceModifier: 0, stock: 8 },
            { value: 'black', priceModifier: 0, stock: 5 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '128GB', priceModifier: 0, stock: 25 },
            { value: '256GB', priceModifier: 100, stock: 18 },
            { value: '512GB', priceModifier: 300, stock: 9 }
          ]
        }
      ],
      images: [
        { url: '/img/iphone-15-main.jpg', alt: 'iPhone 15', isPrimary: true },
        { url: '/img/iphone-15-colors.jpg', alt: 'iPhone 15 Colors', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '6.1 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '2556 x 1179 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'A16 Bionic chip', category: 'Performance' },
        { name: 'Main Camera', value: '48MP f/1.6 aperture', category: 'Camera System' },
        { name: 'Battery Life', value: 'Up to 20 hours video playback', category: 'Battery & Connectivity' }
      ],
      features: ['Dynamic Island', '48MP main camera', 'USB-C connector', 'Vibrant color options']
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
        { url: '/img/galaxy-s24-ultra-main.jpg', alt: 'Samsung Galaxy S24 Ultra - Premium Android flagship smartphone', isPrimary: true, width: 800, height: 600, format: 'jpg' },
        { url: '/img/galaxy-s24-ultra-back.jpg', alt: 'Samsung Galaxy S24 Ultra - Back view showing titanium build', isPrimary: false, width: 800, height: 600, format: 'jpg' },
        { url: '/img/galaxy-s24-ultra-spen.jpg', alt: 'Samsung Galaxy S24 Ultra - S Pen functionality and features', isPrimary: false, width: 800, height: 600, format: 'jpg' },
        { url: '/img/galaxy-s24-ultra-camera.jpg', alt: 'Samsung Galaxy S24 Ultra - 200MP camera system close-up', isPrimary: false, width: 800, height: 600, format: 'jpg' }
      ],
      specifications: [
        // Display & Interface
        { name: 'Screen Size', value: '6.8', unit: 'inches', category: 'Display & Interface' },
        { name: 'Resolution', value: '3120 × 1440', unit: 'pixels', category: 'Display & Interface' },
        { name: 'Pixel Density', value: '515', unit: 'ppi', category: 'Display & Interface' },
        { name: 'Display Technology', value: 'Dynamic AMOLED 2X', unit: '', category: 'Display & Interface' },
        { name: 'Refresh Rate', value: '120', unit: 'Hz', category: 'Display & Interface' },
        { name: 'Brightness', value: '2600', unit: 'nits', category: 'Display & Interface' },
        { name: 'Contrast Ratio', value: '3000000:1', unit: '', category: 'Display & Interface' },
        { name: 'Color Gamut', value: 'DCI-P3 100%', unit: '', category: 'Display & Interface' },
        { name: 'HDR Support', value: 'HDR10+', unit: '', category: 'Display & Interface' },
        
        // Performance
        { name: 'Processor', value: 'Snapdragon 8 Gen 3', unit: '', category: 'Performance' },
        { name: 'CPU Cores', value: '8', unit: 'cores', category: 'Performance' },
        { name: 'GPU', value: 'Adreno 750', unit: '', category: 'Performance' },
        { name: 'RAM', value: '12', unit: 'GB', category: 'Performance' },
        { name: 'Storage', value: '256', unit: 'GB', category: 'Performance' },
        { name: 'AnTuTu Score', value: '1650000', unit: 'points', category: 'Performance' },
        { name: 'Geekbench Single-Core', value: '2200', unit: 'points', category: 'Performance' },
        { name: 'Geekbench Multi-Core', value: '6800', unit: 'points', category: 'Performance' },
        
        // Camera & Imaging
        { name: 'Main Camera', value: '200MP f/1.7', unit: '', category: 'Camera & Imaging' },
        { name: 'Ultra Wide Camera', value: '12MP f/2.2', unit: '', category: 'Camera & Imaging' },
        { name: 'Telephoto Camera', value: '50MP f/3.4', unit: '', category: 'Camera & Imaging' },
        { name: 'Front Camera', value: '12MP f/2.2', unit: '', category: 'Camera & Imaging' },
        { name: 'Video Recording', value: '8K at 30fps', unit: '', category: 'Camera & Imaging' },
        { name: 'Optical Zoom', value: '5x', unit: '', category: 'Camera & Imaging' },
        { name: 'Digital Zoom', value: '100x', unit: '', category: 'Camera & Imaging' },
        { name: 'Image Stabilization', value: 'Dual Pixel Pro AF', unit: '', category: 'Camera & Imaging' },
        { name: 'Night Mode', value: 'Nightography', unit: '', category: 'Camera & Imaging' },
        
        // Audio & Sound
        { name: 'Speakers', value: 'Stereo speakers tuned by AKG', unit: '', category: 'Audio & Sound' },
        { name: 'Audio Technology', value: 'Dolby Atmos', unit: '', category: 'Audio & Sound' },
        { name: 'Microphones', value: '3 microphones', unit: '', category: 'Audio & Sound' },
        { name: 'Audio Jack', value: 'No', unit: '', category: 'Audio & Sound' },
        
        // Connectivity
        { name: 'Cellular', value: '5G (sub‑6 GHz and mmWave)', unit: '', category: 'Connectivity' },
        { name: 'Wi-Fi', value: 'Wi‑Fi 7 (802.11be)', unit: '', category: 'Connectivity' },
        { name: 'Bluetooth', value: '5.3', unit: '', category: 'Connectivity' },
        { name: 'NFC', value: 'Yes', unit: '', category: 'Connectivity' },
        { name: 'USB', value: 'USB-C 3.2', unit: '', category: 'Connectivity' },
        { name: 'Satellite Emergency SOS', value: 'No', unit: '', category: 'Connectivity' },
        
        // Battery & Power
        { name: 'Battery Capacity', value: '5000', unit: 'mAh', category: 'Battery & Power' },
        { name: 'Wired Charging', value: '45', unit: 'W', category: 'Battery & Power' },
        { name: 'Wireless Charging', value: '15', unit: 'W', category: 'Battery & Power' },
        { name: 'Reverse Wireless Charging', value: 'Yes', unit: '', category: 'Battery & Power' },
        { name: 'Battery Life', value: '28', unit: 'hours', category: 'Battery & Power' },
        { name: 'Fast Charging', value: '0-50% in 30 minutes', unit: '', category: 'Battery & Power' },
        
        // Durability & Design
        { name: 'Water Resistance', value: 'IP68', unit: '', category: 'Durability & Design' },
        { name: 'Drop Protection', value: 'Gorilla Glass Victus 2', unit: '', category: 'Durability & Design' },
        { name: 'Build Material', value: 'Titanium frame, Glass back', unit: '', category: 'Durability & Design' },
        { name: 'Dimensions', value: '162.3 × 79.0 × 8.6', unit: 'mm', category: 'Durability & Design' },
        { name: 'Weight', value: '232', unit: 'g', category: 'Durability & Design' },
        { name: 'Colors Available', value: 'Titanium Black, Gray, Violet, Yellow', unit: '', category: 'Durability & Design' },
        
        // Smart Features
        { name: 'AI Features', value: 'Galaxy AI, Circle to Search', unit: '', category: 'Smart Features' },
        { name: 'Voice Assistant', value: 'Bixby, Google Assistant', unit: '', category: 'Smart Features' },
        { name: 'S Pen', value: 'Included with Bluetooth', unit: '', category: 'Smart Features' },
        { name: 'DeX Support', value: 'Samsung DeX', unit: '', category: 'Smart Features' },
        { name: 'Biometric Security', value: 'Ultrasonic Fingerprint, Face Recognition', unit: '', category: 'Smart Features' },
        { name: 'Operating System', value: 'Android 14 with One UI 6.1', unit: '', category: 'Smart Features' }
      ],
      features: ['S Pen included', 'Galaxy AI features', '200MP camera', 'All-day battery', '5G connectivity', 'Titanium build', 'IP68 water resistance', 'Wireless charging'],
      seo: {
        title: 'Samsung Galaxy S24 Ultra - Premium Android Smartphone | TechVerse',
        description: 'Buy Samsung Galaxy S24 Ultra. Premium Android flagship with S Pen and Galaxy AI features. Features: S Pen included, Galaxy AI. Starting at $1199. Free shipping available.',
        keywords: ['samsung galaxy s24 ultra', 'samsung', 'galaxy s24 ultra', 'smartphone', 'android', 's pen', 'galaxy ai', 'premium smartphone', 'titanium smartphone', '200mp camera'],
        canonical: '/products/samsung-galaxy-s24-ultra',
        robots: 'index, follow',
        structuredData: {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": "Samsung Galaxy S24 Ultra",
          "brand": { "@type": "Brand", "name": "Samsung" },
          "description": "Premium Android flagship with S Pen and Galaxy AI features.",
          "image": ["/img/galaxy-s24-ultra-main.jpg"],
          "offers": {
            "@type": "Offer",
            "price": 1199,
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "seller": { "@type": "Organization", "name": "TechVerse" }
          },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.5", "reviewCount": "127" },
          "sku": "GALAXY-S24-ULTRA-001"
        },
        openGraph: {
          "og:type": "product",
          "og:title": "Samsung Galaxy S24 Ultra - Premium Android Smartphone | TechVerse",
          "og:description": "Buy Samsung Galaxy S24 Ultra. Premium Android flagship with S Pen and Galaxy AI features.",
          "og:image": "/img/galaxy-s24-ultra-main.jpg",
          "og:url": "/products/samsung-galaxy-s24-ultra",
          "product:price:amount": 1199,
          "product:price:currency": "USD"
        }
      }
    },
    {
      name: 'Samsung Galaxy S24+',
      subtitle: 'More screen. More power. More Galaxy AI.',
      description: 'Galaxy S24+ delivers a larger display and enhanced performance with Galaxy AI features. Perfect balance of size and capability.',
      shortDescription: 'Large-screen Galaxy with AI features and premium performance.',
      price: 849,
      originalPrice: 999,
      compareAtPrice: 999,
      discountPercentage: 15,
      discountAmount: 150,
      hasDiscount: true,
      discountReason: 'seasonal_sale',
      brand: 'Samsung',
      sku: 'GALAXY-S24-PLUS-001',
      stock: { 
        quantity: 8, 
        lowStockThreshold: 5, 
        trackQuantity: true,
        status: 'low-stock',
        lastUpdated: new Date(),
        reserved: 0
      },
      featured: false,
      sections: ['latest'],
      tags: ['smartphone', 'samsung', 'galaxy', 'android', '5g', 'ai'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'onyx-black', priceModifier: 0, stock: 3 },
            { value: 'marble-gray', priceModifier: 0, stock: 2 },
            { value: 'cobalt-violet', priceModifier: 0, stock: 2 },
            { value: 'amber-yellow', priceModifier: 0, stock: 1 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '256GB', priceModifier: 0, stock: 5 },
            { value: '512GB', priceModifier: 170, stock: 3 }
          ]
        }
      ],
      images: [
        { url: '/img/galaxy-s24-plus-main.jpg', alt: 'Samsung Galaxy S24+', isPrimary: true },
        { url: '/img/galaxy-s24-plus-display.jpg', alt: 'Galaxy S24+ Display', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '6.7 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '3120 x 1440 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'Snapdragon 8 Gen 3', category: 'Performance' },
        { name: 'Main Camera', value: '50MP f/1.8 aperture', category: 'Camera System' },
        { name: 'Battery Life', value: '4900mAh battery', category: 'Battery & Connectivity' }
      ],
      features: ['Galaxy AI features', 'Large 6.7" display', 'Fast charging', 'Premium build quality']
    },
    {
      name: 'Google Pixel 8 Pro',
      subtitle: 'The most helpful Pixel yet.',
      description: 'Pixel 8 Pro with Google AI, advanced camera features, and pure Android experience. The smartest Pixel with professional photography capabilities.',
      shortDescription: 'Google flagship with AI photography and pure Android.',
      price: 999,
      originalPrice: 999,
      compareAtPrice: null,
      discountPercentage: 0,
      discountAmount: 0,
      hasDiscount: false,
      brand: 'Google',
      sku: 'PIXEL-8-PRO-001',
      stock: { 
        quantity: 0, 
        lowStockThreshold: 0, 
        trackQuantity: true,
        status: 'out-of-stock',
        lastUpdated: new Date(),
        reserved: 0
      },
      featured: false,
      sections: ['latest'],
      tags: ['smartphone', 'google', 'pixel', 'android', 'ai-camera', 'pure-android'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'obsidian', priceModifier: 0, stock: 0 },
            { value: 'porcelain', priceModifier: 0, stock: 0 },
            { value: 'bay', priceModifier: 0, stock: 0 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '128GB', priceModifier: 0, stock: 0 },
            { value: '256GB', priceModifier: 100, stock: 0 },
            { value: '512GB', priceModifier: 300, stock: 0 }
          ]
        }
      ],
      images: [
        { url: '/img/pixel-8-pro-main.jpg', alt: 'Google Pixel 8 Pro', isPrimary: true },
        { url: '/img/pixel-8-pro-camera.jpg', alt: 'Pixel 8 Pro Camera Bar', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '6.7 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '2992 x 1344 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'Google Tensor G3', category: 'Performance' },
        { name: 'Main Camera', value: '50MP f/1.68 aperture', category: 'Camera System' },
        { name: 'Battery Life', value: '5050mAh battery', category: 'Battery & Connectivity' }
      ],
      features: ['Google AI features', 'Magic Eraser', 'Pure Android experience', 'Advanced computational photography']
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
    },
    {
      name: 'iPad Pro 11-inch',
      subtitle: 'Portable powerhouse.',
      description: 'iPad Pro 11-inch with M2 chip delivers desktop-class performance in a compact design. Perfect for creative professionals on the go.',
      shortDescription: 'Compact professional tablet with M2 chip.',
      price: 799,
      originalPrice: 899,
      compareAtPrice: 899,
      brand: 'Apple',
      sku: 'IPAD-PRO-11-M2-001',
      stock: { quantity: 35, lowStockThreshold: 12, trackQuantity: true },
      featured: false,
      sections: ['latest'],
      tags: ['tablet', 'apple', 'ipad', 'm2-chip', 'portable'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'silver', priceModifier: 0, stock: 18 },
            { value: 'space-gray', priceModifier: 0, stock: 17 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '128GB', priceModifier: 0, stock: 15 },
            { value: '256GB', priceModifier: 150, stock: 12 },
            { value: '512GB', priceModifier: 350, stock: 6 },
            { value: '1TB', priceModifier: 750, stock: 2 }
          ]
        }
      ],
      images: [
        { url: '/img/ipad-pro-11-main.jpg', alt: 'iPad Pro 11-inch', isPrimary: true },
        { url: '/img/ipad-pro-11-keyboard.jpg', alt: 'iPad Pro with Magic Keyboard', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '11 inches', category: 'Display & Design' },
        { name: 'Display Technology', value: 'Liquid Retina', category: 'Display & Design' },
        { name: 'Processor', value: 'M2 chip', category: 'Performance' },
        { name: 'Front Camera', value: '12MP Ultra Wide', category: 'Camera & Audio' },
        { name: 'Battery Life', value: 'Up to 10 hours', category: 'Battery & Power' }
      ],
      features: ['M2 chip performance', 'Portable design', 'Apple Pencil support', 'Magic Keyboard compatible']
    },
    {
      name: 'iPad Air',
      subtitle: 'Light. Bright. Full of might.',
      description: 'iPad Air with M1 chip delivers powerful performance for creative and professional tasks. The perfect balance of capability and portability.',
      shortDescription: 'Versatile tablet with M1 chip and vibrant display.',
      price: 599,
      originalPrice: 649,
      compareAtPrice: 649,
      brand: 'Apple',
      sku: 'IPAD-AIR-M1-001',
      stock: { quantity: 42, lowStockThreshold: 15, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['tablet', 'apple', 'ipad', 'm1-chip', 'versatile'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'space-gray', priceModifier: 0, stock: 12 },
            { value: 'starlight', priceModifier: 0, stock: 10 },
            { value: 'pink', priceModifier: 0, stock: 8 },
            { value: 'purple', priceModifier: 0, stock: 7 },
            { value: 'blue', priceModifier: 0, stock: 5 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '64GB', priceModifier: 0, stock: 20 },
            { value: '256GB', priceModifier: 150, stock: 22 }
          ]
        }
      ],
      images: [
        { url: '/img/ipad-air-main.jpg', alt: 'iPad Air', isPrimary: true },
        { url: '/img/ipad-air-colors.jpg', alt: 'iPad Air Colors', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '10.9 inches', category: 'Display & Design' },
        { name: 'Display Technology', value: 'Liquid Retina', category: 'Display & Design' },
        { name: 'Processor', value: 'M1 chip', category: 'Performance' },
        { name: 'Front Camera', value: '12MP Ultra Wide', category: 'Camera & Audio' },
        { name: 'Battery Life', value: 'Up to 10 hours', category: 'Battery & Power' }
      ],
      features: ['M1 chip performance', 'Vibrant color options', 'Apple Pencil support', 'Touch ID security']
    },
    {
      name: 'Samsung Galaxy Tab S9 Ultra',
      subtitle: 'Ultra everything.',
      description: 'Galaxy Tab S9 Ultra with the largest display and S Pen included. Perfect for productivity, creativity, and entertainment.',
      shortDescription: 'Premium Android tablet with large display and S Pen.',
      price: 1199,
      originalPrice: 1299,
      compareAtPrice: 1299,
      brand: 'Samsung',
      sku: 'GALAXY-TAB-S9-ULTRA-001',
      stock: { quantity: 18, lowStockThreshold: 8, trackQuantity: true },
      featured: true,
      sections: ['latest', 'featured'],
      tags: ['tablet', 'samsung', 'galaxy', 's-pen', 'android', 'ultra'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'graphite', priceModifier: 0, stock: 10 },
            { value: 'beige', priceModifier: 0, stock: 8 }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '256GB', priceModifier: 0, stock: 12 },
            { value: '512GB', priceModifier: 200, stock: 6 }
          ]
        }
      ],
      images: [
        { url: '/img/galaxy-tab-s9-ultra-main.jpg', alt: 'Samsung Galaxy Tab S9 Ultra', isPrimary: true },
        { url: '/img/galaxy-tab-s9-ultra-spen.jpg', alt: 'Galaxy Tab S9 Ultra with S Pen', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '14.6 inches', category: 'Display & Design' },
        { name: 'Display Technology', value: 'Dynamic AMOLED 2X', category: 'Display & Design' },
        { name: 'Processor', value: 'Snapdragon 8 Gen 2', category: 'Performance' },
        { name: 'Front Camera', value: '12MP Ultra Wide', category: 'Camera & Audio' },
        { name: 'Battery Life', value: '11200mAh battery', category: 'Battery & Power' }
      ],
      features: ['S Pen included', 'Largest tablet display', 'DeX mode support', 'Premium build quality']
    },
    {
      name: 'Microsoft Surface Pro 9',
      subtitle: 'The tablet that can replace your laptop.',
      description: 'Surface Pro 9 with Intel processors delivers laptop performance in a tablet form factor. Perfect for business and creative work.',
      shortDescription: 'Versatile 2-in-1 tablet with laptop performance.',
      price: 999,
      originalPrice: 1099,
      compareAtPrice: 1099,
      brand: 'Microsoft',
      sku: 'SURFACE-PRO-9-001',
      stock: { quantity: 22, lowStockThreshold: 8, trackQuantity: true },
      featured: false,
      sections: ['latest'],
      tags: ['tablet', 'microsoft', 'surface', '2-in-1', 'windows', 'business'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'platinum', priceModifier: 0, stock: 8 },
            { value: 'graphite', priceModifier: 0, stock: 7 },
            { value: 'sapphire', priceModifier: 0, stock: 4 },
            { value: 'forest', priceModifier: 0, stock: 3 }
          ]
        },
        {
          name: 'Configuration',
          options: [
            { value: 'i5 / 8GB / 256GB', priceModifier: 0, stock: 12 },
            { value: 'i7 / 16GB / 512GB', priceModifier: 400, stock: 10 }
          ]
        }
      ],
      images: [
        { url: '/img/surface-pro-9-main.jpg', alt: 'Microsoft Surface Pro 9', isPrimary: true },
        { url: '/img/surface-pro-9-keyboard.jpg', alt: 'Surface Pro 9 with Type Cover', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '13 inches', category: 'Display & Design' },
        { name: 'Display Technology', value: 'PixelSense Flow', category: 'Display & Design' },
        { name: 'Processor', value: 'Intel Core i5/i7', category: 'Performance' },
        { name: 'Operating System', value: 'Windows 11', category: 'Software & Features' },
        { name: 'Battery Life', value: 'Up to 15.5 hours', category: 'Battery & Power' }
      ],
      features: ['2-in-1 design', 'Surface Pen support', 'Windows 11', 'Business-ready features']
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
    },
    {
      name: 'MacBook Air 15-inch',
      subtitle: 'Impressively big. Impossibly thin.',
      description: 'MacBook Air 15-inch with M2 chip delivers incredible performance in an ultra-thin design. Perfect for everyday computing.',
      shortDescription: 'Large-screen MacBook Air with M2 chip.',
      price: 1299,
      originalPrice: 1399,
      compareAtPrice: 1399,
      brand: 'Apple',
      sku: 'MBA-15-M2-001',
      stock: { quantity: 25, lowStockThreshold: 8, trackQuantity: true },
      featured: false,
      sections: ['latest'],
      tags: ['laptop', 'apple', 'macbook', 'm2-chip', 'thin'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'midnight', priceModifier: 0, stock: 8 },
            { value: 'starlight', priceModifier: 0, stock: 8 },
            { value: 'silver', priceModifier: 0, stock: 6 },
            { value: 'space-gray', priceModifier: 0, stock: 3 }
          ]
        },
        {
          name: 'Configuration',
          options: [
            { value: 'M2 / 8GB / 256GB SSD', priceModifier: 0, stock: 15 },
            { value: 'M2 / 16GB / 512GB SSD', priceModifier: 400, stock: 10 }
          ]
        }
      ],
      images: [
        { url: '/img/macbook-air-15-main.jpg', alt: 'MacBook Air 15-inch', isPrimary: true },
        { url: '/img/macbook-air-15-thin.jpg', alt: 'MacBook Air 15-inch Thin Profile', isPrimary: false }
      ],
      specifications: [
        { name: 'Display Size', value: '15.3 inches', category: 'Display & Design' },
        { name: 'Resolution', value: '2880 x 1864 pixels', category: 'Display & Design' },
        { name: 'Processor', value: 'M2 chip', category: 'Performance' },
        { name: 'Memory', value: '8GB unified memory', category: 'Performance' },
        { name: 'Battery Life', value: 'Up to 18 hours', category: 'Battery & Power' }
      ],
      features: ['M2 chip performance', 'Large 15.3" display', 'Ultra-thin design', 'All-day battery life']
    },
    {
      name: 'Dell XPS 13',
      subtitle: 'Smaller. Smarter. Stunning.',
      description: 'Dell XPS 13 with Intel processors and InfinityEdge display. Premium Windows laptop with exceptional build quality.',
      shortDescription: 'Premium Windows ultrabook with InfinityEdge display.',
      price: 999,
      originalPrice: 1099,
      compareAtPrice: 1099,
      brand: 'Dell',
      sku: 'DELL-XPS-13-001',
      stock: { quantity: 20, lowStockThreshold: 6, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['laptop', 'dell', 'xps', 'windows', 'ultrabook'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'platinum-silver', priceModifier: 0, stock: 12 },
            { value: 'graphite', priceModifier: 0, stock: 8 }
          ]
        },
        {
          name: 'Configuration',
          options: [
            { value: 'i5 / 8GB / 256GB SSD', priceModifier: 0, stock: 12 },
            { value: 'i7 / 16GB / 512GB SSD', priceModifier: 400, stock: 8 }
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
      features: ['InfinityEdge display', 'Premium build quality', 'Windows 11', 'Compact design']
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
    },
    {
      name: 'Sony WH-1000XM5',
      subtitle: 'Industry-leading noise cancellation.',
      description: 'Sony WH-1000XM5 with industry-leading noise cancellation, exceptional sound quality, and all-day comfort.',
      shortDescription: 'Premium over-ear headphones with noise cancellation.',
      price: 399,
      originalPrice: 429,
      compareAtPrice: 429,
      brand: 'Sony',
      sku: 'SONY-WH-1000XM5-001',
      stock: { quantity: 28, lowStockThreshold: 10, trackQuantity: true },
      featured: false,
      sections: ['topSeller'],
      tags: ['headphones', 'sony', 'wireless', 'noise-cancellation', 'over-ear'],
      variants: [
        {
          name: 'Color',
          options: [
            { value: 'black', priceModifier: 0, stock: 18 },
            { value: 'silver', priceModifier: 0, stock: 10 }
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
    }
  ],

  // Cameras (8 products)
  cameras: [],

  // Accessories (20 products)  
  accessories: [],

  // Home & Smart Devices (10 products)
  'home-smart-devices': [],

  // Fitness & Health (8 products)
  'fitness-health': []
};

export default productData;