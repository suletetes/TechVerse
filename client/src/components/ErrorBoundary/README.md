# Error Boundary Components

This directory contains error handling components that provide different experiences for development and production environments.

## Components

### 1. ErrorBoundary
A React Error Boundary component that catches JavaScript errors anywhere in the child component tree.

**Features:**
- **Development Mode**: Shows detailed error information, stack traces, and debugging tips
- **Production Mode**: Shows user-friendly error message with recovery options
- Automatically detects environment using `import.meta.env.DEV`

### 2. RouterErrorBoundary
A React Router error boundary component that handles routing errors and 404s.

**Features:**
- **Development Mode**: Shows detailed router error information, error data, and stack traces
- **Production Mode**: Shows user-friendly error messages for 404s and other router errors
- Handles different error types (404, 500, etc.) with appropriate UI

### 3. ErrorTestComponent
A development-only component for testing error boundaries.

**Features:**
- Only visible in development mode
- Provides a button to trigger test errors
- Helps developers verify error boundary functionality

## Usage

### In App.jsx
```jsx
import { ErrorBoundary, RouterErrorBoundary } from './components';

const router = createBrowserRouter([
    {
        path: '/',
        element: <HomeLayout />,
        errorElement: <RouterErrorBoundary />, // Handles router errors
        children: [...]
    }
]);

const App = () => {
    return (
        <ErrorBoundary> {/* Handles JavaScript errors */}
            <RouterProvider router={router} />
        </ErrorBoundary>
    );
};
```

### Wrapping Specific Components
```jsx
import { ErrorBoundary } from './components';

const MyComponent = () => {
    return (
        <ErrorBoundary>
            <SomeRiskyComponent />
        </ErrorBoundary>
    );
};
```

## Error Types Handled

### JavaScript Errors (ErrorBoundary)
- Component rendering errors
- Lifecycle method errors
- Constructor errors
- Event handler errors (when called from render)

### Router Errors (RouterErrorBoundary)
- 404 Not Found errors
- Route loading errors
- Navigation errors
- Loader function errors

## Development vs Production

### Development Features
- Detailed error messages and stack traces
- Component stack information
- Debugging tips and suggestions
- Error test component for verification
- Console logging of all errors

### Production Features
- User-friendly error messages
- Recovery options (reload, go home, contact support)
- No sensitive error information exposed
- Professional error UI matching site design
- Error reporting hooks (ready for services like Sentry)

## Environment Detection

The components automatically detect the environment using Vite's environment variables:
- `import.meta.env.DEV` - Development mode
- `import.meta.env.PROD` - Production mode

## Customization

### Adding Error Reporting
In production, you can add error reporting to external services:

```jsx
componentDidCatch(error, errorInfo) {
    if (import.meta.env.PROD) {
        // Report to error tracking service
        errorReportingService.captureException(error, {
            extra: errorInfo
        });
    }
}
```

### Styling
The error components use the existing TechVerse design system:
- Bootstrap classes for layout
- Custom CSS classes (tc-6533, store-card, etc.)
- Consistent color scheme and typography

## Testing Error Boundaries

### In Development
1. Use the ErrorTestComponent (appears as floating widget)
2. Click "Trigger Error" to test ErrorBoundary
3. Navigate to invalid routes to test RouterErrorBoundary

### Manual Testing
```jsx
// Trigger JavaScript error
const BuggyComponent = () => {
    throw new Error('Test error');
    return <div>This won't render</div>;
};

// Test 404 error
// Navigate to: http://localhost:3000/nonexistent-page
```

## Best Practices

1. **Placement**: Place ErrorBoundary at strategic points in your component tree
2. **Granularity**: Don't wrap every component - find the right balance
3. **Logging**: Always log errors for debugging and monitoring
4. **Recovery**: Provide clear recovery options for users
5. **Testing**: Regularly test error boundaries in both environments

## Browser Support

Error boundaries work in all modern browsers that support React 16+. They do not catch errors in:
- Event handlers (use try-catch)
- Asynchronous code (use try-catch)
- Server-side rendering
- Errors in the error boundary itself