// Dynamic Product Variants System
// This utility provides category-specific variant configurations and validation

export const VARIANT_TYPES = {
  COLOR: 'Color',
  STORAGE: 'Storage',
  SIZE: 'Size',
  MATERIAL: 'Material',
  CONFIGURATION: 'Configuration',
  CONNECTIVITY: 'Connectivity',
  CAPACITY: 'Capacity',
  BAND_TYPE: 'Band Type',
  CASE_SIZE: 'Case Size',
  SCREEN_SIZE: 'Screen Size'
};

// Color definitions with CSS classes and hex codes
export const COLOR_DEFINITIONS = {
  // Apple Colors
  'midnight': { 
    name: 'Midnight', 
    hex: '#1d1d1f', 
    cssClass: 'bg-gray-900',
    textColor: 'text-white'
  },
  'starlight': { 
    name: 'Starlight', 
    hex: '#faf0e6', 
    cssClass: 'bg-yellow-50',
    textColor: 'text-gray-900'
  },
  'space-gray': { 
    name: 'Space Gray', 
    hex: '#5e5e5e', 
    cssClass: 'bg-gray-600',
    textColor: 'text-white'
  },
  'space-grey': { 
    name: 'Space Grey', 
    hex: '#5e5e5e', 
    cssClass: 'bg-gray-600',
    textColor: 'text-white'
  },
  'space-black': { 
    name: 'Space Black', 
    hex: '#2c2c2e', 
    cssClass: 'bg-gray-800',
    textColor: 'text-white'
  },
  'silver': { 
    name: 'Silver', 
    hex: '#c0c0c0', 
    cssClass: 'bg-gray-300',
    textColor: 'text-gray-900'
  },
  'gold': { 
    name: 'Gold', 
    hex: '#ffd700', 
    cssClass: 'bg-yellow-400',
    textColor: 'text-gray-900'
  },
  'rose-gold': { 
    name: 'Rose Gold', 
    hex: '#e8b4b8', 
    cssClass: 'bg-pink-300',
    textColor: 'text-gray-900'
  },
  'blue': { 
    name: 'Blue', 
    hex: '#007aff', 
    cssClass: 'bg-blue-500',
    textColor: 'text-white'
  },
  'purple': { 
    name: 'Purple', 
    hex: '#af52de', 
    cssClass: 'bg-purple-500',
    textColor: 'text-white'
  },
  'pink': { 
    name: 'Pink', 
    hex: '#ff2d92', 
    cssClass: 'bg-pink-500',
    textColor: 'text-white'
  },
  'yellow': { 
    name: 'Yellow', 
    hex: '#ffcc00', 
    cssClass: 'bg-yellow-400',
    textColor: 'text-gray-900'
  },
  'green': { 
    name: 'Green', 
    hex: '#30d158', 
    cssClass: 'bg-green-500',
    textColor: 'text-white'
  },
  'red': { 
    name: 'Red', 
    hex: '#ff3b30', 
    cssClass: 'bg-red-500',
    textColor: 'text-white'
  },
  'black': { 
    name: 'Black', 
    hex: '#000000', 
    cssClass: 'bg-black',
    textColor: 'text-white'
  },
  'white': { 
    name: 'White', 
    hex: '#ffffff', 
    cssClass: 'bg-white border border-gray-300',
    textColor: 'text-gray-900'
  },

  // Samsung Colors
  'titanium-black': { 
    name: 'Titanium Black', 
    hex: '#2c2c2e', 
    cssClass: 'bg-gray-800',
    textColor: 'text-white'
  },
  'titanium-gray': { 
    name: 'Titanium Gray', 
    hex: '#8e8e93', 
    cssClass: 'bg-gray-500',
    textColor: 'text-white'
  },
  'titanium-violet': { 
    name: 'Titanium Violet', 
    hex: '#8b5cf6', 
    cssClass: 'bg-violet-500',
    textColor: 'text-white'
  },
  'titanium-yellow': { 
    name: 'Titanium Yellow', 
    hex: '#fbbf24', 
    cssClass: 'bg-amber-400',
    textColor: 'text-gray-900'
  },
  'phantom-black': { 
    name: 'Phantom Black', 
    hex: '#1a1a1a', 
    cssClass: 'bg-gray-900',
    textColor: 'text-white'
  },
  'cream': { 
    name: 'Cream', 
    hex: '#f5f5dc', 
    cssClass: 'bg-yellow-100',
    textColor: 'text-gray-900'
  },
  'lavender': { 
    name: 'Lavender', 
    hex: '#e6e6fa', 
    cssClass: 'bg-purple-200',
    textColor: 'text-gray-900'
  },
  'graphite': { 
    name: 'Graphite', 
    hex: '#41424c', 
    cssClass: 'bg-gray-700',
    textColor: 'text-white'
  },
  'beige': { 
    name: 'Beige', 
    hex: '#f5f5dc', 
    cssClass: 'bg-yellow-100',
    textColor: 'text-gray-900'
  },

  // Google Colors
  'obsidian': { 
    name: 'Obsidian', 
    hex: '#0f172a', 
    cssClass: 'bg-slate-900',
    textColor: 'text-white'
  },
  'porcelain': { 
    name: 'Porcelain', 
    hex: '#f8fafc', 
    cssClass: 'bg-slate-50 border border-gray-300',
    textColor: 'text-gray-900'
  },
  'bay': { 
    name: 'Bay', 
    hex: '#0ea5e9', 
    cssClass: 'bg-sky-500',
    textColor: 'text-white'
  },

  // OnePlus Colors
  'silky-black': { 
    name: 'Silky Black', 
    hex: '#1c1c1e', 
    cssClass: 'bg-gray-900',
    textColor: 'text-white'
  },
  'flowy-emerald': { 
    name: 'Flowy Emerald', 
    hex: '#10b981', 
    cssClass: 'bg-emerald-500',
    textColor: 'text-white'
  },
  'pale-blue': { 
    name: 'Pale Blue', 
    hex: '#bfdbfe', 
    cssClass: 'bg-blue-200',
    textColor: 'text-gray-900'
  }
};

