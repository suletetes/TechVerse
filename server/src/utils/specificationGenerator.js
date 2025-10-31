// Comprehensive specification generator for different product categories

export const specificationTemplates = {
  // Phone specifications
  phones: {
    'Display & Design': [
      { name: 'Display Size', required: true },
      { name: 'Resolution', required: true },
      { name: 'Display Technology', required: true },
      { name: 'Brightness', required: false },
      { name: 'Color Gamut', required: false },
      { name: 'Dimensions', required: true },
      { name: 'Weight', required: true },
      { name: 'Build Materials', required: false }
    ],
    'Performance': [
      { name: 'Processor', required: true },
      { name: 'CPU', required: false },
      { name: 'GPU', required: false },
      { name: 'RAM', required: true },
      { name: 'Storage Options', required: true },
      { name: 'Operating System', required: true }
    ],
    'Camera System': [
      { name: 'Main Camera', required: true },
      { name: 'Ultra Wide Camera', required: false },
      { name: 'Telephoto Camera', required: false },
      { name: 'Front Camera', required: true },
      { name: 'Video Recording', required: true },
      { name: 'Camera Features', required: false }
    ],
    'Battery & Connectivity': [
      { name: 'Battery Life', required: true },
      { name: 'Battery Capacity', required: false },
      { name: 'Charging', required: true },
      { name: 'Wireless Charging', required: false },
      { name: '5G Support', required: false },
      { name: 'Wi-Fi', required: true },
      { name: 'Bluetooth', required: true }
    ]
  },

  // Tablet specifications
  tablets: {
    'Display & Design': [
      { name: 'Display Size', required: true },
      { name: 'Display Technology', required: true },
      { name: 'Resolution', required: true },
      { name: 'Brightness', required: false },
      { name: 'Color Gamut', required: false },
      { name: 'Dimensions', required: true },
      { name: 'Weight', required: true },
      { name: 'Colors Available', required: false }
    ],
    'Performance': [
      { name: 'Processor', required: true },
      { name: 'CPU', required: false },
      { name: 'GPU', required: false },
      { name: 'Memory', required: true },
      { name: 'Storage Options', required: true },
      { name: 'Operating System', required: true }
    ],
    'Camera & Audio': [
      { name: 'Rear Camera', required: true },
      { name: 'Front Camera', required: true },
      { name: 'Video Recording', required: true },
      { name: 'Audio System', required: true },
      { name: 'Microphones', required: false }
    ],
    'Connectivity & Accessories': [
      { name: 'Wi-Fi', required: true },
      { name: 'Bluetooth', required: true },
      { name: 'Cellular', required: false },
      { name: 'Connector', required: true },
      { name: 'Stylus Support', required: false },
      { name: 'Keyboard Support', required: false }
    ],
    'Battery & Power': [
      { name: 'Battery Life', required: true },
      { name: 'Video Playback', required: false },
      { name: 'Audio Playback', required: false },
      { name: 'Charging', required: true },
      { name: 'Power Adapter', required: false }
    ]
  },

  // Computer specifications
  computers: {
    'Display & Design': [
      { name: 'Display Size', required: true },
      { name: 'Resolution', required: true },
      { name: 'Display Technology', required: false },
      { name: 'Brightness', required: false },
      { name: 'Color Accuracy', required: false },
      { name: 'Dimensions', required: true },
      { name: 'Weight', required: true },
      { name: 'Build Quality', required: false }
    ],
    'Performance': [
      { name: 'Processor', required: true },
      { name: 'CPU Cores', required: false },
      { name: 'GPU', required: false },
      { name: 'Memory', required: true },
      { name: 'Storage', required: true },
      { name: 'Operating System', required: true }
    ],
    'Ports & Connectivity': [
      { name: 'USB Ports', required: true },
      { name: 'Thunderbolt', required: false },
      { name: 'HDMI', required: false },
      { name: 'Audio Jack', required: false },
      { name: 'Wi-Fi', required: true },
      { name: 'Bluetooth', required: true }
    ],
    'Battery & Power': [
      { name: 'Battery Life', required: true },
      { name: 'Battery Capacity', required: false },
      { name: 'Charging', required: true },
      { name: 'Power Consumption', required: false }
    ]
  }
}; 
 // TV specifications
  tvs: {
    'Display Technology': [
      { name: 'Screen Size', required: true },
      { name: 'Resolution', required: true },
      { name: 'Display Type', required: true },
      { name: 'HDR Support', required: true },
      { name: 'Refresh Rate', required: false },
      { name: 'Color Gamut', required: false },
      { name: 'Peak Brightness', required: false }
    ],
    'Smart Features & OS': [
      { name: 'Operating System', required: true },
      { name: 'Voice Assistant', required: false },
      { name: 'App Store', required: true },
      { name: 'Streaming Services', required: false },
      { name: 'Gaming Features', required: false }
    ],
    'Audio System': [
      { name: 'Speaker Configuration', required: true },
      { name: 'Audio Power', required: false },
      { name: 'Audio Technologies', required: false },
      { name: 'Surround Sound', required: false }
    ],
    'Connectivity & Ports': [
      { name: 'HDMI Ports', required: true },
      { name: 'USB Ports', required: true },
      { name: 'Wi-Fi', required: true },
      { name: 'Bluetooth', required: true },
      { name: 'Ethernet', required: false },
      { name: 'Optical Audio', required: false }
    ]
  },

  // Gaming console specifications
  gaming: {
    'Performance': [
      { name: 'Processor', required: true },
      { name: 'Graphics', required: true },
      { name: 'Memory', required: true },
      { name: 'Performance Target', required: true },
      { name: 'Ray Tracing', required: false },
      { name: 'Variable Rate Shading', required: false }
    ],
    'Storage & Media': [
      { name: 'Storage', required: true },
      { name: 'Storage Type', required: false },
      { name: 'Expandable Storage', required: false },
      { name: 'Optical Drive', required: false },
      { name: 'Media Support', required: false }
    ],
    'Gaming Features': [
      { name: 'Backward Compatibility', required: false },
      { name: 'Quick Resume', required: false },
      { name: 'Auto HDR', required: false },
      { name: 'Spatial Audio', required: false },
      { name: 'Game Streaming', required: false }
    ],
    'Connectivity & I/O': [
      { name: 'HDMI Output', required: true },
      { name: 'USB Ports', required: true },
      { name: 'Ethernet', required: true },
      { name: 'Wi-Fi', required: true },
      { name: 'Bluetooth', required: true },
      { name: 'Audio Output', required: false }
    ]
  },

  // Watch specifications
  watches: {
    'Display & Design': [
      { name: 'Display Size', required: true },
      { name: 'Display Type', required: true },
      { name: 'Resolution', required: false },
      { name: 'Always-On Display', required: false },
      { name: 'Case Material', required: true },
      { name: 'Band Options', required: false },
      { name: 'Water Resistance', required: true }
    ],
    'Health & Fitness': [
      { name: 'Heart Rate Monitor', required: true },
      { name: 'ECG', required: false },
      { name: 'Blood Oxygen', required: false },
      { name: 'Sleep Tracking', required: true },
      { name: 'Fitness Tracking', required: true },
      { name: 'GPS', required: false }
    ],
    'Smart Features': [
      { name: 'Operating System', required: true },
      { name: 'Voice Assistant', required: false },
      { name: 'App Store', required: false },
      { name: 'Notifications', required: true },
      { name: 'Payments', required: false }
    ],
    'Performance & Battery': [
      { name: 'Processor', required: true },
      { name: 'Storage', required: false },
      { name: 'Battery Life', required: true },
      { name: 'Charging Method', required: true },
      { name: 'Fast Charging', required: false }
    ]
  },

  // Audio product specifications
  audio: {
    'Audio Technology': [
      { name: 'Driver Type', required: true },
      { name: 'Frequency Response', required: false },
      { name: 'Impedance', required: false },
      { name: 'Sensitivity', required: false },
      { name: 'Audio Codecs', required: false }
    ],
    'Features & Controls': [
      { name: 'Noise Cancellation', required: false },
      { name: 'Transparency Mode', required: false },
      { name: 'Touch Controls', required: false },
      { name: 'Voice Assistant', required: false },
      { name: 'Multipoint Connection', required: false }
    ],
    'Design & Comfort': [
      { name: 'Design Type', required: true },
      { name: 'Weight', required: false },
      { name: 'Comfort Features', required: false },
      { name: 'Foldable', required: false },
      { name: 'Color Options', required: false }
    ],
    'Battery & Connectivity': [
      { name: 'Battery Life', required: true },
      { name: 'Charging Case', required: false },
      { name: 'Quick Charge', required: false },
      { name: 'Connectivity', required: true },
      { name: 'Range', required: false },
      { name: 'Wired Option', required: false }
    ]
  },

  // Camera specifications
  cameras: {
    'Image Quality & Performance': [
      { name: 'Sensor Type', required: true },
      { name: 'Megapixels', required: true },
      { name: 'Image Processor', required: false },
      { name: 'ISO Range', required: true },
      { name: 'Dynamic Range', required: false }
    ],
    'Focus & Exposure': [
      { name: 'Autofocus System', required: true },
      { name: 'Autofocus Points', required: false },
      { name: 'Metering Modes', required: false },
      { name: 'Exposure Modes', required: false }
    ],
    'Video Capabilities': [
      { name: 'Video Recording', required: true },
      { name: 'Frame Rates', required: false },
      { name: 'Video Codecs', required: false },
      { name: 'Stabilization', required: false }
    ],
    'Build & Connectivity': [
      { name: 'Weather Sealing', required: false },
      { name: 'Build Quality', required: false },
      { name: 'Connectivity', required: true },
      { name: 'Storage', required: true },
      { name: 'Battery Life', required: true }
    ]
  },

  // Accessory specifications
  accessories: {
    'Compatibility': [
      { name: 'Device Compatibility', required: true },
      { name: 'Size Compatibility', required: false },
      { name: 'Operating System', required: false }
    ],
    'Design & Materials': [
      { name: 'Material Type', required: true },
      { name: 'Color Options', required: false },
      { name: 'Dimensions', required: false },
      { name: 'Weight', required: false }
    ],
    'Features & Functionality': [
      { name: 'Primary Function', required: true },
      { name: 'Additional Features', required: false },
      { name: 'Ease of Use', required: false }
    ],
    'Protection & Durability': [
      { name: 'Protection Level', required: false },
      { name: 'Drop Protection', required: false },
      { name: 'Water Resistance', required: false },
      { name: 'Durability Rating', required: false }
    ]
  },

  // Home & Smart Device specifications
  'home-smart-devices': {
    'Audio Performance': [
      { name: 'Speaker Configuration', required: true },
      { name: 'Audio Technology', required: false },
      { name: 'Frequency Response', required: false },
      { name: 'Audio Power', required: false }
    ],
    'Smart Features': [
      { name: 'Voice Assistant', required: true },
      { name: 'Smart Home Integration', required: false },
      { name: 'Multi-room Audio', required: false },
      { name: 'Voice Recognition', required: false }
    ],
    'Connectivity & Control': [
      { name: 'Wi-Fi', required: true },
      { name: 'Bluetooth', required: true },
      { name: 'Ethernet', required: false },
      { name: 'App Control', required: true },
      { name: 'Touch Controls', required: false }
    ],
    'Design & Build': [
      { name: 'Dimensions', required: true },
      { name: 'Weight', required: false },
      { name: 'Color Options', required: false },
      { name: 'Build Materials', required: false }
    ]
  },

  // Fitness & Health specifications
  'fitness-health': {
    'Health Monitoring': [
      { name: 'Heart Rate Monitor', required: true },
      { name: 'Sleep Tracking', required: true },
      { name: 'Stress Monitoring', required: false },
      { name: 'SpO2 Monitoring', required: false },
      { name: 'Temperature Tracking', required: false }
    ],
    'Fitness Features': [
      { name: 'Activity Tracking', required: true },
      { name: 'Workout Modes', required: true },
      { name: 'GPS Tracking', required: false },
      { name: 'Water Resistance', required: true },
      { name: 'Step Counter', required: true }
    ],
    'Display & Interface': [
      { name: 'Display Type', required: true },
      { name: 'Display Size', required: false },
      { name: 'Touch Screen', required: false },
      { name: 'Always-On Display', required: false }
    ],
    'Battery & Durability': [
      { name: 'Battery Life', required: true },
      { name: 'Charging Method', required: true },
      { name: 'Water Rating', required: true },
      { name: 'Durability Features', required: false }
    ]
  }
};// Sample
 specification data for different product types
