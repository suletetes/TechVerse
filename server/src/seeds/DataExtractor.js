import fs from 'fs/promises';
import path from 'path';

/**
 * Data Extractor - Parses files and extracts structured data for database seeding
 */
export class DataExtractor {
  constructor(validationEngine) {
    this.validationEngine = validationEngine;
    this.extractedData = {
      products: [],
      categories: [],
      reviews: [],
      users: [],
      pages: [],
      stores: [],
      settings: { homepage: {}, site: {} }
    };
    this.issues = [];
  }

  /**
   * Extract products from file content
   * @param {string} fileContent - File content to parse
   * @param {string} filePath - Source file path
   * @returns {Promise<Product[]>}
   */
  async extractProducts(fileContent, filePath) {
    const products = [];
    
    try {
      // Extract from product arrays (QuickPicks, LatestProducts, etc.)
      const productArrays = this.findProductArrays(fileContent);
      for (const array of productArrays) {
        products.push(...this.parseProductArray(array, filePath));
      }

      // Extract from admin mock data
      const adminProducts = this.findAdminProducts(fileContent);
      products.push(...adminProducts);

      // Extract from individual product objects
      const individualProducts = this.findIndividualProducts(fileContent);
      products.push(...individualProducts);

      return products;
    } catch (error) {
      this.addIssue(filePath, `Product extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Find product arrays in file content
   * @param {string} content - File content
   * @returns {Array}
   */
  findProductArrays(content) {
    const arrays = [];
    
    // Match product arrays with various patterns
    const patterns = [
      /const\s+products\s*=\s*\[([\s\S]*?)\];/g,
      /products\s*:\s*\[([\s\S]*?)\]/g,
      /\[\s*{[\s\S]*?title\s*:[\s\S]*?price\s*:[\s\S]*?}\s*\]/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        try {
          // Try to parse as JavaScript array
          const arrayContent = `[${match[1] || match[0]}]`;
          const parsed = this.safeEval(arrayContent);
          if (Array.isArray(parsed)) {
            arrays.push(parsed);
          }
        } catch (error) {
          // If eval fails, try manual parsing
          const manualParsed = this.manualParseProductArray(match[0]);
          if (manualParsed.length > 0) {
            arrays.push(manualParsed);
          }
        }
      }
    }

    return arrays;
  }

  /**
   * Parse product array into standardized format
   * @param {Array} array - Raw product array
   * @param {string} filePath - Source file path
   * @returns {Product[]}
   */
  parseProductArray(array, filePath) {
    return array.map((item, index) => {
      const product = {
        id: this.generateSlug(item.title || item.name || `product-${index}`),
        slug: this.generateSlug(item.title || item.name || `product-${index}`),
        name: item.title || item.name || `Product ${index + 1}`,
        shortDescription: item.description || item.shortDescription || '',
        longDescription: item.longDescription || '',
        price: this.parsePrice(item.price),
        currency: this.parseCurrency(item.price) || 'USD',
        images: this.parseImages(item),
        category: this.inferCategory(item, filePath),
        variants: item.variants || [],
        specs: item.specs || {},
        stock: item.stock || 50,
        status: item.status || 'active',
        featured: item.featured || false,
        topSeller: item.topSeller || false,
        quickPick: filePath.includes('QuickPicks') || false,
        weeklyDeal: filePath.includes('WeeklyDeals') || false,
        tags: item.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return product;
    });
  }

  /**
   * Find admin products from useAdminData hook
   * @param {string} content - File content
   * @returns {Product[]}
   */
  findAdminProducts(content) {
    const products = [];
    
    // Look for products array in admin data
    const adminProductMatch = content.match(/const\s+products\s*=\s*\[([\s\S]*?)\];/);
    if (adminProductMatch) {
      try {
        const productData = this.manualParseProductArray(adminProductMatch[0]);
        products.push(...productData.map(item => ({
          id: this.generateSlug(item.name),
          slug: this.generateSlug(item.name),
          name: item.name,
          shortDescription: '',
          longDescription: '',
          price: item.price || 0,
          currency: 'GBP',
          images: item.image ? [item.image] : [],
          category: this.generateSlug(item.category || 'general'),
          variants: [],
          specs: {},
          stock: item.stock || 50,
          status: item.status || 'active',
          featured: false,
          topSeller: false,
          quickPick: false,
          weeklyDeal: false,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })));
      } catch (error) {
        this.addIssue('admin-data', `Failed to parse admin products: ${error.message}`);
      }
    }

    return products;
  }

  /**
   * Find individual product objects
   * @param {string} content - File content
   * @returns {Product[]}
   */
  findIndividualProducts(content) {
    const products = [];
    
    // Look for individual product objects with price patterns
    const pricePatterns = [/\$\d+/, /£\d+/, /€\d+/, /From\s+\$\d+/, /From\s+£\d+/];
    
    for (const pattern of pricePatterns) {
      if (pattern.test(content)) {
        // This file likely contains product data, but we need more context
        // This is a placeholder for more sophisticated extraction
      }
    }

    return products;
  }

  /**
   * Parse price from string
   * @param {string|number} priceStr - Price string or number
   * @returns {number}
   */
  parsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    
    const cleaned = priceStr.toString().replace(/[£$€,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Parse currency from price string
   * @param {string} priceStr - Price string
   * @returns {string}
   */
  parseCurrency(priceStr) {
    if (!priceStr) return 'USD';
    
    const str = priceStr.toString();
    if (str.includes('£')) return 'GBP';
    if (str.includes('€')) return 'EUR';
    if (str.includes('$')) return 'USD';
    
    return 'USD';
  }

  /**
   * Parse images from product object
   * @param {Object} item - Product item
   * @returns {string[]}
   */
  parseImages(item) {
    const images = [];
    
    if (item.image) images.push(item.image);
    if (item.imageJpg) images.push(item.imageJpg);
    if (item.imageWebp) images.push(item.imageWebp);
    if (item.images && Array.isArray(item.images)) {
      images.push(...item.images);
    }

    // Filter out SVG files and normalize paths
    return images
      .filter(img => !img.endsWith('.svg'))
      .map(img => img.startsWith('/') ? img : `/${img}`);
  }

  /**
   * Infer category from product data or file path
   * @param {Object} item - Product item
   * @param {string} filePath - Source file path
   * @returns {string}
   */
  inferCategory(item, filePath) {
    if (item.category) return this.generateSlug(item.category);
    
    const name = (item.title || item.name || '').toLowerCase();
    
    // Infer from product name
    if (name.includes('tv') || name.includes('television')) return 'televisions';
    if (name.includes('tablet')) return 'tablets';
    if (name.includes('phone')) return 'smartphones';
    if (name.includes('laptop')) return 'laptops';
    if (name.includes('headphone')) return 'headphones';
    
    return 'general';
  }

  /**
   * Generate URL-safe slug
   * @param {string} text - Text to slugify
   * @returns {string}
   */
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  /**
   * Manually parse product array when eval fails
   * @param {string} arrayStr - Array string
   * @returns {Array}
   */
  manualParseProductArray(arrayStr) {
    const products = [];
    
    // Extract individual objects using regex
    const objectPattern = /{[^{}]*}/g;
    let match;
    
    while ((match = objectPattern.exec(arrayStr)) !== null) {
      try {
        const obj = this.parseObjectString(match[0]);
        if (obj && (obj.title || obj.name) && obj.price) {
          products.push(obj);
        }
      } catch (error) {
        // Skip malformed objects
      }
    }
    
    return products;
  }

  /**
   * Parse object string to JavaScript object
   * @param {string} objStr - Object string
   * @returns {Object}
   */
  parseObjectString(objStr) {
    const obj = {};
    
    // Extract key-value pairs
    const pairs = objStr.match(/(\w+)\s*:\s*['"`]([^'"`]*?)['"`]/g) || [];
    
    for (const pair of pairs) {
      const [, key, value] = pair.match(/(\w+)\s*:\s*['"`]([^'"`]*?)['"`]/) || [];
      if (key && value) {
        obj[key] = value;
      }
    }
    
    return obj;
  }

  /**
   * Safe evaluation of JavaScript code
   * @param {string} code - Code to evaluate
   * @returns {any}
   */
  safeEval(code) {
    // This is a simplified safe eval - in production, use a proper sandbox
    try {
      return Function(`"use strict"; return (${code})`)();
    } catch (error) {
      throw new Error(`Evaluation failed: ${error.message}`);
    }
  }

  /**
   * Extract categories from file content
   * @param {string} fileContent - File content to parse
   * @param {string} filePath - Source file path
   * @returns {Promise<Category[]>}
   */
  async extractCategories(fileContent, filePath) {
    const categories = [];
    
    try {
      // Extract from admin categories data
      const adminCategories = this.findAdminCategories(fileContent);
      categories.push(...adminCategories);

      // Extract from navigation components
      const navCategories = this.findNavigationCategories(fileContent);
      categories.push(...navCategories);

      // Extract from category components
      const componentCategories = this.findComponentCategories(fileContent);
      categories.push(...componentCategories);

      return categories;
    } catch (error) {
      this.addIssue(filePath, `Category extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Find admin categories from useAdminData hook
   * @param {string} content - File content
   * @returns {Category[]}
   */
  findAdminCategories(content) {
    const categories = [];
    
    // Look for categories array in admin data
    const categoryMatch = content.match(/const\s+\[categories[^\]]*\]\s*=\s*useState\(\[([\s\S]*?)\]\);/);
    if (categoryMatch) {
      try {
        const categoryData = this.manualParseCategoryArray(categoryMatch[0]);
        categories.push(...categoryData.map(item => ({
          id: item.slug || this.generateSlug(item.name),
          slug: item.slug || this.generateSlug(item.name),
          name: item.name,
          description: item.description || '',
          image: item.image || '',
          parentId: item.parentId || null,
          isActive: item.isActive !== false,
          sortOrder: item.sortOrder || 0
        })));
      } catch (error) {
        this.addIssue('admin-data', `Failed to parse admin categories: ${error.message}`);
      }
    }

    return categories;
  }

  /**
   * Find categories from navigation components
   * @param {string} content - File content
   * @returns {Category[]}
   */
  findNavigationCategories(content) {
    const categories = [];
    
    // Look for navigation menu items
    const navPatterns = [
      /nav.*?categories?\s*[:=]\s*\[([\s\S]*?)\]/gi,
      /menu.*?items?\s*[:=]\s*\[([\s\S]*?)\]/gi
    ];

    for (const pattern of navPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        try {
          const items = this.parseNavigationItems(match[1]);
          categories.push(...items);
        } catch (error) {
          // Skip malformed navigation data
        }
      }
    }

    return categories;
  }

  /**
   * Find categories from category components
   * @param {string} content - File content
   * @returns {Category[]}
   */
  findComponentCategories(content) {
    const categories = [];
    
    // Infer categories from product data
    const productCategories = new Set();
    
    // Extract category references from product arrays
    const categoryRefs = content.match(/category\s*:\s*['"`]([^'"`]+)['"`]/g) || [];
    for (const ref of categoryRefs) {
      const match = ref.match(/category\s*:\s*['"`]([^'"`]+)['"`]/);
      if (match) {
        productCategories.add(match[1]);
      }
    }

    // Convert to category objects
    for (const categoryName of productCategories) {
      categories.push({
        id: this.generateSlug(categoryName),
        slug: this.generateSlug(categoryName),
        name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
        description: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} products`,
        image: '',
        parentId: null,
        isActive: true,
        sortOrder: 0
      });
    }

    return categories;
  }

  /**
   * Parse navigation items into categories
   * @param {string} itemsStr - Navigation items string
   * @returns {Category[]}
   */
  parseNavigationItems(itemsStr) {
    const categories = [];
    const items = itemsStr.split(',');
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i].trim().replace(/['"`]/g, '');
      if (item && item !== 'Home' && item !== 'Contact' && item !== 'About') {
        categories.push({
          id: this.generateSlug(item),
          slug: this.generateSlug(item),
          name: item,
          description: `${item} category`,
          image: '',
          parentId: null,
          isActive: true,
          sortOrder: i
        });
      }
    }
    
    return categories;
  }

  /**
   * Manually parse category array
   * @param {string} arrayStr - Category array string
   * @returns {Array}
   */
  manualParseCategoryArray(arrayStr) {
    const categories = [];
    
    // Extract individual category objects
    const objectPattern = /{[^{}]*}/g;
    let match;
    
    while ((match = objectPattern.exec(arrayStr)) !== null) {
      try {
        const obj = this.parseObjectString(match[0]);
        if (obj && obj.name) {
          categories.push(obj);
        }
      } catch (error) {
        // Skip malformed objects
      }
    }
    
    return categories;
  }

  /**
   * Extract reviews from file content
   * @param {string} fileContent - File content to parse
   * @param {string} filePath - Source file path
   * @returns {Promise<Review[]>}
   */
  async extractReviews(fileContent, filePath) {
    const reviews = [];
    
    try {
      // Extract from review components
      const componentReviews = this.findComponentReviews(fileContent);
      reviews.push(...componentReviews);

      // Extract from test data
      const testReviews = this.findTestReviews(fileContent, filePath);
      reviews.push(...testReviews);

      return reviews;
    } catch (error) {
      this.addIssue(filePath, `Review extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract users from file content
   * @param {string} fileContent - File content to parse
   * @param {string} filePath - Source file path
   * @returns {Promise<User[]>}
   */
  async extractUsers(fileContent, filePath) {
    const users = [];
    
    try {
      // Extract from admin data
      const adminUsers = this.findAdminUsers(fileContent);
      users.push(...adminUsers);

      // Extract from auth components
      const authUsers = this.findAuthUsers(fileContent);
      users.push(...authUsers);

      return users;
    } catch (error) {
      this.addIssue(filePath, `User extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Find reviews from component data
   * @param {string} content - File content
   * @returns {Review[]}
   */
  findComponentReviews(content) {
    const reviews = [];
    
    // Look for review arrays
    const reviewPatterns = [
      /reviews?\s*[:=]\s*\[([\s\S]*?)\]/gi,
      /testimonials?\s*[:=]\s*\[([\s\S]*?)\]/gi
    ];

    for (const pattern of reviewPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        try {
          const reviewData = this.manualParseReviewArray(match[0]);
          reviews.push(...reviewData.map(item => ({
            id: this.generateId(),
            productId: item.productId || 'unknown',
            authorName: item.author || item.authorName || item.name || 'Anonymous',
            userId: item.userId || null,
            rating: this.parseRating(item.rating || item.stars),
            title: item.title || '',
            body: item.body || item.comment || item.review || '',
            date: item.date || new Date().toISOString(),
            verified: item.verified || false,
            helpfulCount: item.helpfulCount || 0,
            sample: false
          })));
        } catch (error) {
          // Skip malformed review data
        }
      }
    }

    return reviews;
  }

  /**
   * Find reviews from test data
   * @param {string} content - File content
   * @param {string} filePath - Source file path
   * @returns {Review[]}
   */
  findTestReviews(content, filePath) {
    const reviews = [];
    const isTestFile = filePath.includes('test') || filePath.includes('spec');
    
    if (isTestFile) {
      // Mark test reviews as sample data
      const testReviews = this.findComponentReviews(content);
      reviews.push(...testReviews.map(review => ({
        ...review,
        sample: true
      })));
    }

    return reviews;
  }

  /**
   * Find users from admin data
   * @param {string} content - File content
   * @returns {User[]}
   */
  findAdminUsers(content) {
    const users = [];
    
    // Look for admin profile data
    const adminProfileMatch = content.match(/adminProfileData[^{]*{([\s\S]*?)}/);
    if (adminProfileMatch) {
      try {
        const profileData = this.parseObjectString(`{${adminProfileMatch[1]}}`);
        users.push({
          id: this.generateId(),
          name: profileData.name || 'Admin User',
          email: profileData.email || 'admin@techverse.com',
          role: 'admin',
          password: 'CHANGE_ME',
          status: 'active',
          joinDate: new Date().toISOString(),
          permissions: profileData.permissions || ['users', 'products', 'orders', 'analytics', 'settings']
        });
      } catch (error) {
        this.addIssue('admin-data', `Failed to parse admin profile: ${error.message}`);
      }
    }

    // Look for users array in admin data
    const usersMatch = content.match(/const\s+\[users[^\]]*\]\s*=\s*useState\(\[([\s\S]*?)\]\);/);
    if (usersMatch) {
      try {
        const userData = this.manualParseUserArray(usersMatch[0]);
        users.push(...userData.map(item => ({
          id: this.generateId(),
          name: item.name,
          email: item.email,
          role: item.status === 'VIP' ? 'vip' : 'user',
          password: 'CHANGE_ME',
          status: item.status?.toLowerCase() || 'active',
          joinDate: item.joinDate || new Date().toISOString(),
          permissions: []
        })));
      } catch (error) {
        this.addIssue('admin-data', `Failed to parse admin users: ${error.message}`);
      }
    }

    return users;
  }

  /**
   * Find users from auth components
   * @param {string} content - File content
   * @returns {User[]}
   */
  findAuthUsers(content) {
    const users = [];
    
    // Look for sample user data in auth components
    const userPatterns = [
      /testUser\s*[:=]\s*{([\s\S]*?)}/gi,
      /sampleUser\s*[:=]\s*{([\s\S]*?)}/gi,
      /mockUser\s*[:=]\s*{([\s\S]*?)}/gi
    ];

    for (const pattern of userPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        try {
          const userData = this.parseObjectString(`{${match[1]}}`);
          users.push({
            id: this.generateId(),
            name: userData.name || userData.username || 'Test User',
            email: userData.email || 'test@example.com',
            role: userData.role || 'user',
            password: 'CHANGE_ME',
            status: 'active',
            joinDate: new Date().toISOString(),
            permissions: []
          });
        } catch (error) {
          // Skip malformed user data
        }
      }
    }

    return users;
  }

  /**
   * Parse rating value
   * @param {any} rating - Rating value
   * @returns {number}
   */
  parseRating(rating) {
    const parsed = parseFloat(rating);
    if (isNaN(parsed)) return 5;
    return Math.max(1, Math.min(5, parsed));
  }

  /**
   * Manually parse review array
   * @param {string} arrayStr - Review array string
   * @returns {Array}
   */
  manualParseReviewArray(arrayStr) {
    const reviews = [];
    const objectPattern = /{[^{}]*}/g;
    let match;
    
    while ((match = objectPattern.exec(arrayStr)) !== null) {
      try {
        const obj = this.parseObjectString(match[0]);
        if (obj && (obj.author || obj.authorName || obj.name)) {
          reviews.push(obj);
        }
      } catch (error) {
        // Skip malformed objects
      }
    }
    
    return reviews;
  }

  /**
   * Manually parse user array
   * @param {string} arrayStr - User array string
   * @returns {Array}
   */
  manualParseUserArray(arrayStr) {
    const users = [];
    const objectPattern = /{[^{}]*}/g;
    let match;
    
    while ((match = objectPattern.exec(arrayStr)) !== null) {
      try {
        const obj = this.parseObjectString(match[0]);
        if (obj && obj.name && obj.email) {
          users.push(obj);
        }
      } catch (error) {
        // Skip malformed objects
      }
    }
    
    return users;
  }

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Extract static pages from file content
   * @param {string} fileContent - File content to parse
   * @param {string} filePath - Source file path
   * @returns {Promise<Page[]>}
   */
  async extractPages(fileContent, filePath) {
    const pages = [];
    
    try {
      // Extract from info pages
      const infoPages = this.findInfoPages(fileContent, filePath);
      pages.push(...infoPages);

      // Extract from component content
      const componentPages = this.findComponentPages(fileContent, filePath);
      pages.push(...componentPages);

      return pages;
    } catch (error) {
      this.addIssue(filePath, `Page extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract settings from file content
   * @param {string} fileContent - File content to parse
   * @param {string} filePath - Source file path
   * @returns {Promise<Settings>}
   */
  async extractSettings(fileContent, filePath) {
    const settings = { homepage: {}, site: {} };
    
    try {
      // Extract homepage settings from Home.jsx
      if (filePath.includes('Home.jsx')) {
        settings.homepage = this.extractHomepageSettings(fileContent);
      }

      // Extract site settings from constants or config files
      const siteSettings = this.extractSiteSettings(fileContent);
      Object.assign(settings.site, siteSettings);

      return settings;
    } catch (error) {
      this.addIssue(filePath, `Settings extraction failed: ${error.message}`);
      return settings;
    }
  }

  /**
   * Extract stores from file content
   * @param {string} fileContent - File content to parse
   * @param {string} filePath - Source file path
   * @returns {Promise<Store[]>}
   */
  async extractStores(fileContent, filePath) {
    const stores = [];
    
    try {
      // Look for store/location data
      const storeData = this.findStoreData(fileContent);
      stores.push(...storeData);

      return stores;
    } catch (error) {
      this.addIssue(filePath, `Store extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Find info pages content
   * @param {string} content - File content
   * @param {string} filePath - Source file path
   * @returns {Page[]}
   */
  findInfoPages(content, filePath) {
    const pages = [];
    const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
    
    // Map file names to page types
    const pageTypes = {
      'terms': { slug: 'terms', title: 'Terms of Service' },
      'privacy': { slug: 'privacy', title: 'Privacy Policy' },
      'delivery': { slug: 'delivery', title: 'Delivery Information' },
      'returns': { slug: 'returns', title: 'Returns Policy' },
      'faq': { slug: 'faq', title: 'Frequently Asked Questions' },
      'about': { slug: 'about', title: 'About Us' },
      'contact': { slug: 'contact', title: 'Contact Us' }
    };

    const pageType = pageTypes[fileName];
    if (pageType) {
      const sections = this.extractPageSections(content);
      pages.push({
        id: pageType.slug,
        slug: pageType.slug,
        title: pageType.title,
        sections,
        meta: {
          title: pageType.title,
          description: `${pageType.title} page content`
        }
      });
    }

    return pages;
  }

  /**
   * Find component pages
   * @param {string} content - File content
   * @param {string} filePath - Source file path
   * @returns {Page[]}
   */
  findComponentPages(content, filePath) {
    const pages = [];
    
    // Look for static content in components
    const contentPatterns = [
      /const\s+content\s*=\s*['"`]([\s\S]*?)['"`]/gi,
      /const\s+text\s*=\s*['"`]([\s\S]*?)['"`]/gi
    ];

    for (const pattern of contentPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const contentText = match[1];
        if (contentText.length > 100) { // Only substantial content
          const slug = this.generateSlug(path.basename(filePath, path.extname(filePath)));
          pages.push({
            id: slug,
            slug,
            title: this.titleCase(slug.replace(/-/g, ' ')),
            sections: [{
              heading: 'Content',
              html: contentText
            }],
            meta: {
              title: this.titleCase(slug.replace(/-/g, ' ')),
              description: 'Page content'
            }
          });
        }
      }
    }

    return pages;
  }

  /**
   * Extract homepage settings from Home.jsx
   * @param {string} content - File content
   * @returns {Object}
   */
  extractHomepageSettings(content) {
    const settings = {};
    
    // Extract component references to infer homepage sections
    const components = content.match(/<(\w+)\s*\/>/g) || [];
    
    for (const component of components) {
      const componentName = component.match(/<(\w+)/)[1];
      
      switch (componentName) {
        case 'LatestProducts':
          settings.latestProducts = ['ultra-hd-qled', 'tablet-pro', 'phone-15'];
          break;
        case 'TopSellerProducts':
          settings.topSellers = ['laptop-pro', 'phone-air'];
          break;
        case 'QuickPicks':
          settings.quickPicks = ['ultra-hd-qled', 'tablet-pro', 'phone-15', 'laptop-pro'];
          break;
        case 'WeeklyDeals':
          settings.weeklyDeals = ['hd-tv-plus'];
          break;
      }
    }

    return settings;
  }

  /**
   * Extract site settings
   * @param {string} content - File content
   * @returns {Object}
   */
  extractSiteSettings(content) {
    const settings = {};
    
    // Look for currency settings
    const currencyMatch = content.match(/currency\s*[:=]\s*['"`]([^'"`]+)['"`]/i);
    if (currencyMatch) {
      settings.currency = currencyMatch[1];
    }

    // Look for default values
    const stockMatch = content.match(/defaultStock\s*[:=]\s*(\d+)/i);
    if (stockMatch) {
      settings.defaultStock = parseInt(stockMatch[1]);
    }

    // Set defaults if not found
    if (!settings.currency) settings.currency = 'USD';
    if (!settings.defaultStock) settings.defaultStock = 50;
    if (!settings.lowStockThreshold) settings.lowStockThreshold = 10;

    return settings;
  }

  /**
   * Find store data
   * @param {string} content - File content
   * @returns {Store[]}
   */
  findStoreData(content) {
    const stores = [];
    
    // Look for store/location arrays
    const storePatterns = [
      /stores?\s*[:=]\s*\[([\s\S]*?)\]/gi,
      /locations?\s*[:=]\s*\[([\s\S]*?)\]/gi
    ];

    for (const pattern of storePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        try {
          const storeData = this.manualParseStoreArray(match[0]);
          stores.push(...storeData.map(item => ({
            id: this.generateId(),
            city: item.city || '',
            district: item.district || '',
            address: item.address || '',
            phone: item.phone || '',
            hours: item.hours || '',
            directionsLink: item.directionsLink || item.directions || ''
          })));
        } catch (error) {
          // Skip malformed store data
        }
      }
    }

    return stores;
  }

  /**
   * Extract page sections from content
   * @param {string} content - File content
   * @returns {Array}
   */
  extractPageSections(content) {
    const sections = [];
    
    // Look for JSX content sections
    const sectionPatterns = [
      /<section[^>]*>([\s\S]*?)<\/section>/gi,
      /<div[^>]*className="[^"]*section[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ];

    for (const pattern of sectionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const sectionContent = match[1];
        const headingMatch = sectionContent.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
        
        sections.push({
          heading: headingMatch ? headingMatch[1] : 'Section',
          html: sectionContent.trim()
        });
      }
    }

    // If no sections found, create a default section
    if (sections.length === 0) {
      sections.push({
        heading: 'Content',
        html: 'Page content to be added'
      });
    }

    return sections;
  }

  /**
   * Manually parse store array
   * @param {string} arrayStr - Store array string
   * @returns {Array}
   */
  manualParseStoreArray(arrayStr) {
    const stores = [];
    const objectPattern = /{[^{}]*}/g;
    let match;
    
    while ((match = objectPattern.exec(arrayStr)) !== null) {
      try {
        const obj = this.parseObjectString(match[0]);
        if (obj && (obj.city || obj.name)) {
          stores.push(obj);
        }
      } catch (error) {
        // Skip malformed objects
      }
    }
    
    return stores;
  }

  /**
   * Convert string to title case
   * @param {string} str - String to convert
   * @returns {string}
   */
  titleCase(str) {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Add issue to tracking
   * @param {string} filePath - Source file path
   * @param {string} message - Issue message
   */
  addIssue(filePath, message) {
    this.issues.push({
      file: filePath,
      message,
      timestamp: new Date().toISOString()
    });
  }
}