// Category-specific variant configurations
export const CATEGORY_VARIANTS = {
  phones: {
    required: [VARIANT_TYPES.COLOR, VARIANT_TYPES.STORAGE],
    optional: [VARIANT_TYPES.CONNECTIVITY],
    colorOptions: ['midnight', 'starlight', 'space-black', 'silver', 'gold', 'blue', 'purple', 'pink', 'yellow', 'green', 'red', 'titanium-black', 'titanium-gray', 'phantom-black', 'obsidian', 'porcelain'],
    storageOptions: ['64GB', '128GB', 'GB', '512GB', '1TB'],
    connectivityOptions: ['5G', '4G LTE', 'Wi-Fi Only']
  },
  
  tablets: {
    required: [VARIANT_TYPES.COLOR, VARIANT_TYPES.STORAGE],
    optional: [VARIANT_TYPES.CONNECTIVITY, VARIANT_TYPES.SCREEN_SIZE],
    colorOptions: ['space-gray', 'silver', 'starlight', 'pink', 'purple', 'blue', 'graphite', 'beige'],
    storageOptions: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
    connectivityOptions: ['Wi-Fi', 'Wi-Fi + Cellular'],
    screenSizeOptions: ['10.9"', '11"', '12.9"', '13"', '14.6"']
  },
  
  computers: {
    required: [VARIANT_TYPES.COLOR, VARIANT_TYPES.CONFIGURATION],
    optional: [VARIANT_TYPES.SCREEN_SIZE],
    colorOptions: ['space-gray', 'silver', 'midnight', 'starlight', 'platinum-silver', 'frost-white'],
    configurationOptions: [
      'M1 / 8GB / 256GB SSD',
      'M2 / 8GB / 256GB SSD', 
      'M2 / 16GB / 512GB SSD',
      'M3 Pro / 18GB / 512GB SSD',
      'M3 Pro / 36GB / 1TB SSD',
      'i5 / 8GB / 256GB SSD',
      'i7 / 16GB / 512GB SSD'
    ],
    screenSizeOptions: ['13.3"', '13.6"', '14.2"', '15.3"', '16.2"']
  },
  
  tvs: {
    required: [VARIANT_TYPES.SCREEN_SIZE],
    optional: [VARIANT_TYPES.COLOR],
    colorOptions: ['black', 'silver', 'white'],
    screenSizeOptions: ['43"', '50"', '55"', '65"', '75"', '85"']
  },
  
  gaming: {
    required: [VARIANT_TYPES.COLOR],
    optional: [VARIANT_TYPES.STORAGE],
    colorOptions: ['white', 'black', 'matte-black', 'neon-blue-red'],
    storageOptions: ['512GB SSD', '825GB SSD', '1TB SSD', '2TB SSD', '64GB']
  },
  
  watches: {
    required: [VARIANT_TYPES.COLOR, VARIANT_TYPES.CASE_SIZE],
    optional: [VARIANT_TYPES.MATERIAL, VARIANT_TYPES.BAND_TYPE],
    colorOptions: ['midnight', 'starlight', 'silver', 'gold', 'space-black', 'pink', 'blue', 'red'],
    caseSizeOptions: ['38mm', '40mm', '41mm', '42mm', '44mm', '45mm', '46mm', '49mm'],
    materialOptions: ['aluminum', 'stainless-steel', 'titanium', 'ceramic'],
    bandTypeOptions: ['sport-band', 'sport-loop', 'leather-loop', 'milanese-loop', 'link-bracelet']
  },
  
  audio: {
    required: [VARIANT_TYPES.COLOR],
    optional: [VARIANT_TYPES.CONNECTIVITY],
    colorOptions: ['white', 'black', 'silver', 'space-gray', 'midnight', 'starlight', 'pink', 'blue', 'purple'],
    connectivityOptions: ['Wireless', 'Wired', 'Wireless + Wired']
  },
  
  cameras: {
    required: [VARIANT_TYPES.COLOR],
    optional: [VARIANT_TYPES.CONFIGURATION],
    colorOptions: ['black', 'silver', 'white'],
    configurationOptions: ['body-only', 'with-24-70mm-lens', 'with-24-105mm-lens', 'with-28-70mm-lens']
  },
  
  accessories: {
    required: [VARIANT_TYPES.COLOR],
    optional: [VARIANT_TYPES.SIZE, VARIANT_TYPES.MATERIAL],
    colorOptions: ['black', 'white', 'silver', 'space-gray', 'clear', 'blue', 'red', 'pink', 'purple'],
    sizeOptions: ['Small', 'Medium', 'Large', 'XL'],
    materialOptions: ['silicone', 'leather', 'fabric', 'metal', 'plastic', 'glass']
  },
  
  'home-smart-devices': {
    required: [VARIANT_TYPES.COLOR],
    optional: [VARIANT_TYPES.SIZE],
    colorOptions: ['white', 'black', 'charcoal', 'glacier-white', 'deep-sea-blue', 'midnight', 'silver'],
    sizeOptions: ['Mini', 'Standard', 'Plus', 'Max']
  },
  
  'fitness-health': {
    required: [VARIANT_TYPES.COLOR, VARIANT_TYPES.SIZE],
    optional: [VARIANT_TYPES.BAND_TYPE],
    colorOptions: ['black', 'white', 'lunar-white', 'steel-blue', 'pink', 'light-pink', 'tidal-blue'],
    sizeOptions: ['Small', 'Large', '40mm', '44mm', '41mm', '45mm', '46mm'],
    bandTypeOptions: ['sport-band', 'leather-band', 'nylon-band', 'metal-band']
  }
};

