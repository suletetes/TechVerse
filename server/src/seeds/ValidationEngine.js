/**
 * Validation Engine - Ensures data integrity, normalizes formats, and handles duplicates
 */
export class ValidationEngine {
  constructor(config = {}) {
    this.config = {
      defaultCurrency: config.defaultCurrency || 'USD',
      defaultStock: config.defaultStock || 50,
      generatePlaceholders: config.generatePlaceholders !== false,
      replaceLorem: config.replaceLorem !== false,
      ...config
    };
    this.issues = [];
  }

  /**
   * Validate product data
   * @param {Object} product - Product to validate
   * @returns {ValidationResult}
   */
  validateProduct(product) {
    const errors = [];
    const warnings = [];
    const normalized = { ...product };

    // Required fields validation
    if (!product.name || product.name.trim() === '') {
      errors.push('Product name is required');
    }

    if (typeof product.price !== 'number' || product.price < 0) {
      if (product.price === undefined || product.price === null) {
        errors.push('Product price is required');
      } else {
        errors.push('Product price must be a positive number');
      }
    }

    if (!product.category || product.category.trim() === '') {
      warnings.push('Product category is missing, using "general"');
      normalized.category = 'general';
    }

    // Normalize fields
    normalized.slug = this.normalizeSlug(product.name || product.slug);
    normalized.price = this.normalizePrice(product.price, product.currency);
    normalized.currency = this.normalizeCurrency(product.currency);
    normalized.stock = this.normalizeStock(product.stock);
    normalized.status = this.normalizeStatus(product.status);
    normalized.images = this.normalizeImages(product.images);
    normalized.createdAt = this.normalizeDate(product.createdAt);
    normalized.updatedAt = this.normalizeDate(product.updatedAt);

    // Generate missing fields
    if (!normalized.id) {
      normalized.id = normalized.slug;
    }

    if (!normalized.shortDescription && this.config.generatePlaceholders) {
      normalized.shortDescription = `${normalized.name} - Premium quality product`;
      warnings.push('Generated placeholder short description');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      normalized
    };
  }

  /**
   * Validate category data
   * @param {Object} category - Category to validate
   * @returns {ValidationResult}
   */
  validateCategory(category) {
    const errors = [];
    const warnings = [];
    const normalized = { ...category };

    // Required fields validation
    if (!category.name || category.name.trim() === '') {
      errors.push('Category name is required');
    }

    // Normalize fields
    normalized.slug = this.normalizeSlug(category.name || category.slug);
    normalized.name = category.name?.trim();
    normalized.isActive = category.isActive !== false;
    normalized.sortOrder = typeof category.sortOrder === 'number' ? category.sortOrder : 0;

    // Generate missing fields
    if (!normalized.id) {
      normalized.id = normalized.slug;
    }

    if (!normalized.description && this.config.generatePlaceholders) {
      normalized.description = `${normalized.name} products and accessories`;
      warnings.push('Generated placeholder description');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      normalized
    };
  }

  /**
   * Validate review data
   * @param {Object} review - Review to validate
   * @returns {ValidationResult}
   */
  validateReview(review) {
    const errors = [];
    const warnings = [];
    const normalized = { ...review };

    // Required fields validation
    if (!review.authorName || review.authorName.trim() === '') {
      errors.push('Review author name is required');
    }

    if (!review.body || review.body.trim() === '') {
      errors.push('Review body is required');
    }

    if (typeof review.rating !== 'number' || review.rating < 1 || review.rating > 5) {
      errors.push('Review rating must be between 1 and 5');
    }

    // Normalize fields
    normalized.rating = Math.max(1, Math.min(5, Math.round(review.rating || 5)));
    normalized.date = this.normalizeDate(review.date);
    normalized.verified = Boolean(review.verified);
    normalized.helpfulCount = Math.max(0, parseInt(review.helpfulCount) || 0);
    normalized.sample = Boolean(review.sample);

    // Generate missing fields
    if (!normalized.id) {
      normalized.id = this.generateId();
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      normalized
    };
  }

  /**
   * Validate user data
   * @param {Object} user - User to validate
   * @returns {ValidationResult}
   */
  validateUser(user) {
    const errors = [];
    const warnings = [];
    const normalized = { ...user };

    // Required fields validation
    if (!user.name || user.name.trim() === '') {
      errors.push('User name is required');
    }

    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push('Valid user email is required');
    }

