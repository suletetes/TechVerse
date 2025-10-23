import { z } from 'zod';

/**
 * Order and Checkout Zod Schemas
 * Shared validation schemas for order-related forms
 */

// Address schema
export const addressSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .trim(),
  company: z
    .string()
    .max(100, 'Company name must not exceed 100 characters')
    .optional(),
  address1: z
    .string()
    .min(1, 'Address is required')
    .max(200, 'Address must not exceed 200 characters')
    .trim(),
  address2: z
    .string()
    .max(200, 'Address line 2 must not exceed 200 characters')
    .optional(),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must not exceed 100 characters')
    .trim(),
  state: z
    .string()
    .min(1, 'State/Province is required')
    .max(100, 'State/Province must not exceed 100 characters')
    .trim(),
  zipCode: z
    .string()
    .min(1, 'ZIP/Postal code is required')
    .max(20, 'ZIP/Postal code must not exceed 20 characters')
    .regex(/^[A-Z0-9\s-]+$/i, 'Please enter a valid ZIP/Postal code')
    .trim(),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country must not exceed 100 characters'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val),
      'Please enter a valid phone number'
    ),
  isDefault: z.boolean().optional().default(false),
});

// Payment method schema
export const paymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay'], {
    errorMap: () => ({ message: 'Please select a valid payment method' }),
  }),
  cardNumber: z
    .string()
    .optional()
    .refine((val, ctx) => {
      if (ctx.parent.type === 'credit_card' || ctx.parent.type === 'debit_card') {
        if (!val) return false;
        // Remove spaces and validate card number
        const cleaned = val.replace(/\s/g, '');
        return /^\d{13,19}$/.test(cleaned);
      }
      return true;
    }, 'Please enter a valid card number'),
  expiryMonth: z
    .string()
    .optional()
    .refine((val, ctx) => {
      if (ctx.parent.type === 'credit_card' || ctx.parent.type === 'debit_card') {
        if (!val) return false;
        const month = parseInt(val);
        return month >= 1 && month <= 12;
      }
      return true;
    }, 'Please enter a valid expiry month'),
  expiryYear: z
    .string()
    .optional()
    .refine((val, ctx) => {
      if (ctx.parent.type === 'credit_card' || ctx.parent.type === 'debit_card') {
        if (!val) return false;
        const year = parseInt(val);
        const currentYear = new Date().getFullYear();
        return year >= currentYear && year <= currentYear + 20;
      }
      return true;
    }, 'Please enter a valid expiry year'),
  cvv: z
    .string()
    .optional()
    .refine((val, ctx) => {
      if (ctx.parent.type === 'credit_card' || ctx.parent.type === 'debit_card') {
        if (!val) return false;
        return /^\d{3,4}$/.test(val);
      }
      return true;
    }, 'Please enter a valid CVV'),
  cardholderName: z
    .string()
    .optional()
    .refine((val, ctx) => {
      if (ctx.parent.type === 'credit_card' || ctx.parent.type === 'debit_card') {
        if (!val) return false;
        return val.trim().length >= 2;
      }
      return true;
    }, 'Please enter the cardholder name'),
  saveCard: z.boolean().optional().default(false),
});

// Shipping method schema
export const shippingMethodSchema = z.object({
  id: z.string().min(1, 'Please select a shipping method'),
  name: z.string().min(1, 'Shipping method name is required'),
  price: z.number().min(0, 'Shipping price cannot be negative'),
  estimatedDays: z
    .number()
    .int('Estimated days must be a whole number')
    .min(1, 'Estimated days must be at least 1')
    .optional(),
});

// Order item schema
export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity must not exceed 999'),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),
  productName: z.string().min(1, 'Product name is required'),
  productSku: z.string().optional(),
  productImage: z.string().url('Product image must be a valid URL').optional(),
});

// Checkout schema
export const checkoutSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required to checkout'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  useSameAddress: z.boolean().default(true),
  shippingMethod: shippingMethodSchema,
  paymentMethod: paymentMethodSchema,
  couponCode: z
    .string()
    .max(50, 'Coupon code must not exceed 50 characters')
    .optional(),
  specialInstructions: z
    .string()
    .max(500, 'Special instructions must not exceed 500 characters')
    .optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  subscribeNewsletter: z.boolean().optional().default(false),
}).refine((data) => {
  // If not using same address, billing address is required
  if (!data.useSameAddress && !data.billingAddress) {
    return false;
  }
  return true;
}, {
  message: 'Billing address is required when different from shipping address',
  path: ['billingAddress'],
});

