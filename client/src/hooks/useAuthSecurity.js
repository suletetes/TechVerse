import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

// Security monitoring hook
export const useAuthSecurity = () => {
  const { user, isAuthenticated, getTimeUntilExpiry, isSessionExpiringSoon } = useAuth();
  const { showNotification } = useNotification();
  
  const [securityStatus, setSecurityStatus] = useState({
    passwordStrength: 'unknown',
    lastPasswordChange: null,
    suspiciousActivity: false,
    deviceTrust: 'unknown',
    loginHistory: []
  });

  // Check password strength
  const checkPasswordStrength = useCallback((password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let score = 0;
    if (password.length >= minLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumbers) score++;
    if (hasSpecialChar) score++;
    
    if (score < 3) return 'weak';
    if (score < 4) return 'medium';
    return 'strong';
  }, []);

  // Monitor session expiry
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const timeLeft = getTimeUntilExpiry();
      
      if (timeLeft && timeLeft <= 300000) { // 5 minutes
        showNotification(
          `Session expires in ${Math.ceil(timeLeft / 60000)} minutes`,
          'warning'
        );
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, getTimeUntilExpiry, showNotification]);

  // Detect suspicious activity patterns
  const detectSuspiciousActivity = useCallback((loginHistory) => {
    if (!loginHistory || loginHistory.length < 2) return false;

    const recent = loginHistory.slice(0, 5);
    const locations = new Set(recent.map(login => login.location));
    const devices = new Set(recent.map(login => login.device));
    
    // Multiple locations in short time
    if (locations.size > 2) return true;
    
    // Multiple devices in short time
    if (devices.size > 3) return true;
    
    // Failed attempts followed by success
    const hasFailedAttempts = recent.some(login => !login.success);
    const hasRecentSuccess = recent[0]?.success;
    
    return hasFailedAttempts && hasRecentSuccess;
  }, []);

  // Get security recommendations
  const getSecurityRecommendations = useCallback(() => {
    const recommendations = [];
    
    if (!user?.mfaEnabled) {
      recommendations.push({
        type: 'mfa',
        priority: 'high',
        message: 'Enable two-factor authentication for better security'
      });
    }
    
    if (securityStatus.passwordStrength === 'weak') {
      recommendations.push({
        type: 'password',
        priority: 'high',
        message: 'Your password is weak. Consider using a stronger password'
      });
    }
    
    if (securityStatus.suspiciousActivity) {
      recommendations.push({
        type: 'activity',
        priority: 'critical',
        message: 'Suspicious activity detected. Review your recent logins'
      });
    }
    
    if (isSessionExpiringSoon()) {
      recommendations.push({
        type: 'session',
        priority: 'medium',
        message: 'Your session is expiring soon. Save your work'
      });
    }
    
    return recommendations;
  }, [user, securityStatus, isSessionExpiringSoon]);

  return {
    securityStatus,
    checkPasswordStrength,
    detectSuspiciousActivity,
    getSecurityRecommendations
  };
};

// Device fingerprinting hook
export const useDeviceFingerprint = () => {
  const [fingerprint, setFingerprint] = useState(null);

  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        canvas: canvas.toDataURL(),
        webgl: getWebGLFingerprint(),
        fonts: detectFonts(),
        plugins: Array.from(navigator.plugins).map(p => p.name).sort(),
        timestamp: Date.now()
      };
      
      setFingerprint(fingerprint);
    };

    const getWebGLFingerprint = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return null;
        
        return {
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER)
        };
      } catch (e) {
        return null;
      }
    };

    const detectFonts = () => {
      const testFonts = [
        'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
        'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman'
      ];
      
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      const baselines = {};
      baseFonts.forEach(baseFont => {
        context.font = `${testSize} ${baseFont}`;
        baselines[baseFont] = context.measureText(testString).width;
      });
      
      return testFonts.filter(font => {
        return baseFonts.some(baseFont => {
          context.font = `${testSize} ${font}, ${baseFont}`;
          return context.measureText(testString).width !== baselines[baseFont];
        });
      });
    };

    generateFingerprint();
  }, []);

  return fingerprint;
};

// Biometric authentication hook (if supported)
export const useBiometricAuth = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        setIsSupported(true);
        
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsAvailable(available);
        } catch (error) {
          console.warn('Biometric check failed:', error);
        }
      }
    };

    checkSupport();
  }, []);

  const registerBiometric = async (userId) => {
    if (!isSupported || !isAvailable) {
      throw new Error('Biometric authentication not supported');
    }

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: { name: 'TechVerse' },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: userId
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        }
      }
    });

    return credential;
  };

  const authenticateBiometric = async (credentialId) => {
    if (!isSupported || !isAvailable) {
      throw new Error('Biometric authentication not supported');
    }

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        allowCredentials: [{
          id: credentialId,
          type: 'public-key'
        }],
        userVerification: 'required'
      }
    });

    return assertion;
  };

  return {
    isSupported,
    isAvailable,
    registerBiometric,
    authenticateBiometric
  };
};