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
  
  // Try to match by name first, then slug
  return getCategoryConfig(categoryName) || getCategoryConfig(categorySlug);
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