// Utility functions for variant management
export class VariantSystem {
  
  /**
   * Get color information including CSS classes
   */
  static getColorInfo(colorValue) {
    const normalizedColor = colorValue.toLowerCase().replace(/\s+/g, '-');
    return COLOR_DEFINITIONS[normalizedColor] || {
      name: colorValue,
      hex: '#6b7280',
      cssClass: 'bg-gray-500',
      textColor: 'text-white'
    };
  }

  /**
   * Get category-specific variant configuration
   */
  static getCategoryVariants(categorySlug) {
    return CATEGORY_VARIANTS[categorySlug] || {
      required: [VARIANT_TYPES.COLOR],
      optional: [],
      colorOptions: ['black', 'white', 'silver']
    };
  }

  /**
   * Validate product variants against category requirements
   */
  static validateProductVariants(product, categorySlug) {
    const categoryConfig = this.getCategoryVariants(categorySlug);
    const productVariants = product.variants || [];
    const errors = [];

    // Check required variants
    categoryConfig.required.forEach(requiredType => {
      const hasVariant = productVariants.some(v => v.name === requiredType);
      if (!hasVariant) {
        errors.push(`Missing required variant: ${requiredType}`);
      }
    });

    // Validate color options
    const colorVariant = productVariants.find(v => v.name === VARIANT_TYPES.COLOR);
    if (colorVariant) {
      colorVariant.options.forEach(option => {
        const colorInfo = this.getColorInfo(option.value);
        if (!colorInfo.cssClass) {
          errors.push(`Unknown color: ${option.value}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate total price including variant modifiers
   */
  static calculateVariantPrice(basePrice, selectedVariants, productVariants) {
    let totalModifier = 0;

    selectedVariants.forEach(selected => {
      const variant = productVariants.find(v => v.name === selected.name);
      if (variant) {
        const option = variant.options.find(o => o.value === selected.value);
        if (option && option.priceModifier) {
          totalModifier += option.priceModifier;
        }
      }
    });

    return basePrice + totalModifier;
  }

  /**
   * Check variant stock availability
   */
  static checkVariantStock(selectedVariants, productVariants, baseStock) {
    if (selectedVariants.length === 0) {
      return baseStock;
    }

    let availableStock = baseStock;

    selectedVariants.forEach(selected => {
      const variant = productVariants.find(v => v.name === selected.name);
      if (variant) {
        const option = variant.options.find(o => o.value === selected.value);
        if (option && typeof option.stock === 'number') {
          availableStock = Math.min(availableStock, option.stock);
        }
      }
    });

    return availableStock;
  }

  /**
   * Generate variant combinations for inventory management
   */
  static generateVariantCombinations(productVariants) {
    if (!productVariants || productVariants.length === 0) {
      return [{}];
    }

    const combinations = [];
    
    function generateCombos(variantIndex, currentCombo) {
      if (variantIndex >= productVariants.length) {
        combinations.push({ ...currentCombo });
        return;
      }

      const variant = productVariants[variantIndex];
      variant.options.forEach(option => {
        currentCombo[variant.name] = option.value;
        generateCombos(variantIndex + 1, currentCombo);
      });
    }

    generateCombos(0, {});
    return combinations;
  }

  /**
   * Format variant selection for display
   */
  static formatVariantSelection(selectedVariants) {
    if (!selectedVariants || selectedVariants.length === 0) {
      return 'Default';
    }

    return selectedVariants
      .map(variant => {
        const colorInfo = this.getColorInfo(variant.value);
        return colorInfo.name || variant.value;
      })
      .join(' • ');
  }

  /**
   * Get variant display name with proper formatting
   */
  static getVariantDisplayName(variantName, variantValue) {
    if (variantName === VARIANT_TYPES.COLOR) {
      const colorInfo = this.getColorInfo(variantValue);
      return colorInfo.name;
    }
    
    return variantValue;
  }

  /**
   * Generate SKU suffix based on variant selection
   */
  static generateVariantSKU(selectedVariants) {
    if (!selectedVariants || selectedVariants.length === 0) {
      return '';
    }

    return selectedVariants
      .map(variant => {
        const value = variant.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return value.substring(0, 3);
      })
      .join('-');
  }

  /**
   * Check if two variant selections are equal
   */
  static areVariantsEqual(variants1, variants2) {
    if (!variants1 && !variants2) return true;
    if (!variants1 || !variants2) return false;
    if (variants1.length !== variants2.length) return false;

    return variants1.every(v1 => 
      variants2.some(v2 => v1.name === v2.name && v1.value === v2.value)
    );
  }
}

export default VariantSystem;