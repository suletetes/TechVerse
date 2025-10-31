// Utility functions for handling product variants

/**
 * Calculate the total price including variant modifiers
 * @param {number} basePrice - The base product price
 * @param {Array} selectedVariants - Array of selected variant options
 * @returns {number} Total price with modifiers
 */
export const calculateVariantPrice = (basePrice, selectedVariants = []) => {
  let totalModifier = 0;
  
  selectedVariants.forEach(variant => {
    totalModifier += variant.priceModifier || 0;
  });
  
  return basePrice + totalModifier;
};

/**
 * Get the selected variant option from a variant array
 * @param {Array} variants - Product variants array
 * @param {string} variantName - Name of the variant (e.g., 'Color', 'Storage')
 * @param {string} selectedValue - Selected option value
 * @returns {Object|null} Selected variant option or null
 */
export const getSelectedVariantOption = (variants, variantName, selectedValue) => {
  const variant = variants.find(v => 
    v.name.toLowerCase() === variantName.toLowerCase()
  );
  
  if (!variant) return null;
  
  return variant.options.find(option => 
    option.value === selectedValue || 
    option._id === selectedValue ||
    option.id === selectedValue
  ) || null;
};

/**
 * Get all selected variant options for price calculation
 * @param {Array} variants - Product variants array
 * @param {Object} selections - Object with variant selections {Color: 'blue', Storage: '256GB'}
 * @returns {Array} Array of selected variant options with price modifiers
 */
export const getSelectedVariantOptions = (variants, selections) => {
  const selectedOptions = [];
  
  Object.entries(selections).forEach(([variantName, selectedValue]) => {
    const option = getSelectedVariantOption(variants, variantName, selectedValue);
    if (option) {
      selectedOptions.push({
        variantName,
        ...option
      });
    }
  });
  
  return selectedOptions;
};

/**
 * Check if a variant option is available (in stock)
 * @param {Object} option - Variant option object
 * @returns {boolean} True if available, false if out of stock
 */
export const isVariantOptionAvailable = (option) => {
  return option.stock === undefined || option.stock > 0;
};

/**
 * Get the display name for a variant option
 * @param {Object} option - Variant option object
 * @returns {string} Display name
 */
export const getVariantOptionDisplayName = (option) => {
  return option.name || option.value || option.toString();
};

/**
 * Get the CSS class for a color variant
 * @param {Object} option - Color variant option
 * @returns {string} CSS class name
 */
export const getColorVariantClass = (option) => {
  if (option.cssClass) {
    return option.cssClass;
  }
  
  const colorValue = (option.value || option.name || '').toLowerCase();
  const colorMap = {
    'silver': 'color-silver',
    'gold': 'color-gold',
    'black': 'color-black',
    'white': 'color-white',
    'blue': 'color-blue',
    'red': 'color-red',
    'green': 'color-green',
    'pink': 'color-pink',
    'purple': 'color-purple',
    'starlight': 'color-starlight',
    'midnight': 'color-midnight',
    'space-gray': 'color-space-gray',
    'space-black': 'color-space-black',
    'deep-purple': 'color-deep-purple',
    'phantom-black': 'color-phantom-black',
    'cream': 'color-cream',
    'lavender': 'color-lavender'
  };
  
  return colorMap[colorValue] || 'color-default';
};

/**
 * Validate variant selections
 * @param {Array} variants - Product variants array
 * @param {Object} selections - Selected variant values
 * @returns {Array} Array of validation errors
 */
export const validateVariantSelections = (variants, selections) => {
  const errors = [];
  
  variants.forEach(variant => {
    const selectedValue = selections[variant.name];
    
    if (!selectedValue) {
      errors.push(`Please select ${variant.name}`);
      return;
    }
    
    const option = getSelectedVariantOption(variants, variant.name, selectedValue);
    if (!option) {
      errors.push(`Invalid ${variant.name} selection`);
    } else if (!isVariantOptionAvailable(option)) {
      errors.push(`${variant.name} ${getVariantOptionDisplayName(option)} is out of stock`);
    }
  });
  
  return errors;
};

/**
 * Format price with currency symbol
 * @param {number} price - Price to format
 * @param {string} currency - Currency symbol (default: '£')
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = '£') => {
  return `${currency}${price.toLocaleString()}`;
};

/**
 * Format price modifier for display
 * @param {number} modifier - Price modifier amount
 * @param {string} currency - Currency symbol (default: '£')
 * @returns {string} Formatted modifier string (e.g., '+£100', '-£50')
 */
export const formatPriceModifier = (modifier, currency = '£') => {
  if (modifier === 0) return '';
  const sign = modifier > 0 ? '+' : '';
  return `${sign}${currency}${modifier.toLocaleString()}`;
};

export default {
  calculateVariantPrice,
  getSelectedVariantOption,
  getSelectedVariantOptions,
  isVariantOptionAvailable,
  getVariantOptionDisplayName,
  getColorVariantClass,
  validateVariantSelections,
  formatPrice,
  formatPriceModifier
};