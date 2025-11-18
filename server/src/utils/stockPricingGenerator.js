// Stock and Pricing Strategy Generator
// Generates realistic stock levels and pricing with proper discount calculations

/**
 * Stock level distribution strategy:
 * - 30% in-stock (50+ units)
 * - 50% low-stock (5-15 units) 
 * - 20% out-of-stock (0 units)
 */

export const stockDistribution = {
  IN_STOCK: 0.30,      // 30% of products
  LOW_STOCK: 0.50,     // 50% of products
  OUT_OF_STOCK: 0.20   // 20% of products
};

export const stockRanges = {
  IN_STOCK: { min: 50, max: 150 },
  LOW_STOCK: { min: 5, max: 15 },
  OUT_OF_STOCK: { min: 0, max: 0 }
};

/**
 * Generate realistic stock levels based on distribution strategy
 * @param {number} productIndex - Index of product in array (for consistent distribution)
 * @param {number} totalProducts - Total number of products
 * @returns {Object} Stock configuration
 */
export const generateStockLevel = (productIndex, totalProducts) => {
  // Determine stock category based on index to ensure proper distribution
  const stockCategory = getStockCategory(productIndex, totalProducts);
  const range = stockRanges[stockCategory];
  
  const quantity = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  
  // Set low stock threshold based on quantity
  let lowStockThreshold;
  if (quantity === 0) {
    lowStockThreshold = 0;
  } else if (quantity <= 15) {
    lowStockThreshold = Math.max(1, Math.floor(quantity * 0.3));
  } else {
    lowStockThreshold = Math.floor(Math.random() * 10) + 5; // 5-15 for high stock items
  }

  return {
    quantity,
    lowStockThreshold,
    trackQuantity: true,
    status: getStockStatus(quantity, lowStockThreshold),
    lastUpdated: new Date(),
    reserved: 0 // For cart reservations
  };
};

/**
 * Determine stock category based on product index
 * @param {number} index - Product index
 * @param {number} total - Total products
 * @returns {string} Stock category
 */
const getStockCategory = (index, total) => {
  const position = index / total;
  
  if (position < stockDistribution.OUT_OF_STOCK) {
    return 'OUT_OF_STOCK';
  } else if (position < stockDistribution.OUT_OF_STOCK + stockDistribution.LOW_STOCK) {
    return 'LOW_STOCK';
  } else {
    return 'IN_STOCK';
  }
};

/**
 * Get stock status based on quantity and threshold
 * @param {number} quantity - Current quantity
 * @param {number} threshold - Low stock threshold
 * @returns {string} Stock status
 */
export const getStockStatus = (quantity, threshold) => {
  if (quantity === 0) return 'out-of-stock';
  if (quantity <= threshold) return 'low-stock';
  return 'in-stock';
};

/**
 * Generate realistic pricing with discounts
 * @param {number} basePrice - Base price of the product
 * @param {Object} options - Pricing options
 * @returns {Object} Pricing configuration
 */
export const generatePricing = (basePrice, options = {}) => {
  const {
    category = 'general',
    brand = 'generic',
    hasDiscount = Math.random() > 0.4, // 60% chance of discount
    seasonalMultiplier = 1.0
  } = options;

  // Apply category-based pricing adjustments
  const categoryMultiplier = getCategoryPriceMultiplier(category);
  const brandMultiplier = getBrandPriceMultiplier(brand);
  
  // Calculate adjusted base price
  const adjustedBasePrice = Math.round(basePrice * categoryMultiplier * brandMultiplier * seasonalMultiplier);
  
  let pricing = {
    price: adjustedBasePrice,
    originalPrice: adjustedBasePrice,
    compareAtPrice: null,
    discountPercentage: 0,
    discountAmount: 0,
    hasDiscount: false,
    priceHistory: [
      {
        price: adjustedBasePrice,
        date: new Date(),
        reason: 'initial_price'
      }
    ]
  };

  // Apply discount if applicable
  if (hasDiscount) {
    const discount = generateDiscount(category, brand);
    const discountAmount = Math.round(adjustedBasePrice * discount.percentage);
    const salePrice = adjustedBasePrice - discountAmount;

    pricing = {
      ...pricing,
      price: salePrice,
      originalPrice: adjustedBasePrice,
      compareAtPrice: adjustedBasePrice,
      discountPercentage: Math.round(discount.percentage * 100),
      discountAmount,
      hasDiscount: true,
      discountReason: discount.reason,
      discountValidUntil: discount.validUntil
    };
  }

  return pricing;
};

