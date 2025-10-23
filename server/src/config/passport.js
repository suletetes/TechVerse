import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Initialize Passport strategies
 * This function is called after environment variables are loaded
 */
export const initializePassport = () => {
  /**
   * JWT Strategy Configuration
   * Replaces the custom JWT middleware with Passport JWT strategy
   */
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required for Passport JWT strategy');
  }

  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    algorithms: ['HS256'],
    issuer: process.env.JWT_ISSUER || 'techverse-api',
    audience: process.env.JWT_AUDIENCE || 'techverse-client',
    clockTolerance: 30 // 30 seconds tolerance for clock skew
  };

  passport.use('jwt', new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Enhanced token payload validation
      if (!payload.id || !payload.email || !payload.role) {
        logger.warn('Invalid JWT payload structure', {
          hasId: !!payload.id,
          hasEmail: !!payload.email,
          hasRole: !!payload.role,
          jti: payload.jti
        });
        return done(null, false, { message: 'Invalid token payload' });
      }

      // Validate token age (prevent very old tokens)
      const tokenAge = Date.now() / 1000 - payload.iat;
      const maxTokenAge = 30 * 24 * 60 * 60; // 30 days in seconds

      if (tokenAge > maxTokenAge) {
        logger.warn('JWT token too old', {
          userId: payload.id,
          tokenAge: Math.floor(tokenAge / 86400), // days
          maxAge: 30,
          jti: payload.jti
        });
        return done(null, false, { message: 'Token is too old' });
      }

      // Find user and exclude sensitive fields
      const user = await User.findById(payload.id)
        .select('-password -emailVerificationToken -passwordResetToken')
        .lean();

      if (!user) {
        logger.warn('JWT authentication failed: User not found', {
          userId: payload.id,
          jti: payload.jti
        });
        return done(null, false, { message: 'User not found' });
      }

      // Enhanced account status checks
      if (!user.isActive) {
        logger.warn('JWT authentication failed: Account inactive', {
          userId: user._id,
          jti: payload.jti
        });
        return done(null, false, { message: 'Account is deactivated' });
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
        logger.warn('JWT authentication failed: Account locked', {
          userId: user._id,
          lockUntil: user.lockUntil,
          jti: payload.jti
        });
        return done(null, false, { 
          message: `Account is temporarily locked. Try again in ${lockTimeRemaining} minutes.`,
          lockUntil: user.lockUntil
        });
      }

      // Check account status
      if (user.accountStatus === 'suspended') {
        logger.warn('JWT authentication failed: Account suspended', {
          userId: user._id,
          suspensionReason: user.suspensionReason,
          jti: payload.jti
        });
        return done(null, false, { 
          message: 'Account is suspended',
          reason: user.suspensionReason
        });
      }

      if (user.accountStatus === 'pending') {
        logger.warn('JWT authentication failed: Email not verified', {
          userId: user._id,
          jti: payload.jti
        });
        return done(null, false, { message: 'Please verify your email address' });
      }

      if (user.accountStatus === 'closed') {
        logger.warn('JWT authentication failed: Account closed', {
          userId: user._id,
          jti: payload.jti
        });
        return done(null, false, { message: 'Account has been closed' });
      }

      // Add auth context to user object
      user.authContext = {
        tokenIssuedAt: new Date(payload.iat * 1000),
        tokenExpiresAt: new Date(payload.exp * 1000),
        sessionId: payload.sessionId,
        jti: payload.jti
      };

      logger.debug('JWT authentication successful', {
        userId: user._id,
        role: user.role,
        jti: payload.jti
      });

      return done(null, user);

    } catch (error) {
      logger.error('JWT strategy error', {
        error: error.message,
        stack: error.stack,
        jti: payload?.jti
      });
      return done(error, false);
    }
  }));

  /**
   * Local Strategy Configuration
   * For email/password authentication
   */
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      // Find user by email (include password field)
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        logger.warn('Local authentication failed: User not found', {
          email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
        logger.warn('Local authentication failed: Account locked', {
          userId: user._id,
          lockUntil: user.lockUntil,
          ip: req.ip
        });
        return done(null, false, { 
          message: `Account is temporarily locked. Try again in ${lockTimeRemaining} minutes.`,
          lockUntil: user.lockUntil,
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incLoginAttempts();
        
        logger.warn('Local authentication failed: Invalid password', {
          userId: user._id,
          email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
          failedAttempts: user.loginAttempts + 1,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Check if password hash needs upgrade and migrate if necessary
      if (user.needsPasswordUpgrade()) {
        try {
          const upgraded = await user.upgradePasswordHash(password);
          if (upgraded) {
            await user.save();
            logger.info('Password hash upgraded during login', {
              userId: user._id,
              email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
              ip: req.ip
            });
          }
        } catch (upgradeError) {
          // Log the error but don't fail the login
          logger.warn('Password hash upgrade failed during login', {
            userId: user._id,
            error: upgradeError.message,
            ip: req.ip
          });
        }
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await User.findByIdAndUpdate(user._id, {
          $unset: { loginAttempts: 1, lockUntil: 1 }
        });
      }

      // Check account status
      if (!user.isActive) {
        logger.warn('Local authentication failed: Account inactive', {
          userId: user._id,
          ip: req.ip
        });
        return done(null, false, { message: 'Account is deactivated' });
      }

      if (user.accountStatus === 'suspended') {
        logger.warn('Local authentication failed: Account suspended', {
          userId: user._id,
          suspensionReason: user.suspensionReason,
          ip: req.ip
        });
        return done(null, false, { 
          message: 'Account is suspended',
          reason: user.suspensionReason,
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      if (user.accountStatus === 'pending') {
        logger.warn('Local authentication failed: Email not verified', {
          userId: user._id,
          ip: req.ip
        });
        return done(null, false, { 
          message: 'Please verify your email address to activate your account',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }

      if (user.accountStatus === 'closed') {
        logger.warn('Local authentication failed: Account closed', {
          userId: user._id,
          ip: req.ip
        });
        return done(null, false, { 
          message: 'Account has been closed',
          code: 'ACCOUNT_CLOSED'
        });
      }

      // Update last login and activity
      await User.findByIdAndUpdate(user._id, {
        lastLogin: new Date(),
        lastActivity: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info('Local authentication successful', {
        userId: user._id,
        email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return done(null, user);

    } catch (error) {
      logger.error('Local strategy error', {
        error: error.message,
        stack: error.stack,
        email: email?.replace(/(.{3}).*(@.*)/, '$1***$2'),
        ip: req?.ip
      });
      return done(error, false);
    }
  }));

  /**
   * Google OAuth Strategy Configuration
   * For Google social authentication
   */
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        
        if (!email) {
          logger.warn('Google OAuth failed: No email provided', {
            googleId: profile.id,
            displayName: profile.displayName
          });
          return done(null, false, { message: 'Email is required for registration' });
        }

        // Check if user already exists with this email
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          // Link Google account if not already linked
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isEmailVerified = true; // Google emails are pre-verified
            await user.save();
            
            logger.info('Google account linked to existing user', {
              userId: user._id,
              email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
              googleId: profile.id
            });
          }
        } else {
          // Create new user from Google profile
          user = new User({
            firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
            lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
            email: email.toLowerCase(),
            googleId: profile.id,
            isEmailVerified: true,
            accountStatus: 'active',
            isActive: true,
            role: 'user',
            avatar: profile.photos?.[0]?.value
          });

          await user.save();

          logger.info('New user created via Google OAuth', {
            userId: user._id,
            email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
            googleId: profile.id
          });
        }

        return done(null, user);

      } catch (error) {
        logger.error('Google OAuth strategy error', {
          error: error.message,
          stack: error.stack,
          googleId: profile?.id
        });
        return done(error, false);
      }
    }));
  }

  /**
   * GitHub OAuth Strategy Configuration
   * For GitHub social authentication
   */
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use('github', new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
      scope: ['user:email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        
        if (!email) {
          logger.warn('GitHub OAuth failed: No email provided', {
            githubId: profile.id,
            username: profile.username
          });
          return done(null, false, { message: 'Email is required for registration' });
        }

        // Check if user already exists with this email
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          // Link GitHub account if not already linked
          if (!user.githubId) {
            user.githubId = profile.id;
            user.isEmailVerified = true; // GitHub emails are pre-verified
            await user.save();
            
            logger.info('GitHub account linked to existing user', {
              userId: user._id,
              email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
              githubId: profile.id
            });
          }
        } else {
          // Create new user from GitHub profile
          const displayName = profile.displayName || profile.username || 'User';
          const nameParts = displayName.split(' ');
          
          user = new User({
            firstName: nameParts[0] || 'User',
            lastName: nameParts.slice(1).join(' ') || '',
            email: email.toLowerCase(),
            githubId: profile.id,
            isEmailVerified: true,
            accountStatus: 'active',
            isActive: true,
            role: 'user',
            avatar: profile.photos?.[0]?.value
          });

          await user.save();

          logger.info('New user created via GitHub OAuth', {
            userId: user._id,
            email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
            githubId: profile.id
          });
        }

        return done(null, user);

      } catch (error) {
        logger.error('GitHub OAuth strategy error', {
          error: error.message,
          stack: error.stack,
          githubId: profile?.id
        });
        return done(error, false);
      }
    }));
  }

  /**
   * Serialize user for session (if using sessions)
   */
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  /**
   * Deserialize user from session (if using sessions)
   */
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id)
        .select('-password -emailVerificationToken -passwordResetToken')
        .lean();
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  return passport;
};

// Initialize passport strategies immediately if environment variables are available
if (process.env.JWT_SECRET) {
  initializePassport();
}

export default passport;