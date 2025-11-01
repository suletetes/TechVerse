/**
 * End-to-End Admin Workflow Tests
 * Tests complete admin workflows for product and order management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import testUtils from './setup.js';

describe('Admin Workflow E2E Tests', () => {
  beforeEach(async () => {
    // Login as admin user
    await testUtils.login('admin@techverse.com', 'AdminPass123!');
    await testUtils.navigateToAdmin();
  });

  describe('Admin Dashboard', () => {
    it('should display admin dashboard with key metrics', async () => {
      await testUtils.expectElementVisible('[data-testid="admin-dashboard"]');
      await testUtils.expectElementVisible('[data-testid="sales-metrics"]');
      await testUtils.expectElementVisible('[data-testid="order-metrics"]');
      await testUtils.expectElementVisible('[data-testid="user-metrics"]');
      await testUtils.expectElementVisible('[data-testid="product-metrics"]');
    });

    it('should display recent orders', async () => {
      await testUtils.expectElementVisible('[data-testid="recent-orders"]');
      await testUtils.expectElementVisible('[data-testid="order-item"]');
    });

    it('should display low stock alerts', async () => {
      await testUtils.expectElementVisible('[data-testid="low-stock-alerts"]');
    });
  });

  describe('Product Management', () => {
    it('should create new product', async () => {
      await testUtils.page.click('[data-testid="products-menu"]');
      await testUtils.page.waitForSelector('[data-testid="products-page"]');
      
      // Click add product
      await testUtils.page.click('[data-testid="add-product"]');
      await testUtils.page.waitForSelector('[data-testid="product-form"]');
      
      // Fill product details
      await testUtils.page.type('[name="name"]', 'Test Product E2E');
      await testUtils.page.type('[name="description"]', 'This is a test product for E2E testing');
      await testUtils.page.type('[name="price"]', '999.99');
      await testUtils.page.type('[name="comparePrice"]', '1199.99');
      await testUtils.page.type('[name="sku"]', 'TEST-E2E-001');
      
      // Select category
      await testUtils.page.click('[data-testid="category-select"]');
      await testUtils.page.click('[data-testid="category-phones"]');
      
      // Add product variants
      await testUtils.page.click('[data-testid="add-variant"]');
      await testUtils.page.type('[name="variantName"]', 'Color');
      await testUtils.page.type('[name="variantOptions"]', 'Black,White,Blue');
      
      // Set stock information
      await testUtils.page.type('[name="stockQuantity"]', '50');
      await testUtils.page.click('[name="trackQuantity"]');
      
      // Add product images
      await testUtils.page.click('[data-testid="add-image"]');
      await testUtils.page.type('[name="imageUrl"]', '/images/test-product.jpg');
      await testUtils.page.type('[name="imageAlt"]', 'Test Product Image');
      
      // Save product
      await testUtils.page.click('[data-testid="save-product"]');
      
      // Verify product created
      await testUtils.expectElementVisible('[data-testid="product-created-success"]');
      await testUtils.expectElementText('[data-testid="success-message"]', 'Product created successfully');
    });

    it('should edit existing product', async () => {
      await testUtils.page.click('[data-testid="products-menu"]');
      await testUtils.page.waitForSelector('[data-testid="products-table"]');
      
      // Find and edit product
      await testUtils.page.click('[data-testid="edit-product-1"]');
      await testUtils.page.waitForSelector('[data-testid="product-form"]');
      
      // Update product details
      await testUtils.page.fill('[name="name"]', 'Updated Product Name');
      await testUtils.page.fill('[name="price"]', '1099.99');
      
      // Save changes
      await testUtils.page.click('[data-testid="save-product"]');
      
      // Verify product updated
      await testUtils.expectElementVisible('[data-testid="product-updated-success"]');
    });

    it('should manage product inventory', async () => {
      await testUtils.page.click('[data-testid="products-menu"]');
      await testUtils.page.click('[data-testid="inventory-tab"]');
      
      // Update stock for a product
      await testUtils.page.click('[data-testid="update-stock-1"]');
      await testUtils.page.type('[name="stockQuantity"]', '25');
      await testUtils.page.type('[name="stockNote"]', 'Stock adjustment - E2E test');
      
      // Save stock update
      await testUtils.page.click('[data-testid="save-stock"]');
      
      // Verify stock updated
      await testUtils.expectElementVisible('[data-testid="stock-updated-success"]');
      await testUtils.expectElementText('[data-testid="current-stock-1"]', '25');
    });

    it('should bulk update products', async () => {
      await testUtils.page.click('[data-testid="products-menu"]');
      await testUtils.page.waitForSelector('[data-testid="products-table"]');
      
      // Select multiple products
      await testUtils.page.click('[data-testid="select-product-1"]');
      await testUtils.page.click('[data-testid="select-product-2"]');
      await testUtils.page.click('[data-testid="select-product-3"]');
      
      // Open bulk actions
      await testUtils.page.click('[data-testid="bulk-actions"]');
      await testUtils.page.click('[data-testid="bulk-update-price"]');
      
      // Apply bulk price update
      await testUtils.page.type('[name="priceAdjustment"]', '10');
      await testUtils.page.click('[name="adjustmentType"][value="percentage"]');
      await testUtils.page.click('[data-testid="apply-bulk-update"]');
      
      // Verify bulk update
      await testUtils.expectElementVisible('[data-testid="bulk-update-success"]');
    });

    it('should delete product', async () => {
      await testUtils.page.click('[data-testid="products-menu"]');
      await testUtils.page.waitForSelector('[data-testid="products-table"]');
      
      // Delete product
      await testUtils.page.click('[data-testid="delete-product-test"]');
      await testUtils.page.click('[data-testid="confirm-delete"]');
      
      // Verify product deleted
      await testUtils.expectElementVisible('[data-testid="product-deleted-success"]');
    });
  });

  describe('Order Management', () => {
    it('should view order details', async () => {
      await testUtils.page.click('[data-testid="orders-menu"]');
      await testUtils.page.waitForSelector('[data-testid="orders-table"]');
      
      // Click on order to view details
      await testUtils.page.click('[data-testid="view-order-1"]');
      await testUtils.page.waitForSelector('[data-testid="order-details"]');
      
      // Verify order details displayed
      await testUtils.expectElementVisible('[data-testid="order-info"]');
      await testUtils.expectElementVisible('[data-testid="customer-info"]');
      await testUtils.expectElementVisible('[data-testid="order-items"]');
      await testUtils.expectElementVisible('[data-testid="payment-info"]');
      await testUtils.expectElementVisible('[data-testid="shipping-info"]');
    });

    it('should update order status', async () => {
      await testUtils.page.click('[data-testid="orders-menu"]');
      await testUtils.page.click('[data-testid="view-order-1"]');
      
      // Update order status
      await testUtils.page.click('[data-testid="status-dropdown"]');
      await testUtils.page.click('[data-testid="status-processing"]');
      await testUtils.page.type('[name="statusNote"]', 'Order is being processed');
      
      // Save status update
      await testUtils.page.click('[data-testid="update-status"]');
      
      // Verify status updated
      await testUtils.expectElementVisible('[data-testid="status-updated-success"]');
      await testUtils.expectElementText('[data-testid="current-status"]', 'Processing');
    });

    it('should process refund', async () => {
      await testUtils.page.click('[data-testid="orders-menu"]');
      await testUtils.page.click('[data-testid="view-order-1"]');
      
      // Initiate refund
      await testUtils.page.click('[data-testid="refund-order"]');
      await testUtils.page.waitForSelector('[data-testid="refund-form"]');
      
      // Fill refund details
      await testUtils.page.type('[name="refundAmount"]', '999.99');
      await testUtils.page.type('[name="refundReason"]', 'Customer requested refund');
      await testUtils.page.click('[name="refundMethod"][value="original"]');
      
      // Process refund
      await testUtils.page.click('[data-testid="process-refund"]');
      
      // Verify refund processed
      await testUtils.expectElementVisible('[data-testid="refund-success"]');
    });

    it('should export orders', async () => {
      await testUtils.page.click('[data-testid="orders-menu"]');
      await testUtils.page.waitForSelector('[data-testid="orders-table"]');
      
      // Set date range for export
      await testUtils.page.type('[name="startDate"]', '2024-01-01');
      await testUtils.page.type('[name="endDate"]', '2024-12-31');
      
      // Export orders
      await testUtils.page.click('[data-testid="export-orders"]');
      await testUtils.page.click('[data-testid="export-csv"]');
      
      // Verify export initiated
      await testUtils.expectElementVisible('[data-testid="export-started"]');
    });

    it('should filter orders', async () => {
      await testUtils.page.click('[data-testid="orders-menu"]');
      await testUtils.page.waitForSelector('[data-testid="orders-table"]');
      
      // Apply filters
      await testUtils.page.click('[data-testid="filter-status"]');
      await testUtils.page.click('[data-testid="status-pending"]');
      
      await testUtils.page.click('[data-testid="filter-date"]');
      await testUtils.page.type('[name="dateFrom"]', '2024-01-01');
      await testUtils.page.type('[name="dateTo"]', '2024-12-31');
      
      // Apply filters
      await testUtils.page.click('[data-testid="apply-filters"]');
      
      // Verify filtered results
      await testUtils.expectElementVisible('[data-testid="filtered-orders"]');
    });
  });

  describe('User Management', () => {
    it('should view user details', async () => {
      await testUtils.page.click('[data-testid="users-menu"]');
      await testUtils.page.waitForSelector('[data-testid="users-table"]');
      
      // View user details
      await testUtils.page.click('[data-testid="view-user-1"]');
      await testUtils.page.waitForSelector('[data-testid="user-details"]');
      
      // Verify user details displayed
      await testUtils.expectElementVisible('[data-testid="user-info"]');
      await testUtils.expectElementVisible('[data-testid="user-orders"]');
      await testUtils.expectElementVisible('[data-testid="user-activity"]');
    });

    it('should update user status', async () => {
      await testUtils.page.click('[data-testid="users-menu"]');
      await testUtils.page.click('[data-testid="view-user-1"]');
      
      // Update user status
      await testUtils.page.click('[data-testid="status-dropdown"]');
      await testUtils.page.click('[data-testid="status-suspended"]');
      await testUtils.page.type('[name="statusReason"]', 'Suspicious activity detected');
      
      // Save status update
      await testUtils.page.click('[data-testid="update-user-status"]');
      
      // Verify status updated
      await testUtils.expectElementVisible('[data-testid="user-status-updated"]');
    });

    it('should reset user password', async () => {
      await testUtils.page.click('[data-testid="users-menu"]');
      await testUtils.page.click('[data-testid="view-user-1"]');
      
      // Reset password
      await testUtils.page.click('[data-testid="reset-password"]');
      await testUtils.page.click('[data-testid="confirm-reset"]');
      
      // Verify password reset
      await testUtils.expectElementVisible('[data-testid="password-reset-success"]');
    });
  });

  describe('Analytics and Reporting', () => {
    it('should view sales analytics', async () => {
      await testUtils.page.click('[data-testid="analytics-menu"]');
      await testUtils.page.waitForSelector('[data-testid="analytics-dashboard"]');
      
      // Verify analytics components
      await testUtils.expectElementVisible('[data-testid="sales-chart"]');
      await testUtils.expectElementVisible('[data-testid="revenue-metrics"]');
      await testUtils.expectElementVisible('[data-testid="top-products"]');
      await testUtils.expectElementVisible('[data-testid="customer-metrics"]');
    });

    it('should filter analytics by date range', async () => {
      await testUtils.page.click('[data-testid="analytics-menu"]');
      await testUtils.page.waitForSelector('[data-testid="analytics-dashboard"]');
      
      // Set date range
      await testUtils.page.click('[data-testid="date-range-picker"]');
      await testUtils.page.click('[data-testid="last-30-days"]');
      
      // Verify analytics updated
      await testUtils.expectElementVisible('[data-testid="analytics-updated"]');
    });

    it('should export analytics report', async () => {
      await testUtils.page.click('[data-testid="analytics-menu"]');
      await testUtils.page.waitForSelector('[data-testid="analytics-dashboard"]');
      
      // Export report
      await testUtils.page.click('[data-testid="export-report"]');
      await testUtils.page.click('[data-testid="export-pdf"]');
      
      // Verify export initiated
      await testUtils.expectElementVisible('[data-testid="report-export-started"]');
    });
  });

  describe('Category Management', () => {
    it('should create new category', async () => {
      await testUtils.page.click('[data-testid="categories-menu"]');
      await testUtils.page.waitForSelector('[data-testid="categories-page"]');
      
      // Add new category
      await testUtils.page.click('[data-testid="add-category"]');
      await testUtils.page.type('[name="name"]', 'Test Category E2E');
      await testUtils.page.type('[name="description"]', 'Test category for E2E testing');
      await testUtils.page.type('[name="slug"]', 'test-category-e2e');
      
      // Save category
      await testUtils.page.click('[data-testid="save-category"]');
      
      // Verify category created
      await testUtils.expectElementVisible('[data-testid="category-created-success"]');
    });

    it('should update category hierarchy', async () => {
      await testUtils.page.click('[data-testid="categories-menu"]');
      await testUtils.page.waitForSelector('[data-testid="categories-tree"]');
      
      // Drag and drop to reorder categories
      await testUtils.page.dragAndDrop(
        '[data-testid="category-test"]',
        '[data-testid="category-electronics"]'
      );
      
      // Verify hierarchy updated
      await testUtils.expectElementVisible('[data-testid="hierarchy-updated"]');
    });
  });

  describe('Review Management', () => {
    it('should moderate product reviews', async () => {
      await testUtils.page.click('[data-testid="reviews-menu"]');
      await testUtils.page.waitForSelector('[data-testid="reviews-moderation"]');
      
      // View pending reviews
      await testUtils.page.click('[data-testid="pending-reviews"]');
      
      // Approve a review
      await testUtils.page.click('[data-testid="approve-review-1"]');
      
      // Verify review approved
      await testUtils.expectElementVisible('[data-testid="review-approved"]');
    });

    it('should reject inappropriate review', async () => {
      await testUtils.page.click('[data-testid="reviews-menu"]');
      await testUtils.page.click('[data-testid="pending-reviews"]');
      
      // Reject review
      await testUtils.page.click('[data-testid="reject-review-2"]');
      await testUtils.page.type('[name="rejectionReason"]', 'Inappropriate content');
      await testUtils.page.click('[data-testid="confirm-rejection"]');
      
      // Verify review rejected
      await testUtils.expectElementVisible('[data-testid="review-rejected"]');
    });
  });

  describe('System Settings', () => {
    it('should update site settings', async () => {
      await testUtils.page.click('[data-testid="settings-menu"]');
      await testUtils.page.waitForSelector('[data-testid="settings-page"]');
      
      // Update site settings
      await testUtils.page.type('[name="siteName"]', 'TechVerse E2E Test');
      await testUtils.page.type('[name="siteDescription"]', 'E2E Testing Environment');
      
      // Save settings
      await testUtils.page.click('[data-testid="save-settings"]');
      
      // Verify settings saved
      await testUtils.expectElementVisible('[data-testid="settings-saved"]');
    });

    it('should configure payment settings', async () => {
      await testUtils.page.click('[data-testid="settings-menu"]');
      await testUtils.page.click('[data-testid="payment-settings"]');
      
      // Update payment settings
      await testUtils.page.check('[name="enableStripe"]');
      await testUtils.page.type('[name="stripePublicKey"]', 'pk_test_example');
      
      // Save payment settings
      await testUtils.page.click('[data-testid="save-payment-settings"]');
      
      // Verify settings saved
      await testUtils.expectElementVisible('[data-testid="payment-settings-saved"]');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      await testUtils.page.click('[data-testid="products-menu"]');
      await testUtils.page.click('[data-testid="add-product"]');
      
      // Try to save without required fields
      await testUtils.page.click('[data-testid="save-product"]');
      
      // Verify validation errors displayed
      await testUtils.expectElementVisible('[data-testid="validation-errors"]');
      await testUtils.expectElementVisible('[data-testid="name-required-error"]');
    });

    it('should handle server errors gracefully', async () => {
      // Simulate server error scenario
      await testUtils.page.goto('http://localhost:5173/admin/products/invalid-id');
      
      // Verify error handling
      await testUtils.expectElementVisible('[data-testid="error-message"]');
      await testUtils.expectElementVisible('[data-testid="back-to-products"]');
    });
  });

  describe('Performance and Usability', () => {
    it('should load admin pages quickly', async () => {
      const startTime = Date.now();
      await testUtils.page.click('[data-testid="products-menu"]');
      await testUtils.page.waitForSelector('[data-testid="products-table"]');
      const loadTime = Date.now() - startTime;
      
      // Verify page loads within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle large data sets efficiently', async () => {
      await testUtils.page.click('[data-testid="orders-menu"]');
      await testUtils.page.waitForSelector('[data-testid="orders-table"]');
      
      // Load more orders
      await testUtils.page.click('[data-testid="load-more-orders"]');
      
      // Verify pagination works
      await testUtils.expectElementVisible('[data-testid="pagination-controls"]');
    });
  });
});