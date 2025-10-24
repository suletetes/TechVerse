import fs from 'fs/promises';
import path from 'path';

/**
 * Seed Generator - Creates structured JSON files for database seeding
 */
export class SeedGenerator {
  constructor(outputPath) {
    this.outputPath = path.resolve(outputPath);
  }

  /**
   * Generate product seeds
   * @param {Product[]} products - Products to generate seeds for
   * @returns {Product[]} Formatted product seeds
   */
  generateProductSeeds(products) {
    return products.map(product => ({
      id: product.id || product.slug,
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription || '',
      longDescription: product.longDescription || '',
      longDescriptionHtml: product.longDescriptionHtml || product.longDescription || '',
      price: product.price,
      currency: product.currency || 'USD',
      images: product.images || [],
      category: product.category,
      variants: product.variants || [],
      specs: product.specs || {},
      stock: product.stock || 50,
      status: product.status || 'active',
      featured: Boolean(product.featured),
      topSeller: Boolean(product.topSeller),
      quickPick: Boolean(product.quickPick),
      weeklyDeal: Boolean(product.weeklyDeal),
      tags: product.tags || [],
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: product.updatedAt || new Date().toISOString()
    }));
  }

  /**
   * Generate category seeds
   * @param {Category[]} categories - Categories to generate seeds for
   * @returns {Category[]} Formatted category seeds
   */
  generateCategorySeeds(categories) {
    return categories.map(category => ({
      id: category.id || category.slug,
      slug: category.slug,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      parentId: category.parentId || null,
      isActive: category.isActive !== false,
      sortOrder: category.sortOrder || 0
    }));
  }

  /**
   * Generate review seeds
   * @param {Review[]} reviews - Reviews to generate seeds for
   * @returns {Review[]} Formatted review seeds
   */
  generateReviewSeeds(reviews) {
    return reviews.map(review => ({
      id: review.id,
      productId: review.productId,
      authorName: review.authorName,
      userId: review.userId || null,
      rating: review.rating,
      title: review.title || '',
      body: review.body,
      date: review.date || new Date().toISOString(),
      verified: Boolean(review.verified),
      helpfulCount: review.helpfulCount || 0,
      sample: Boolean(review.sample)
    }));
  }

  /**
   * Generate user seeds
   * @param {User[]} users - Users to generate seeds for
   * @returns {User[]} Formatted user seeds
   */
  generateUserSeeds(users) {
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      password: user.password || 'CHANGE_ME',
      status: user.status || 'active',
      joinDate: user.joinDate || new Date().toISOString(),
      permissions: user.permissions || []
    }));
  }

  /**
   * Generate page seeds
   * @param {Page[]} pages - Pages to generate seeds for
   * @returns {Page[]} Formatted page seeds
   */
  generatePageSeeds(pages) {
    return pages.map(page => ({
      id: page.id || page.slug,
      slug: page.slug,
      title: page.title,
      sections: page.sections || [],
      meta: {
        title: page.meta?.title || page.title,
        description: page.meta?.description || `${page.title} page`
      }
    }));
  }

  /**
   * Generate store seeds
   * @param {Store[]} stores - Stores to generate seeds for
   * @returns {Store[]} Formatted store seeds
   */
  generateStoreSeeds(stores) {
    return stores.map(store => ({
      id: store.id,
      city: store.city,
      district: store.district || '',
      address: store.address || '',
      phone: store.phone || '',
      hours: store.hours || '',
      directionsLink: store.directionsLink || ''
    }));
  }

  /**
   * Generate settings seeds
   * @param {Settings} settings - Settings to generate seeds for
   * @returns {Settings} Formatted settings seeds
   */
  generateSettingsSeeds(settings) {
    return {
      homepage: {
        latestProducts: settings.homepage?.latestProducts || [],
        topSellers: settings.homepage?.topSellers || [],
        quickPicks: settings.homepage?.quickPicks || [],
        weeklyDeals: settings.homepage?.weeklyDeals || []
      },
      site: {
        currency: settings.site?.currency || 'USD',
        defaultStock: settings.site?.defaultStock || 50,
        lowStockThreshold: settings.site?.lowStockThreshold || 10
      }
    };
  }

  /**
   * Generate combined seed file
   * @param {Object} allData - All extracted data
   * @returns {Object} Combined seed data
   */
  generateCombinedSeed(allData) {
    return {
      products: this.generateProductSeeds(allData.products || []),
      categories: this.generateCategorySeeds(allData.categories || []),
      reviews: this.generateReviewSeeds(allData.reviews || []),
      users: this.generateUserSeeds(allData.users || []),
      pages: this.generatePageSeeds(allData.pages || []),
      stores: this.generateStoreSeeds(allData.stores || []),
      settings: this.generateSettingsSeeds(allData.settings || {})
    };
  }

  /**
   * Write seeds to file
   * @param {any} seedData - Data to write
   * @param {string} filename - Output filename
   * @returns {Promise<void>}
   */
  async writeSeeds(seedData, filename) {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputPath, { recursive: true });

      const filePath = path.join(this.outputPath, filename);
      const jsonContent = JSON.stringify(seedData, null, 2);
      
      await fs.writeFile(filePath, jsonContent, 'utf-8');
      
      return {
        success: true,
        filePath,
        size: jsonContent.length,
        records: Array.isArray(seedData) ? seedData.length : 1
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        filename
      };
    }
  }

  /**
   * Generate all seed files
   * @param {Object} extractedData - All extracted data
   * @returns {Promise<Object>} Generation results
   */
  async generateAllSeeds(extractedData) {
    const results = {
      success: [],
      failed: [],
      summary: {}
    };

    // Generate individual seed files
    const seedTypes = [
      { name: 'products', data: this.generateProductSeeds(extractedData.products || []) },
      { name: 'categories', data: this.generateCategorySeeds(extractedData.categories || []) },
      { name: 'reviews', data: this.generateReviewSeeds(extractedData.reviews || []) },
      { name: 'users', data: this.generateUserSeeds(extractedData.users || []) },
      { name: 'pages', data: this.generatePageSeeds(extractedData.pages || []) },
      { name: 'stores', data: this.generateStoreSeeds(extractedData.stores || []) },
      { name: 'settings', data: this.generateSettingsSeeds(extractedData.settings || {}) }
    ];

    for (const seedType of seedTypes) {
      const result = await this.writeSeeds(seedType.data, `${seedType.name}.json`);
      
      if (result.success) {
        results.success.push({
          type: seedType.name,
          file: result.filePath,
          records: result.records,
          size: result.size
        });
        results.summary[seedType.name] = result.records;
      } else {
        results.failed.push({
          type: seedType.name,
          error: result.error
        });
      }
    }

    // Generate combined seed file
    const combinedData = this.generateCombinedSeed(extractedData);
    const combinedResult = await this.writeSeeds(combinedData, 'initial_seed.json');
    
    if (combinedResult.success) {
      results.success.push({
        type: 'combined',
        file: combinedResult.filePath,
        records: 'all',
        size: combinedResult.size
      });
    } else {
      results.failed.push({
        type: 'combined',
        error: combinedResult.error
      });
    }

    return results;
  }
}