/**
 * Get category-based price multiplier
 * @param {string} category - Product category
 * @returns {number} Price multiplier
 */
const getCategoryPriceMultiplier = (category) => {
  const multipliers = {
    phones: 1.0,
    tablets: 0.9,
    computers: 1.2,
    tvs: 0.8,
    gaming: 1.1,
    watches: 0.7,
    audio: 0.6,
    cameras: 1.3,
    accessories: 0.3,
    'home-smart-devices': 0.5,
    'fitness-health': 0.4
  };

  return multipliers[category] || 1.0;
};

/**
 * Get brand-based price multiplier
 * @param {string} brand - Product brand
 * @returns {number} Price multiplier
 */
const getBrandPriceMultiplier = (brand) => {
  const multipliers = {
    'Apple': 1.3,
    'Samsung': 1.1,
    'Google': 1.0,
    'Sony': 1.2,
    'Microsoft': 1.1,
    'Dell': 0.9,
    'HP': 0.8,
    'Lenovo': 0.8,
    'ASUS': 0.9,
    'Acer': 0.7,
    'LG': 0.9,
    'Xiaomi': 0.6,
    'OnePlus': 0.8,
    'Nothing': 0.7,
    'Garmin': 1.0,
    'Fitbit': 0.7,
    'Bose': 1.2,
    'Sennheiser': 1.1,
    'Audio-Technica': 0.9,
    'Canon': 1.2,
    'Nikon': 1.1,
    'Fujifilm': 1.0
  };

  return multipliers[brand] || 1.0;
};

/**
 * Generate discount information
 * @param {string} category - Product category
 * @param {string} brand - Product brand
 * @returns {Object} Discount information
 */
const generateDiscount = (category, brand) => {
  // Different discount ranges by category
  const categoryDiscounts = {
    phones: { min: 0.05, max: 0.25 },
    tablets: { min: 0.10, max: 0.30 },
    computers: { min: 0.08, max: 0.20 },
    tvs: { min: 0.15, max: 0.35 },
    gaming: { min: 0.05, max: 0.15 },
    watches: { min: 0.10, max: 0.25 },
    audio: { min: 0.15, max: 0.40 },
    cameras: { min: 0.10, max: 0.25 },
    accessories: { min: 0.20, max: 0.50 },
    'home-smart-devices': { min: 0.15, max: 0.35 },
    'fitness-health': { min: 0.20, max: 0.40 }
  };

  const discountRange = categoryDiscounts[category] || { min: 0.10, max: 0.30 };
  const percentage = Math.random() * (discountRange.max - discountRange.min) + discountRange.min;

  // Generate discount reason
  const reasons = [
    'seasonal_sale',
    'clearance',
    'new_model_release',
    'bulk_discount',
    'flash_sale',
    'holiday_special',
    'back_to_school',
    'black_friday',
    'cyber_monday',
    'end_of_year'
  ];

  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  
  // Generate valid until date (1-30 days from now)
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + Math.floor(Math.random() * 30) + 1);

  return {
    percentage,
    reason,
    validUntil
  };
};

/**
 * Generate variant pricing modifiers
 * @param {string} variantType - Type of variant (color, storage, etc.)
 * @param {string} variantValue - Specific variant value
 * @param {number} basePrice - Base product price
 * @returns {number} Price modifier
 */
