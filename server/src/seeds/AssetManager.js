import fs from 'fs/promises';
import path from 'path';

/**
 * Asset Manager - Handles image validation, copying, and path normalization
 */
export class AssetManager {
  constructor(clientPath, serverPath, options = {}) {
    this.clientPath = path.resolve(clientPath);
    this.serverPath = path.resolve(serverPath);
    this.targetDir = path.join(this.serverPath, 'uploads', 'seed_images');
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp'];
    this.excludeFormats = ['.svg', '.gif'];
    this.assetReport = {
      found: [],
      missing: [],
      copied: [],
      suggestions: {}
    };
    this.options = {
      copyAssets: options.copyAssets !== false,
      generateFallbacks: options.generateFallbacks !== false,
      ...options
    };
  }

  /**
   * Validate if image exists in client directories
   * @param {string} imagePath - Image path to validate
   * @returns {Promise<Object>} Validation result with path info
   */
  async validateImageExists(imagePath) {
    const searchPaths = [
      path.join(this.clientPath, 'public', 'img'),
      path.join(this.clientPath, 'src', 'assets', 'images'),
      path.join(this.clientPath, 'public'),
      path.join(this.clientPath, 'src', 'assets')
    ];

    // Normalize the image path
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    for (const searchPath of searchPaths) {
      const fullPath = path.join(searchPath, normalizedPath);
      
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          const ext = path.extname(fullPath).toLowerCase();
          
          return {
            exists: true,
            fullPath,
            relativePath: path.relative(this.clientPath, fullPath),
            size: stats.size,
            extension: ext,
            supported: this.supportedFormats.includes(ext),
            excluded: this.excludeFormats.includes(ext)
          };
        }
      } catch (error) {
        // File doesn't exist in this location, continue searching
      }
    }

    return {
      exists: false,
      searchedPaths: searchPaths.map(p => path.join(p, normalizedPath)),
      suggestions: this.generateFallbackSuggestions(imagePath)
    };
  }

  /**
   * Copy image from client to server directory
   * @param {string} sourcePath - Source image path
   * @param {string} targetPath - Target path (optional)
   * @returns {Promise<Object>} Copy operation result
   */
  async copyImageToServer(sourcePath, targetPath = null) {
    try {
      // Ensure target directory exists
      await fs.mkdir(this.targetDir, { recursive: true });

      const fileName = targetPath || path.basename(sourcePath);
      const targetFullPath = path.join(this.targetDir, fileName);
      
      // Check if file already exists
      try {
        await fs.access(targetFullPath);
        // File exists, generate unique name
        const ext = path.extname(fileName);
        const baseName = path.basename(fileName, ext);
        const uniqueName = `${baseName}-${Date.now()}${ext}`;
        const uniqueTargetPath = path.join(this.targetDir, uniqueName);
        
        await fs.copyFile(sourcePath, uniqueTargetPath);
        
        return {
          success: true,
          sourcePath,
          targetPath: uniqueTargetPath,
          serverPath: `/uploads/seed_images/${uniqueName}`,
          renamed: true,
          originalName: fileName,
          newName: uniqueName
        };
      } catch (error) {
        // File doesn't exist, use original name
        await fs.copyFile(sourcePath, targetFullPath);
        
        return {
          success: true,
          sourcePath,
          targetPath: targetFullPath,
          serverPath: `/uploads/seed_images/${fileName}`,
          renamed: false
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        sourcePath,
        targetPath
      };
    }
  }

  /**
   * Normalize image path for database storage
   * @param {string} imagePath - Original image path
   * @returns {Promise<string>} Normalized server path
   */
  async normalizeImagePath(imagePath) {
    if (!imagePath) return '';

    // Skip SVG files
    if (imagePath.endsWith('.svg')) {
      return '';
    }

    const validation = await this.validateImageExists(imagePath);
    
    if (validation.exists && validation.supported && !validation.excluded) {
      this.assetReport.found.push(imagePath);
      
      if (this.options.copyAssets) {
        const copyResult = await this.copyImageToServer(validation.fullPath);
        if (copyResult.success) {
          this.assetReport.copied.push({
            original: imagePath,
            server: copyResult.serverPath,
            renamed: copyResult.renamed
          });
          return copyResult.serverPath;
        }
      }
      
      // Return relative path if not copying
      return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    } else {
      this.assetReport.missing.push(imagePath);
      
      if (this.options.generateFallbacks) {
        const fallback = this.generateFallbackPath(imagePath);
        this.assetReport.suggestions[imagePath] = fallback;
        return fallback;
      }
      
      return '';
    }
  }

  /**
   * Process multiple images and return normalized paths
   * @param {string[]} imagePaths - Array of image paths
   * @returns {Promise<string[]>} Array of normalized paths
   */
  async processImages(imagePaths) {
    if (!Array.isArray(imagePaths)) return [];
    
    const processed = [];
    
    for (const imagePath of imagePaths) {
      const normalized = await this.normalizeImagePath(imagePath);
      if (normalized) {
        processed.push(normalized);
      }
    }
    
    return processed;
  }

  /**
   * Handle responsive image sets (choose primary image)
   * @param {Object} imageSet - Object with webp, jpg properties
   * @returns {Promise<string>} Primary image path
   */
  async handleResponsiveImages(imageSet) {
    if (typeof imageSet === 'string') {
      return this.normalizeImagePath(imageSet);
    }
    
    // Priority order: jpg > png > webp
    const priorities = ['imageJpg', 'image', 'imagePng', 'imageWebp'];
    
    for (const key of priorities) {
      if (imageSet[key]) {
        const normalized = await this.normalizeImagePath(imageSet[key]);
        if (normalized) {
          return normalized;
        }
      }
    }
    
    return '';
  }

  /**
   * Generate fallback suggestions for missing images
   * @param {string} imagePath - Missing image path
   * @returns {string[]} Array of fallback suggestions
   */
  generateFallbackSuggestions(imagePath) {
    const suggestions = [];
    const fileName = path.basename(imagePath);
    const baseName = path.basename(fileName, path.extname(fileName));
    
    // Common variations
    const variations = [
      fileName.toLowerCase(),
      fileName.replace(/[-_]/g, ''),
      `${baseName}.jpg`,
      `${baseName}.png`,
      `${baseName}.webp`,
      `product-${baseName}.jpg`,
      `${baseName}-product.jpg`
    ];
    
    suggestions.push(...variations);
    
    // Category-based fallbacks
    if (baseName.includes('tv')) {
      suggestions.push('/img/tv-placeholder.jpg', '/img/television-default.jpg');
    } else if (baseName.includes('tablet')) {
      suggestions.push('/img/tablet-placeholder.jpg', '/img/tablet-default.jpg');
    } else if (baseName.includes('phone')) {
      suggestions.push('/img/phone-placeholder.jpg', '/img/smartphone-default.jpg');
    } else if (baseName.includes('laptop')) {
      suggestions.push('/img/laptop-placeholder.jpg', '/img/laptop-default.jpg');
    } else {
      suggestions.push('/img/product-placeholder.jpg', '/img/default-product.jpg');
    }
    
    return [...new Set(suggestions)];
  }

  /**
   * Generate fallback path for missing image
   * @param {string} imagePath - Missing image path
   * @returns {string} Fallback path
   */
  generateFallbackPath(imagePath) {
    const baseName = path.basename(imagePath, path.extname(imagePath));
    
    // Infer category from filename
    if (baseName.includes('tv') || baseName.includes('television')) {
      return '/img/tv-placeholder.jpg';
    } else if (baseName.includes('tablet')) {
      return '/img/tablet-placeholder.jpg';
    } else if (baseName.includes('phone')) {
      return '/img/phone-placeholder.jpg';
    } else if (baseName.includes('laptop')) {
      return '/img/laptop-placeholder.jpg';
    } else if (baseName.includes('category')) {
      return '/img/category-placeholder.jpg';
    } else {
      return '/img/product-placeholder.jpg';
    }
  }

  /**
   * Get image dimensions (if sharp is available)
   * @param {string} imagePath - Image path
   * @returns {Promise<Object>} Image dimensions
   */
  async getImageDimensions(imagePath) {
    try {
      // This would require sharp package for image processing
      // For now, return default dimensions
      return {
        width: 800,
        height: 600,
        format: path.extname(imagePath).slice(1)
      };
    } catch (error) {
      return {
        width: 0,
        height: 0,
        format: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Generate comprehensive asset report
   * @returns {Object} Asset report with statistics
   */
  generateAssetReport() {
    const report = {
      ...this.assetReport,
      statistics: {
        totalProcessed: this.assetReport.found.length + this.assetReport.missing.length,
        foundCount: this.assetReport.found.length,
        missingCount: this.assetReport.missing.length,
        copiedCount: this.assetReport.copied.length,
        successRate: this.assetReport.found.length / (this.assetReport.found.length + this.assetReport.missing.length) * 100
      },
      timestamp: new Date().toISOString()
    };
    
    return report;
  }

  /**
   * Clear asset report for new processing
   */
  clearReport() {
    this.assetReport = {
      found: [],
      missing: [],
      copied: [],
      suggestions: {}
    };
  }

  /**
   * Validate all images in extracted data
   * @param {Object} extractedData - All extracted data
   * @returns {Promise<Object>} Updated data with normalized image paths
   */
  async validateAllImages(extractedData) {
    const updatedData = { ...extractedData };
    
    // Process product images
    if (updatedData.products) {
      for (const product of updatedData.products) {
        if (product.images) {
          product.images = await this.processImages(product.images);
        }
        
        // Process variant images
        if (product.variants) {
          for (const variant of product.variants) {
            if (variant.image) {
              variant.image = await this.normalizeImagePath(variant.image);
            }
          }
        }
      }
    }
    
    // Process category images
    if (updatedData.categories) {
      for (const category of updatedData.categories) {
        if (category.image) {
          category.image = await this.normalizeImagePath(category.image);
        }
      }
    }
    
    return updatedData;
  }
}