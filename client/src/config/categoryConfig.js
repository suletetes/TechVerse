/**
 * Dynamic Category Configuration System
 * Maps category names to their specific options and specifications
 * Based on product-categories-data-structure.md and product-options-structure.json
 */

export const CATEGORY_CONFIGS = {
  // Phones Configuration
  'phones': {
    slug: 'phones',
    colorOptions: [
      { id: 'midnight', name: 'Midnight', class: 'midnight-dot' },
      { id: 'starlight', name: 'Starlight', class: 'starlight-dot' },
      { id: 'blue', name: 'Blue', class: 'blue-dot' },
      { id: 'purple', name: 'Purple', class: 'purple-dot' },
      { id: 'red', name: 'Red', class: 'red-dot' },
      { id: 'pink', name: 'Pink', class: 'pink-dot' },
      { id: 'green', name: 'Green', class: 'green-dot' },
      { id: 'yellow', name: 'Yellow', class: 'yellow-dot' }
    ],
    secondaryOptions: {
      name: 'Storage',
      key: 'storage',
      options: [
        { id: '128GB', name: '128GB', basePriceModifier: 0 },
        { id: '256GB', name: '256GB', basePriceModifier: 100 },
        { id: '512GB', name: '512GB', basePriceModifier: 300 },
        { id: '1TB', name: '1TB', basePriceModifier: 600 }
      ]
    },
    specificationCategories: {
      'Display & Design': [
        { key: 'display_size', name: 'Display Size', type: 'text', required: true, placeholder: '6.1"' },
        { key: 'resolution', name: 'Resolution', type: 'text', required: true, placeholder: '2556 x 1179 pixels' },
        { key: 'display_technology', name: 'Display Technology', type: 'text', required: false, placeholder: 'Super Retina XDR OLED' },
        { key: 'brightness', name: 'Brightness', type: 'text', required: false, placeholder: '1000 nits' },
        { key: 'refresh_rate', name: 'Refresh Rate', type: 'text', required: false, placeholder: '120Hz ProMotion' },
        { key: 'dimensions', name: 'Dimensions', type: 'text', required: true, placeholder: '147.6 × 71.6 × 7.80 mm' },
        { key: 'weight', name: 'Weight', type: 'text', required: true, placeholder: '171g' },
        { key: 'materials', name: 'Materials', type: 'text', required: false, placeholder: 'Aluminum, Glass' }
      ],
      'Performance': [
        { key: 'processor', name: 'Processor', type: 'text', required: true, placeholder: 'A17 Pro chip' },
        { key: 'cpu_cores', name: 'CPU Cores', type: 'text', required: false, placeholder: '6-core CPU' },
        { key: 'gpu_cores', name: 'GPU Cores', type: 'text', required: false, placeholder: '6-core GPU' },
        { key: 'neural_engine', name: 'Neural Engine', type: 'text', required: false, placeholder: '16-core Neural Engine' },
        { key: 'ram', name: 'RAM', type: 'text', required: true, placeholder: '8GB' },
        { key: 'storage_type', name: 'Storage Type', type: 'text', required: false, placeholder: 'NVMe' }
      ],
      'Camera System': [
        { key: 'main_camera', name: 'Main Camera', type: 'text', required: false, placeholder: '48MP f/1.78' },
        { key: 'ultra_wide', name: 'Ultra Wide Camera', type: 'text', required: false, placeholder: '12MP f/2.2' },
        { key: 'telephoto', name: 'Telephoto Camera', type: 'text', required: false, placeholder: '12MP f/2.8' },
        { key: 'front_camera', name: 'Front Camera', type: 'text', required: false, placeholder: '12MP f/1.9' },
        { key: 'video_recording', name: 'Video Recording', type: 'text', required: false, placeholder: '4K at 60fps' },
        { key: 'camera_features', name: 'Camera Features', type: 'text', required: false, placeholder: 'Night mode, Portrait, etc.' }
      ],
      'Battery & Connectivity': [
        { key: 'battery_life', name: 'Battery Life', type: 'text', required: false, placeholder: 'Up to 20 hours' },
        { key: 'charging', name: 'Charging', type: 'text', required: false, placeholder: 'Lightning, MagSafe, Qi' },
        { key: '5g_support', name: '5G Support', type: 'text', required: false, placeholder: '5G (sub‑6 GHz and mmWave)' },
        { key: 'wifi_standards', name: 'Wi-Fi Standards', type: 'text', required: false, placeholder: 'Wi-Fi 6E' },
        { key: 'bluetooth_version', name: 'Bluetooth Version', type: 'text', required: false, placeholder: 'Bluetooth 5.3' },
        { key: 'nfc_support', name: 'NFC Support', type: 'boolean', required: false, placeholder: 'Yes/No' }
      ]
    }
  },

  // Tablets Configuration  
  'tablets': {
    slug: 'tablets',
    colorOptions: [
      { id: 'silver', name: 'Silver', class: 'silver-dot' },
      { id: 'space-gray', name: 'Space Gray', class: 'space-gray-dot' },
      { id: 'rose-gold', name: 'Rose Gold', class: 'rose-gold-dot' },
      { id: 'sky-blue', name: 'Sky Blue', class: 'sky-blue-dot' },
      { id: 'purple', name: 'Purple', class: 'purple-dot' },
      { id: 'pink', name: 'Pink', class: 'pink-dot' }
    ],
    secondaryOptions: {
      name: 'Storage',
      key: 'storage',
      options: [
        { id: '64GB', name: '64GB', basePriceModifier: -170 },
        { id: '128GB', name: '128GB', basePriceModifier: 0 },
        { id: '256GB', name: '256GB', basePriceModifier: 150 },
        { id: '512GB', name: '512GB', basePriceModifier: 350 },
        { id: '1TB', name: '1TB', basePriceModifier: 650 },
        { id: '2TB', name: '2TB', basePriceModifier: 1050 }
      ]
    },
    specificationCategories: {
      'Display & Design': [
        { key: 'display_size', name: 'Display Size', type: 'text', required: true, placeholder: '11" or 12.9"' },
        { key: 'resolution', name: 'Resolution', type: 'text', required: true, placeholder: '2388 x 1668 pixels' },
        { key: 'display_technology', name: 'Display Technology', type: 'text', required: false, placeholder: 'Liquid Retina' },
        { key: 'brightness', name: 'Brightness', type: 'text', required: false, placeholder: '600 nits' },
        { key: 'color_accuracy', name: 'Color Accuracy', type: 'text', required: false, placeholder: 'P3 wide color' },
        { key: 'dimensions', name: 'Dimensions', type: 'text', required: true, placeholder: '247.6 × 178.5 × 5.9 mm' },
        { key: 'weight', name: 'Weight', type: 'text', required: true, placeholder: '466g' }
      ],
      'Performance': [
        { key: 'processor', name: 'Processor', type: 'text', required: true, placeholder: 'M2 chip' },
        { key: 'cpu_cores', name: 'CPU Cores', type: 'text', required: false, placeholder: '8-core CPU' },
        { key: 'gpu_cores', name: 'GPU Cores', type: 'text', required: false, placeholder: '10-core GPU' },
        { key: 'unified_memory', name: 'Unified Memory', type: 'text', required: true, placeholder: '8GB' },
        { key: 'storage_speed', name: 'Storage Speed', type: 'text', required: false, placeholder: 'Up to 2.4GB/s' }
      ]
    }
  },

  // Computers Configuration
  'computers': {
    slug: 'computers',
    colorOptions: [
      { id: 'silver', name: 'Silver', class: 'silver-dot' },
      { id: 'space-gray', name: 'Space Gray', class: 'space-gray-dot' },
      { id: 'midnight', name: 'Midnight', class: 'midnight-dot' },
      { id: 'starlight', name: 'Starlight', class: 'starlight-dot' },
      { id: 'gold', name: 'Gold', class: 'gold-dot' }
    ],
    secondaryOptions: {
      name: 'Configuration',
      key: 'configuration',
      options: [
        { id: 'base', name: 'M3 / 8GB / 256GB SSD', basePriceModifier: 0 },
        { id: 'mid', name: 'M3 / 16GB / 512GB SSD', basePriceModifier: 400 },
        { id: 'high', name: 'M3 Pro / 18GB / 512GB SSD', basePriceModifier: 700 },
        { id: 'max', name: 'M3 Max / 36GB / 1TB SSD', basePriceModifier: 1900 }
      ]
    },
    specificationCategories: {
      'Display & Design': [
        { key: 'display_size', name: 'Display Size', type: 'text', required: true, placeholder: '13.6" or 15.3"' },
        { key: 'resolution', name: 'Resolution', type: 'text', required: true, placeholder: '2560 x 1664 pixels' },
        { key: 'display_technology', name: 'Display Technology', type: 'text', required: false, placeholder: 'Liquid Retina' },
        { key: 'color_accuracy', name: 'Color Accuracy', type: 'text', required: false, placeholder: 'P3 wide color' },
        { key: 'refresh_rate', name: 'Refresh Rate', type: 'text', required: false, placeholder: '60Hz or 120Hz ProMotion' },
        { key: 'dimensions', name: 'Dimensions', type: 'text', required: true, placeholder: '304 × 212 × 11.5 mm' },
        { key: 'weight', name: 'Weight', type: 'text', required: true, placeholder: '1.24kg' }
      ],
      'Performance': [
        { key: 'processor', name: 'Processor', type: 'text', required: true, placeholder: 'Apple M3' },
        { key: 'cpu_cores', name: 'CPU Cores', type: 'text', required: false, placeholder: '8-core CPU' },
        { key: 'gpu_cores', name: 'GPU Cores', type: 'text', required: false, placeholder: '10-core GPU' },
        { key: 'memory', name: 'Memory', type: 'text', required: true, placeholder: '8GB unified memory' },
        { key: 'storage_type', name: 'Storage Type', type: 'text', required: false, placeholder: 'SSD' },
        { key: 'thermal_design', name: 'Thermal Design', type: 'text', required: false, placeholder: 'Fanless design' }
      ],
      'Ports & Connectivity': [
        { key: 'thunderbolt_ports', name: 'Thunderbolt/USB-C Ports', type: 'text', required: false, placeholder: '2x Thunderbolt 4' },
        { key: 'usb_ports', name: 'USB-A Ports', type: 'text', required: false, placeholder: '2x USB 3.0' },
        { key: 'hdmi_output', name: 'HDMI Output', type: 'text', required: false, placeholder: 'HDMI 2.1' },
        { key: 'audio_jack', name: 'Audio Jack', type: 'text', required: false, placeholder: '3.5mm headphone jack' },
        { key: 'wifi_bluetooth', name: 'Wi-Fi & Bluetooth', type: 'text', required: false, placeholder: 'Wi-Fi 6E, Bluetooth 5.3' }
      ],
      'Battery & Power': [
        { key: 'battery_life', name: 'Battery Life', type: 'text', required: false, placeholder: 'Up to 18 hours' },
        { key: 'power_adapter', name: 'Power Adapter', type: 'text', required: false, placeholder: '67W USB-C Power Adapter' }
      ]
    }
  },

  // TVs Configuration
  'tvs': {
    slug: 'tvs',
    colorOptions: [
      { id: 'black', name: 'Black', class: 'black-dot' },
      { id: 'silver', name: 'Silver', class: 'silver-dot' },
      { id: 'white', name: 'White', class: 'white-dot' }
    ],
    secondaryOptions: {
      name: 'Screen Size',
      key: 'screen_size',
      options: [
        { id: '43inch', name: '43"', basePriceModifier: -200 },
        { id: '55inch', name: '55"', basePriceModifier: 0 },
        { id: '65inch', name: '65"', basePriceModifier: 500 },
        { id: '75inch', name: '75"', basePriceModifier: 1000 },
        { id: '85inch', name: '85"', basePriceModifier: 2000 }
      ]
    },
    specificationCategories: {
      'Display': [
        { key: 'resolution', name: 'Resolution', type: 'select', required: true, options: ['4K UHD', '8K', 'Full HD'] },
        { key: 'hdr_support', name: 'HDR Support', type: 'text', required: false, placeholder: 'HDR10, Dolby Vision' },
        { key: 'refresh_rate', name: 'Refresh Rate', type: 'text', required: false, placeholder: '120Hz' },
        { key: 'panel_type', name: 'Panel Type', type: 'select', required: false, options: ['OLED', 'QLED', 'LED', 'Mini-LED'] }
      ],
      'Smart Features': [
        { key: 'operating_system', name: 'Operating System', type: 'text', required: false, placeholder: 'webOS, Tizen, Android TV' },
        { key: 'voice_assistant', name: 'Voice Assistant', type: 'text', required: false, placeholder: 'Google Assistant, Alexa' },
        { key: 'streaming_apps', name: 'Streaming Apps', type: 'text', required: false, placeholder: 'Netflix, Prime Video, Disney+' }
      ]
    }
  },

  // Gaming Configuration
  'gaming': {
    slug: 'gaming',
    colorOptions: [
      { id: 'black', name: 'Black', class: 'black-dot' },
      { id: 'white', name: 'White', class: 'white-dot' },
      { id: 'blue', name: 'Blue', class: 'blue-dot' },
      { id: 'red', name: 'Red', class: 'red-dot' }
    ],
    secondaryOptions: {
      name: 'Storage',
      key: 'storage',
      options: [
        { id: '512GB', name: '512GB SSD', basePriceModifier: 0 },
        { id: '1TB', name: '1TB SSD', basePriceModifier: 100 },
        { id: '2TB', name: '2TB SSD', basePriceModifier: 300 }
      ]
    },
    specificationCategories: {
      'Performance': [
        { key: 'processor', name: 'Processor', type: 'text', required: true, placeholder: 'Custom AMD Zen 2' },
        { key: 'gpu', name: 'Graphics', type: 'text', required: true, placeholder: 'Custom RDNA 2' },
        { key: 'memory', name: 'Memory', type: 'text', required: true, placeholder: '16GB GDDR6' },
        { key: 'max_resolution', name: 'Max Resolution', type: 'text', required: false, placeholder: '4K at 120fps' }
      ],
      'Features': [
        { key: 'backwards_compatibility', name: 'Backwards Compatibility', type: 'boolean', required: false },
        { key: 'vr_support', name: 'VR Support', type: 'boolean', required: false },
        { key: 'online_service', name: 'Online Service', type: 'text', required: false, placeholder: 'PlayStation Plus, Xbox Live' }
      ]
    }
  },

  // Watches Configuration
  'watches': {
    slug: 'watches',
    colorOptions: [
      { id: 'midnight', name: 'Midnight', class: 'midnight-dot' },
      { id: 'starlight', name: 'Starlight', class: 'starlight-dot' },
      { id: 'silver', name: 'Silver', class: 'silver-dot' },
      { id: 'gold', name: 'Gold', class: 'gold-dot' },
      { id: 'red', name: 'Red', class: 'red-dot' }
    ],
    secondaryOptions: {
      name: 'Size',
      key: 'size',
      options: [
        { id: '41mm', name: '41mm', basePriceModifier: 0 },
        { id: '45mm', name: '45mm', basePriceModifier: 30 }
      ]
    },
    specificationCategories: {
      'Display & Design': [
        { key: 'display_size', name: 'Display Size', type: 'text', required: true, placeholder: '1.9" Retina' },
        { key: 'case_material', name: 'Case Material', type: 'text', required: false, placeholder: 'Aluminum, Steel, Titanium' },
        { key: 'water_resistance', name: 'Water Resistance', type: 'text', required: false, placeholder: '50m' }
      ],
      'Health & Fitness': [
        { key: 'heart_rate', name: 'Heart Rate Monitor', type: 'boolean', required: false },
        { key: 'gps', name: 'GPS', type: 'boolean', required: false },
        { key: 'fitness_tracking', name: 'Fitness Tracking', type: 'text', required: false, placeholder: 'Steps, Calories, Workouts' }
      ]
    }
  },

  // Audio Configuration
  'audio': {
    slug: 'audio',
    colorOptions: [
      { id: 'black', name: 'Black', class: 'black-dot' },
      { id: 'white', name: 'White', class: 'white-dot' },
      { id: 'silver', name: 'Silver', class: 'silver-dot' },
      { id: 'blue', name: 'Blue', class: 'blue-dot' },
      { id: 'red', name: 'Red', class: 'red-dot' }
    ],
    secondaryOptions: {
      name: 'Type',
      key: 'type',
      options: [
        { id: 'wireless', name: 'Wireless', basePriceModifier: 0 },
        { id: 'wired', name: 'Wired', basePriceModifier: -50 },
        { id: 'noise-cancelling', name: 'Noise Cancelling', basePriceModifier: 100 }
      ]
    },
    specificationCategories: {
      'Audio Quality': [
        { key: 'driver_size', name: 'Driver Size', type: 'text', required: false, placeholder: '40mm' },
        { key: 'frequency_response', name: 'Frequency Response', type: 'text', required: false, placeholder: '20Hz - 20kHz' },
        { key: 'impedance', name: 'Impedance', type: 'text', required: false, placeholder: '32 ohms' }
      ],
      'Features': [
        { key: 'noise_cancellation', name: 'Noise Cancellation', type: 'boolean', required: false },
        { key: 'wireless_connectivity', name: 'Wireless Connectivity', type: 'text', required: false, placeholder: 'Bluetooth 5.0' },
        { key: 'battery_life', name: 'Battery Life', type: 'text', required: false, placeholder: '30 hours' }
      ]
    }
  },

  // Cameras Configuration
  'cameras': {
    slug: 'cameras',
    colorOptions: [
      { id: 'black', name: 'Black', class: 'black-dot' },
      { id: 'silver', name: 'Silver', class: 'silver-dot' },
      { id: 'white', name: 'White', class: 'white-dot' }
    ],
    secondaryOptions: {
      name: 'Lens Kit',
      key: 'lens_kit',
      options: [
        { id: 'body-only', name: 'Body Only', basePriceModifier: 0 },
        { id: 'kit-lens', name: 'With Kit Lens', basePriceModifier: 200 },
        { id: 'pro-kit', name: 'Pro Lens Kit', basePriceModifier: 800 }
      ]
    },
    specificationCategories: {
      'Image Quality': [
        { key: 'sensor_type', name: 'Sensor Type', type: 'text', required: true, placeholder: 'Full Frame CMOS' },
        { key: 'megapixels', name: 'Megapixels', type: 'text', required: true, placeholder: '24.2MP' },
        { key: 'iso_range', name: 'ISO Range', type: 'text', required: false, placeholder: '100-51200' }
      ],
      'Video': [
        { key: 'video_resolution', name: 'Video Resolution', type: 'text', required: false, placeholder: '4K at 60fps' },
        { key: 'video_formats', name: 'Video Formats', type: 'text', required: false, placeholder: 'MP4, MOV' }
      ]
    }
  },

  // Accessories Configuration
  'accessories': {
    slug: 'accessories',
    colorOptions: [
      { id: 'black', name: 'Black', class: 'black-dot' },
      { id: 'white', name: 'White', class: 'white-dot' },
      { id: 'clear', name: 'Clear', class: 'clear-dot' },
      { id: 'blue', name: 'Blue', class: 'blue-dot' },
      { id: 'red', name: 'Red', class: 'red-dot' }
    ],
    secondaryOptions: {
      name: 'Compatibility',
      key: 'compatibility',
      options: [
        { id: 'universal', name: 'Universal', basePriceModifier: 0 },
        { id: 'iphone', name: 'iPhone', basePriceModifier: 5 },
        { id: 'android', name: 'Android', basePriceModifier: 5 },
        { id: 'laptop', name: 'Laptop', basePriceModifier: 10 }
      ]
    },
    specificationCategories: {
      'Specifications': [
        { key: 'material', name: 'Material', type: 'text', required: false, placeholder: 'Silicone, Leather, Metal' },
        { key: 'dimensions', name: 'Dimensions', type: 'text', required: false, placeholder: 'Length x Width x Height' },
        { key: 'weight', name: 'Weight', type: 'text', required: false, placeholder: 'Weight in grams' }
      ]
    }
  }
};

