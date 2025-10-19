/**
 * Token Manager Tests
 * 
 * Tests for the enhanced token manager functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tokenManager } from '../tokenManager.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock window and document
const windowMock = {
  location: { protocol: 'https:' },
  addEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

const documentMock = {
  createElement: vi.fn(() => ({
    getContext: vi.fn(() => ({
      textBaseline: '',
      font: '',
      fillText: vi.fn(),
      toDataURL: vi.fn(() => 'mock-canvas-data')
    }))
  })),
  addEventListener: vi.fn()
};

// Mock navigator
const navigatorMock = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
  language: 'en-US',
  languages: ['en-US', 'en'],
  platform: 'Test Platform',
  cookieEnabled: true,
  doNotTrack: '0',
  hardwareConcurrency: 4,
  maxTouchPoints: 0
};

// Mock screen
const screenMock = {
  width: 1920,
  height: 1080,
  colorDepth: 24,
  pixelDepth: 24
};

describe('TokenManager', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    global.localStorage = localStorageMock;
    global.window = windowMock;
    global.document = documentMock;
    global.navigator = navigatorMock;
    global.screen = screenMock;
    global.Intl = {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'America/New_York' })
      })
    };
    
    // Mock atob and btoa
    global.atob = vi.fn((str) => Buffer.from(str, 'base64').toString());
    global.btoa = vi.fn((str) => Buffer.from(str).toString('base64'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Validation', () => {
    it('should validate JWT token format correctly', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwfQ.signature';
      
      // Mock atob to return valid JSON
      global.atob = vi.fn()
        .mockReturnValueOnce('{"alg":"HS256","typ":"JWT"}') // header
        .mockReturnValueOnce('{"id":"123","email":"test@example.com","exp":9999999999,"iat":1600000000}'); // payload
      
      const validation = tokenManager.validateTokenFormat(validToken);
      expect(validation.valid).toBe(true);
      expect(validation.payload).toBeDefined();
      expect(validation.payload.id).toBe('123');
    });

    it('should reject invalid token format', () => {
      const invalidToken = 'invalid.token';
      
      const validation = tokenManager.validateTokenFormat(invalidToken);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Invalid JWT format');
    });

    it('should reject token with invalid payload', () => {
      const tokenWithInvalidPayload = 'header.payload.signature';
      
      global.atob = vi.fn()
        .mockReturnValueOnce('{"alg":"HS256","typ":"JWT"}') // header
        .mockReturnValueOnce('{"invalid":"payload"}'); // payload without required fields
      
      const validation = tokenManager.validateTokenFormat(tokenWithInvalidPayload);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Invalid JWT payload');
    });
  });

  describe('Token Storage', () => {
    it('should store token with security metadata', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwfQ.signature';
      
      global.atob = vi.fn()
        .mockReturnValueOnce('{"alg":"HS256","typ":"JWT"}')
        .mockReturnValueOnce('{"id":"123","email":"test@example.com","exp":9999999999,"iat":1600000000}');
      
      tokenManager.setToken(token, '1h', 'session123');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('techverse_token_v2'),
        token
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('techverse_token_expiry_v2'),
        expect.any(String)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('techverse_token_fp_v2'),
        expect.any(String)
      );
    });

    it('should throw error for invalid token format during storage', () => {
      const invalidToken = 'invalid-token';
      
      expect(() => {
        tokenManager.setToken(invalidToken);
      }).toThrow('Invalid token');
    });
  });

  describe('Token Retrieval', () => {
    it('should return null when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const token = tokenManager.getToken();
      expect(token).toBeNull();
    });

    it('should return token when valid token exists', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwfQ.signature';
      const futureExpiry = (Date.now() + 3600000).toString(); // 1 hour from now
      
      localStorageMock.getItem
        .mockReturnValueOnce(validToken) // token
        .mockReturnValueOnce(futureExpiry) // expiry
        .mockReturnValueOnce('fingerprint123'); // fingerprint
      
      global.atob = vi.fn()
        .mockReturnValueOnce('{"alg":"HS256","typ":"JWT"}')
        .mockReturnValueOnce('{"id":"123","email":"test@example.com","exp":9999999999,"iat":1600000000}');
      
      const token = tokenManager.getToken();
      expect(token).toBe(validToken);
    });

    it('should return null for expired token', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwfQ.signature';
      const pastExpiry = (Date.now() - 3600000).toString(); // 1 hour ago
      
      localStorageMock.getItem
        .mockReturnValueOnce(validToken) // token
        .mockReturnValueOnce(pastExpiry); // expired
      
      global.atob = vi.fn()
        .mockReturnValueOnce('{"alg":"HS256","typ":"JWT"}')
        .mockReturnValueOnce('{"id":"123","email":"test@example.com","exp":9999999999,"iat":1600000000}');
      
      const token = tokenManager.getToken();
      expect(token).toBeNull();
    });
  });

  describe('Security Features', () => {
    it('should generate browser fingerprint', () => {
      const fingerprint = tokenManager.generateBrowserFingerprint();
      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
    });

    it('should detect fingerprint mismatch', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwfQ.signature';
      const futureExpiry = (Date.now() + 3600000).toString();
      const oldFingerprint = 'old-fingerprint';
      
      localStorageMock.getItem
        .mockReturnValueOnce(validToken) // token
        .mockReturnValueOnce(futureExpiry) // expiry
        .mockReturnValueOnce(oldFingerprint); // old fingerprint
      
      global.atob = vi.fn()
        .mockReturnValueOnce('{"alg":"HS256","typ":"JWT"}')
        .mockReturnValueOnce('{"id":"123","email":"test@example.com","exp":9999999999,"iat":1600000000}');
      
      // Mock fingerprint generation to return different value
      vi.spyOn(tokenManager, 'generateBrowserFingerprint').mockReturnValue('new-fingerprint');
      
      const token = tokenManager.getToken();
      
      // Should increment mismatch counter but still return token (first mismatch)
      expect(tokenManager.fingerprintMismatches).toBe(1);
    });

    it('should clear tokens on security breach', () => {
      tokenManager.handleSuspiciousActivity();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(expect.any(Number));
      expect(windowMock.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'securityBreach'
        })
      );
    });
  });

  describe('Token Expiry', () => {
    it('should check if token is expiring soon', () => {
      const soonExpiry = (Date.now() + 5 * 60 * 1000).toString(); // 5 minutes from now
      localStorageMock.getItem.mockReturnValue(soonExpiry);
      
      const isExpiringSoon = tokenManager.isTokenExpiringSoon();
      expect(isExpiringSoon).toBe(true);
    });

    it('should return false for token not expiring soon', () => {
      const futureExpiry = (Date.now() + 60 * 60 * 1000).toString(); // 1 hour from now
      localStorageMock.getItem.mockReturnValue(futureExpiry);
      
      const isExpiringSoon = tokenManager.isTokenExpiringSoon();
      expect(isExpiringSoon).toBe(false);
    });
  });

  describe('Token Cleanup', () => {
    it('should clear all tokens and related data', () => {
      tokenManager.clearTokens();
      
      // Should remove multiple keys
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(expect.any(Number));
      expect(windowMock.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'authTokensCleared'
        })
      );
    });
  });
});