    // Normalize fields
    normalized.name = user.name?.trim();
    normalized.email = user.email?.toLowerCase().trim();
    normalized.role = user.role || 'user';
    normalized.status = user.status || 'active';
    normalized.joinDate = this.normalizeDate(user.joinDate);
    normalized.permissions = Array.isArray(user.permissions) ? user.permissions : [];

    // Generate missing fields
    if (!normalized.id) {
      normalized.id = this.generateId();
    }

    if (normalized.password === 'CHANGE_ME') {
      warnings.push('User has placeholder password - requires password reset');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      normalized
    };
  }

  /**
   * Validate page data
   * @param {Object} page - Page to validate
   * @returns {ValidationResult}
   */
  validatePage(page) {
    const errors = [];
    const warnings = [];
    const normalized = { ...page };

    // Required fields validation
    if (!page.title || page.title.trim() === '') {
      errors.push('Page title is required');
    }

    if (!page.slug || page.slug.trim() === '') {
      errors.push('Page slug is required');
    }

    // Normalize fields
    normalized.slug = this.normalizeSlug(page.slug);
    normalized.title = page.title?.trim();
    normalized.sections = Array.isArray(page.sections) ? page.sections : [];
    normalized.meta = page.meta || {};

    // Generate missing fields
    if (!normalized.id) {
      normalized.id = normalized.slug;
    }

    if (!normalized.meta.title) {
      normalized.meta.title = normalized.title;
    }

    if (!normalized.meta.description) {
      normalized.meta.description = `${normalized.title} page`;
    }

    // Check for Lorem ipsum content
    if (this.config.replaceLorem) {
      normalized.sections = normalized.sections.map(section => {
        if (this.isLoremIpsum(section.html)) {
          warnings.push(`Replaced Lorem ipsum content in section: ${section.heading}`);
          return {
            ...section,
            html: this.generateRealisticContent(section.heading)
          };
        }
        return section;
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      normalized
    };
  }

  /**
   * Normalize price value
   * @param {any} price - Price to normalize
   * @param {string} currency - Currency context
   * @returns {number}
   */
  normalizePrice(price, currency) {
    if (typeof price === 'number') return Math.max(0, price);
    
    if (typeof price === 'string') {
      const cleaned = price.replace(/[£$€,\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    
    return 0;
  }

  /**
   * Normalize currency code
   * @param {string} currency - Currency to normalize
   * @returns {string}
   */
  normalizeCurrency(currency) {
    if (!currency) return this.config.defaultCurrency;
    
    const currencyMap = {
      '$': 'USD',
      '£': 'GBP',
      '€': 'EUR',
      'usd': 'USD',
      'gbp': 'GBP',
      'eur': 'EUR'
    };
    
    const normalized = currencyMap[currency.toLowerCase()] || currency.toUpperCase();
    return ['USD', 'GBP', 'EUR'].includes(normalized) ? normalized : this.config.defaultCurrency;
  }

  /**
   * Normalize date to ISO format
   * @param {any} date - Date to normalize
   * @returns {string}
   */
  normalizeDate(date) {
    if (!date) return new Date().toISOString();
    
    if (date instanceof Date) return date.toISOString();
    
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    }
    
    return new Date().toISOString();
  }

  /**
   * Normalize slug to URL-safe format
   * @param {string} text - Text to slugify
   * @returns {string}
   */
  normalizeSlug(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Normalize stock value
   * @param {any} stock - Stock to normalize
   * @returns {number}
   */
  normalizeStock(stock) {
    const parsed = parseInt(stock);
    return isNaN(parsed) ? this.config.defaultStock : Math.max(0, parsed);
  }

  /**
   * Normalize status value
   * @param {string} status - Status to normalize
   * @returns {string}
   */
  normalizeStatus(status) {
    const validStatuses = ['active', 'inactive', 'low_stock', 'out_of_stock'];
    const normalized = status?.toLowerCase().replace(/\s+/g, '_');
    return validStatuses.includes(normalized) ? normalized : 'active';
  }

  /**
   * Normalize images array
   * @param {any} images - Images to normalize
   * @returns {string[]}
   */
  normalizeImages(images) {
    if (!images) return [];
    
    const imageArray = Array.isArray(images) ? images : [images];
    return imageArray
      .filter(img => typeof img === 'string' && img.trim() !== '')
      .map(img => img.startsWith('/') ? img : `/${img}`)
      .filter(img => !img.endsWith('.svg')); // Exclude SVG files
  }

  /**
   * Check if email is valid
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if content is Lorem ipsum
   * @param {string} content - Content to check
   * @returns {boolean}
   */
  isLoremIpsum(content) {
    const loremIndicators = ['lorem ipsum', 'dolor sit amet', 'consectetur adipiscing'];
    const contentLower = content.toLowerCase();
    return loremIndicators.some(indicator => contentLower.includes(indicator));
  }

  /**
   * Generate realistic content
   * @param {string} heading - Section heading for context
   * @returns {string}
   */
  generateRealisticContent(heading) {
    const contentMap = {
      'terms': 'These terms and conditions govern your use of our website and services.',
      'privacy': 'We are committed to protecting your privacy and personal information.',
      'delivery': 'We offer fast and reliable delivery options for all orders.',
      'returns': 'You may return items within 30 days of purchase for a full refund.',
      'faq': 'Find answers to commonly asked questions about our products and services.',
      'about': 'We are dedicated to providing high-quality technology products.',
      'contact': 'Get in touch with our customer service team for assistance.'
    };
    
    const headingLower = heading.toLowerCase();
    for (const [key, content] of Object.entries(contentMap)) {
      if (headingLower.includes(key)) {
        return `<p>${content}</p>`;
      }
    }
    
    return '<p>Content to be added by the content team.</p>';
  }

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Deduplicate products by slug
   * @param {Product[]} products - Products to deduplicate
   * @returns {Product[]}
   */
  deduplicateProducts(products) {
    const seen = new Map();
    const duplicates = [];
    const unique = [];

    for (const product of products) {
      const key = product.slug || this.normalizeSlug(product.name);
      
      if (seen.has(key)) {
        const existing = seen.get(key);
        const merged = this.mergeProducts(existing, product);
        seen.set(key, merged);
        duplicates.push({
          slug: key,
          existing: existing.name,
          duplicate: product.name,
          action: 'merged'
        });
      } else {
        seen.set(key, product);
        unique.push(product);
      }
    }

    // Replace unique products with merged versions
    for (let i = 0; i < unique.length; i++) {
      const key = unique[i].slug || this.normalizeSlug(unique[i].name);
      if (seen.has(key)) {
        unique[i] = seen.get(key);
      }
    }

    if (duplicates.length > 0) {
      this.addIssue('deduplication', `Found ${duplicates.length} duplicate products`);
    }

    return unique;
  }

  /**
   * Deduplicate categories by slug
   * @param {Category[]} categories - Categories to deduplicate
   * @returns {Category[]}
   */
  deduplicateCategories(categories) {
    const seen = new Map();
    const duplicates = [];
    const unique = [];

    for (const category of categories) {
      const key = category.slug || this.normalizeSlug(category.name);
      
      if (seen.has(key)) {
        const existing = seen.get(key);
        const merged = this.mergeCategories(existing, category);
        seen.set(key, merged);
        duplicates.push({
          slug: key,
          existing: existing.name,
          duplicate: category.name,
          action: 'merged'
        });
      } else {
        seen.set(key, category);
        unique.push(category);
      }
    }

    // Replace unique categories with merged versions
    for (let i = 0; i < unique.length; i++) {
      const key = unique[i].slug || this.normalizeSlug(unique[i].name);
      if (seen.has(key)) {
        unique[i] = seen.get(key);
      }
    }

    if (duplicates.length > 0) {
      this.addIssue('deduplication', `Found ${duplicates.length} duplicate categories`);
    }

    return unique;
  }

  /**
   * Deduplicate users by email
   * @param {User[]} users - Users to deduplicate
   * @returns {User[]}
   */
  deduplicateUsers(users) {
    const seen = new Map();
    const duplicates = [];
    const unique = [];

    for (const user of users) {
      const key = user.email?.toLowerCase();
      
      if (!key) {
        unique.push(user);
        continue;
      }
      
      if (seen.has(key)) {
        const existing = seen.get(key);
        const merged = this.mergeUsers(existing, user);
        seen.set(key, merged);
        duplicates.push({
          email: key,
          existing: existing.name,
          duplicate: user.name,
          action: 'merged'
        });
      } else {
        seen.set(key, user);
        unique.push(user);
      }
    }

    // Replace unique users with merged versions
    for (let i = 0; i < unique.length; i++) {
      const key = unique[i].email?.toLowerCase();
      if (key && seen.has(key)) {
        unique[i] = seen.get(key);
      }
    }

    if (duplicates.length > 0) {
      this.addIssue('deduplication', `Found ${duplicates.length} duplicate users`);
    }

    return unique;
  }

  /**
   * Merge two products, preferring more complete data
   * @param {Product} existing - Existing product
   * @param {Product} duplicate - Duplicate product
   * @returns {Product}
   */
  mergeProducts(existing, duplicate) {
    return {
      ...existing,
      // Prefer non-empty values from either product
      name: duplicate.name || existing.name,
      shortDescription: duplicate.shortDescription || existing.shortDescription,
      longDescription: duplicate.longDescription || existing.longDescription,
      price: duplicate.price || existing.price,
      currency: duplicate.currency || existing.currency,
      // Merge image arrays
      images: [...new Set([...existing.images || [], ...duplicate.images || []])],
      // Prefer more specific category
      category: duplicate.category !== 'general' ? duplicate.category : existing.category,
      // Merge specs objects
      specs: { ...existing.specs, ...duplicate.specs },
      // Use higher stock value
      stock: Math.max(existing.stock || 0, duplicate.stock || 0),
      // Merge boolean flags (OR operation)
      featured: existing.featured || duplicate.featured,
      topSeller: existing.topSeller || duplicate.topSeller,
      quickPick: existing.quickPick || duplicate.quickPick,
      weeklyDeal: existing.weeklyDeal || duplicate.weeklyDeal,
      // Merge tags
      tags: [...new Set([...existing.tags || [], ...duplicate.tags || []])],
      // Keep earlier creation date
      createdAt: existing.createdAt < duplicate.createdAt ? existing.createdAt : duplicate.createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Merge two categories, preferring more complete data
   * @param {Category} existing - Existing category
   * @param {Category} duplicate - Duplicate category
   * @returns {Category}
   */
  mergeCategories(existing, duplicate) {
    return {
      ...existing,
      name: duplicate.name || existing.name,
      description: duplicate.description || existing.description,
      image: duplicate.image || existing.image,
      parentId: duplicate.parentId || existing.parentId,
      isActive: existing.isActive && duplicate.isActive,
      sortOrder: Math.min(existing.sortOrder || 999, duplicate.sortOrder || 999)
    };
  }

  /**
   * Merge two users, preferring more complete data
   * @param {User} existing - Existing user
   * @param {User} duplicate - Duplicate user
   * @returns {User}
   */
  mergeUsers(existing, duplicate) {
    return {
      ...existing,
      name: duplicate.name || existing.name,
      role: duplicate.role === 'admin' ? 'admin' : existing.role,
      status: existing.status === 'active' ? existing.status : duplicate.status,
      // Merge permissions arrays
      permissions: [...new Set([...existing.permissions || [], ...duplicate.permissions || []])],
      // Keep earlier join date
      joinDate: existing.joinDate < duplicate.joinDate ? existing.joinDate : duplicate.joinDate
    };
  }

  /**
   * Validate foreign key relationships
   * @param {Object} data - All extracted data
   * @returns {Object} Validation results with relationship issues
   */
  validateRelationships(data) {
    const issues = [];
    const { products, categories, reviews, users } = data;

    // Create lookup maps
    const categoryMap = new Map(categories.map(cat => [cat.slug, cat]));
    const productMap = new Map(products.map(prod => [prod.slug, prod]));
    const userMap = new Map(users.map(user => [user.id, user]));

    // Validate product -> category relationships
    for (const product of products) {
      if (product.category && !categoryMap.has(product.category)) {
        issues.push({
          type: 'missing_category',
          product: product.slug,
          category: product.category,
          suggestion: 'Create category or update product category'
        });
      }
    }

    // Validate review -> product relationships
    for (const review of reviews) {
      if (review.productId && !productMap.has(review.productId)) {
        issues.push({
          type: 'missing_product',
          review: review.id,
          product: review.productId,
          suggestion: 'Create product or update review product reference'
        });
      }

      if (review.userId && !userMap.has(review.userId)) {
        issues.push({
          type: 'missing_user',
          review: review.id,
          user: review.userId,
          suggestion: 'Create user or remove user reference'
        });
      }
    }

    // Validate category parent relationships
    for (const category of categories) {
      if (category.parentId && !categoryMap.has(category.parentId)) {
        issues.push({
          type: 'missing_parent_category',
          category: category.slug,
          parent: category.parentId,
          suggestion: 'Create parent category or remove parent reference'
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Add issue to tracking
   * @param {string} context - Issue context
   * @param {string} message - Issue message
   */
  addIssue(context, message) {
    this.issues.push({
      context,
      message,
      timestamp: new Date().toISOString()
    });
  }
}