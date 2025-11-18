/**
 * Shared Admin Data Store
 * Prevents data loss when switching between admin tabs
 */

class AdminDataStore {
    constructor() {
        this.data = {
            products: [],
            users: [],
            orders: [],
            categories: []
        };
        this.loading = {
            products: false,
            users: false,
            orders: false,
            categories: false
        };
        this.errors = {
            products: null,
            users: null,
            orders: null,
            categories: null
        };
        this.lastFetch = {
            products: null,
            users: null,
            orders: null,
            categories: null
        };
        this.listeners = new Map();
    }

    // Set data for a specific type
    setData(type, data) {
        this.data[type] = data;
        this.lastFetch[type] = Date.now();
        this.notifyListeners(type);
    }

    // Get data for a specific type
    getData(type) {
        return this.data[type] || [];
    }

    // Set loading state
    setLoading(type, loading) {
        this.loading[type] = loading;
        this.notifyListeners(type);
    }

    // Get loading state
    isLoading(type) {
        return this.loading[type] || false;
    }

    // Set error
    setError(type, error) {
        this.errors[type] = error;
        this.notifyListeners(type);
    }

    // Get error
    getError(type) {
        return this.errors[type];
    }

    // Check if data is fresh (less than 5 minutes old)
    isDataFresh(type, maxAge = 5 * 60 * 1000) {
        const lastFetch = this.lastFetch[type];
        return lastFetch && (Date.now() - lastFetch) < maxAge;
    }

    // Add listener for data changes
    addListener(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type).add(callback);

        // Return unsubscribe function
        return () => {
            const typeListeners = this.listeners.get(type);
            if (typeListeners) {
                typeListeners.delete(callback);
            }
        };
    }

    // Notify listeners of data changes
    notifyListeners(type) {
        const typeListeners = this.listeners.get(type);
        if (typeListeners) {
            const data = {
                data: this.data[type],
                loading: this.loading[type],
                error: this.errors[type],
                lastFetch: this.lastFetch[type]
            };
            
            typeListeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${type} listener:`, error);
                }
            });
        }
    }

    // Clear data for a specific type
    clearData(type) {
        this.data[type] = [];
        this.lastFetch[type] = null;
        this.errors[type] = null;
        this.notifyListeners(type);
    }

    // Clear all data
    clearAll() {
        Object.keys(this.data).forEach(type => {
            this.clearData(type);
        });
    }
}

// Create singleton instance
export const adminDataStore = new AdminDataStore();

// Make available globally in development
if (import.meta.env?.DEV && typeof window !== 'undefined') {
    window.adminDataStore = adminDataStore;
    console.log('🔧 Development helper: window.adminDataStore');
}

export default adminDataStore;