export const sampleSpecifications = {
  // Phone sample specs
  phones: {
    'iPhone 15 Pro': {
      'Display & Design': {
        'Display Size': '6.1 inches',
        'Resolution': '2556 x 1179 pixels',
        'Display Technology': 'Super Retina XDR OLED',
        'Brightness': '1000 nits (typical), 2000 nits (peak)',
        'Color Gamut': 'P3 wide color',
        'Dimensions': '146.6 × 70.6 × 8.25 mm',
        'Weight': '187g',
        'Build Materials': 'Titanium frame, Ceramic Shield front'
      },
      'Performance': {
        'Processor': 'A17 Pro chip',
        'CPU': '6-core CPU with 2 performance and 4 efficiency cores',
        'GPU': '6-core GPU',
        'RAM': '8GB',
        'Storage Options': '128GB, 256GB, 512GB, 1TB',
        'Operating System': 'iOS 17'
      },
      'Camera System': {
        'Main Camera': '48MP f/1.78 aperture',
        'Ultra Wide Camera': '13MP f/2.2 aperture',
        'Telephoto Camera': '12MP f/2.8 aperture (3x zoom)',
        'Front Camera': '12MP f/1.9 aperture',
        'Video Recording': '4K at 24, 25, 30, or 60 fps',
        'Camera Features': 'Action mode, Cinematic mode, ProRAW'
      },
      'Battery & Connectivity': {
        'Battery Life': 'Up to 23 hours video playback',
        'Charging': 'Lightning to USB-C',
        'Wireless Charging': 'MagSafe and Qi wireless charging',
        '5G Support': 'Sub-6 GHz and mmWave',
        'Wi-Fi': 'Wi-Fi 6E (802.11ax)',
        'Bluetooth': 'Bluetooth 5.3'
      }
    },
    'Samsung Galaxy S24 Ultra': {
      'Display & Design': {
        'Display Size': '6.8 inches',
        'Resolution': '3120 x 1440 pixels',
        'Display Technology': 'Dynamic AMOLED 2X',
        'Brightness': '2600 nits peak brightness',
        'Color Gamut': 'DCI-P3 100%',
        'Dimensions': '162.3 × 79.0 × 8.6 mm',
        'Weight': '232g',
        'Build Materials': 'Titanium frame, Gorilla Glass Victus 2'
      },
      'Performance': {
        'Processor': 'Snapdragon 8 Gen 3',
        'CPU': 'Octa-core (1×3.39GHz + 3×3.1GHz + 2×2.9GHz + 2×2.2GHz)',
        'GPU': 'Adreno 750',
        'RAM': '12GB',
        'Storage Options': '256GB, 512GB, 1TB',
        'Operating System': 'Android 14 with One UI 6.1'
      },
      'Camera System': {
        'Main Camera': '200MP f/1.7 aperture',
        'Ultra Wide Camera': '12MP f/2.2 aperture',
        'Telephoto Camera': '50MP f/3.4 aperture (5x zoom)',
        'Front Camera': '12MP f/2.2 aperture',
        'Video Recording': '8K at 24/30 fps, 4K at 30/60 fps',
        'Camera Features': 'Galaxy AI photo editing, Super HDR'
      },
      'Battery & Connectivity': {
        'Battery Life': '5000mAh battery',
        'Charging': '45W fast charging',
        'Wireless Charging': '15W wireless charging',
        '5G Support': 'Sub-6 GHz and mmWave',
        'Wi-Fi': 'Wi-Fi 7 (802.11be)',
        'Bluetooth': 'Bluetooth 5.3'
      }
    }
  },

  // Tablet sample specs
  tablets: {
    'iPad Pro 12.9-inch': {
      'Display & Design': {
        'Display Size': '12.9 inches',
        'Display Technology': 'Liquid Retina XDR',
        'Resolution': '2732 x 2048 pixels',
        'Brightness': '1000 nits (typical), 1600 nits (peak)',
        'Color Gamut': 'P3 wide color',
        'Dimensions': '280.6 × 214.9 × 6.4 mm',
        'Weight': '682g (Wi-Fi), 685g (Cellular)',
        'Colors Available': 'Silver, Space Gray'
      },
      'Performance': {
        'Processor': 'M2 chip',
        'CPU': '8-core CPU with 4 performance and 4 efficiency cores',
        'GPU': '10-core GPU',
        'Memory': '8GB, 16GB unified memory',
        'Storage Options': '128GB, 256GB, 512GB, 1TB, 2TB',
        'Operating System': 'iPadOS 17'
      },
      'Camera & Audio': {
        'Rear Camera': '12MP Wide camera',
        'Front Camera': '12MP Ultra Wide front camera',
        'Video Recording': '4K video recording at 24, 25, 30, or 60 fps',
        'Audio System': 'Four-speaker audio system',
        'Microphones': 'Five studio-quality microphones'
      },
      'Connectivity & Accessories': {
        'Wi-Fi': 'Wi-Fi 6E (802.11ax)',
        'Bluetooth': 'Bluetooth 5.3',
        'Cellular': '5G (sub-6 GHz and mmWave)',
        'Connector': 'Thunderbolt / USB 4',
        'Stylus Support': 'Apple Pencil (2nd generation)',
        'Keyboard Support': 'Magic Keyboard, Smart Keyboard Folio'
      },
      'Battery & Power': {
        'Battery Life': 'Up to 10 hours',
        'Video Playback': 'Up to 10 hours of video playback',
        'Audio Playback': 'Up to 9 hours of audio playback',
        'Charging': 'Fast charging with 20W adapter',
        'Power Adapter': '20W USB-C Power Adapter'
      }
    }
  }
};

