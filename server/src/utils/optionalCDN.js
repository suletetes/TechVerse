import AWS from 'aws-sdk';
import path from 'path';
import fs from 'fs/promises';
import enhancedLogger from './enhancedLogger.js';

/**
 * Optional CDN Integration
 * Provides CDN functionality when configured, falls back to local storage
 */

class OptionalCDN {
  constructor() {
    this.isS3Available = false;
    this.isCloudFrontAvailable = false;
    this.s3Client = null;
    this.cloudFrontClient = null;
    this.bucketName = null;
    this.cloudFrontDistributionId = null;
    this.cdnDomain = null;
    this.localStoragePath = process.env.LOCAL_STORAGE_PATH || './uploads';
    
    this.initializeAWS();
  }

  /**
   * Initialize AWS services if configured
   */
  async initializeAWS() {
    try {
      const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const awsRegion = process.env.AWS_REGION || 'us-east-1';
      this.bucketName = process.env.AWS_S3_BUCKET;
      this.cloudFrontDistributionId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;
      this.cdnDomain = process.env.CDN_DOMAIN;

      // Only initialize if AWS credentials are provided
      if (awsAccessKeyId && awsSecretAccessKey && this.bucketName) {
        AWS.config.update({
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
          region: awsRegion
        });

        this.s3Client = new AWS.S3();
        
        // Test S3 connection
        await this.s3Client.headBucket({ Bucket: this.bucketName }).promise();
        this.isS3Available = true;

        enhancedLogger.info('S3 CDN initialized successfully', {
          bucket: this.bucketName,
          region: awsRegion
        });

        // Initialize CloudFront if distribution ID is provided
        if (this.cloudFrontDistributionId) {
          this.cloudFrontClient = new AWS.CloudFront();
          this.isCloudFrontAvailable = true;
          
          enhancedLogger.info('CloudFront CDN initialized successfully', {
            distributionId: this.cloudFrontDistributionId,
            domain: this.cdnDomain
          });
        }

      } else {
        enhancedLogger.info('No AWS configuration found, using local storage only');
      }

      // Ensure local storage directory exists
      await fs.mkdir(this.localStoragePath, { recursive: true });

    } catch (error) {
      enhancedLogger.warn('Failed to initialize AWS CDN, using local storage', {
        error: error.message
      });
      this.isS3Available = false;
      this.isCloudFrontAvailable = false;
    }
  }

  /**
   * Upload file to CDN or local storage
   */
  async uploadFile(filePath, key, options = {}) {
    try {
      const {
        contentType = 'application/octet-stream',
        cacheControl = 'public, max-age=31536000', // 1 year
        metadata = {},
        makePublic = true
      } = options;

      if (this.isS3Available) {
        // Upload to S3
        const fileBuffer = await fs.readFile(filePath);
        
        const uploadParams = {
          Bucket: this.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          CacheControl: cacheControl,
          Metadata: metadata
        };

        if (makePublic) {
          uploadParams.ACL = 'public-read';
        }

        const result = await this.s3Client.upload(uploadParams).promise();
        
        enhancedLogger.info('File uploaded to S3 successfully', {
          key,
          location: result.Location,
          size: fileBuffer.length
        });

        // Return CDN URL if available, otherwise S3 URL
        const url = this.cdnDomain 
          ? `https://${this.cdnDomain}/${key}`
          : result.Location;

        return {
          success: true,
          url,
          key,
          location: 'cdn',
          size: fileBuffer.length
        };

      } else {
        // Store locally
        const localKey = key.replace(/[^a-zA-Z0-9.-]/g, '_');
        const localPath = path.join(this.localStoragePath, localKey);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        
        // Copy file to local storage
        await fs.copyFile(filePath, localPath);
        
        enhancedLogger.info('File stored locally', {
          key: localKey,
          path: localPath
        });

        return {
          success: true,
          url: `/uploads/${localKey}`,
          key: localKey,
          location: 'local',
          path: localPath
        };
      }

    } catch (error) {
      enhancedLogger.error('File upload error', {
        error: error.message,
        key,
        filePath
      });

      return {
        success: false,
        error: error.message,
        key
      };
    }
  }

