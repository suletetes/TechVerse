import { apiClient, handleApiResponse } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

// Enhanced API service with advanced features
class EnhancedApiService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generic request with caching
  async request(endpoint, options = {}) {
    const { 
      cache = false, 
      cacheKey, 
      dedupe = true,
      retries = 3,
      timeout = 30000,
      ...requestOptions 
    } = options;

    const key = cacheKey || `${requestOptions.method || 'GET'}_${endpoint}`;

    // Check cache first
    if (cache && this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(key);
    }

    // Dedupe identical requests
    if (dedupe && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Make request
    const requestPromise = this.makeRequest(endpoint, requestOptions, retries, timeout);
    
    if (dedupe) {
      this.pendingRequests.set(key, requestPromise);
    }

    try {
      const response = await requestPromise;
      const data = await handleApiResponse(response);

      // Cache successful responses
      if (cache && response.ok) {
        this.cache.set(key, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    } finally {
      if (dedupe) {
        this.pendingRequests.delete(key);
      }
    }
  }

  // Make request with retry logic
  async makeRequest(endpoint, options, retries, timeout) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await apiClient.request(endpoint, { ...options, timeout });
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError;
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch requests
  async batchRequest(requests) {
    const results = await Promise.allSettled(
      requests.map(req => this.request(req.endpoint, req.options))
    );

    return results.map((result, index) => ({
      ...requests[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Paginated requests
  async getPaginated(endpoint, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      autoFetch = false,
      ...requestOptions 
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...requestOptions.params
    });

    const url = `${endpoint}?${params}`;
    const response = await this.request(url, requestOptions);

    if (autoFetch && response.hasMore) {
      const nextPage = await this.getPaginated(endpoint, {
        ...options,
        page: page + 1
      });
      
      return {
        ...response,
        data: [...response.data, ...nextPage.data]
      };
    }

    return response;
  }

  // Real-time updates with polling
  startPolling(endpoint, callback, interval = 30000) {
    const poll = async () => {
      try {
        const data = await this.request(endpoint, { cache: false });
        callback(null, data);
      } catch (error) {
        callback(error, null);
      }
    };

    const intervalId = setInterval(poll, interval);
    
    // Initial poll
    poll();

    return () => clearInterval(intervalId);
  }

  // WebSocket connection manager
  createWebSocket(url, options = {}) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const { 
        onMessage, 
        onError, 
        onClose,
        reconnect = true,
        maxReconnectAttempts = 5 
      } = options;

      let reconnectAttempts = 0;

      ws.onopen = () => {
        reconnectAttempts = 0;
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        onError?.(error);
        reject(error);
      };

      ws.onclose = (event) => {
        onClose?.(event);
        
        // Auto-reconnect logic
        if (reconnect && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setTimeout(() => {
            this.createWebSocket(url, options);
          }, Math.pow(2, reconnectAttempts) * 1000);
        }
      };
    });
  }

  // File upload with progress
  async uploadFile(endpoint, file, options = {}) {
    const { 
      onProgress, 
      chunkSize = 1024 * 1024, // 1MB chunks
      ...requestOptions 
    } = options;

    // For small files, use regular upload
    if (file.size <= chunkSize) {
      const formData = new FormData();
      formData.append('file', file);
      
      return apiClient.upload(endpoint, formData, requestOptions);
    }

    // For large files, use chunked upload
    return this.chunkedUpload(endpoint, file, chunkSize, onProgress, requestOptions);
  }

  // Chunked file upload
  async chunkedUpload(endpoint, file, chunkSize, onProgress, options) {
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedBytes = 0;

    // Initialize upload
    const initResponse = await apiClient.post(`${endpoint}/init`, {
      fileName: file.name,
      fileSize: file.size,
      totalChunks
    }, options);

    const { uploadId } = await handleApiResponse(initResponse);

    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('uploadId', uploadId);

      await apiClient.upload(`${endpoint}/chunk`, formData, options);
      
      uploadedBytes += chunk.size;
      onProgress?.({
        loaded: uploadedBytes,
        total: file.size,
        percentage: Math.round((uploadedBytes / file.size) * 100)
      });
    }

    // Finalize upload
    const finalizeResponse = await apiClient.post(`${endpoint}/finalize`, {
      uploadId
    }, options);

    return handleApiResponse(finalizeResponse);
  }

  // Search with debouncing
  createDebouncedSearch(endpoint, delay = 300) {
    let timeoutId;
    let lastQuery = '';

    return (query, options = {}) => {
      return new Promise((resolve, reject) => {
        // Clear previous timeout
        clearTimeout(timeoutId);

        // If query is the same, don't make new request
        if (query === lastQuery && query !== '') {
          return;
        }

        lastQuery = query;

        timeoutId = setTimeout(async () => {
          try {
            const params = new URLSearchParams({
              q: query,
              ...options.params
            });

            const data = await this.request(`${endpoint}?${params}`, {
              ...options,
              cache: true,
              cacheKey: `search_${query}`
            });

            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };
  }

  // Clear cache
  clearCache(pattern) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalSize: Array.from(this.cache.values())
        .reduce((total, item) => total + JSON.stringify(item).length, 0)
    };
  }
}

// Create and export singleton instance
export default new EnhancedApiService();

// Export specific methods for convenience
export const {
  request,
  batchRequest,
  getPaginated,
  startPolling,
  createWebSocket,
  uploadFile,
  createDebouncedSearch,
  clearCache,
  getCacheStats
} = new EnhancedApiService();