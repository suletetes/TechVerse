import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

/**
 * Frontend Scanner - Recursively scans client directory for extractable content
 */
export class FrontendScanner {
  constructor(clientPath, options = {}) {
    this.clientPath = path.resolve(clientPath);
    this.excludePatterns = options.excludePatterns || [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.js',
      '**/*.spec.jsx'
    ];
    this.maxDepth = options.maxDepth || 10;
    this.includePatterns = {
      components: ['**/*.jsx', '**/*.js'],
      assets: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.webp'],
      data: ['**/*.json']
    };
  }

  /**
   * Recursively scan directory structure
   * @param {string} scanPath - Path to scan
   * @param {number} depth - Current depth
   * @returns {Promise<ScanResult>}
   */
  async scanDirectory(scanPath = this.clientPath, depth = 0) {
    if (depth > this.maxDepth) {
      return { files: [], directories: [] };
    }

    try {
      const entries = await fs.readdir(scanPath, { withFileTypes: true });
      const result = { files: [], directories: [] };

      for (const entry of entries) {
        const fullPath = path.join(scanPath, entry.name);
        const relativePath = path.relative(this.clientPath, fullPath);

        // Skip excluded patterns
        if (this.isExcluded(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          result.directories.push(fullPath);
          const subResult = await this.scanDirectory(fullPath, depth + 1);
          result.files.push(...subResult.files);
          result.directories.push(...subResult.directories);
        } else if (entry.isFile()) {
          result.files.push(fullPath);
        }
      }

      return result;
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${scanPath}:`, error.message);
      return { files: [], directories: [] };
    }
  }

  /**
   * Scan individual file for content
   * @param {string} filePath - File path to scan
   * @returns {Promise<Object>}
   */
  async scanFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const relativePath = path.relative(this.clientPath, filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      return {
        path: filePath,
        relativePath,
        extension: ext,
        size: stats.size,
        modified: stats.mtime,
        type: this.getFileType(ext, relativePath)
      };
    } catch (error) {
      console.warn(`Warning: Could not scan file ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Get files matching specific patterns
   * @param {string|string[]} patterns - Glob patterns
   * @returns {Promise<string[]>}
   */
  async getFilesByPattern(patterns) {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    const allFiles = [];

    for (const pattern of patternArray) {
      try {
        const files = await glob(pattern, {
          cwd: this.clientPath,
          absolute: true,
          ignore: this.excludePatterns
        });
        allFiles.push(...files);
      } catch (error) {
        console.warn(`Warning: Pattern matching failed for ${pattern}:`, error.message);
      }
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }

  /**
   * Get all component files
   * @returns {Promise<string[]>}
   */
  async getComponentFiles() {
    return this.getFilesByPattern(this.includePatterns.components);
  }

  /**
   * Get all asset files
   * @returns {Promise<string[]>}
   */
  async getAssetFiles() {
    return this.getFilesByPattern(this.includePatterns.assets);
  }

  /**
   * Get all data files
   * @returns {Promise<string[]>}
   */
  async getDataFiles() {
    return this.getFilesByPattern(this.includePatterns.data);
  }

  /**
   * Check if path should be excluded
   * @param {string} relativePath - Relative path to check
   * @returns {boolean}
   */
  isExcluded(relativePath) {
    return this.excludePatterns.some(pattern => {
      // Convert glob pattern to regex for matching
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(relativePath) || regex.test(relativePath.replace(/\\/g, '/'));
    });
  }

  /**
   * Determine file type based on extension and path
   * @param {string} ext - File extension
   * @param {string} relativePath - Relative file path
   * @returns {string}
   */
  getFileType(ext, relativePath) {
    const pathLower = relativePath.toLowerCase();

    // Component files
    if (['.jsx', '.js'].includes(ext)) {
      if (pathLower.includes('/components/')) return 'component';
      if (pathLower.includes('/pages/')) return 'page';
      if (pathLower.includes('/hooks/')) return 'hook';
      return 'script';
    }

    // Asset files
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      if (pathLower.includes('/public/img/') || pathLower.includes('/assets/images/')) {
        return 'image';
      }
      return 'asset';
    }

    // Data files
    if (ext === '.json') {
      return 'data';
    }

    return 'other';
  }

  /**
   * Categorize files by their likely data content
   * @param {string[]} files - Array of file paths
   * @returns {Promise<Object>}
   */
  async categorizeFiles(files) {
    const categories = {
      productSources: [],
      categorySources: [],
      reviewSources: [],
      userSources: [],
      pageSources: [],
      settingSources: [],
      assetSources: []
    };

    for (const file of files) {
      const relativePath = path.relative(this.clientPath, file);
      const pathLower = relativePath.toLowerCase();
      const fileName = path.basename(file).toLowerCase();

      // Product data sources
      if (this.isProductSource(pathLower, fileName)) {
        categories.productSources.push(file);
      }

      // Category data sources
      if (this.isCategorySource(pathLower, fileName)) {
        categories.categorySources.push(file);
      }

      // Review data sources
      if (this.isReviewSource(pathLower, fileName)) {
        categories.reviewSources.push(file);
      }

      // User data sources
      if (this.isUserSource(pathLower, fileName)) {
        categories.userSources.push(file);
      }

      // Page content sources
      if (this.isPageSource(pathLower, fileName)) {
        categories.pageSources.push(file);
      }

      // Settings sources
      if (this.isSettingSource(pathLower, fileName)) {
        categories.settingSources.push(file);
      }

      // Asset sources
      if (this.isAssetSource(pathLower, fileName)) {
        categories.assetSources.push(file);
      }
    }

    return categories;
  }

  /**
   * Check if file is likely to contain product data
   * @param {string} pathLower - Lowercase file path
   * @param {string} fileName - Lowercase file name
   * @returns {boolean}
   */
  isProductSource(pathLower, fileName) {
    const productIndicators = [
      'product', 'quickpicks', 'latestproducts', 'topseller', 
      'weeklydeals', 'useadmindata', 'productcard', 'productdetails'
    ];
    
    return productIndicators.some(indicator => 
      pathLower.includes(indicator) || fileName.includes(indicator)
    );
  }

  /**
   * Check if file is likely to contain category data
   * @param {string} pathLower - Lowercase file path
   * @param {string} fileName - Lowercase file name
   * @returns {boolean}
   */
  isCategorySource(pathLower, fileName) {
    const categoryIndicators = [
      'category', 'navigation', 'nav', 'menu', 'filter'
    ];
    
    return categoryIndicators.some(indicator => 
      pathLower.includes(indicator) || fileName.includes(indicator)
    );
  }

  /**
   * Check if file is likely to contain review data
   * @param {string} pathLower - Lowercase file path
   * @param {string} fileName - Lowercase file name
   * @returns {boolean}
   */
  isReviewSource(pathLower, fileName) {
    const reviewIndicators = [
      'review', 'rating', 'testimonial', 'feedback'
    ];
    
    return reviewIndicators.some(indicator => 
      pathLower.includes(indicator) || fileName.includes(indicator)
    );
  }

  /**
   * Check if file is likely to contain user data
   * @param {string} pathLower - Lowercase file path
   * @param {string} fileName - Lowercase file name
   * @returns {boolean}
   */
  isUserSource(pathLower, fileName) {
    const userIndicators = [
      'user', 'admin', 'auth', 'profile', 'account'
    ];
    
    return userIndicators.some(indicator => 
      pathLower.includes(indicator) || fileName.includes(indicator)
    );
  }

  /**
   * Check if file is likely to contain page content
   * @param {string} pathLower - Lowercase file path
   * @param {string} fileName - Lowercase file name
   * @returns {boolean}
   */
  isPageSource(pathLower, fileName) {
    const pageIndicators = [
      'pages/info', 'terms', 'privacy', 'policy', 'faq', 
      'about', 'contact', 'delivery', 'returns'
    ];
    
    return pageIndicators.some(indicator => 
      pathLower.includes(indicator) || fileName.includes(indicator)
    );
  }

  /**
   * Check if file is likely to contain settings data
   * @param {string} pathLower - Lowercase file path
   * @param {string} fileName - Lowercase file name
   * @returns {boolean}
   */
  isSettingSource(pathLower, fileName) {
    const settingIndicators = [
      'home.jsx', 'constants', 'config', 'settings'
    ];
    
    return settingIndicators.some(indicator => 
      pathLower.includes(indicator) || fileName.includes(indicator)
    );
  }

  /**
   * Check if file is an asset source
   * @param {string} pathLower - Lowercase file path
   * @param {string} fileName - Lowercase file name
   * @returns {boolean}
   */
  isAssetSource(pathLower, fileName) {
    const ext = path.extname(fileName);
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) &&
           (pathLower.includes('/public/img/') || pathLower.includes('/assets/images/'));
  }

  /**
   * Get comprehensive scan results with categorization
   * @returns {Promise<ScanResult>}
   */
  async getFullScanResults() {
    const [componentFiles, assetFiles, dataFiles] = await Promise.all([
      this.getComponentFiles(),
      this.getAssetFiles(),
      this.getDataFiles()
    ]);

    const allFiles = [...componentFiles, ...assetFiles, ...dataFiles];
    const categorized = await this.categorizeFiles(allFiles);

    const stats = {
      totalFiles: allFiles.length,
      componentFiles: componentFiles.length,
      assetFiles: assetFiles.length,
      dataFiles: dataFiles.length,
      productSources: categorized.productSources.length,
      categorySources: categorized.categorySources.length,
      reviewSources: categorized.reviewSources.length,
      userSources: categorized.userSources.length,
      pageSources: categorized.pageSources.length,
      settingSources: categorized.settingSources.length
    };

    return {
      componentFiles,
      assetFiles,
      dataFiles,
      categorized,
      stats
    };
  }
}