// Order status update schema (admin)
export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ], {
    errorMap: () => ({ message: 'Please select a valid order status' }),
  }),
  trackingNumber: z
    .string()
    .max(100, 'Tracking number must not exceed 100 characters')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
  notifyCustomer: z.boolean().default(true),
});

// Order search schema
export const orderSearchSchema = z.object({
  query: z
    .string()
    .max(200, 'Search query must not exceed 200 characters')
    .optional(),
  status: z
    .enum([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ])
    .optional(),
  dateFrom: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Date.parse(val));
    }, 'Please enter a valid date'),
  dateTo: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Date.parse(val));
    }, 'Please enter a valid date'),
  minAmount: z
    .number()
    .min(0, 'Minimum amount cannot be negative')
    .optional(),
  maxAmount: z
    .number()
    .min(0, 'Maximum amount cannot be negative')
    .optional(),
  customerId: z.string().optional(),
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
    .default(20),
}).refine((data) => {
  // Date range validation
  if (data.dateFrom && data.dateTo) {
    const fromDate = new Date(data.dateFrom);
    const toDate = new Date(data.dateTo);
    return fromDate <= toDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['dateTo'],
}).refine((data) => {
  // Amount range validation
  if (data.minAmount && data.maxAmount && data.maxAmount <= data.minAmount) {
    return false;
  }
  return true;
}, {
  message: 'Maximum amount must be greater than minimum amount',
  path: ['maxAmount'],
});

// Return/refund request schema
export const returnRequestSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  items: z
    .array(z.object({
      orderItemId: z.string().min(1, 'Order item ID is required'),
      quantity: z
        .number()
        .int('Quantity must be a whole number')
        .min(1, 'Quantity must be at least 1'),
      reason: z.enum([
        'defective',
        'wrong_item',
        'not_as_described',
        'damaged_shipping',
        'changed_mind',
        'other',
      ], {
        errorMap: () => ({ message: 'Please select a return reason' }),
      }),
    }))
    .min(1, 'At least one item must be selected for return'),
  reason: z.enum([
    'defective',
    'wrong_item',
    'not_as_described',
    'damaged_shipping',
    'changed_mind',
    'other',
  ], {
    errorMap: () => ({ message: 'Please select a return reason' }),
  }),
  description: z
    .string()
    .min(10, 'Please provide a detailed description (at least 10 characters)')
    .max(1000, 'Description must not exceed 1000 characters'),
  refundMethod: z.enum(['original_payment', 'store_credit'], {
    errorMap: () => ({ message: 'Please select a refund method' }),
  }),
  images: z
    .array(z.instanceof(File))
    .max(5, 'Maximum 5 images allowed')
    .optional(),
});

// Coupon schema
export const couponSchema = z.object({
  code: z
    .string()
    .min(1, 'Coupon code is required')
    .max(50, 'Coupon code must not exceed 50 characters')
    .regex(/^[A-Z0-9-_]+$/i, 'Coupon code can only contain letters, numbers, hyphens, and underscores')
    .trim(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping'], {
    errorMap: () => ({ message: 'Please select a valid coupon type' }),
  }),
  value: z
    .number()
    .min(0, 'Coupon value cannot be negative')
    .refine((val, ctx) => {
      if (ctx.parent.type === 'percentage') {
        return val <= 100;
      }
      return true;
    }, 'Percentage discount cannot exceed 100%'),
  minimumAmount: z
    .number()
    .min(0, 'Minimum amount cannot be negative')
    .optional(),
  maximumDiscount: z
    .number()
    .min(0, 'Maximum discount cannot be negative')
    .optional(),
  usageLimit: z
    .number()
    .int('Usage limit must be a whole number')
    .min(1, 'Usage limit must be at least 1')
    .optional(),
  expiryDate: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return date > new Date();
    }, 'Expiry date must be in the future'),
  isActive: z.boolean().default(true),
});

// Export all schemas as a collection
export const orderSchemas = {
  address: addressSchema,
  paymentMethod: paymentMethodSchema,
  shippingMethod: shippingMethodSchema,
  orderItem: orderItemSchema,
  checkout: checkoutSchema,
  orderStatusUpdate: orderStatusUpdateSchema,
  orderSearch: orderSearchSchema,
  returnRequest: returnRequestSchema,
  coupon: couponSchema,
};

export default orderSchemas;