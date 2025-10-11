// Performance Configuration for TechVerse E-commerce Platform

export const performanceConfig = {
  // Frontend Performance Budgets
  frontend: {
    budgets: {
      // Bundle size limits
      maxBundleSize: 2 * 1024 * 1024, // 2MB
      maxChunkSize: 500 * 1024, // 500KB
      maxAssetSize: 250 * 1024, // 250KB
      
      // Performance metrics
      maxRenderTime: 16, // 16ms for 60fps
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxImageSize: 500 * 1024, // 500KB
      
      // Core Web Vitals
      maxLCP: 2500, // Largest Contentful Paint (ms)
      maxFID: 100,  // First Input Delay (ms)
      maxCLS: 0.1,  // Cumulative Layout Shift
      maxFCP: 1500, // First Contentful Paint (ms)
      maxTTFB: 600  // Time to First Byte (ms)
    },
    
    // Optimization settings
    optimization: {
      // Image optimization
      images: {
        formats: ['webp', 'avif', 'jpg', 'png'],
        quality: 85,
        sizes: [320, 640, 960, 1280, 1920],
        lazyLoading: true,
        placeholder: 'blur'
      },
      
      // Code splitting
      codeSplitting: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 500000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5
          }
        }
      },
      
      // Tree shaking
      treeShaking: {
        usedExports: true,
        sideEffects: false,
        optimization: {
          providedExports: true,
          usedExports: true,
          concatenateModules: true
        }
      }
    },
    
    // Monitoring settings
    monitoring: {
      enablePerformanceObserver: true,
      enableResourceTiming: true,
      enableNavigationTiming: true,
      enableMemoryInfo: true,
      reportingThreshold: {
        slowRender: 16, // ms
        memoryLeak: 10 * 1024 * 1024, // 10MB increase
        largeBundle: 1 * 1024 * 1024 // 1MB
      }
    }
  },

  // Backend Performance Configuration
  backend: {
    // Response time targets
    responseTime: {
      target: 200, // ms
      warning: 500, // ms
      critical: 1000 // ms
    },
    
    // Database optimization
    database: {
      connectionPool: {
        min: 5,
        max: 20,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      },
      
      queryOptimization: {
        slowQueryThreshold: 100, // ms
        enableQueryLogging: true,
        enableIndexHints: true,
        maxQueryComplexity: 1000
      },
      
      indexing: {
        autoCreateIndexes: false,
        backgroundIndexBuilding: true,
        indexStatistics: true
      }
    },
    
    // Caching configuration
    caching: {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        keyPrefix: 'techverse:',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      },
      
      strategies: {
        // API response caching
        api: {
          defaultTTL: 300, // 5 minutes
          maxTTL: 3600, // 1 hour
          staleWhileRevalidate: 60 // 1 minute
        },
        
        // Database query caching
        database: {
          defaultTTL: 600, // 10 minutes
          maxTTL: 1800, // 30 minutes
          invalidationPatterns: [
            'products:*',
            'categories:*',
            'users:*'
          ]
        },
        
        // Static content caching
        static: {
          maxAge: 31536000, // 1 year
          immutable: true,
          etag: true
        }
      }
    },
    
    // Compression settings
    compression: {
      gzip: {
        level: 6,
        threshold: 1024,
        memLevel: 8,
        windowBits: 15
      },
      
      brotli: {
        enabled: true,
        quality: 6,
        lgwin: 22,
        lgblock: 0
      }
    },
    
    // Rate limiting
    rateLimiting: {
      global: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // requests per window
        standardHeaders: true,
        legacyHeaders: false
      },
      
      api: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5, // login attempts
        skipSuccessfulRequests: true
      }
    },
    
    // Monitoring and alerting
    monitoring: {
      metrics: {
        collectInterval: 30000, // 30 seconds
        retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
        aggregationWindow: 5 * 60 * 1000 // 5 minutes
      },
      
      alerts: {
        responseTime: {
          warning: 500, // ms
          critical: 1000 // ms
        },
        
        errorRate: {
          warning: 2, // %
          critical: 5 // %
        },
        
        memoryUsage: {
          warning: 80, // %
          critical: 90 // %
        },
        
        cpuUsage: {
          warning: 70, // %
          critical: 85 // %
        },
        
        diskUsage: {
          warning: 80, // %
          critical: 90 // %
        }
      }
    }
  },

  // Load testing configuration
  loadTesting: {
    scenarios: {
      // Normal load
      normal: {
        duration: '5m',
        vus: 50, // virtual users
        rps: 100 // requests per second
      },
      
      // Peak load
      peak: {
        duration: '10m',
        vus: 200,
        rps: 500
      },
      
      // Stress test
      stress: {
        duration: '15m',
        vus: 500,
        rps: 1000
      },
      
      // Spike test
      spike: {
        duration: '2m',
        vus: 1000,
        rps: 2000
      }
    },
    
    thresholds: {
      http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
      http_req_failed: ['rate<0.01'], // Error rate under 1%
      http_reqs: ['rate>100'] // Minimum 100 RPS
    }
  },

  // CDN and deployment optimization
  deployment: {
    cdn: {
      enabled: true,
      provider: 'cloudflare', // or 'aws', 'azure', 'gcp'
      
      caching: {
        static: {
          maxAge: 31536000, // 1 year
          browserCache: 86400 // 1 day
        },
        
        dynamic: {
          maxAge: 300, // 5 minutes
          browserCache: 0
        },
        
        api: {
          maxAge: 60, // 1 minute
          browserCache: 0
        }
      },
      
      optimization: {
        minification: true,
        compression: true,
        imageOptimization: true,
        http2Push: true
      }
    },
    
    serverOptimization: {
      keepAlive: {
        enabled: true,
        timeout: 65000,
        maxRequests: 1000
      },
      
      clustering: {
        enabled: true,
        workers: 'auto' // or specific number
      },
      
      gracefulShutdown: {
        timeout: 30000, // 30 seconds
        forceExit: true
      }
    }
  },

  // Development optimization
  development: {
    hotReload: {
      enabled: true,
      overlay: true,
      quiet: false
    },
    
    bundleAnalysis: {
      enabled: true,
      openAnalyzer: false,
      generateStatsFile: true
    },
    
    performanceHints: {
      enabled: true,
      maxAssetSize: 250000,
      maxEntrypointSize: 250000
    }
  }
};

// Environment-specific overrides
export const getPerformanceConfig = (env = 'development') => {
  const config = { ...performanceConfig };
  
  switch (env) {
    case 'production':
      // Production optimizations
      config.frontend.budgets.maxBundleSize = 1.5 * 1024 * 1024; // Stricter in prod
      config.backend.caching.strategies.api.defaultTTL = 600; // Longer cache
      config.backend.monitoring.metrics.collectInterval = 15000; // More frequent
      break;
      
    case 'staging':
      // Staging optimizations
      config.backend.caching.strategies.api.defaultTTL = 300;
      config.loadTesting.scenarios.normal.vus = 25; // Reduced load
      break;
      
    case 'development':
      // Development optimizations
      config.backend.caching.strategies.api.defaultTTL = 60; // Short cache
      config.frontend.monitoring.enablePerformanceObserver = true;
      config.development.bundleAnalysis.openAnalyzer = true;
      break;
  }
  
  return config;
};

export default performanceConfig;