  /**
   * Upload buffer directly
   */
  async uploadBuffer(buffer, key, options = {}) {
    try {
      const {
        contentType = 'application/octet-stream',
        cacheControl = 'public, max-age=31536000',
        metadata = {},
        makePublic = true
      } = options;

      if (this.isS3Available) {
        const uploadParams = {
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: cacheControl,
          Metadata: metadata
        };

        if (makePublic) {
          uploadParams.ACL = 'public-read';
        }

        const result = await this.s3Client.upload(uploadParams).promise();
        
        const url = this.cdnDomain 
          ? `https://${this.cdnDomain}/${key}`
          : result.Location;

        return {
          success: true,
          url,
          key,
          location: 'cdn',
          size: buffer.length
        };

      } else {
        const localKey = key.replace(/[^a-zA-Z0-9.-]/g, '_');
        const localPath = path.join(this.localStoragePath, localKey);
        
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, buffer);

        return {
          success: true,
          url: `/uploads/${localKey}`,
          key: localKey,
          location: 'local',
          path: localPath
        };
      }

    } catch (error) {
      enhancedLogger.error('Buffer upload error', {
        error: error.message,
        key,
        size: buffer.length
      });

      return {
        success: false,
        error: error.message,
        key
      };
    }
  }

  /**
   * Delete file from CDN or local storage
   */
  async deleteFile(key) {
    try {
      if (this.isS3Available) {
        await this.s3Client.deleteObject({
          Bucket: this.bucketName,
          Key: key
        }).promise();

        enhancedLogger.info('File deleted from S3', { key });

        // Invalidate CloudFront cache if available
        if (this.isCloudFrontAvailable) {
          await this.invalidateCloudFrontCache([key]);
        }

      } else {
        const localKey = key.replace(/[^a-zA-Z0-9.-]/g, '_');
        const localPath = path.join(this.localStoragePath, localKey);
        
        try {
          await fs.unlink(localPath);
          enhancedLogger.info('File deleted locally', { key: localKey, path: localPath });
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }

      return { success: true, key };

    } catch (error) {
      enhancedLogger.error('File deletion error', {
        error: error.message,
        key
      });

      return {
        success: false,
        error: error.message,
        key
      };
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(key) {
    if (this.isS3Available) {
      return this.cdnDomain 
        ? `https://${this.cdnDomain}/${key}`
        : `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } else {
      const localKey = key.replace(/[^a-zA-Z0-9.-]/g, '_');
      return `/uploads/${localKey}`;
    }
  }

  /**
   * Generate signed URL for private files
   */
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      if (this.isS3Available) {
        const url = await this.s3Client.getSignedUrlPromise('getObject', {
          Bucket: this.bucketName,
          Key: key,
          Expires: expiresIn
        });

        return {
          success: true,
          url,
          expiresIn
        };
      } else {
        // For local files, return regular URL (no signing available)
        return {
          success: true,
          url: this.getFileUrl(key),
          expiresIn: null,
          note: 'Local storage does not support signed URLs'
        };
      }

    } catch (error) {
      enhancedLogger.error('Signed URL generation error', {
        error: error.message,
        key
      });

      return {
        success: false,
        error: error.message,
        key
      };
    }
  }

  /**
   * Invalidate CloudFront cache
   */
  async invalidateCloudFrontCache(paths) {
    try {
      if (!this.isCloudFrontAvailable) {
        return { success: false, message: 'CloudFront not available' };
      }

      const params = {
        DistributionId: this.cloudFrontDistributionId,
        InvalidationBatch: {
          CallerReference: `invalidation-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths.map(path => `/${path}`)
          }
        }
      };

      const result = await this.cloudFrontClient.createInvalidation(params).promise();

      enhancedLogger.info('CloudFront cache invalidated', {
        invalidationId: result.Invalidation.Id,
        paths
      });

      return {
        success: true,
        invalidationId: result.Invalidation.Id,
        paths
      };

    } catch (error) {
      enhancedLogger.error('CloudFront invalidation error', {
        error: error.message,
        paths
      });

      return {
        success: false,
        error: error.message,
        paths
      };
    }
  }

  /**
   * Optimize image and upload
   */
  async uploadOptimizedImage(filePath, key, options = {}) {
    try {
      const {
        quality = 85,
        format = 'webp',
        maxWidth = 1920,
        maxHeight = 1080,
        ...uploadOptions
      } = options;

      // Import sharp dynamically to handle optional dependency
      let sharp;
      try {
        sharp = (await import('sharp')).default;
      } catch (error) {
        enhancedLogger.warn('Sharp not available, uploading original image', {
          key,
          error: error.message
        });
        return this.uploadFile(filePath, key, uploadOptions);
      }

      // Optimize image
      const optimizedBuffer = await sharp(filePath)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(format, { quality })
        .toBuffer();

      // Update key extension if format changed
      const optimizedKey = key.replace(/\.[^.]+$/, `.${format}`);

      return this.uploadBuffer(optimizedBuffer, optimizedKey, {
        ...uploadOptions,
        contentType: `image/${format}`
      });

    } catch (error) {
      enhancedLogger.error('Image optimization error', {
        error: error.message,
        key,
        filePath
      });

      // Fallback to original upload
      return this.uploadFile(filePath, key, options);
    }
  }

  /**
   * Batch upload files
   */
  async uploadBatch(files, options = {}) {
    const results = [];
    const { concurrency = 5 } = options;

    // Process files in batches to avoid overwhelming the system
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async ({ filePath, key, options: fileOptions }) => {
        return this.uploadFile(filePath, key, { ...options, ...fileOptions });
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason.message,
            key: batch[index].key
          });
        }
      });
    }

    return results;
  }

  /**
   * Get CDN statistics
   */
  async getStats() {
    try {
      const stats = {
        isS3Available: this.isS3Available,
        isCloudFrontAvailable: this.isCloudFrontAvailable,
        bucketName: this.bucketName,
        cdnDomain: this.cdnDomain,
        localStoragePath: this.localStoragePath
      };

      if (this.isS3Available) {
        // Get bucket size and object count (this can be expensive for large buckets)
        try {
          const listParams = {
            Bucket: this.bucketName,
            MaxKeys: 1000 // Limit for performance
          };
          
          const objects = await this.s3Client.listObjectsV2(listParams).promise();
          
          stats.s3Stats = {
            objectCount: objects.KeyCount,
            isTruncated: objects.IsTruncated,
            totalSize: objects.Contents.reduce((sum, obj) => sum + obj.Size, 0)
          };
        } catch (error) {
          stats.s3StatsError = error.message;
        }
      }

      // Get local storage stats
      try {
        const localFiles = await fs.readdir(this.localStoragePath);
        let totalLocalSize = 0;
        
        for (const file of localFiles.slice(0, 100)) { // Limit for performance
          try {
            const filePath = path.join(this.localStoragePath, file);
            const stat = await fs.stat(filePath);
            if (stat.isFile()) {
              totalLocalSize += stat.size;
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        }
        
        stats.localStats = {
          fileCount: localFiles.length,
          totalSize: totalLocalSize
        };
      } catch (error) {
        stats.localStatsError = error.message;
      }

      return stats;

    } catch (error) {
      enhancedLogger.error('CDN stats error', {
        error: error.message
      });

      return {
        error: error.message,
        isS3Available: this.isS3Available,
        isCloudFrontAvailable: this.isCloudFrontAvailable
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      services: {}
    };

    // Check S3
    if (this.isS3Available) {
      try {
        await this.s3Client.headBucket({ Bucket: this.bucketName }).promise();
        health.services.s3 = { status: 'healthy', bucket: this.bucketName };
      } catch (error) {
        health.services.s3 = { status: 'unhealthy', error: error.message };
        health.status = 'degraded';
      }
    } else {
      health.services.s3 = { status: 'not_configured' };
    }

    // Check CloudFront
    if (this.isCloudFrontAvailable) {
      health.services.cloudfront = { 
        status: 'configured', 
        distributionId: this.cloudFrontDistributionId 
      };
    } else {
      health.services.cloudfront = { status: 'not_configured' };
    }

    // Check local storage
    try {
      await fs.access(this.localStoragePath);
      health.services.localStorage = { 
        status: 'healthy', 
        path: this.localStoragePath 
      };
    } catch (error) {
      health.services.localStorage = { 
        status: 'unhealthy', 
        error: error.message 
      };
      health.status = 'unhealthy';
    }

    return health;
  }
}

// Create singleton instance
const optionalCDN = new OptionalCDN();

export default optionalCDN;