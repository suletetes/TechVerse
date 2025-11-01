/**
 * End-to-End User Journey Tests
 * Tests complete user workflows from registration to purchase
 */

import { describe, it, expect, beforeEach } from 'vitest';
import testUtils from './setup.js';

describe('User Journey E2E Tests', () => {
  beforeEach(async () => {
    // Reset test environment
    await testUtils.navigateToHome();
  });

  describe('User Registration and Authentication', () => {
    it('should complete user registration flow', async () => {
      // Navigate to registration
      await testUtils.page.goto('http://localhost:5173/auth/register');
      await testUtils.page.waitForSelector('[data-testid="register-form"]');

      // Fill registration form
      await testUtils.page.type('[name="firstName"]', 'John');
      await testUtils.page.type('[name="lastName"]', 'Doe');
      await testUtils.page.type('[name="email"]', 'john.doe@example.com');
      await testUtils.page.type('[name="password"]', 'SecurePass123!');
      await testUtils.page.type('[name="confirmPassword"]', 'SecurePass123!');

      // Submit registration
      await testUtils.page.click('[data-testid="register-button"]');

      // Verify registration success
      await testUtils.page.waitForSelector('[data-testid="registration-success"]');
      await testUtils.expectElementVisible('[data-testid="email-verification-notice"]');
    });

    it('should complete login flow', async () => {
      await testUtils.login('john.doe@example.com', 'SecurePass123!');
      
      // Verify successful login
      await testUtils.expectElementVisible('[data-testid="user-menu"]');
      await testUtils.expectUrl('/dashboard');
    });

    it('should handle logout flow', async () => {
      await testUtils.login();
      await testUtils.logout();
      
      // Verify successful logout
      await testUtils.expectElementVisible('[data-testid="login-button"]');
      await testUtils.expectUrl('/');
    });
  });

  describe('Product Browsing and Search', () => {
    it('should browse products by category', async () => {
      await testUtils.navigateToHome();
      
      // Click on a category
      await testUtils.page.click('[data-testid="category-phones"]');
      await testUtils.page.waitForSelector('[data-testid="product-listing"]');
      
      // Verify category products are displayed
      await testUtils.expectElementVisible('[data-testid="product-card"]');
      await testUtils.expectUrl('/category/phones');
    });

    it('should search for products', async () => {
      await testUtils.navigateToHome();
      
      // Use search functionality
      await testUtils.page.type('[data-testid="search-input"]', 'iPhone');
      await testUtils.page.click('[data-testid="search-button"]');
      
      // Verify search results
      await testUtils.page.waitForSelector('[data-testid="search-results"]');
      await testUtils.expectElementVisible('[data-testid="product-card"]');
      await testUtils.expectUrl('/search?q=iPhone');
    });

    it('should filter products', async () => {
      await testUtils.page.goto('http://localhost:5173/category/phones');
      await testUtils.page.waitForSelector('[data-testid="product-listing"]');
      
      // Apply price filter
      await testUtils.page.click('[data-testid="price-filter"]');
      await testUtils.page.click('[data-testid="price-range-500-1000"]');
      
      // Apply brand filter
      await testUtils.page.click('[data-testid="brand-filter"]');
      await testUtils.page.click('[data-testid="brand-apple"]');
      
      // Verify filtered results
      await testUtils.page.waitForSelector('[data-testid="filtered-products"]');
      await testUtils.expectElementVisible('[data-testid="product-card"]');
    });
  });

  describe('Product Details and Variants', () => {
    it('should view product details', async () => {
      await testUtils.navigateToProduct('iphone-15-pro');
      
      // Verify product details are displayed
      await testUtils.expectElementVisible('[data-testid="product-name"]');
      await testUtils.expectElementVisible('[data-testid="product-price"]');
      await testUtils.expectElementVisible('[data-testid="product-description"]');
      await testUtils.expectElementVisible('[data-testid="product-images"]');
    });

    it('should select product variants', async () => {
      await testUtils.navigateToProduct('iphone-15-pro');
      
      // Select color variant
      await testUtils.selectProductVariant('color', 'space-black');
      await testUtils.expectElementVisible('[data-testid="variant-color-selected"]');
      
      // Select storage variant
      await testUtils.selectProductVariant('storage', '256gb');
      await testUtils.expectElementVisible('[data-testid="variant-storage-selected"]');
      
      // Verify price update
      await testUtils.expectElementVisible('[data-testid="updated-price"]');
    });

    it('should update quantity', async () => {
      await testUtils.navigateToProduct('iphone-15-pro');
      
      // Update quantity
      await testUtils.updateQuantity(2);
      
      // Verify quantity and total price update
      await testUtils.expectElementText('[data-testid="quantity-display"]', '2');
      await testUtils.expectElementVisible('[data-testid="total-price"]');
    });
  });

  describe('Shopping Cart Management', () => {
    it('should add product to cart', async () => {
      await testUtils.addProductToCart('iphone-15-pro');
      
      // Verify cart count update
      const cartCount = await testUtils.getCartItemCount();
      expect(cartCount).toBe(1);
      
      // Verify cart notification
      await testUtils.expectElementVisible('[data-testid="cart-notification"]');
    });

    it('should view cart contents', async () => {
      await testUtils.addProductToCart('iphone-15-pro');
      await testUtils.navigateToCart();
      
      // Verify cart items
      await testUtils.expectElementVisible('[data-testid="cart-item"]');
      await testUtils.expectElementVisible('[data-testid="cart-total"]');
    });

    it('should update cart item quantity', async () => {
      await testUtils.addProductToCart('iphone-15-pro');
      await testUtils.navigateToCart();
      
      // Update quantity in cart
      await testUtils.page.click('[data-testid="quantity-increase"]');
      
      // Verify quantity and total update
      await testUtils.expectElementText('[data-testid="item-quantity"]', '2');
      await testUtils.expectElementVisible('[data-testid="updated-total"]');
    });

    it('should remove item from cart', async () => {
      await testUtils.addProductToCart('iphone-15-pro');
      await testUtils.navigateToCart();
      
      // Remove item
      await testUtils.removeFromCart('iphone-15-pro');
      
      // Verify item removed
      await testUtils.expectElementVisible('[data-testid="empty-cart"]');
      
      const cartCount = await testUtils.getCartItemCount();
      expect(cartCount).toBe(0);
    });
  });

  describe('Checkout Process', () => {
    beforeEach(async () => {
      // Set up cart with items
      await testUtils.login();
      await testUtils.addProductToCart('iphone-15-pro');
    });

    it('should complete checkout flow', async () => {
      await testUtils.navigateToCheckout();
      
      // Fill shipping address
      await testUtils.fillShippingAddress({
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001'
      });
      
      // Select payment method
      await testUtils.selectPaymentMethod('credit-card');
      
      // Fill payment details
      await testUtils.page.type('[name="cardNumber"]', '4111111111111111');
      await testUtils.page.type('[name="expiryDate"]', '12/25');
      await testUtils.page.type('[name="cvv"]', '123');
      
      // Complete order
      await testUtils.completeOrder();
      
      // Verify order confirmation
      await testUtils.expectElementVisible('[data-testid="order-confirmation"]');
      await testUtils.expectElementVisible('[data-testid="order-number"]');
    });

    it('should handle payment errors', async () => {
      await testUtils.navigateToCheckout();
      
      // Fill required fields
      await testUtils.fillShippingAddress({
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001'
      });
      
      // Use invalid payment details
      await testUtils.selectPaymentMethod('credit-card');
      await testUtils.page.type('[name="cardNumber"]', '4000000000000002'); // Declined card
      await testUtils.page.type('[name="expiryDate"]', '12/25');
      await testUtils.page.type('[name="cvv"]', '123');
      
      // Attempt to complete order
      await testUtils.page.click('[data-testid="place-order"]');
      
      // Verify error handling
      await testUtils.expectElementVisible('[data-testid="payment-error"]');
    });
  });

  describe('User Profile Management', () => {
    beforeEach(async () => {
      await testUtils.login();
    });

    it('should update user profile', async () => {
      await testUtils.page.goto('http://localhost:5173/profile');
      await testUtils.page.waitForSelector('[data-testid="profile-form"]');
      
      // Update profile information
      await testUtils.page.type('[name="firstName"]', 'Jane');
      await testUtils.page.type('[name="phone"]', '+1234567890');
      
      // Save changes
      await testUtils.page.click('[data-testid="save-profile"]');
      
      // Verify success
      await testUtils.expectElementVisible('[data-testid="profile-updated"]');
    });

    it('should manage addresses', async () => {
      await testUtils.page.goto('http://localhost:5173/profile?tab=addresses');
      await testUtils.page.waitForSelector('[data-testid="addresses-tab"]');
      
      // Add new address
      await testUtils.page.click('[data-testid="add-address"]');
      await testUtils.fillShippingAddress({
        firstName: 'John',
        lastName: 'Doe',
        address: '456 Oak Ave',
        city: 'Boston',
        postalCode: '02101'
      });
      await testUtils.page.click('[data-testid="save-address"]');
      
      // Verify address added
      await testUtils.expectElementVisible('[data-testid="address-item"]');
    });

    it('should view order history', async () => {
      await testUtils.page.goto('http://localhost:5173/profile?tab=orders');
      await testUtils.page.waitForSelector('[data-testid="orders-tab"]');
      
      // Verify order history display
      await testUtils.expectElementVisible('[data-testid="order-list"]');
      await testUtils.expectElementVisible('[data-testid="order-item"]');
    });
  });

  describe('Wishlist Management', () => {
    beforeEach(async () => {
      await testUtils.login();
    });

    it('should add product to wishlist', async () => {
      await testUtils.navigateToProduct('iphone-15-pro');
      
      // Add to wishlist
      await testUtils.page.click('[data-testid="add-to-wishlist"]');
      
      // Verify wishlist notification
      await testUtils.expectElementVisible('[data-testid="wishlist-notification"]');
    });

    it('should view wishlist', async () => {
      await testUtils.navigateToProduct('iphone-15-pro');
      await testUtils.page.click('[data-testid="add-to-wishlist"]');
      
      // Navigate to wishlist
      await testUtils.page.goto('http://localhost:5173/wishlist');
      await testUtils.page.waitForSelector('[data-testid="wishlist-items"]');
      
      // Verify wishlist items
      await testUtils.expectElementVisible('[data-testid="wishlist-item"]');
    });

    it('should move wishlist item to cart', async () => {
      await testUtils.navigateToProduct('iphone-15-pro');
      await testUtils.page.click('[data-testid="add-to-wishlist"]');
      
      await testUtils.page.goto('http://localhost:5173/wishlist');
      await testUtils.page.waitForSelector('[data-testid="wishlist-items"]');
      
      // Move to cart
      await testUtils.page.click('[data-testid="move-to-cart"]');
      
      // Verify item moved to cart
      const cartCount = await testUtils.getCartItemCount();
      expect(cartCount).toBe(1);
    });
  });

  describe('Product Reviews', () => {
    beforeEach(async () => {
      await testUtils.login();
    });

    it('should write product review', async () => {
      await testUtils.navigateToProduct('iphone-15-pro');
      
      // Scroll to reviews section
      await testUtils.page.click('[data-testid="reviews-tab"]');
      
      // Write review
      await testUtils.page.click('[data-testid="write-review"]');
      await testUtils.page.click('[data-testid="rating-5"]');
      await testUtils.page.type('[name="title"]', 'Great product!');
      await testUtils.page.type('[name="comment"]', 'Really happy with this purchase.');
      
      // Submit review
      await testUtils.page.click('[data-testid="submit-review"]');
      
      // Verify review submitted
      await testUtils.expectElementVisible('[data-testid="review-submitted"]');
    });

    it('should filter reviews', async () => {
      await testUtils.navigateToProduct('iphone-15-pro');
      await testUtils.page.click('[data-testid="reviews-tab"]');
      
      // Filter by rating
      await testUtils.page.click('[data-testid="filter-5-stars"]');
      
      // Verify filtered reviews
      await testUtils.expectElementVisible('[data-testid="filtered-reviews"]');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network error
      await testUtils.page.goto('http://localhost:5173/product/non-existent');
      
      // Verify error handling
      await testUtils.expectElementVisible('[data-testid="error-message"]');
      await testUtils.expectElementVisible('[data-testid="retry-button"]');
    });

    it('should handle out of stock products', async () => {
      await testUtils.navigateToProduct('out-of-stock-product');
      
      // Verify out of stock handling
      await testUtils.expectElementVisible('[data-testid="out-of-stock"]');
      await testUtils.expectElementVisible('[data-testid="notify-when-available"]');
    });

    it('should handle session expiration', async () => {
      await testUtils.login();
      
      // Simulate session expiration
      await testUtils.page.evaluate(() => {
        localStorage.removeItem('auth_token');
      });
      
      // Try to access protected resource
      await testUtils.page.goto('http://localhost:5173/profile');
      
      // Verify redirect to login
      await testUtils.expectUrl('/auth/login');
    });
  });

  describe('Performance and Accessibility', () => {
    it('should load pages within acceptable time', async () => {
      const startTime = Date.now();
      await testUtils.navigateToHome();
      const loadTime = Date.now() - startTime;
      
      // Verify page loads within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    it('should be keyboard navigable', async () => {
      await testUtils.navigateToHome();
      
      // Test keyboard navigation
      await testUtils.page.keyboard.press('Tab');
      await testUtils.page.keyboard.press('Enter');
      
      // Verify keyboard interaction works
      await testUtils.expectElementVisible('[data-testid="focused-element"]');
    });

    it('should have proper ARIA labels', async () => {
      await testUtils.navigateToHome();
      
      // Check for ARIA labels on interactive elements
      const buttons = await testUtils.page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).every(
          button => button.getAttribute('aria-label') || button.textContent.trim()
        );
      });
      
      expect(buttons).toBe(true);
    });
  });
});