import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * Authentication Store with Zustand
 * Manages user authentication state, tokens, and auth-related actions
 */
export const useAuthStore = create(
    persist(
        immer((set, get) => ({
            // State
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            sessionId: null,
            authMethod: null,
            lastActivity: null,

            // Actions
            setUser: (user) => set((state) => {
                state.user = user;
                state.isAuthenticated = !!user;
                state.error = null;
                state.lastActivity = new Date().toISOString();
            }),

            setTokens: (tokens) => set((state) => {
                state.token = tokens.accessToken;
                state.refreshToken = tokens.refreshToken;
                state.sessionId = tokens.sessionId;
                state.authMethod = tokens.authMethod || 'jwt';
                state.lastActivity = new Date().toISOString();
            }),

            setLoading: (loading) => set((state) => {
                state.isLoading = loading;
            }),

            setError: (error) => set((state) => {
                state.error = error;
                state.isLoading = false;
            }),

            clearError: () => set((state) => {
                state.error = null;
            }),

            login: async (credentials) => {
                set((state) => {
                    state.isLoading = true;
                    state.error = null;
                });

                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(credentials),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Login failed');
                    }

                    set((state) => {
                        state.user = data.user;
                        state.token = data.tokens.accessToken;
                        state.refreshToken = data.tokens.refreshToken;
                        state.sessionId = data.tokens.sessionId;
                        state.authMethod = data.tokens.authMethod || 'jwt';
                        state.isAuthenticated = true;
                        state.isLoading = false;
                        state.error = null;
                        state.lastActivity = new Date().toISOString();
                    });

                    return data;
                } catch (error) {
                    set((state) => {
                        state.error = error.message;
                        state.isLoading = false;
                    });
                    throw error;
                }
            },

            register: async (userData) => {
                set((state) => {
                    state.isLoading = true;
                    state.error = null;
                });

                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(userData),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Registration failed');
                    }

                    set((state) => {
                        state.user = data.user;
                        state.token = data.tokens.accessToken;
                        state.refreshToken = data.tokens.refreshToken;
                        state.sessionId = data.tokens.sessionId;
                        state.authMethod = data.tokens.authMethod || 'jwt';
                        state.isAuthenticated = true;
                        state.isLoading = false;
                        state.error = null;
                        state.lastActivity = new Date().toISOString();
                    });

                    return data;
                } catch (error) {
                    set((state) => {
                        state.error = error.message;
                        state.isLoading = false;
                    });
                    throw error;
                }
            },

            logout: async () => {
                set((state) => {
                    state.isLoading = true;
                });

                try {
                    const { token } = get();

                    if (token) {
                        await fetch('/api/auth/logout', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                    }
                } catch (error) {
                    console.warn('Logout request failed:', error.message);
                } finally {
                    // Clear state regardless of API call success
                    set((state) => {
                        state.user = null;
                        state.token = null;
                        state.refreshToken = null;
                        state.sessionId = null;
                        state.authMethod = null;
                        state.isAuthenticated = false;
                        state.isLoading = false;
                        state.error = null;
                        state.lastActivity = null;
                    });
                }
            },

            refreshTokens: async () => {
                const { refreshToken } = get();

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                try {
                    const response = await fetch('/api/auth/refresh-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ refreshToken }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Token refresh failed');
                    }

                    set((state) => {
                        state.token = data.tokens.accessToken;
                        state.refreshToken = data.tokens.refreshToken;
                        state.sessionId = data.tokens.sessionId;
                        state.user = data.user;
                        state.lastActivity = new Date().toISOString();
                    });

                    return data;
                } catch (error) {
                    // If refresh fails, logout user
                    get().logout();
                    throw error;
                }
            },

            updateProfile: async (profileData) => {
                set((state) => {
                    state.isLoading = true;
                    state.error = null;
                });

                try {
                    const { token } = get();

                    const response = await fetch('/api/auth/profile', {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(profileData),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Profile update failed');
                    }

                    set((state) => {
                        state.user = { ...state.user, ...data.user };
                        state.isLoading = false;
                        state.error = null;
                        state.lastActivity = new Date().toISOString();
                    });

                    return data;
                } catch (error) {
                    set((state) => {
                        state.error = error.message;
                        state.isLoading = false;
                    });
                    throw error;
                }
            },

            changePassword: async (passwordData) => {
                set((state) => {
                    state.isLoading = true;
                    state.error = null;
                });

                try {
                    const { token } = get();

                    const response = await fetch('/api/auth/change-password', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(passwordData),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Password change failed');
                    }

                    set((state) => {
                        state.isLoading = false;
                        state.error = null;
                        state.lastActivity = new Date().toISOString();
                    });

                    return data;
                } catch (error) {
                    set((state) => {
                        state.error = error.message;
                        state.isLoading = false;
                    });
                    throw error;
                }
            },

            // Utility methods
            isTokenExpired: () => {
                const { token } = get();
                if (!token) return true;

                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    return Date.now() >= payload.exp * 1000;
                } catch {
                    return true;
                }
            },

            getAuthHeader: () => {
                const { token } = get();
                return token ? `Bearer ${token}` : null;
            },

            updateLastActivity: () => set((state) => {
                state.lastActivity = new Date().toISOString();
            }),

            // Reset store (useful for testing)
            reset: () => set((state) => {
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.sessionId = null;
                state.authMethod = null;
                state.isAuthenticated = false;
                state.isLoading = false;
                state.error = null;
                state.lastActivity = null;
            }),
        })),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                sessionId: state.sessionId,
                authMethod: state.authMethod,
                isAuthenticated: state.isAuthenticated,
                lastActivity: state.lastActivity,
            }),
            version: 1,
            migrate: (persistedState, version) => {
                // Handle migration from older versions
                if (version === 0) {
                    // Migration logic for version 0 to 1
                    return {
                        ...persistedState,
                        authMethod: 'jwt',
                        sessionId: null,
                        lastActivity: new Date().toISOString(),
                    };
                }
                return persistedState;
            },
        }
    )
);

// Selectors for better performance
export const useAuth = () => useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
}));

export const useAuthActions = () => useAuthStore((state) => ({
    login: state.login,
    register: state.register,
    logout: state.logout,
    updateProfile: state.updateProfile,
    changePassword: state.changePassword,
    clearError: state.clearError,
}));

export const useAuthToken = () => useAuthStore((state) => ({
    token: state.token,
    refreshToken: state.refreshToken,
    getAuthHeader: state.getAuthHeader,
    isTokenExpired: state.isTokenExpired,
    refreshTokens: state.refreshTokens,
}));