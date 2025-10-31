// Dynamic variant generator for different product categories
export const variantGenerator = {
  // Color variants with proper CSS classes and naming
  colors: {
    phones: [
      { value: 'midnight', name: 'Midnight', cssClass: 'color-midnight', priceModifier: 0 },
      { value: 'starlight', name: 'Starlight', cssClass: 'color-starlight', priceModifier: 0 },
      { value: 'blue', name: 'Blue', cssClass: 'color-blue', priceModifier: 0 },
      { value: 'purple', name: 'Purple', cssClass: 'color-purple', priceModifier: 0 },
      { value: 'pink', name: 'Pink', cssClass: 'color-pink', priceModifier: 0 },
      { value: 'yellow', name: 'Yellow', cssClass: 'color-yellow', priceModifier: 0 },
      { value: 'green', name: 'Green', cssClass: 'color-green', priceModifier: 0 },
      { value: 'black', name: 'Black', cssClass: 'color-black', priceModifier: 0 },
      { value: 'white', name: 'White', cssClass: 'color-white', priceModifier: 0 },
      { value: 'red', name: 'Red', cssClass: 'color-red', priceModifier: 0 },
      { value: 'silver', name: 'Silver', cssClass: 'color-silver', priceModifier: 0 },
      { value: 'gold', name: 'Gold', cssClass: 'color-gold', priceModifier: 0 },
      { value: 'space-gray', name: 'Space Gray', cssClass: 'color-space-gray', priceModifier: 0 },
      { value: 'space-black', name: 'Space Black', cssClass: 'color-space-black', priceModifier: 0 },
      { value: 'deep-purple', name: 'Deep Purple', cssClass: 'color-deep-purple', priceModifier: 0 }
    ],
    tablets: [
      { value: 'silver', name: 'Silver', cssClass: 'color-silver', priceModifier: 0 },
      { value: 'space-gray', name: 'Space Gray', cssClass: 'color-space-gray', priceModifier: 0 },
      { value: 'starlight', name: 'Starlight', cssClass: 'color-starlight', priceModifier: 0 },
      { value: 'pink', name: 'Pink', cssClass: 'color-pink', priceModifier: 0 },
      { value: 'purple', name: 'Purple', cssClass: 'color-purple', priceModifier: 0 },
      { value: 'blue', name: 'Blue', cssClass: 'color-blue', priceModifier: 0 }
    ]
  },

  // Storage/Configuration variants with price modifiers
  storage: {
    phones: [
      { value: '128GB', name: '128GB', priceModifier: 0 },
      { value: '256GB', name: '256GB', priceModifier: 100 },
      { value: '512GB', name: '512GB', priceModifier: 300 },
      { value: '1TB', name: '1TB', priceModifier: 600 }
    ],
    tablets: [
      { value: '64GB', name: '64GB', priceModifier: 0 },
      { value: '128GB', name: '128GB', priceModifier: 100 },
      { value: '256GB', name: '256GB', priceModifier: 200 },
      { value: '512GB', name: '512GB', priceModifier: 400 },
      { value: '1TB', name: '1TB', priceModifier: 800 },
      { value: '2TB', name: '2TB', priceModifier: 1200 }
    ],
    computers: [
      { value: 'M3 / 8GB / 256GB SSD', name: 'M3 / 8GB / 256GB SSD', priceModifier: 0 },
      { value: 'M3 / 16GB / 512GB SSD', name: 'M3 / 16GB / 512GB SSD', priceModifier: 400 },
      { value: 'M3 Pro / 18GB / 512GB SSD', name: 'M3 Pro / 18GB / 512GB SSD', priceModifier: 500 },
      { value: 'M3 Pro / 36GB / 1TB SSD', name: 'M3 Pro / 36GB / 1TB SSD', priceModifier: 1000 },
      { value: 'M3 Max / 36GB / 1TB SSD', name: 'M3 Max / 36GB / 1TB SSD', priceModifier: 1500 }
    ],
    gaming: [
      { value: '512GB SSD', name: '512GB SSD', priceModifier: 0 },
      { value: '1TB SSD', name: '1TB SSD', priceModifier: 100 },
      { value: '2TB SSD', name: '2TB SSD', priceModifier: 300 }
    ]
  },

  // Size variants for applicable categories
  sizes: {
    watches: [
      { value: '41mm', name: '41mm', priceModifier: 0 },
      { value: '45mm', name: '45mm', priceModifier: 30 },
      { value: '46mm', name: '46mm', priceModifier: 50 }
    ],
    'fitness-health': [
      { value: 'Small', name: 'Small', priceModifier: 0 },
      { value: 'Medium', name: 'Medium', priceModifier: 0 },
      { value: 'Large', name: 'Large', priceModifier: 0 },
      { value: 'XL', name: 'XL', priceModifier: 0 }
    ],
    accessories: [
      { value: 'Small', name: 'Small', priceModifier: 0 },
      { value: 'Medium', name: 'Medium', priceModifier: 0 },
      { value: 'Large', name: 'Large', priceModifier: 0 }
    ]
  },

  // Material variants for watches and accessories
  materials: {
    watches: [
      { value: 'aluminum', name: 'Aluminum', priceModifier: 0 },
      { value: 'stainless-steel', name: 'Stainless Steel', priceModifier: 300 },
      { value: 'titanium', name: 'Titanium', priceModifier: 500 },
      { value: 'ceramic', name: 'Ceramic', priceModifier: 700 }
    ],
    accessories: [
      { value: 'silicone', name: 'Silicone', priceModifier: 0 },
      { value: 'leather', name: 'Leather', priceModifier: 50 },
      { value: 'fabric', name: 'Fabric', priceModifier: 25 },
      { value: 'metal', name: 'Metal', priceModifier: 100 },
      { value: 'plastic', name: 'Plastic', priceModifier: -10 }
    ]
  },

  // Screen size variants for TVs
  screenSizes: {
    tvs: [
      { value: '43"', name: '43"', priceModifier: -400 },
      { value: '50"', name: '50"', priceModifier: -200 },
      { value: '55"', name: '55"', priceModifier: -100 },
      { value: '65"', name: '65"', priceModifier: 0 },
      { value: '75"', name: '75"', priceModifier: 700 },
      { value: '85"', name: '85"', priceModifier: 1500 }
    ]
  },

  // Connectivity variants for tablets and computers
  connectivity: {
    tablets: [
      { value: 'Wi-Fi', name: 'Wi-Fi', priceModifier: 0 },
      { value: 'Wi-Fi + Cellular', name: 'Wi-Fi + Cellular', priceModifier: 150 }
    ]
  },

  // Lens kit variants for cameras
  lensKits: {
    cameras: [
      { value: 'body-only', name: 'Body Only', priceModifier: 0 },
      { value: 'with-kit-lens', name: 'With Kit Lens', priceModifier: 600 },
      { value: 'with-pro-lens', name: 'With Pro Lens', priceModifier: 1300 }
    ]
  }
};

