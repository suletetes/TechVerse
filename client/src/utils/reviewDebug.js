/**
 * Review Debug Utility
 * Comprehensive debugging for review fetching and display
 */

const isDevelopment = import.meta.env.DEV;

class ReviewDebugger {
    constructor() {
        this.logs = [];
        this.enabled = isDevelopment;
    }

    /**
     * Enable/disable debugging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Log with timestamp and category
     */
    log(category, message, data = null) {
        if (!this.enabled) return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            category,
            message,
            data
        };

        this.logs.push(logEntry);

        // Console output with styling
        const styles = {
            API: 'color: #2196F3; font-weight: bold',
            SUCCESS: 'color: #4CAF50; font-weight: bold',
            ERROR: 'color: #F44336; font-weight: bold',
            WARNING: 'color: #FF9800; font-weight: bold',
            INFO: 'color: #9E9E9E',
            DATA: 'color: #9C27B0'
        };

        console.log(
            `%c[${category}] ${message}`,
            styles[category] || styles.INFO,
            data || ''
        );
    }

    /**
     * Debug API request
     */
    logApiRequest(endpoint, params) {
        this.log('API', `📤 Request: ${endpoint}`, {
            endpoint,
            params,
            timestamp: Date.now()
        });
    }

    /**
     * Debug API response
     */
    logApiResponse(endpoint, response, duration) {
        this.log('SUCCESS', `📥 Response: ${endpoint} (${duration}ms)`, {
            endpoint,
            success: response.success,
            reviewCount: response.data?.reviews?.length || 0,
            totalReviews: response.data?.pagination?.totalReviews || 0,
            totalPages: response.data?.pagination?.totalPages || 0,
            ratingBreakdown: response.data?.ratingBreakdown,
            duration
        });
    }

    /**
     * Debug API error
     */
    logApiError(endpoint, error) {
        this.log('ERROR', `❌ Error: ${endpoint}`, {
            endpoint,
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            stack: error.stack
        });
    }

    /**
     * Debug review processing
     */
    logReviewProcessing(rawReviews, processedReviews) {
        this.log('DATA', `🔄 Processing ${rawReviews.length} reviews`, {
            rawCount: rawReviews.length,
            processedCount: processedReviews.length,
            sample: processedReviews[0] || null
        });
    }

    /**
     * Debug pagination
     */
    logPagination(currentPage, totalPages, totalReviews, reviewsPerPage) {
        this.log('INFO', `📄 Pagination Info`, {
            currentPage,
            totalPages,
            totalReviews,
            reviewsPerPage,
            startIndex: (currentPage - 1) * reviewsPerPage,
            endIndex: Math.min(currentPage * reviewsPerPage, totalReviews)
        });
    }

    /**
     * Debug filter/sort
     */
    logFilterSort(filterRating, sortBy) {
        this.log('INFO', `🔍 Filter & Sort`, {
            filterRating,
            sortBy,
            isFiltered: filterRating !== 'all'
        });
    }

    /**
     * Debug state changes
     */
    logStateChange(stateName, oldValue, newValue) {
        this.log('INFO', `🔄 State Change: ${stateName}`, {
            from: oldValue,
            to: newValue,
            changed: oldValue !== newValue
        });
    }

    /**
     * Debug fallback to sample reviews
     */
    logFallbackToSample(reason) {
        this.log('WARNING', `⚠️ Using sample reviews: ${reason}`, {
            reason,
            sampleCount: 5
        });
    }

    /**
     * Get all logs
     */
    getLogs() {
        return this.logs;
    }

    /**
     * Export logs as JSON
     */
    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `review-debug-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Clear logs
     */
    clearLogs() {
        this.logs = [];
        console.clear();
        this.log('INFO', '🧹 Logs cleared');
    }

    /**
     * Print summary
     */
    printSummary() {
        if (!this.enabled) return;

        console.group('📊 Review Debug Summary');
        
        const categories = {};
        this.logs.forEach(log => {
            categories[log.category] = (categories[log.category] || 0) + 1;
        });

        console.table(categories);
        
        const errors = this.logs.filter(log => log.category === 'ERROR');
        if (errors.length > 0) {
            console.group('❌ Errors');
            errors.forEach(error => {
                console.error(error.message, error.data);
            });
            console.groupEnd();
        }

        const warnings = this.logs.filter(log => log.category === 'WARNING');
        if (warnings.length > 0) {
            console.group('⚠️ Warnings');
            warnings.forEach(warning => {
                console.warn(warning.message, warning.data);
            });
            console.groupEnd();
        }

        console.groupEnd();
    }

    /**
     * Validate review data structure
     */
    validateReview(review) {
        const required = ['id', 'rating', 'review'];
        const missing = required.filter(field => !review[field]);
        
        if (missing.length > 0) {
            this.log('WARNING', `⚠️ Review missing fields: ${missing.join(', ')}`, review);
            return false;
        }

        if (review.rating < 1 || review.rating > 5) {
            this.log('WARNING', `⚠️ Invalid rating: ${review.rating}`, review);
            return false;
        }

        return true;
    }

    /**
     * Validate API response
     */
    validateApiResponse(response) {
        if (!response) {
            this.log('ERROR', '❌ Response is null or undefined');
            return false;
        }

        // Check if response has the expected structure
        // API returns either {success, data: {reviews, ...}} or {reviews, ratingBreakdown, pagination}
        const hasSuccessFormat = response.success && response.data;
        const hasDirectFormat = response.reviews !== undefined;

        if (!hasSuccessFormat && !hasDirectFormat) {
            this.log('ERROR', '❌ Response has unexpected structure', response);
            return false;
        }

        // Get reviews array from either format
        const reviews = hasSuccessFormat ? response.data.reviews : response.reviews;

        if (!Array.isArray(reviews)) {
            this.log('ERROR', '❌ Reviews is not an array', { reviews });
            return false;
        }

        this.log('SUCCESS', '✅ API response is valid', {
            format: hasSuccessFormat ? 'success/data' : 'direct',
            reviewCount: reviews.length
        });
        return true;
    }

    /**
     * Performance timing
     */
    startTimer(label) {
        if (!this.enabled) return;
        console.time(label);
    }

    endTimer(label) {
        if (!this.enabled) return;
        console.timeEnd(label);
    }
}

// Create singleton instance
const reviewDebugger = new ReviewDebugger();

// Expose to window for manual debugging
if (typeof window !== 'undefined') {
    window.reviewDebugger = reviewDebugger;
}

export default reviewDebugger;

/**
 * Usage Examples:
 * 
 * // In your component:
 * import reviewDebugger from '../utils/reviewDebug';
 * 
 * // Log API request
 * reviewDebugger.logApiRequest('/api/products/123/reviews', { page: 1, limit: 10 });
 * 
 * // Log API response
 * reviewDebugger.logApiResponse('/api/products/123/reviews', response, 250);
 * 
 * // Log error
 * reviewDebugger.logApiError('/api/products/123/reviews', error);
 * 
 * // Print summary
 * reviewDebugger.printSummary();
 * 
 * // Export logs
 * reviewDebugger.exportLogs();
 * 
 * // From browser console:
 * window.reviewDebugger.printSummary()
 * window.reviewDebugger.exportLogs()
 * window.reviewDebugger.clearLogs()
 */
