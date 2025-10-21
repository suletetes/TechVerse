/**
 * Prefetch Manager
 * Intelligently prefetches critical data to improve perceived performance
 * and user experience by anticipating user needs.
 */

class PrefetchManager {
  constructor(options = {}) {
    this.prefetchQueue = new Map();
    this.prefetchHistory = new Set();
    this.config = {
      maxConcurrentPrefetches: options.maxConcurrentPrefetches || 3,
      prefetchDelay: options.prefetchDelay || 100, // ms
      maxPrefetchAge: options.maxPrefetchAge || 10 * 60 * 1000, // 10 minutes
      enableLogging: options.enableLogging || false,
      strategies: {
        // Define prefetch strategies for different scenarios
        navigation: {
          enabled: true,
          delay: 50,
          priority: 'high'
        },
        hover: {
          enabled: true,
          delay: 200,
          priority: 'medium'
        },
        scroll: {
          enabled: true,
          delay: 500,
          priority: 'low'
        },
        predictive: {
          enabled: true,
          delay: 1000,
          priority: 'low'
        }
      },
      routes: {
        // Define critical data for each route
        '/dashboard': [
          '/api/profile',
          '/api/dashboard/stats',
          '/api/products?featured=true&limit=5'
        ],
        '/products': [
          '/api/categories',
          '/api/products?page=1&limit=20',
          '/api/products/featured'
        ],
        '/categories': [
          '/api/categories',
          '/api/products?limit=10'
        ],
        '/profile': [
          '/api/profile',
          '/api/orders?limit=5',
          '/api/profile/preferences'
        ]
      },
      ...options
    };
    
    this.activePrefetches = 0;
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for automatic prefetching
   */
  setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Prefetch on link hover
    if (this.config.strategies.hover.enabled) {
      document.addEventListener('mouseover', this.handleLinkHover.bind(this));
    }

    // Prefetch on scroll (for pagination)
    if (this.config.strategies.scroll.enabled) {
      let scrollTimeout;
      document.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.handleScroll();
        }, this.config.strategies.scroll.delay);
      });
    }

    // Prefetch on visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.refreshCriticalData();
      }
    });
  }

  /**
   * Handle link hover for prefetching
   * @param {Event} event - Mouse event
   */
  handleLinkHover(event) {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // Extract route from href
    const route = this.extractRoute(href);
    if (route && this.config.routes[route]) {
      setTimeout(() => {
        this.prefetchForRoute(route, 'hover');
      }, this.config.strategies.hover.delay);
    }
  }

  /**
   * Handle scroll events for pagination prefetching
   */
  handleScroll() {
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPercentage = scrollPosition / documentHeight;

    // Prefetch next page when user is 80% down the page
    if (scrollPercentage > 0.8) {
      this.prefetchNextPage();
    }
  }

  /**
   * Extract route from URL
   * @param {string} url - URL to extract route from
   * @returns {string|null} Extracted route
   */
  extractRoute(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.pathname;
    } catch (error) {
      return url.startsWith('/') ? url : null;
    }
  }

  /**
   * Prefetch data for a specific route
   * @param {string} route - Route to prefetch for
   * @param {string} trigger - What triggered the prefetch
   */
  async prefetchForRoute(route, trigger = 'manual') {
    const endpoints = this.config.routes[route];
    if (!endpoints || endpoints.length === 0) {
      return;
    }

    if (this.config.enableLogging) {
      console.log('🚀 Prefetching for route:', {
        route,
        trigger,
        endpoints: endpoints.length
      });
    }

    // Prefetch each endpoint
    const prefetchPromises = endpoints.map(endpoint => 
      this.prefetchEndpoint(endpoint, { trigger, route })
    );

    try {
      await Promise.allSettled(prefetchPromises);
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('⚠️ Route prefetch partially failed:', {
          route,
          error: error.message
        });
      }
    }
  }

  /**
   * Prefetch a specific endpoint
   * @param {string} endpoint - API endpoint to prefetch
   * @param {Object} options - Prefetch options
   * @returns {Promise} Prefetch promise
   */
  async prefetchEndpoint(endpoint, options = {}) {
    const { trigger = 'manual', priority = 'medium' } = options;
    
    // Check if already prefetched recently
    if (this.prefetchHistory.has(endpoint)) {
      return;
    }

    // Check if already in queue
    if (this.prefetchQueue.has(endpoint)) {
      return this.prefetchQueue.get(endpoint);
    }

    // Limit concurrent prefetches
    if (this.activePrefetches >= this.config.maxConcurrentPrefetches) {
      if (this.config.enableLogging) {
        console.log('⏳ Prefetch queued (max concurrent reached):', { endpoint });
      }
      
      // Wait for a slot to become available
      await this.waitForPrefetchSlot();
    }

    const prefetchPromise = this.executePrefetch(endpoint, { trigger, priority });
    this.prefetchQueue.set(endpoint, prefetchPromise);

    try {
      await prefetchPromise;
      
      // Mark as prefetched
      this.prefetchHistory.add(endpoint);
      
      // Clean up old history entries
      setTimeout(() => {
        this.prefetchHistory.delete(endpoint);
      }, this.config.maxPrefetchAge);
      
    } finally {
      this.prefetchQueue.delete(endpoint);
    }

    return prefetchPromise;
  }

  /**
   * Execute the actual prefetch request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Prefetch options
   * @returns {Promise} Request promise
   */
  async executePrefetch(endpoint, options = {}) {
    this.activePrefetches++;
    
    try {
      // Import services dynamically to avoid circular dependencies
      const [
        { apiClient },
        { default: intelligentCache }
      ] = await Promise.all([
        import('../interceptors/index.js'),
        import('./intelligentCache.js')
      ]);

      // Check if already cached
      const cacheKey = intelligentCache.normalizeKey(`GET:${endpoint}`);
      if (intelligentCache.getFromCache(cacheKey)) {
        if (this.config.enableLogging) {
          console.log('📦 Prefetch skipped (already cached):', { endpoint });
        }
        return;
      }

      if (this.config.enableLogging) {
        console.log('🔄 Executing prefetch:', {
          endpoint,
          trigger: options.trigger,
          priority: options.priority
        });
      }

      // Execute the prefetch request
      const response = await apiClient.get(endpoint, {
        // Mark as prefetch to avoid certain behaviors
        prefetch: true,
        // Lower priority for prefetch requests
        priority: 'low'
      });

      if (this.config.enableLogging) {
        console.log('✅ Prefetch completed:', { endpoint });
      }

      return response;
      
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('⚠️ Prefetch failed:', {
          endpoint,
          error: error.message
        });
      }
      
      // Don't throw errors for prefetch failures
      return null;
      
    } finally {
      this.activePrefetches--;
    }
  }

  /**
   * Wait for a prefetch slot to become available
   * @returns {Promise} Promise that resolves when slot is available
   */
  async waitForPrefetchSlot() {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.activePrefetches < this.config.maxConcurrentPrefetches) {
          resolve();
        } else {
          setTimeout(checkSlot, 50);
        }
      };
      checkSlot();
    });
  }

  /**
   * Prefetch next page of current listing
   */
  async prefetchNextPage() {
    // Try to determine current page from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '1');
    const nextPage = currentPage + 1;

    // Build next page URL
    const nextPageParams = new URLSearchParams(urlParams);
    nextPageParams.set('page', nextPage.toString());
    
    const currentPath = window.location.pathname;
    const nextPageEndpoint = `${currentPath}?${nextPageParams.toString()}`;

    await this.prefetchEndpoint(nextPageEndpoint, {
      trigger: 'scroll',
      priority: 'low'
    });
  }

  /**
   * Refresh critical data for current route
   */
  async refreshCriticalData() {
    const currentRoute = window.location.pathname;
    const criticalEndpoints = this.config.routes[currentRoute];

    if (criticalEndpoints) {
      // Import cache manager to invalidate stale data
      const { default: intelligentCache } = await import('./intelligentCache.js');
      
      // Invalidate cached data for critical endpoints
      criticalEndpoints.forEach(endpoint => {
        const cacheKey = intelligentCache.normalizeKey(`GET:${endpoint}`);
        intelligentCache.invalidate(cacheKey);
      });

      // Prefetch fresh data
      await this.prefetchForRoute(currentRoute, 'refresh');
    }
  }

  /**
   * Prefetch based on user behavior patterns
   * @param {Array} userActions - Recent user actions
   */
  async predictivePrefetch(userActions = []) {
    if (!this.config.strategies.predictive.enabled) {
      return;
    }

    // Analyze user patterns and prefetch likely next actions
    const predictions = this.analyzeUserPatterns(userActions);
    
    for (const prediction of predictions) {
      if (prediction.confidence > 0.7) { // Only prefetch high-confidence predictions
        await this.prefetchEndpoint(prediction.endpoint, {
          trigger: 'predictive',
          priority: 'low'
        });
      }
    }
  }

  /**
   * Analyze user patterns to predict next actions
   * @param {Array} userActions - User action history
   * @returns {Array} Predictions with confidence scores
   */
  analyzeUserPatterns(userActions) {
    const predictions = [];
    
    // Simple pattern analysis - can be enhanced with ML
    const recentActions = userActions.slice(-5);
    
    // If user viewed products, likely to view categories
    if (recentActions.some(action => action.type === 'view_product')) {
      predictions.push({
        endpoint: '/api/categories',
        confidence: 0.8,
        reason: 'user_viewed_products'
      });
    }

    // If user is on dashboard, likely to check profile
    if (recentActions.some(action => action.route === '/dashboard')) {
      predictions.push({
        endpoint: '/api/profile',
        confidence: 0.75,
        reason: 'dashboard_to_profile_pattern'
      });
    }

    return predictions;
  }

  /**
   * Get prefetch statistics
   * @returns {Object} Prefetch statistics
   */
  getStats() {
    return {
      activePrefetches: this.activePrefetches,
      queuedPrefetches: this.prefetchQueue.size,
      historySize: this.prefetchHistory.size,
      maxConcurrent: this.config.maxConcurrentPrefetches,
      strategies: Object.keys(this.config.strategies).filter(
        strategy => this.config.strategies[strategy].enabled
      ),
      configuredRoutes: Object.keys(this.config.routes).length
    };
  }

  /**
   * Clear prefetch history and queue
   */
  clear() {
    this.prefetchQueue.clear();
    this.prefetchHistory.clear();
    
    if (this.config.enableLogging) {
      console.log('🗑️ Prefetch manager cleared');
    }
  }

  /**
   * Destroy prefetch manager and clean up
   */
  destroy() {
    this.clear();
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      document.removeEventListener('mouseover', this.handleLinkHover);
      document.removeEventListener('scroll', this.handleScroll);
      document.removeEventListener('visibilitychange', this.refreshCriticalData);
    }
  }
}

// Create and export singleton instance
const prefetchManager = new PrefetchManager({
  enableLogging: process.env.NODE_ENV === 'development'
});

export default prefetchManager;

// Export class for custom instances
export { PrefetchManager };