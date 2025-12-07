// Error Reporting Service for centralized error handling and reporting

class ErrorReportingService {
    constructor() {
        this.errorQueue = [];
        this.isOnline = navigator.onLine;
        this.maxQueueSize = 100;
        this.retryAttempts = 3;
        
        // Listen for online/offline events
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    // Report error to external service or local storage
    async reportError(errorReport) {
        try {
            // Add metadata
            const enhancedReport = {
                ...errorReport,
                sessionId: this.getSessionId(),
                buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
                environment: import.meta.env.MODE,
                browserInfo: this.getBrowserInfo(),
                performanceInfo: this.getPerformanceInfo()
            };

            // If online, try to send immediately
            if (this.isOnline) {
                await this.sendErrorReport(enhancedReport);
            } else {
                // Queue for later if offline
                this.queueError(enhancedReport);
            }

            // Always store locally for debugging
            this.storeErrorLocally(enhancedReport);

        } catch (error) {
            console.error('Failed to report error:', error);
            // Fallback to local storage
            this.storeErrorLocally(errorReport);
        }
    }

    // Send error report to external service
    async sendErrorReport(errorReport) {
        // In development, just log to console
        if (import.meta.env.DEV) {
            console.group('📊 Error Report');
            console.error('Report:', errorReport);
            console.groupEnd();
            return;
        }

        // In production, send to error reporting service
        // This would typically be Sentry, LogRocket, Bugsnag, etc.
        const endpoint = import.meta.env.VITE_ERROR_REPORTING_ENDPOINT;
        
        if (!endpoint) {
            console.warn('No error reporting endpoint configured');
            return;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(errorReport)
        });

        if (!response.ok) {
            throw new Error(`Error reporting failed: ${response.status}`);
        }
    }

    // Queue error for later transmission
    queueError(errorReport) {
        this.errorQueue.push(errorReport);
        
        // Limit queue size
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift(); // Remove oldest error
        }

        // Store queue in localStorage
        try {
            localStorage.setItem('errorQueue', JSON.stringify(this.errorQueue));
        } catch (error) {
            console.warn('Failed to store error queue:', error);
        }
    }

    // Store error locally for debugging
    storeErrorLocally(errorReport) {
        try {
            const key = `error_${errorReport.id}`;
            const storedErrors = JSON.parse(localStorage.getItem('storedErrors') || '[]');
            
            storedErrors.push({
                key,
                timestamp: errorReport.timestamp,
                message: errorReport.message
            });

            // Keep only last 50 errors
            if (storedErrors.length > 50) {
                const oldestError = storedErrors.shift();
                localStorage.removeItem(oldestError.key);
            }

            localStorage.setItem('storedErrors', JSON.stringify(storedErrors));
            localStorage.setItem(key, JSON.stringify(errorReport));
        } catch (error) {
            console.warn('Failed to store error locally:', error);
        }
    }

    // Handle coming back online
    async handleOnline() {
        this.isOnline = true;

        // Load queued errors from localStorage
        try {
            const queuedErrors = JSON.parse(localStorage.getItem('errorQueue') || '[]');
            this.errorQueue = queuedErrors;
        } catch (error) {
            console.warn('Failed to load error queue:', error);
        }

        // Process queued errors
        await this.processErrorQueue();
    }

    // Handle going offline
    handleOffline() {
        this.isOnline = false;
    }

    // Process queued errors
    async processErrorQueue() {
        const errors = [...this.errorQueue];
        this.errorQueue = [];

        for (const errorReport of errors) {
            try {
                await this.sendErrorReport(errorReport);
            } catch (error) {
                console.warn('Failed to send queued error:', error);
                // Re-queue if failed
                this.queueError(errorReport);
            }
        }

        // Update localStorage
        try {
            localStorage.setItem('errorQueue', JSON.stringify(this.errorQueue));
        } catch (error) {
            console.warn('Failed to update error queue:', error);
        }
    }

    // Get or create session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    // Get browser information
    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            }
        };
    }

    // Get performance information
    getPerformanceInfo() {
        if (!window.performance) return null;

        const navigation = performance.getEntriesByType('navigation')[0];
        const memory = performance.memory;

        return {
            timing: navigation ? {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                responseTime: navigation.responseEnd - navigation.requestStart
            } : null,
            memory: memory ? {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit
            } : null,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }

    // Get stored errors for debugging
    getStoredErrors() {
        try {
            const storedErrors = JSON.parse(localStorage.getItem('storedErrors') || '[]');
            return storedErrors.map(errorInfo => {
                const errorData = JSON.parse(localStorage.getItem(errorInfo.key) || '{}');
                return errorData;
            });
        } catch (error) {
            console.warn('Failed to retrieve stored errors:', error);
            return [];
        }
    }

    // Clear stored errors
    clearStoredErrors() {
        try {
            const storedErrors = JSON.parse(localStorage.getItem('storedErrors') || '[]');
            storedErrors.forEach(errorInfo => {
                localStorage.removeItem(errorInfo.key);
            });
            localStorage.removeItem('storedErrors');
            localStorage.removeItem('errorQueue');
            this.errorQueue = [];
        } catch (error) {
            console.warn('Failed to clear stored errors:', error);
        }
    }

    // Get error statistics
    getErrorStats() {
        const storedErrors = this.getStoredErrors();
        const stats = {
            total: storedErrors.length,
            byType: {},
            bySection: {},
            recent: storedErrors.filter(error => {
                const errorTime = new Date(error.timestamp);
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                return errorTime > oneHourAgo;
            }).length
        };

        storedErrors.forEach(error => {
            // Count by type
            const type = error.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            // Count by section
            const section = error.section || 'unknown';
            stats.bySection[section] = (stats.bySection[section] || 0) + 1;
        });

        return stats;
    }
}

// Create singleton instance
const errorReportingService = new ErrorReportingService();

export default errorReportingService;