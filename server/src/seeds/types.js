/**
 * Type definitions for the Frontend Data Extraction System
 */

/**
 * @typedef {Object} Product
 * @property {string} id - Unique identifier (slug-based)
 * @property {string} slug - URL-safe unique identifier
 * @property {string} name - Product name
 * @property {string} [shortDescription] - Brief product description
 * @property {string} [longDescription] - Detailed product description
 * @property {string} [longDescriptionHtml] - HTML formatted description
 * @property {number} price - Product price
 * @property {string} currency - Currency code (ISO 4217)
 * @property {string[]} images - Array of image paths
 * @property {string} category - Category slug reference
 * @property {ProductVariant[]} [variants] - Product variants
 * @property {Object} [specs] - Product specifications
 * @property {number} stock - Stock quantity
 * @property {string} status - Product status (active, inactive, low_stock, out_of_stock)
 * @property {boolean} featured - Featured product flag
 * @property {boolean} topSeller - Top seller flag
 * @property {boolean} quickPick - Quick pick flag
 * @property {boolean} weeklyDeal - Weekly deal flag
 * @property {string[]} tags - Product tags
 * @property {string} createdAt - Creation date (ISO 8601)
 * @property {string} updatedAt - Last update date (ISO 8601)
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} sku - Stock keeping unit
 * @property {string} name - Variant name
 * @property {number} [price] - Variant-specific price
 * @property {number} stock - Variant stock
 * @property {string} [image] - Variant-specific image
 */

/**
 * @typedef {Object} Category
 * @property {string} id - Unique identifier (slug-based)
 * @property {string} slug - URL-safe unique identifier
 * @property {string} name - Category name
 * @property {string} [description] - Category description
 * @property {string} [image] - Category image path
 * @property {string} [parentId] - Parent category ID
 * @property {boolean} isActive - Active status
 * @property {number} sortOrder - Display order
 */

/**
 * @typedef {Object} Review
 * @property {string} id - Unique identifier
 * @property {string} productId - Product ID reference
 * @property {string} authorName - Review author name
 * @property {string} [userId] - User ID reference
 * @property {number} rating - Rating (1-5)
 * @property {string} [title] - Review title
 * @property {string} body - Review content
 * @property {string} date - Review date (ISO 8601)
 * @property {boolean} verified - Verified purchase flag
 * @property {number} helpfulCount - Helpful votes count
 * @property {boolean} sample - Sample data flag
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} name - User full name
 * @property {string} email - User email address
 * @property {string} role - User role (admin, user)
 * @property {string} password - Password placeholder
 * @property {string} status - User status
 * @property {string} joinDate - Join date (ISO 8601)
 * @property {string[]} [permissions] - User permissions
 */

/**
 * @typedef {Object} Page
 * @property {string} id - Unique identifier (slug-based)
 * @property {string} slug - URL-safe unique identifier
 * @property {string} title - Page title
 * @property {PageSection[]} sections - Page content sections
 * @property {PageMeta} meta - Page metadata
 */

/**
 * @typedef {Object} PageSection
 * @property {string} heading - Section heading
 * @property {string} html - Section HTML content
 */

/**
 * @typedef {Object} PageMeta
 * @property {string} title - Meta title
 * @property {string} description - Meta description
 */

/**
 * @typedef {Object} Store
 * @property {string} id - Unique identifier
 * @property {string} city - Store city
 * @property {string} district - Store district
 * @property {string} address - Store address
 * @property {string} phone - Store phone number
 * @property {string} hours - Store hours
 * @property {string} [directionsLink] - Directions URL
 */

/**
 * @typedef {Object} Settings
 * @property {HomepageSettings} homepage - Homepage configuration
 * @property {SiteSettings} site - Site-wide settings
 */

/**
 * @typedef {Object} HomepageSettings
 * @property {string[]} latestProducts - Latest products slugs
 * @property {string[]} topSellers - Top sellers slugs
 * @property {string[]} quickPicks - Quick picks slugs
 * @property {string[]} weeklyDeals - Weekly deals slugs
 */

/**
 * @typedef {Object} SiteSettings
 * @property {string} currency - Default currency
 * @property {number} defaultStock - Default stock value
 * @property {number} lowStockThreshold - Low stock threshold
 */

/**
 * @typedef {Object} ExtractionConfig
 * @property {string} clientPath - Client directory path
 * @property {string} serverPath - Server directory path
 * @property {string[]} excludePatterns - Exclude patterns
 * @property {number} maxDepth - Maximum scan depth
 * @property {boolean} copyAssets - Copy assets flag
 * @property {ValidationConfig} validation - Validation configuration
 */

/**
 * @typedef {Object} ValidationConfig
 * @property {string} defaultCurrency - Default currency code
 * @property {number} defaultStock - Default stock value
 * @property {boolean} generatePlaceholders - Generate placeholder content
 * @property {boolean} replaceLorem - Replace Lorem ipsum text
 */

/**
 * @typedef {Object} ScanResult
 * @property {string[]} componentFiles - Component file paths
 * @property {string[]} assetFiles - Asset file paths
 * @property {string[]} dataFiles - Data file paths
 * @property {Object} stats - Scan statistics
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {Product[]} products - Extracted products
 * @property {Category[]} categories - Extracted categories
 * @property {Review[]} reviews - Extracted reviews
 * @property {User[]} users - Extracted users
 * @property {Page[]} pages - Extracted pages
 * @property {Store[]} stores - Extracted stores
 * @property {Settings} settings - Extracted settings
 * @property {string[]} issues - Extraction issues
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Validation success
 * @property {string[]} errors - Validation errors
 * @property {string[]} warnings - Validation warnings
 * @property {Object} normalized - Normalized data
 */

/**
 * @typedef {Object} AssetReport
 * @property {string[]} found - Found asset paths
 * @property {string[]} missing - Missing asset paths
 * @property {string[]} copied - Copied asset paths
 * @property {Object} suggestions - Fallback suggestions
 */

export {
  // Type definitions are exported as JSDoc comments for runtime use
};