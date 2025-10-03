# UserProfile Component Tests

This directory contains comprehensive tests for the `UserProfile.jsx` component.

## Test Files

### 1. `UserProfile.test.jsx`
Main unit tests covering:
- URL parameter extraction and handling
- Component rendering
- Edge cases and error scenarios
- React Router integration

### 2. `UserProfile.integration.test.jsx`
Integration tests covering:
- Full component integration with React Router
- Tab navigation simulation
- Complex URL scenarios
- Multi-parameter handling

### 3. `UserProfile.comprehensive.test.jsx`
Comprehensive tests covering:
- Performance and optimization
- Accessibility considerations
- Error handling
- Hook usage validation

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test UserProfile.test.jsx

# Run tests with UI
npm run test:ui
```

## Test Coverage

The tests cover:

### ✅ URL Parameter Handling
- Valid tab parameters (orders, addresses, payments, activity, preferences)
- Invalid/empty tab parameters
- Multiple URL parameters
- URL encoding scenarios

### ✅ Component Behavior
- Proper rendering of UserProfileLayout
- Correct prop passing
- State management
- Re-rendering on URL changes

### ✅ React Router Integration
- MemoryRouter testing
- BrowserRouter compatibility
- Navigation state changes
- Search parameter extraction

### ✅ Edge Cases
- Malformed URLs
- Special characters in parameters
- Rapid navigation changes
- Error scenarios

### ✅ Performance
- Unnecessary re-render prevention
- Hook optimization
- Memory leak prevention

## Test Structure

```
src/pages/__tests__/
├── UserProfile.test.jsx              # Main unit tests
├── UserProfile.integration.test.jsx  # Integration tests
├── UserProfile.comprehensive.test.jsx # Comprehensive tests
└── README.md                         # This file

src/test/
├── setup.js                          # Test setup and mocks
├── utils.jsx                         # Test utilities
└── config.js                         # Test configuration
```

## Mocking Strategy

The tests use strategic mocking:

1. **UserProfileLayout Component**: Mocked to isolate UserProfile logic
2. **React Router**: Uses MemoryRouter for controlled testing
3. **Browser APIs**: Mocked for consistent test environment

## Test Utilities

### `renderWithRouter(component, options)`
Custom render function that wraps components with MemoryRouter.

### `testUrlParams(url)`
Helper function to extract and test URL parameters.

### `createMockComponent(name, testId)`
Factory function for creating consistent mock components.

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Descriptive Names**: Test names clearly describe what is being tested
3. **Comprehensive Coverage**: Tests cover happy path, edge cases, and error scenarios
4. **Realistic Scenarios**: Tests simulate real user interactions
5. **Performance Aware**: Tests check for performance implications

## Debugging Tests

To debug failing tests:

1. Use `screen.debug()` to see rendered output
2. Check console logs for mock function calls
3. Use `--reporter=verbose` for detailed output
4. Run single test files to isolate issues

## Adding New Tests

When adding new tests:

1. Follow existing naming conventions
2. Use appropriate test utilities
3. Mock external dependencies
4. Test both success and failure scenarios
5. Update this README if adding new test categories