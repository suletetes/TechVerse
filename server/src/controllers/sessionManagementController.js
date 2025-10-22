import { asyncHandler } from '../middleware/errorHandler.js';
import sessionConfig from '../config/session.js';
import sessionManager from '../utils/sessionManager.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get session management status and configuration
 * @route   GET /api/auth/session/status
 * @access  Private (Admin)
 */
export const getSessionStatus = asyncHandler(async (req, res) => {
  try {
    const managerStatus = sessionManager.getStatus();
    const configValidation = sessionManager.validateConfig();
    const stats = await sessionManager.getStats();

    const status = {
      sessionManagement: 'enabled',
      store: managerStatus.store,
      hybridAuth: 'enabled',
      redisAvailable: managerStatus.redisAvailable,
      features: managerStatus.features,
      configuration: {
        sessionName: 'techverse.sid',
        maxAge: '24 hours',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        validation: configValidation
      },
      stats
    };

    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Failed to get session status', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get session status',
      error: error.message
    });
  }
});

/**
 * @desc    Test session functionality
 * @route   POST /api/auth/session/test
 * @access  Private (Admin)
 */
export const testSessionFunctionality = asyncHandler(async (req, res) => {
  try {
    const testResult = await sessionManager.test(req);
    
    // Add hybrid authentication test
    const hasUser = !!req.user;
    const authMethod = req.authMethod;
    
    testResult.tests.push({
      name: 'Hybrid Authentication',
      passed: hasUser && authMethod,
      details: hasUser ? `Authenticated via ${authMethod}` : 'No authentication found'
    });

    // Recalculate summary
    testResult.allPassed = testResult.tests.every(test => test.passed);
    testResult.summary = {
      total: testResult.tests.length,
      passed: testResult.tests.filter(t => t.passed).length,
      failed: testResult.tests.filter(t => !t.passed).length
    };

    logger.info('Session functionality test completed', {
      adminUserId: req.user._id,
      allPassed: testResult.allPassed,
      testsCount: testResult.tests.length,
      passedCount: testResult.summary.passed,
      ip: req.ip
    });

    res.json({
      success: true,
      ...testResult
    });
  } catch (error) {
    logger.error('Session functionality test failed', {
      adminUserId: req.user._id,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Session functionality test failed',
      error: error.message
    });
  }
});

/**
 * @desc    Force session cleanup (manual trigger)
 * @route   POST /api/auth/session/force-cleanup
 * @access  Private (Admin)
 */
export const forceSessionCleanup = asyncHandler(async (req, res) => {
  try {
    const result = await sessionManager.cleanup();
    
    logger.info('Manual session cleanup triggered', {
      adminUserId: req.user._id,
      result,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Session cleanup completed successfully',
      result
    });
  } catch (error) {
    logger.error('Manual session cleanup failed', {
      adminUserId: req.user._id,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Session cleanup failed',
      error: error.message
    });
  }
});

/**
 * @desc    Get active sessions count
 * @route   GET /api/auth/session/count
 * @access  Private (Admin)
 */
export const getActiveSessionsCount = asyncHandler(async (req, res) => {
  try {
    const stats = await sessionManager.getStats();
    
    res.json({
      success: true,
      activeSessions: stats.activeSessions || 0,
      redisConnected: stats.redisAvailable,
      store: stats.store,
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    logger.error('Failed to get active sessions count', {
      error: error.message,
      stack: error.stack
    });

    res.json({
      success: true,
      activeSessions: 0,
      redisConnected: false,
      store: 'unknown',
      error: 'Session stats unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

export default {
  getSessionStatus,
  testSessionFunctionality,
  forceSessionCleanup,
  getActiveSessionsCount
};