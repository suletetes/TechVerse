// Utility functions for handling product specifications

/**
 * Format specification value with unit
 * @param {Object} spec - Specification object
 * @returns {string} Formatted specification value
 */
export const formatSpecificationValue = (spec) => {
  if (!spec || !spec.value) return 'N/A';
  
  if (spec.unit && spec.value !== 'Yes' && spec.value !== 'No') {
    return `${spec.value}${spec.unit}`;
  }
  return spec.value;
};

/**
 * Group specifications by category
 * @param {Array} specifications - Array of specifications
 * @returns {Object} Grouped specifications
 */
export const groupSpecificationsByCategory = (specifications) => {
  const grouped = {};
  
  specifications.forEach(spec => {
    const category = spec.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(spec);
  });
  
  return grouped;
};

/**
 * Get specification highlights based on priority
 * @param {Array} specifications - Array of specifications
 * @param {number} count - Number of highlights to return
 * @returns {Array} Array of highlighted specifications
 */
export const getSpecificationHighlights = (specifications, count = 6) => {
  const prioritySpecs = [
    'Screen Size', 'Resolution', 'Processor', 'RAM', 'Storage', 
    'Battery Life', 'Main Camera', 'Display Technology', 'Water Resistance',
    'Battery Capacity', 'Refresh Rate', 'Brightness'
  ];
  
  const highlights = [];
  
  // First, add priority specifications
  prioritySpecs.forEach(specName => {
    const spec = specifications.find(s => s.name === specName);
    if (spec && highlights.length < count) {
      highlights.push(spec);
    }
  });
  
  // Fill remaining slots with other important specs
  if (highlights.length < count) {
    specifications.forEach(spec => {
      if (!prioritySpecs.includes(spec.name) && highlights.length < count) {
        highlights.push(spec);
      }
    });
  }
  
  return highlights;
};

/**
 * Compare specifications between two products
 * @param {Array} product1Specs - First product specifications
 * @param {Array} product2Specs - Second product specifications
 * @returns {Object} Comparison object
 */
export const compareSpecifications = (product1Specs, product2Specs) => {
  const comparison = {};
  
  // Create a map of all unique specification names
  const allSpecs = new Set([
    ...product1Specs.map(s => s.name),
    ...product2Specs.map(s => s.name)
  ]);

  allSpecs.forEach(specName => {
    const spec1 = product1Specs.find(s => s.name === specName);
    const spec2 = product2Specs.find(s => s.name === specName);
    
    comparison[specName] = {
      product1: spec1 ? formatSpecificationValue(spec1) : 'N/A',
      product2: spec2 ? formatSpecificationValue(spec2) : 'N/A',
      category: spec1?.category || spec2?.category || 'Other'
    };
  });
  
  return comparison;
};

/**
 * Filter products based on specification criteria
 * @param {Array} products - Array of products
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered products
 */
export const filterProductsBySpecifications = (products, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return products;
  }

  return products.filter(product => {
    if (!product.specifications) return false;

    return Object.entries(filters).every(([category, specs]) => {
      return Object.entries(specs).every(([specName, values]) => {
        const productSpec = product.specifications.find(
          s => s.category === category && s.name === specName
        );
        
        if (!productSpec) return false;
        
        return values.includes(productSpec.value);
      });
    });
  });
};

/**
 * Search products by specification text
 * @param {Array} products - Array of products
 * @param {string} searchTerm - Search term
 * @returns {Array} Matching products
 */
export const searchProductsBySpecifications = (products, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return products;
  }

  const term = searchTerm.toLowerCase().trim();

  return products.filter(product => {
    if (!product.specifications) return false;

    return product.specifications.some(spec => {
      return (
        spec.name.toLowerCase().includes(term) ||
        spec.value.toLowerCase().includes(term) ||
        spec.category.toLowerCase().includes(term)
      );
    });
  });
};

/**
 * Get unique specification values for a given specification name
 * @param {Array} products - Array of products
 * @param {string} specificationName - Name of the specification
 * @returns {Array} Unique values
 */
export const getUniqueSpecificationValues = (products, specificationName) => {
  const values = new Set();
  
  products.forEach(product => {
    if (product.specifications) {
      const spec = product.specifications.find(s => s.name === specificationName);
      if (spec) {
        values.add(spec.value);
      }
    }
  });
  
  return Array.from(values).sort();
};

/**
 * Calculate specification completeness score
 * @param {Array} specifications - Product specifications
 * @param {string} category - Product category
 * @returns {Object} Completeness information
 */
export const calculateSpecificationCompleteness = (specifications, category) => {
  const requiredSpecs = {
    phones: ['Screen Size', 'Resolution', 'Processor', 'RAM', 'Storage', 'Battery Capacity'],
    tablets: ['Screen Size', 'Resolution', 'Processor', 'RAM', 'Storage', 'Battery Life'],
    computers: ['Screen Size', 'Resolution', 'Processor', 'RAM', 'Storage Capacity'],
    tvs: ['Screen Size', 'Resolution', 'Display Technology', 'Refresh Rate'],
    gaming: ['Processor', 'GPU', 'RAM', 'Storage'],
    watches: ['Display Size', 'Battery Life', 'Water Resistance'],
    audio: ['Driver Size', 'Frequency Response', 'Wireless Technology'],
    cameras: ['Sensor Type', 'Resolution', 'ISO Range']
  };

  const required = requiredSpecs[category] || [];
  const specNames = specifications.map(s => s.name);
  const presentRequired = required.filter(spec => specNames.includes(spec));
  
  const completenessScore = required.length > 0 
    ? Math.round((presentRequired.length / required.length) * 100)
    : 100;

  return {
    score: completenessScore,
    total: specifications.length,
    required: required.length,
    presentRequired: presentRequired.length,
    missingRequired: required.filter(spec => !specNames.includes(spec))
  };
};

/**
 * Sort specifications by importance and category
 * @param {Array} specifications - Array of specifications
 * @returns {Array} Sorted specifications
 */
export const sortSpecificationsByImportance = (specifications) => {
  const categoryOrder = [
    'Display & Interface',
    'Performance',
    'Camera & Imaging',
    'Audio & Sound',
    'Connectivity',
    'Battery & Power',
    'Durability & Design',
    'Health & Fitness Features',
    'Smart Features',
    'Gaming Features'
  ];

  const importanceOrder = [
    'Screen Size', 'Resolution', 'Processor', 'RAM', 'Storage',
    'Battery Life', 'Main Camera', 'Display Technology', 'Water Resistance'
  ];

  return specifications.sort((a, b) => {
    // First sort by category
    const categoryA = categoryOrder.indexOf(a.category);
    const categoryB = categoryOrder.indexOf(b.category);
    
    if (categoryA !== categoryB) {
      return (categoryA === -1 ? 999 : categoryA) - (categoryB === -1 ? 999 : categoryB);
    }
    
    // Then sort by importance within category
    const importanceA = importanceOrder.indexOf(a.name);
    const importanceB = importanceOrder.indexOf(b.name);
    
    if (importanceA !== importanceB) {
      return (importanceA === -1 ? 999 : importanceA) - (importanceB === -1 ? 999 : importanceB);
    }
    
    // Finally sort alphabetically
    return a.name.localeCompare(b.name);
  });
};

export default {
  formatSpecificationValue,
  groupSpecificationsByCategory,
  getSpecificationHighlights,
  compareSpecifications,
  filterProductsBySpecifications,
  searchProductsBySpecifications,
  getUniqueSpecificationValues,
  calculateSpecificationCompleteness,
  sortSpecificationsByImportance
};