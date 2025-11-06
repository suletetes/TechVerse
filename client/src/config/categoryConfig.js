/**
 * Dynamic Category Configuration System
 * Maps category names to their specific options and specifications
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
    ]
  }
};    s
econdaryOptions: {
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
        { id: '43inch', name: '43"', basePriceModifier: -500 },
        { id: '50inch', name: '50"', basePriceModifier: -300 },
        { id: '55inch', name: '55"', basePriceModifier: 0 },
        { id: '65inch', name: '65"', basePriceModifier: 500 },
        { id: '75inch', name: '75"', basePriceModifier: 1200 },
        { id: '85inch', name: '85"', basePriceModifier: 2200 }
      ]
    },
    specificationCategories: {
      'Display Technology': [
        { key: 'display_type', name: 'Display Type', type: 'text', required: true, placeholder: 'QLED, OLED, Mini-LED' },
        { key: 'resolution', name: 'Resolution', type: 'text', required: true, placeholder: '4K UHD, 8K UHD' },
        { key: 'hdr_support', name: 'HDR Support', type: 'text', required: false, placeholder: 'HDR10, Dolby Vision' },
        { key: 'refresh_rate', name: 'Refresh Rate', type: 'text', required: false, placeholder: '120Hz' },
        { key: 'peak_brightness', name: 'Peak Brightness', type: 'text', required: false, placeholder: '1000 nits' }
      ],
      'Smart Features': [
        { key: 'operating_system', name: 'Operating System', type: 'text', required: true, placeholder: 'Tizen, webOS, Google TV' },
        { key: 'voice_control', name: 'Voice Control', type: 'text', required: false, placeholder: 'Alexa, Google Assistant' },
        { key: 'streaming_apps', name: 'Streaming Apps', type: 'text', required: false, placeholder: 'Netflix, Disney+, Prime Video' }
      ]
    }
  },

  // Gaming Configuration
  'gaming': {
    slug: 'gaming',
    colorOptions: [
      { id: 'white', name: 'White', class: 'white-dot' },
      { id: 'black', name: 'Black', class: 'black-dot' },
      { id: 'blue', name: 'Blue', class: 'blue-dot' },
      { id: 'red', name: 'Red', class: 'red-dot' }
    ],
    secondaryOptions: {
      name: 'Storage',
      key: 'storage',
      options: [
        { id: '512GB', name: '512GB SSD', basePriceModifier: 0 },
        { id: '1TB', name: '1TB SSD', basePriceModifier: 150 },
        { id: '2TB', name: '2TB SSD', basePriceModifier: 400 }
      ]
    },
    specificationCategories: {
      'Performance': [
        { key: 'processor', name: 'Processor', type: 'text', required: true, placeholder: 'Custom AMD Zen 2' },
        { key: 'graphics', name: 'Graphics', type: 'text', required: true, placeholder: 'Custom RDNA 2 GPU' },
        { key: 'memory', name: 'Memory', type: 'text', required: true, placeholder: '16GB GDDR6' },
        { key: 'performance_target', name: 'Performance Target', type: 'text', required: false, placeholder: '4K 120fps' }
      ],
      'Gaming Features': [
        { key: 'backward_compatibility', name: 'Backward Compatibility', type: 'text', required: false, placeholder: 'PS4, Xbox One games' },
        { key: 'vr_support', name: 'VR Support', type: 'text', required: false, placeholder: 'PlayStation VR2' },
        { key: 'online_service', name: 'Online Service', type: 'text', required: false, placeholder: 'PlayStation Plus, Xbox Game Pass' }
      ]
    }
  },

  // Watches Configuration
  'watches': {
    slug: 'watches',
    colorOptions: [
      { id: 'silver', name: 'Silver', class: 'silver-dot' },
      { id: 'space-gray', name: 'Space Gray', class: 'space-gray-dot' },
      { id: 'gold', name: 'Gold', class: 'gold-dot' },
      { id: 'midnight', name: 'Midnight', class: 'midnight-dot' },
      { id: 'starlight', name: 'Starlight', class: 'starlight-dot' }
    ],
    secondaryOptions: {
      name: 'Case Material',
      key: 'case_material',
      options: [
        { id: 'aluminum', name: 'Aluminum', basePriceModifier: 0 },
        { id: 'stainless-steel', name: 'Stainless Steel', basePriceModifier: 300 },
        { id: 'titanium', name: 'Titanium', basePriceModifier: 400 },
        { id: 'ceramic', name: 'Ceramic', basePriceModifier: 500 }
      ]
    },
    specificationCategories: {
      'Display & Design': [
        { key: 'display_type', name: 'Display Type', type: 'text', required: true, placeholder: 'Always-On Retina LTPO OLED' },
        { key: 'screen_size', name: 'Screen Size', type: 'text', required: true, placeholder: '41mm or 45mm' },
        { key: 'water_resistance', name: 'Water Resistance', type: 'text', required: false, placeholder: '50 meters' },
        { key: 'crown_controls', name: 'Crown Controls', type: 'text', required: false, placeholder: 'Digital Crown, Side Button' }
      ],
      'Health & Fitness': [
        { key: 'heart_rate', name: 'Heart Rate Monitoring', type: 'text', required: true, placeholder: '24/7 heart rate tracking' },
        { key: 'ecg', name: 'ECG', type: 'text', required: false, placeholder: 'ECG app available' },
        { key: 'blood_oxygen', name: 'Blood Oxygen', type: 'text', required: false, placeholder: 'Blood Oxygen app' },
        { key: 'sleep_tracking', name: 'Sleep Tracking', type: 'text', required: false, placeholder: 'Sleep stages tracking' }
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
      { id: 'space-gray', name: 'Space Gray', class: 'space-gray-dot' },
      { id: 'blue', name: 'Blue', class: 'blue-dot' },
      { id: 'pink', name: 'Pink', class: 'pink-dot' }
    ],
    secondaryOptions: {
      name: 'Model',
      key: 'model',
      options: [
        { id: 'standard', name: 'Standard', basePriceModifier: 0 },
        { id: 'pro', name: 'Pro', basePriceModifier: 70 },
        { id: 'max', name: 'Max', basePriceModifier: 370 },
        { id: 'studio', name: 'Studio', basePriceModifier: 170 }
      ]
    },
    specificationCategories: {
      'Audio Technology': [
        { key: 'driver_size', name: 'Driver Size', type: 'text', required: true, placeholder: '40mm dynamic drivers' },
        { key: 'frequency_response', name: 'Frequency Response', type: 'text', required: false, placeholder: '20Hz - 20kHz' },
        { key: 'noise_cancellation', name: 'Noise Cancellation', type: 'text', required: false, placeholder: 'Active Noise Cancellation' },
        { key: 'spatial_audio', name: 'Spatial Audio', type: 'text', required: false, placeholder: 'Dolby Atmos support' }
      ],
      'Battery & Connectivity': [
        { key: 'battery_life', name: 'Battery Life', type: 'text', required: true, placeholder: '30 hours with ANC off' },
        { key: 'charging_time', name: 'Charging Time', type: 'text', required: false, placeholder: '2 hours full charge' },
        { key: 'bluetooth_version', name: 'Bluetooth Version', type: 'text', required: true, placeholder: 'Bluetooth 5.3' },
        { key: 'wireless_range', name: 'Wireless Range', type: 'text', required: false, placeholder: '10 meters' }
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
        identifier.includes(key)) {
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
};  // Ca
meras Configuration
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
        { id: 'kit-lens', name: 'With 24-70mm f/4 Lens', basePriceModifier: 500 },
        { id: 'pro-lens', name: 'With 24-70mm f/2.8 Lens', basePriceModifier: 1300 }
      ]
    },
    specificationCategories: {
      'Image Sensor': [
        { key: 'sensor_type', name: 'Sensor Type', type: 'text', required: true, placeholder: 'Full-frame CMOS' },
        { key: 'resolution', name: 'Resolution', type: 'text', required: true, placeholder: '24.2 megapixels' },
        { key: 'iso_range', name: 'ISO Range', type: 'text', required: false, placeholder: '100-51200' },
        { key: 'image_processor', name: 'Image Processor', type: 'text', required: false, placeholder: 'DIGIC X' }
      ],
      'Video Capabilities': [
        { key: 'video_resolution', name: 'Video Resolution', type: 'text', required: false, placeholder: '4K UHD at 60fps' },
        { key: 'video_formats', name: 'Video Formats', type: 'text', required: false, placeholder: 'MP4, MOV' },
        { key: 'image_stabilization', name: 'Image Stabilization', type: 'text', required: false, placeholder: 'In-body 5-axis IS' }
      ]
    }
  },

  // Accessories Configuration
  'accessories': {
    slug: 'accessories',
    colorOptions: [
      { id: 'clear', name: 'Clear', class: 'clear-dot' },
      { id: 'black', name: 'Black', class: 'black-dot' },
      { id: 'blue', name: 'Blue', class: 'blue-dot' },
      { id: 'purple', name: 'Purple', class: 'purple-dot' },
      { id: 'pink', name: 'Pink', class: 'pink-dot' },
      { id: 'red', name: 'Red', class: 'red-dot' },
      { id: 'white', name: 'White', class: 'white-dot' }
    ],
    secondaryOptions: {
      name: 'Type/Material',
      key: 'material_type',
      options: [
        { id: 'silicone', name: 'Silicone', basePriceModifier: 0 },
        { id: 'leather', name: 'Leather', basePriceModifier: 30 },
        { id: 'clear', name: 'Clear', basePriceModifier: 10 },
        { id: 'magsafe', name: 'MagSafe', basePriceModifier: 20 },
        { id: 'wallet', name: 'Wallet', basePriceModifier: 50 }
      ]
    },
    specificationCategories: {
      'Protection & Durability': [
        { key: 'drop_protection', name: 'Drop Protection', type: 'text', required: false, placeholder: '6 feet drop protection' },
        { key: 'material_composition', name: 'Material', type: 'text', required: true, placeholder: 'TPU, Polycarbonate' },
        { key: 'water_resistance', name: 'Water Resistance', type: 'text', required: false, placeholder: 'IPX4' },
        { key: 'scratch_resistance', name: 'Scratch Resistance', type: 'text', required: false, placeholder: '9H hardness' }
      ],
      'Compatibility': [
        { key: 'device_compatibility', name: 'Device Compatibility', type: 'text', required: true, placeholder: 'iPhone 15 Pro Max' },
        { key: 'wireless_charging', name: 'Wireless Charging', type: 'text', required: false, placeholder: 'MagSafe compatible' },
        { key: 'port_access', name: 'Port Access', type: 'text', required: false, placeholder: 'All ports accessible' }
      ]
    }
  },

  // Home & Smart Devices Configuration
  'home-smart': {
    slug: 'home-smart',
    colorOptions: [
      { id: 'white', name: 'White', class: 'white-dot' },
      { id: 'black', name: 'Black', class: 'black-dot' },
      { id: 'silver', name: 'Silver', class: 'silver-dot' },
      { id: 'space-gray', name: 'Space Gray', class: 'space-gray-dot' },
      { id: 'blue', name: 'Blue', class: 'blue-dot' }
    ],
    secondaryOptions: {
      name: 'Size/Type',
      key: 'size_type',
      options: [
        { id: 'mini', name: 'Mini', basePriceModifier: -50 },
        { id: 'standard', name: 'Standard', basePriceModifier: 0 },
        { id: 'pro', name: 'Pro', basePriceModifier: 50 },
        { id: 'max', name: 'Max', basePriceModifier: 150 }
      ]
    },
    specificationCategories: {
      'Smart Features': [
        { key: 'voice_assistant', name: 'Voice Assistant', type: 'text', required: true, placeholder: 'Alexa, Google Assistant, Siri' },
        { key: 'smart_home_compatibility', name: 'Smart Home Compatibility', type: 'text', required: false, placeholder: 'HomeKit, SmartThings' },
        { key: 'app_control', name: 'App Control', type: 'text', required: false, placeholder: 'iOS and Android apps' },
        { key: 'privacy_features', name: 'Privacy Features', type: 'text', required: false, placeholder: 'Mute button, LED indicator' }
      ],
      'Audio & Display': [
        { key: 'speaker_config', name: 'Speaker Configuration', type: 'text', required: false, placeholder: '360-degree sound' },
        { key: 'display_size', name: 'Display Size', type: 'text', required: false, placeholder: '7-inch touchscreen' },
        { key: 'audio_quality', name: 'Audio Quality', type: 'text', required: false, placeholder: 'Hi-Fi stereo sound' }
      ]
    }
  },

  // Fitness & Health Configuration
  'fitness-health': {
    slug: 'fitness-health',
    colorOptions: [
      { id: 'black', name: 'Black', class: 'black-dot' },
      { id: 'white', name: 'White', class: 'white-dot' },
      { id: 'pink', name: 'Pink', class: 'pink-dot' },
      { id: 'blue', name: 'Blue', class: 'blue-dot' },
      { id: 'green', name: 'Green', class: 'green-dot' },
      { id: 'red', name: 'Red', class: 'red-dot' }
    ],
    secondaryOptions: {
      name: 'Size',
      key: 'size',
      options: [
        { id: 'small', name: 'Small', basePriceModifier: -30 },
        { id: 'medium', name: 'Medium', basePriceModifier: 0 },
        { id: 'large', name: 'Large', basePriceModifier: 0 },
        { id: 'xl', name: 'XL', basePriceModifier: 20 }
      ]
    },
    specificationCategories: {
      'Health Monitoring': [
        { key: 'heart_rate_tracking', name: 'Heart Rate Tracking', type: 'text', required: true, placeholder: '24/7 continuous monitoring' },
        { key: 'sleep_monitoring', name: 'Sleep Monitoring', type: 'text', required: false, placeholder: 'Sleep stages and quality' },
        { key: 'stress_tracking', name: 'Stress Tracking', type: 'text', required: false, placeholder: 'Stress level monitoring' },
        { key: 'blood_oxygen', name: 'Blood Oxygen', type: 'text', required: false, placeholder: 'SpO2 monitoring' }
      ],
      'Fitness Features': [
        { key: 'gps', name: 'GPS', type: 'text', required: false, placeholder: 'Built-in GPS for outdoor activities' },
        { key: 'water_resistance', name: 'Water Resistance', type: 'text', required: true, placeholder: '50 meters / 5 ATM' },
        { key: 'workout_modes', name: 'Workout Modes', type: 'text', required: false, placeholder: '100+ sport modes' },
        { key: 'battery_life', name: 'Battery Life', type: 'text', required: true, placeholder: '7 days typical use' }
      ]
    }
  }
};