import express from 'express';
import { generateSpecificationsForProduct, specificationTemplates, sampleSpecifications } from '../utils/specificationGenerator.js';
import { validateProductSpecifications, getSpecificationCompleteness } from '../utils/specificationValidator.js';
import { validateSpecifications, validateSingleSpecification } from '../middleware/specificationValidation.js';

const router = express.Router();

/**
 * GET /api/specifications/generate/:category
 * Generate specifications for a product category
 */
router.get('/generate/:category', (req, res) => {
  try {
    const { category } = req.params;
    const { productName = 'Sample Product', productBrand = 'Sample Brand' } = req.query;

    const specifications = generateSpecificationsForProduct(category, productName, { brand: productBrand });
    
    if (specifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No specification template found for category: ${category}`
      });
    }

    // Simple categorization - group by category
    const categorized = specifications || {};
    // Simple highlights - just return first few specs
    const highlights = Object.keys(categorized).slice(0, 3);

    res.json({
      success: true,
      data: {
        specifications,
        categorized,
        highlights,
        category,
        productName,
        productBrand
      }
    });
  } catch (error) {
    console.error('Error generating specifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate specifications',
      error: error.message
    });
  }
});

/**
 * POST /api/specifications/validate
 * Validate product specifications
 */
router.post('/validate', validateSpecifications, (req, res) => {
  try {
    const { specifications, category } = req.body;

    if (!specifications || !Array.isArray(specifications)) {
      return res.status(400).json({
        success: false,
        message: 'Specifications array is required'
      });
    }

    const validation = validateProductSpecifications(specifications, category);
    const completeness = getSpecificationCompleteness(specifications, category);

    res.json({
      success: true,
      data: {
        validation,
        completeness,
        specifications: specifications.length,
        category
      }
    });
  } catch (error) {
    console.error('Error validating specifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate specifications',
      error: error.message
    });
  }
});

/**
 * POST /api/specifications/compare
 * Compare specifications between products
 */
router.post('/compare', (req, res) => {
  try {
    const { product1Specs, product2Specs } = req.body;

    if (!product1Specs || !product2Specs) {
      return res.status(400).json({
        success: false,
        message: 'Both product specifications are required for comparison'
      });
    }

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
        product1: spec1 ? (spec1.unit ? `${spec1.value}${spec1.unit}` : spec1.value) : 'N/A',
        product2: spec2 ? (spec2.unit ? `${spec2.value}${spec2.unit}` : spec2.value) : 'N/A',
        category: spec1?.category || spec2?.category || 'Other',
        different: spec1?.value !== spec2?.value
      };
    });

    const categorized = {};
    Object.entries(comparison).forEach(([specName, spec]) => {
      if (!categorized[spec.category]) {
        categorized[spec.category] = {};
      }
      categorized[spec.category][specName] = spec;
    });

    res.json({
      success: true,
      data: {
        comparison,
        categorized,
        totalSpecs: Object.keys(comparison).length,
        differentSpecs: Object.values(comparison).filter(spec => spec.different).length
      }
    });
  } catch (error) {
    console.error('Error comparing specifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare specifications',
      error: error.message
    });
  }
});

/**
 * GET /api/specifications/categories
 * Get available specification categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = [
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

    res.json({
      success: true,
      data: {
        categories,
        total: categories.length
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch specification categories',
      error: error.message
    });
  }
});

/**
 * GET /api/specifications/highlights/:productId
 * Get specification highlights for a product
 */
router.get('/highlights/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { count = 6 } = req.query;

    // In a real application, you would fetch the product from database
    // For now, we'll return a sample response
    const sampleHighlights = [
      { name: 'Screen Size', value: '6.8', unit: 'inches', category: 'Display & Interface' },
      { name: 'Processor', value: 'Snapdragon 8 Gen 3', unit: '', category: 'Performance' },
      { name: 'RAM', value: '12', unit: 'GB', category: 'Performance' },
      { name: 'Main Camera', value: '200MP f/1.7', unit: '', category: 'Camera & Imaging' },
      { name: 'Battery Capacity', value: '5000', unit: 'mAh', category: 'Battery & Power' },
      { name: 'Water Resistance', value: 'IP68', unit: '', category: 'Durability & Design' }
    ].slice(0, parseInt(count));

    res.json({
      success: true,
      data: {
        highlights: sampleHighlights,
        productId,
        count: sampleHighlights.length
      }
    });
  } catch (error) {
    console.error('Error fetching specification highlights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch specification highlights',
      error: error.message
    });
  }
});

/**
 * POST /api/specifications/search
 * Search products by specifications
 */
router.post('/search', (req, res) => {
  try {
    const { 
      filters = {}, 
      category = null, 
      searchTerm = '', 
      sortBy = 'relevance' 
    } = req.body;

    // In a real application, you would search the database
    // For now, return a sample response
    const sampleResults = {
      products: [],
      totalResults: 0,
      appliedFilters: filters,
      searchTerm,
      category,
      sortBy,
      facets: {
        'Display & Interface': {
          'Screen Size': ['6.1"', '6.7"', '6.8"'],
          'Resolution': ['2556 × 1179', '3120 × 1440']
        },
        'Performance': {
          'Processor': ['A17 Pro', 'Snapdragon 8 Gen 3'],
          'RAM': ['8GB', '12GB', '16GB']
        }
      }
    };

    res.json({
      success: true,
      data: sampleResults
    });
  } catch (error) {
    console.error('Error searching specifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search by specifications',
      error: error.message
    });
  }
});

export default router;