// Generate variants for a product based on its category
export const generateVariantsForCategory = (categorySlug, baseStock = 100) => {
  const variants = [];
  
  // Add color variants
  if (variantGenerator.colors[categorySlug]) {
    const colorOptions = variantGenerator.colors[categorySlug].map(color => ({
      ...color,
      stock: Math.floor(baseStock / variantGenerator.colors[categorySlug].length)
    }));
    
    variants.push({
      name: 'Color',
      options: colorOptions
    });
  }

  // Add storage/configuration variants
  if (variantGenerator.storage[categorySlug]) {
    const storageOptions = variantGenerator.storage[categorySlug].map(storage => ({
      ...storage,
      stock: Math.floor(baseStock / variantGenerator.storage[categorySlug].length)
    }));
    
    variants.push({
      name: categorySlug === 'computers' ? 'Configuration' : 'Storage',
      options: storageOptions
    });
  }

  // Add size variants for applicable categories
  if (variantGenerator.sizes[categorySlug]) {
    const sizeOptions = variantGenerator.sizes[categorySlug].map(size => ({
      ...size,
      stock: Math.floor(baseStock / variantGenerator.sizes[categorySlug].length)
    }));
    
    variants.push({
      name: 'Size',
      options: sizeOptions
    });
  }

  // Add material variants for watches and accessories
  if (variantGenerator.materials[categorySlug]) {
    const materialOptions = variantGenerator.materials[categorySlug].map(material => ({
      ...material,
      stock: Math.floor(baseStock / variantGenerator.materials[categorySlug].length)
    }));
    
    variants.push({
      name: categorySlug === 'watches' ? 'Case Material' : 'Material Type',
      options: materialOptions
    });
  }

  // Add screen size variants for TVs
  if (variantGenerator.screenSizes[categorySlug]) {
    const screenOptions = variantGenerator.screenSizes[categorySlug].map(screen => ({
      ...screen,
      stock: Math.floor(baseStock / variantGenerator.screenSizes[categorySlug].length)
    }));
    
    variants.push({
      name: 'Screen Size',
      options: screenOptions
    });
  }

  // Add connectivity variants for tablets
  if (variantGenerator.connectivity[categorySlug]) {
    const connectivityOptions = variantGenerator.connectivity[categorySlug].map(conn => ({
      ...conn,
      stock: Math.floor(baseStock / variantGenerator.connectivity[categorySlug].length)
    }));
    
    variants.push({
      name: 'Connectivity',
      options: connectivityOptions
    });
  }

  // Add lens kit variants for cameras
  if (variantGenerator.lensKits[categorySlug]) {
    const lensOptions = variantGenerator.lensKits[categorySlug].map(lens => ({
      ...lens,
      stock: Math.floor(baseStock / variantGenerator.lensKits[categorySlug].length)
    }));
    
    variants.push({
      name: 'Kit Type',
      options: lensOptions
    });
  }

  return variants;
};

// Calculate total price with variant modifiers
export const calculateVariantPrice = (basePrice, selectedVariants) => {
  let totalModifier = 0;
  
  selectedVariants.forEach(variant => {
    totalModifier += variant.priceModifier || 0;
  });
  
  return basePrice + totalModifier;
};

// Validate variant selection
export const validateVariantSelection = (product, selectedVariants) => {
  const errors = [];
  
  // Check if all required variants are selected
  product.variants.forEach(variant => {
    const selected = selectedVariants.find(s => s.variantName === variant.name);
    if (!selected) {
      errors.push(`Please select ${variant.name}`);
    } else {
      // Check if selected option exists
      const option = variant.options.find(o => o.value === selected.value);
      if (!option) {
        errors.push(`Invalid ${variant.name} selection`);
      } else if (option.stock <= 0) {
        errors.push(`${variant.name} ${option.name} is out of stock`);
      }
    }
  });
  
  return errors;
};

export default variantGenerator;