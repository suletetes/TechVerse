import { z } from 'zod';

/**
 * Product Zod Schemas
 * Shared validation schemas for product-related forms
 */

// Base field schemas
export const productNameSchema = z
  .string()
  .min(1, 'Product name is required')
  .min(3, 'Product name must be at least 3 characters long')
  .max(200, 'Product name must not exceed 200 characters')
  .trim();

export const productDescriptionSchema = z
  .string()
  .min(1, 'Product description is required')
  .min(10, 'Product description must be at least 10 characters long')
  .max(5000, 'Product description must not exceed 5000 characters')
  .trim();

export const priceSchema = z
  .number()
  .min(0.01, 'Price must be greater than 0')
  .max(999999.99, 'Price must not exceed $999,999.99')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

export const skuSchema = z
  .string()
  .min(1, 'SKU is required')
  .max(50, 'SKU must not exceed 50 characters')
  .regex(/^[A-Z0-9-_]+$/, 'SKU can only contain uppercase letters, numbers, hyphens, and underscores')
  .trim();

export const categorySchema = z
  .string()
  .min(1, 'Category is required');

export const brandSchema = z
  .string()
  .min(1, 'Brand is required')
  .max(100, 'Brand must not exceed 100 characters')
  .trim();

export const stockQuantitySchema = z
  .number()
  .int('Stock quantity must be a whole number')
  .min(0, 'Stock quantity cannot be negative')
  .max(999999, 'Stock quantity must not exceed 999,999');

export const weightSchema = z
  .number()
  .min(0, 'Weight cannot be negative')
  .max(9999.99, 'Weight must not exceed 9999.99')
  .optional();

export const dimensionsSchema = z
  .object({
    length: z.number().min(0, 'Length cannot be negative').optional(),
    width: z.number().min(0, 'Width cannot be negative').optional(),
    height: z.number().min(0, 'Height cannot be negative').optional(),
  })
  .optional();

// Product creation/update schema
export const productSchema = z.object({
  name: productNameSchema,
  description: productDescriptionSchema,
  shortDescription: z
    .string()
    .max(500, 'Short description must not exceed 500 characters')
    .optional(),
  price: priceSchema,
  salePrice: z
    .number()
    .min(0, 'Sale price cannot be negative')
    .max(999999.99, 'Sale price must not exceed $999,999.99')
    .multipleOf(0.01, 'Sale price must have at most 2 decimal places')
    .optional(),
  sku: skuSchema,
  category: categorySchema,
  brand: brandSchema,
  tags: z
    .array(z.string().min(1).max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
    .default([]),
  stockQuantity: stockQuantitySchema,
  lowStockThreshold: z
    .number()
    .int('Low stock threshold must be a whole number')
    .min(0, 'Low stock threshold cannot be negative')
    .optional()
    .default(10),
  weight: weightSchema,
  dimensions: dimensionsSchema,
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  allowBackorder: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  requiresShipping: z.boolean().default(true),
  metaTitle: z
    .string()
    .max(60, 'Meta title must not exceed 60 characters')
    .optional(),
  metaDescription: z
    .string()
    .max(160, 'Meta description must not exceed 160 characters')
    .optional(),
  specifications: z
    .record(z.string(), z.string())
    .optional()
    .default({}),
}).refine((data) => {
  // Sale price must be less than regular price
  if (data.salePrice && data.salePrice >= data.price) {
    return false;
  }
  return true;
}, {
  message: 'Sale price must be less than regular price',
  path: ['salePrice'],
});

// Product search schema
export const productSearchSchema = z.object({
  query: z.string().max(200, 'Search query must not exceed 200 characters').optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z
    .number()
    .min(0, 'Minimum price cannot be negative')
    .optional(),
  maxPrice: z
    .number()
    .min(0, 'Maximum price cannot be negative')
    .optional(),
  inStock: z.boolean().optional(),
  onSale: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortBy: z
    .enum(['name', 'price', 'created', 'popularity', 'rating'])
    .optional()
    .default('name'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('asc'),
  page: z
    .number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .optional()
    .default(1),
  limit: z
    .number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must not exceed 100')
    .optional()
    .default(12),
}).refine((data) => {
  // Max price must be greater than min price
  if (data.minPrice && data.maxPrice && data.maxPrice <= data.minPrice) {
    return false;
  }
  return true;
}, {
  message: 'Maximum price must be greater than minimum price',
  path: ['maxPrice'],
});

// Product review schema
export const productReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),
  title: z
    .string()
    .min(1, 'Review title is required')
    .max(100, 'Review title must not exceed 100 characters')
    .trim(),
  comment: z
    .string()
    .min(10, 'Review comment must be at least 10 characters long')
    .max(1000, 'Review comment must not exceed 1000 characters')
    .trim(),
  wouldRecommend: z.boolean().optional(),
  verifiedPurchase: z.boolean().optional().default(false),
});

// Category schema
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Category description must not exceed 500 characters')
    .optional(),
  slug: z
    .string()
    .min(1, 'Category slug is required')
    .max(100, 'Category slug must not exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .trim(),
  parentCategory: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z
    .number()
    .int('Sort order must be a whole number')
    .min(0, 'Sort order cannot be negative')
    .optional()
    .default(0),
  metaTitle: z
    .string()
    .max(60, 'Meta title must not exceed 60 characters')
    .optional(),
  metaDescription: z
    .string()
    .max(160, 'Meta description must not exceed 160 characters')
    .optional(),
});

// Inventory update schema
export const inventoryUpdateSchema = z.object({
  stockQuantity: stockQuantitySchema,
  lowStockThreshold: z
    .number()
    .int('Low stock threshold must be a whole number')
    .min(0, 'Low stock threshold cannot be negative')
    .optional(),
  trackInventory: z.boolean().optional(),
  allowBackorder: z.boolean().optional(),
  reason: z
    .enum(['restock', 'sale', 'damage', 'theft', 'adjustment', 'return'])
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
});

// Bulk product update schema
export const bulkProductUpdateSchema = z.object({
  productIds: z
    .array(z.string().min(1, 'Product ID is required'))
    .min(1, 'At least one product must be selected')
    .max(100, 'Maximum 100 products can be updated at once'),
  updates: z.object({
    category: z.string().optional(),
    brand: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    priceAdjustment: z
      .object({
        type: z.enum(['percentage', 'fixed']),
        value: z.number(),
        operation: z.enum(['increase', 'decrease']),
      })
      .optional(),
  }),
});

// Product import schema
export const productImportSchema = z.object({
  file: z.instanceof(File, { message: 'Please select a file to import' }),
  format: z.enum(['csv', 'xlsx'], { message: 'Unsupported file format' }),
  updateExisting: z.boolean().default(false),
  skipErrors: z.boolean().default(false),
});

// Export all schemas as a collection
export const productSchemas = {
  product: productSchema,
  productSearch: productSearchSchema,
  productReview: productReviewSchema,
  category: categorySchema,
  inventoryUpdate: inventoryUpdateSchema,
  bulkProductUpdate: bulkProductUpdateSchema,
  productImport: productImportSchema,
};

export default productSchemas;