/**
 * Get category configuration by category name or slug
 */
export const getCategoryConfig = (categoryIdentifier) => {
  if (!categoryIdentifier) return null;
  
  const identifier = categoryIdentifier.toLowerCase();
  
  // Try direct match first
  if (CATEGORY_CONFIGS[identifier]) {
    return CATEGORY_CONFIGS[identifier];
  }
  
  // Try to find by slug or partial match
  for (const [key, config] of Object.entries(CATEGORY_CONFIGS)) {
    if (config.slug === identifier || 
        key.includes(identifier) || 
        identifier.includes(key) ||
        identifier.includes(config.slug)) {
      return config;
    }
  }
  
  return null;
};

/**
 * Get all available categories
 */
export const getAllCategoryConfigs = () => {
  return Object.entries(CATEGORY_CONFIGS).map(([key, config]) => ({
    key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    ...config
  }));
};

/**
 * Map database category to config
 */
export const mapCategoryToConfig = (category) => {
  if (!category) return null;
  
  // Handle both string and object categories
  const categoryName = typeof category === 'object' ? category.name : category;
  const categorySlug = typeof category === 'object' ? category.slug : category;
  
  console.log('Mapping category to config:', { categoryName, categorySlug, category });
  
  // Create mapping for common category names to config keys
  const nameMapping = {
    'smartphones': 'phones',
    'smart phones': 'phones',
    'mobile phones': 'phones',
    'phones': 'phones',
    'tablets': 'tablets',
    'ipad': 'tablets',
    'laptops & computers': 'computers',
    'laptops': 'computers',
    'computers': 'computers',
    'desktop': 'computers',
    'laptop': 'computers',
    'smart tvs': 'tvs',
    'televisions': 'tvs',
    'tv': 'tvs',
    'tvs': 'tvs',
    'gaming consoles': 'gaming',
    'gaming': 'gaming',
    'console': 'gaming',
    'smart watches': 'watches',
    'watches': 'watches',
    'smartwatch': 'watches',
    'audio & headphones': 'audio',
    'headphones': 'audio',
    'audio': 'audio',
    'speakers': 'audio',
    'cameras': 'cameras',
    'camera': 'cameras',
    'photography': 'cameras',
    'accessories': 'accessories',
    'smart home': 'home-smart-devices',
    'home automation': 'home-smart-devices',
    'fitness & health': 'fitness-health',
    'fitness': 'fitness-health',
    'health': 'fitness-health'
  };
  
  // Try direct config lookup first
  let config = getCategoryConfig(categoryName) || getCategoryConfig(categorySlug);
  
  // If not found, try mapped names
  if (!config && categoryName) {
    const mappedKey = nameMapping[categoryName.toLowerCase()];
    if (mappedKey) {
      config = getCategoryConfig(mappedKey);
    }
  }
  
  if (!config && categorySlug) {
    const mappedKey = nameMapping[categorySlug.toLowerCase()];
    if (mappedKey) {
      config = getCategoryConfig(mappedKey);
    }
  }
  
  console.log('Config found:', config ? 'Yes' : 'No', config);
  return config;
};

/**
 * Generate slug from product name
 */
export const generateProductSlug = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Validate product slug
 */
export const validateProductSlug = (slug) => {
  if (!slug) return false;
  
  // Check if slug matches pattern: lowercase letters, numbers, hyphens only
  const slugPattern = /^[a-z0-9-]+$/;
  return slugPattern.test(slug) && slug.length >= 2 && slug.length <= 100;
};