export const generateVariantPriceModifier = (variantType, variantValue, basePrice) => {
  const modifiers = {
    storage: {
      '64GB': 0,
      '128GB': 0,
      '256GB': Math.round(basePrice * 0.1), // 10% increase
      '512GB': Math.round(basePrice * 0.2), // 20% increase
      '1TB': Math.round(basePrice * 0.4),   // 40% increase
      '2TB': Math.round(basePrice * 0.6)    // 60% increase
    },
    memory: {
      '8GB': 0,
      '16GB': Math.round(basePrice * 0.15),
      '32GB': Math.round(basePrice * 0.35),
      '64GB': Math.round(basePrice * 0.60)
    },
    material: {
      'aluminum': 0,
      'stainless-steel': Math.round(basePrice * 0.25),
      'titanium': Math.round(basePrice * 0.40),
      'ceramic': Math.round(basePrice * 0.30)
    },
    size: {
      'small': -Math.round(basePrice * 0.05),
      'medium': 0,
      'large': Math.round(basePrice * 0.08),
      'xl': Math.round(basePrice * 0.15)
    },
    color: {
      // Most colors have no modifier
      'black': 0,
      'white': 0,
      'silver': 0,
      'gray': 0,
      'blue': 0,
      'red': 0,
      'green': 0,
      'purple': 0,
      'pink': 0,
      'yellow': 0,
      // Premium colors might have small modifiers
      'gold': Math.round(basePrice * 0.05),
      'rose-gold': Math.round(basePrice * 0.05),
      'space-black': Math.round(basePrice * 0.03),
      'midnight': 0,
      'starlight': 0
    }
  };

  const typeModifiers = modifiers[variantType.toLowerCase()];
  if (!typeModifiers) return 0;

  return typeModifiers[variantValue.toLowerCase()] || 0;
};

/**
 * Update stock levels for variants
 * @param {Array} variants - Product variants
 * @param {Object} stockConfig - Stock configuration
 * @returns {Array} Updated variants with stock
 */
export const distributeVariantStock = (variants, stockConfig) => {
  if (!variants || variants.length === 0) return variants;

  return variants.map(variant => {
    const updatedOptions = variant.options.map((option, index) => {
      // Distribute stock among variant options
      const totalOptions = variant.options.length;
      const baseStock = Math.floor(stockConfig.quantity / totalOptions);
      const remainder = stockConfig.quantity % totalOptions;
      
      // Give remainder to first few options
      const optionStock = baseStock + (index < remainder ? 1 : 0);
      
      // Add some randomness while maintaining total
      const variance = Math.floor(Math.random() * 6) - 3; // -3 to +3
      const finalStock = Math.max(0, optionStock + variance);

      return {
        ...option,
        stock: finalStock
      };
    });

    return {
      ...variant,
      options: updatedOptions
    };
  });
};

/**
 * Calculate total available stock including variants
 * @param {Object} product - Product with variants
 * @returns {number} Total available stock
 */
export const calculateTotalStock = (product) => {
  if (!product.variants || product.variants.length === 0) {
    return product.stock?.quantity || 0;
  }

  let totalStock = 0;
  product.variants.forEach(variant => {
    variant.options.forEach(option => {
      totalStock += option.stock || 0;
    });
  });

  return totalStock;
};

/**
 * Validate stock consistency
 * @param {Object} product - Product to validate
 * @returns {Object} Validation result
 */
export const validateStockConsistency = (product) => {
  const errors = [];
  const warnings = [];

  // Check if main stock matches variant stock
  if (product.variants && product.variants.length > 0) {
    const totalVariantStock = calculateTotalStock(product);
    const mainStock = product.stock?.quantity || 0;

    if (Math.abs(totalVariantStock - mainStock) > 5) {
      warnings.push(`Stock mismatch: Main stock (${mainStock}) vs Variant total (${totalVariantStock})`);
    }
  }

  // Check for negative stock
  if (product.stock?.quantity < 0) {
    errors.push('Main stock quantity cannot be negative');
  }

  // Check variant stock
  if (product.variants) {
    product.variants.forEach((variant, vIndex) => {
      variant.options.forEach((option, oIndex) => {
        if (option.stock < 0) {
          errors.push(`Variant ${vIndex + 1}, Option ${oIndex + 1} has negative stock`);
        }
      });
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export default {
  generateStockLevel,
  generatePricing,
  generateVariantPriceModifier,
  distributeVariantStock,
  calculateTotalStock,
  validateStockConsistency,
  getStockStatus
};