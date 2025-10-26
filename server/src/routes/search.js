import express from 'express';
import { query } from 'express-validator';
import {
  searchProducts,
  getAutocomplete,
  getSearchFilters
} from '../controllers/searchController.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const autocompleteValidation = [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Query must be between 2 and 50 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
];

// Search routes
router.get('/products', searchValidation, validate, searchProducts);
router.get('/autocomplete', autocompleteValidation, validate, getAutocomplete);
router.get('/filters', getSearchFilters);

export default router;