// Generate specifications for a product based on category and product name
export const generateSpecificationsForProduct = (categorySlug, productName, productData = {}) => {
  const template = specificationTemplates[categorySlug];
  if (!template) {
    console.warn(`No specification template found for category: ${categorySlug}`);
    return [];
  }

  const specifications = [];
  const sampleData = sampleSpecifications[categorySlug]?.[productName] || {};

  // Generate specifications based on template
  Object.entries(template).forEach(([categoryName, specs]) => {
    specs.forEach(spec => {
      if (spec.required || Math.random() > 0.3) { // Include required specs and 70% of optional specs
        const sampleValue = sampleData[categoryName]?.[spec.name];
        const value = sampleValue || generateSampleValue(spec.name, categorySlug, productData);
        
        if (value) {
          specifications.push({
            name: spec.name,
            value: value,
            category: categoryName
          });
        }
      }
    });
  });

  return specifications;
};

// Generate sample values for specifications
const generateSampleValue = (specName, categorySlug, productData) => {
  const specValues = {
    // Display specifications
    'Display Size': {
      phones: ['6.1 inches', '6.7 inches', '6.8 inches', '5.4 inches'],
      tablets: ['10.9 inches', '11 inches', '12.9 inches', '13 inches'],
      computers: ['13.3 inches', '14 inches', '15.6 inches', '16 inches'],
      tvs: ['43 inches', '50 inches', '55 inches', '65 inches', '75 inches']
    },
    'Resolution': {
      phones: ['2556 x 1179 pixels', '2796 x 1290 pixels', '3120 x 1440 pixels'],
      tablets: ['2388 x 1668 pixels', '2732 x 2048 pixels', '2880 x 1920 pixels'],
      computers: ['2560 x 1600 pixels', '3024 x 1964 pixels', '3456 x 2234 pixels'],
      tvs: ['3840 x 2160 (4K UHD)', '7680 x 4320 (8K)', '1920 x 1080 (Full HD)']
    },
    'Display Technology': {
      phones: ['Super Retina XDR OLED', 'Dynamic AMOLED 2X', 'LTPO OLED'],
      tablets: ['Liquid Retina', 'Liquid Retina XDR', 'Dynamic AMOLED 2X'],
      computers: ['Liquid Retina XDR', 'OLED', 'IPS LCD'],
      tvs: ['QLED', 'OLED', 'Neo QLED', 'Mini LED']
    },
    
    // Performance specifications
    'Processor': {
      phones: ['A17 Pro chip', 'Snapdragon 8 Gen 3', 'Google Tensor G3'],
      tablets: ['M2 chip', 'M1 chip', 'Snapdragon 8 Gen 2'],
      computers: ['M3 Pro chip', 'M2 chip', 'Intel Core i7', 'AMD Ryzen 7'],
      gaming: ['Custom AMD Zen 2', 'Custom NVIDIA Tegra', 'AMD Ryzen Zen 2']
    },
    'RAM': {
      phones: ['6GB', '8GB', '12GB', '16GB'],
      tablets: ['8GB', '16GB', '32GB'],
      computers: ['8GB', '16GB', '32GB', '64GB']
    },
    'Storage Options': {
      phones: ['128GB, 256GB, 512GB, 1TB'],
      tablets: ['64GB, 256GB, 512GB, 1TB, 2TB'],
      computers: ['256GB SSD, 512GB SSD, 1TB SSD, 2TB SSD']
    },
    
    // Battery specifications
    'Battery Life': {
      phones: ['Up to 20 hours video playback', 'Up to 23 hours video playback', 'Up to 29 hours video playback'],
      tablets: ['Up to 10 hours', 'Up to 12 hours', 'Up to 15 hours'],
      computers: ['Up to 15 hours', 'Up to 18 hours', 'Up to 22 hours'],
      watches: ['Up to 18 hours', 'Up to 36 hours', 'Up to 7 days'],
      audio: ['Up to 6 hours', 'Up to 30 hours', 'Up to 40 hours'],
      'fitness-health': ['Up to 7 days', 'Up to 14 days', 'Up to 21 days']
    },
    
    // Connectivity specifications
    'Wi-Fi': ['Wi-Fi 6 (802.11ax)', 'Wi-Fi 6E (802.11ax)', 'Wi-Fi 7 (802.11be)'],
    'Bluetooth': ['Bluetooth 5.0', 'Bluetooth 5.2', 'Bluetooth 5.3'],
    '5G Support': ['Sub-6 GHz', 'Sub-6 GHz and mmWave', 'Global 5G'],
    
    // Camera specifications
    'Main Camera': {
      phones: ['48MP f/1.78 aperture', '50MP f/1.8 aperture', '200MP f/1.7 aperture'],
      tablets: ['12MP Wide camera', '8MP Wide camera'],
      cameras: ['24.2MP Full-Frame CMOS', '45MP Full-Frame CMOS', '61MP Full-Frame CMOS']
    },
    'Video Recording': {
      phones: ['4K at 24, 25, 30, or 60 fps', '8K at 24/30 fps'],
      tablets: ['4K video recording at 24, 25, 30, or 60 fps'],
      cameras: ['4K UHD at 30p', '8K at 30p', '4K at 120p']
    }
  };

  const categoryValues = specValues[specName];
  if (!categoryValues) return null;

  if (typeof categoryValues === 'object' && categoryValues[categorySlug]) {
    const values = categoryValues[categorySlug];
    return values[Math.floor(Math.random() * values.length)];
  } else if (Array.isArray(categoryValues)) {
    return categoryValues[Math.floor(Math.random() * categoryValues.length)];
  }

  return null;
};

export default {
  specificationTemplates,
  sampleSpecifications,
  generateSpecificationsForProduct,
  generateSampleValue
};