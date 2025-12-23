export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  testTimeout: 30000, // Reduced timeout
  maxWorkers: 1, // Run tests sequentially to avoid conflicts
  forceExit: true, // Force Jest to exit after tests complete
  detectOpenHandles: true, // Detect open handles for debugging
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!src/utils/logger.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    },
    './src/controllers/**/*.js': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/services/**/*.js': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  // Additional configuration to handle open handles
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};