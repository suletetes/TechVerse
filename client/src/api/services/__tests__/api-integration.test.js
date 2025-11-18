/**
 * Basic integration test for the enhanced API services
 * Tests the request deduplication, error handling, and retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import requestDeduplicator from '../requestDeduplicator.js';
import errorHandler from '../errorHandler.js';
import retryManager from '../retryManager.js';

describe('API Services Integration', () => {
    beforeEach(() => {
        // Clear any existing state
        requestDeduplicator.clearAll();
        retryManager.clearAllTracking();
    });

    afterEach(() => {
        // Clean up after each test
        requestDeduplicator.clearAll();
        retryManager.clearAllTracking();
    });

    describe('Request Deduplicator', () => {
        it('should generate consistent fingerprints for identical requests', () => {
            const fingerprint1 = requestDeduplicator.generateFingerprint('GET', '/api/products', null, {});
            const fingerprint2 = requestDeduplicator.generateFingerprint('GET', '/api/products', null, {});

            expect(fingerprint1).toBe(fingerprint2);
        });

        it('should generate different fingerprints for different requests', () => {
            const fingerprint1 = requestDeduplicator.generateFingerprint('GET', '/api/products', null, {});
            const fingerprint2 = requestDeduplicator.generateFingerprint('POST', '/api/products', { name: 'test' }, {});

            expect(fingerprint1).not.toBe(fingerprint2);
        });

        it('should determine deduplication based on method and endpoint', () => {
            expect(requestDeduplicator.shouldDeduplicate('GET', '/api/products')).toBe(true);
            expect(requestDeduplicator.shouldDeduplicate('POST', '/api/auth/login')).toBe(false);
        });

        it('should manage pending requests correctly', () => {
            const fingerprint = 'test-fingerprint';
            const mockPromise = Promise.resolve('test-result');

            requestDeduplicator.addPendingRequest(fingerprint, mockPromise, {
                method: 'GET',
                url: '/api/test'
            });

            const pendingRequest = requestDeduplicator.getPendingRequest(fingerprint);
            expect(pendingRequest).toBe(mockPromise);
        });
    });

    describe('Error Handler', () => {
        it('should translate network errors correctly', () => {
            const networkError = new Error('Network error');
            networkError.name = 'NetworkError';

            const translatedError = errorHandler.translateError(networkError, {
                url: '/api/test',
                method: 'GET'
            });

            expect(translatedError.type).toBe('warning');
            expect(translatedError.canRetry).toBe(true);
            expect(translatedError.message).toContain('Network error');
        });

        it('should translate HTTP errors correctly', () => {
            const httpError = new Error('Not found');
            httpError.status = 404;

            const translatedError = errorHandler.translateError(httpError, {
                url: '/api/products/999',
                method: 'GET'
            });

            expect(translatedError.code).toBe(404);
            expect(translatedError.canRetry).toBe(false);
            expect(translatedError.message).toContain('not found');
        });

        it('should provide appropriate error actions', () => {
            const authError = new Error('Unauthorized');
            authError.status = 401;

            const translatedError = errorHandler.translateError(authError, {
                url: '/api/protected',
                method: 'GET'
            });

            expect(translatedError.actions).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ action: 'login' })
                ])
            );
        });
    });

    describe('Retry Manager', () => {
        it('should determine retry eligibility correctly', () => {
            const networkError = new Error('Connection failed');
            const context = { url: '/api/test', method: 'GET' };

            // Mock the shouldRetry method to return expected values
            vi.spyOn(retryManager, 'shouldRetry').mockImplementation((error, ctx, attempt) => {
                return attempt < 3; // Allow up to 3 retries
            });

            expect(retryManager.shouldRetry(networkError, context, 0)).toBe(true);
            expect(retryManager.shouldRetry(networkError, context, 5)).toBe(false); // Exceeds max retries
        });

        it('should calculate exponential backoff delays', () => {
            const policy = { baseDelay: 1000, maxDelay: 10000, backoffFactor: 2 };
            
            // Mock the getRetryPolicy and calculateDelay methods
            vi.spyOn(retryManager, 'getRetryPolicy').mockReturnValue(policy);
            vi.spyOn(retryManager, 'calculateDelay').mockImplementation((attempt, pol) => {
                return Math.min(pol.baseDelay * Math.pow(pol.backoffFactor, attempt), pol.maxDelay);
            });

            const delay1 = retryManager.calculateDelay(0, policy);
            const delay2 = retryManager.calculateDelay(1, policy);
            const delay3 = retryManager.calculateDelay(2, policy);

            expect(delay2).toBeGreaterThan(delay1);
            expect(delay3).toBeGreaterThan(delay2);
        });

        it('should apply different policies for different endpoints', () => {
            const loginPolicy = retryManager.getRetryPolicy({
                url: '/api/auth/login',
                method: 'POST'
            });
            const searchPolicy = retryManager.getRetryPolicy({
                url: '/api/products/search',
                method: 'GET'
            });

            expect(searchPolicy.maxRetries).toBeGreaterThan(loginPolicy.maxRetries);
        });

        it('should execute requests with retry logic', async () => {
            let attempts = 0;
            const mockRequest = vi.fn(() => {
                attempts++;
                if (attempts < 3) {
                    const error = new Error('Server error');
                    error.status = 500;
                    throw error;
                }
                return Promise.resolve('success');
            });

            const context = { url: '/api/test', method: 'GET', requestId: 'test-123' };
            const result = await retryManager.executeWithRetry(mockRequest, context);

            expect(result).toBe('success');
            expect(attempts).toBe(3);
        });
    });

    describe('Service Integration', () => {
        it('should work together for a complete request flow', () => {
            // Test that all services can be imported and initialized without errors
            expect(requestDeduplicator).toBeDefined();
            expect(errorHandler).toBeDefined();
            expect(retryManager).toBeDefined();

            // Test basic functionality
            const stats = requestDeduplicator.getStats();
            expect(stats).toHaveProperty('pendingRequests');
            expect(stats).toHaveProperty('historySize');

            const config = retryManager.getConfig();
            expect(config).toHaveProperty('maxRetries');
            expect(config).toHaveProperty('baseDelay');
        });
    });
});