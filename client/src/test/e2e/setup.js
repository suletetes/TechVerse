/**
 * End-to-End Test Setup for TechVerse Platform
 * Configures browser automation and test environment
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Mock browser automation for E2E tests
class MockBrowser {
  constructor() {
    this.pages = [];
    this.currentPage = null;
  }

  async newPage() {
    const page = new MockPage();
    this.pages.push(page);
    this.currentPage = page;
    return page;
  }

  async close() {
    this.pages = [];
    this.currentPage = null;
  }
}

class MockPage {
  constructor() {
    this.url = '';
    this.content = '';
    this.elements = new Map();
  }

  async goto(url) {
    this.url = url;
    // Simulate page load
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async waitForSelector(selector, options = {}) {
    const timeout = options.timeout || 5000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.elements.has(selector)) {
        return this.elements.get(selector);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Selector ${selector} not found within ${timeout}ms`);
  }

  async click(selector) {
    const element = await this.waitForSelector(selector);
    element.clicked = true;
    return element;
  }

  async type(selector, text) {
    const element = await this.waitForSelector(selector);
    element.value = text;
    return element;
  }

  async evaluate(fn) {
    return fn();
  }

  async screenshot(options = {}) {
    return Buffer.from('mock-screenshot-data');
  }

  // Mock element creation for testing
  mockElement(selector, properties = {}) {
    const element = {
      selector,
      visible: true,
      enabled: true,
      value: '',
      textContent: '',
      clicked: false,
      ...properties
    };
    this.elements.set(selector, element);
    return element;
  }
}

// Global test setup
let browser;
let page;

beforeAll(async () => {
  // Initialize mock browser for E2E tests
  browser = new MockBrowser();
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.VITE_API_URL = 'http://localhost:3001';
});

beforeEach(async () => {
  // Create new page for each test
  page = await browser.newPage();
  
  // Set up common page elements
  setupCommonElements(page);
});

afterEach(async () => {
  // Clean up after each test
  if (page) {
    await page.evaluate(() => {
      // Clear any test data
      localStorage.clear();
      sessionStorage.clear();
    });
  }
});

afterAll(async () => {
  // Clean up browser
  if (browser) {
    await browser.close();
  }
});

function setupCommonElements(page) {
  // Mock common page elements
  page.mockElement('header', { textContent: 'TechVerse' });
  page.mockElement('nav', { visible: true });
  page.mockElement('[data-testid="loading-spinner"]', { visible: false });
  page.mockElement('[data-testid="error-message"]', { visible: false });
  
  // Mock form elements
  page.mockElement('input[type="email"]', { value: '' });
  page.mockElement('input[type="password"]', { value: '' });
  page.mockElement('button[type="submit"]', { enabled: true });
  
  // Mock product elements
  page.mockElement('[data-testid="product-card"]', { visible: true });
  page.mockElement('[data-testid="add-to-cart"]', { enabled: true });
  page.mockElement('[data-testid="buy-now"]', { enabled: true });
  
  // Mock cart elements
  page.mockElement('[data-testid="cart-icon"]', { visible: true });
  page.mockElement('[data-testid="cart-count"]', { textContent: '0' });
}

// Test utilities
export const testUtils = {
  // Navigation helpers
  async navigateToHome() {
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('header');
  },

  async navigateToLogin() {
    await page.goto('http://localhost:5173/auth/login');
    await page.waitForSelector('form');
  },

  async navigateToProduct(productId) {
    await page.goto(`http://localhost:5173/product/${productId}`);
    await page.waitForSelector('[data-testid="product-details"]');
  },

  async navigateToCart() {
    await page.goto('http://localhost:5173/cart');
    await page.waitForSelector('[data-testid="cart-items"]');
  },

  async navigateToCheckout() {
    await page.goto('http://localhost:5173/checkout');
    await page.waitForSelector('[data-testid="checkout-form"]');
  },

  // Authentication helpers
  async login(email = 'test@example.com', password = 'password123') {
    await this.navigateToLogin();
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="user-menu"]');
  },

  async logout() {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForSelector('[data-testid="login-button"]');
  },

  // Product interaction helpers
  async addProductToCart(productId) {
    await this.navigateToProduct(productId);
    await page.click('[data-testid="add-to-cart"]');
    await page.waitForSelector('[data-testid="cart-notification"]');
  },

  async selectProductVariant(variantType, variantValue) {
    const selector = `[data-testid="variant-${variantType}"] [data-value="${variantValue}"]`;
    await page.click(selector);
  },

  async updateQuantity(quantity) {
    await page.type('[data-testid="quantity-input"]', quantity.toString());
  },

  // Cart helpers
  async getCartItemCount() {
    const element = await page.waitForSelector('[data-testid="cart-count"]');
    return parseInt(element.textContent || '0');
  },

  async removeFromCart(itemId) {
    await page.click(`[data-testid="remove-item-${itemId}"]`);
    await page.waitForSelector('[data-testid="item-removed-notification"]');
  },

  // Checkout helpers
  async fillShippingAddress(address) {
    await page.type('[name="firstName"]', address.firstName);
    await page.type('[name="lastName"]', address.lastName);
    await page.type('[name="address"]', address.address);
    await page.type('[name="city"]', address.city);
    await page.type('[name="postalCode"]', address.postalCode);
  },

  async selectPaymentMethod(method) {
    await page.click(`[data-testid="payment-${method}"]`);
  },

  async completeOrder() {
    await page.click('[data-testid="place-order"]');
    await page.waitForSelector('[data-testid="order-confirmation"]');
  },

  // Admin helpers
  async navigateToAdmin() {
    await page.goto('http://localhost:5173/admin');
    await page.waitForSelector('[data-testid="admin-dashboard"]');
  },

  async addProduct(productData) {
    await this.navigateToAdmin();
    await page.click('[data-testid="add-product"]');
    await page.type('[name="name"]', productData.name);
    await page.type('[name="price"]', productData.price.toString());
    await page.type('[name="description"]', productData.description);
    await page.click('[data-testid="save-product"]');
    await page.waitForSelector('[data-testid="product-saved"]');
  },

  // Assertion helpers
  async expectElementVisible(selector) {
    const element = await page.waitForSelector(selector);
    if (!element.visible) {
      throw new Error(`Element ${selector} is not visible`);
    }
  },

  async expectElementText(selector, expectedText) {
    const element = await page.waitForSelector(selector);
    if (element.textContent !== expectedText) {
      throw new Error(`Expected "${expectedText}" but got "${element.textContent}"`);
    }
  },

  async expectUrl(expectedUrl) {
    if (!page.url.includes(expectedUrl)) {
      throw new Error(`Expected URL to contain "${expectedUrl}" but got "${page.url}"`);
    }
  },

  // Screenshot helpers
  async takeScreenshot(name) {
    const screenshot = await page.screenshot();
    // In a real implementation, save screenshot to file
    console.log(`Screenshot taken: ${name}`);
    return screenshot;
  }
};

// Export globals for tests
export { browser, page };
export default testUtils;