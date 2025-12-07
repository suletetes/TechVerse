# TechVerse Frontend

React-based frontend application for the TechVerse e-commerce platform. Built with modern tools and best practices for a fast, responsive, and user-friendly shopping experience.

## Technology Stack

- **Framework**: React 18+ with Vite
- **Routing**: React Router DOM v7+
- **State Management**: Zustand + TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives + custom components
- **Styling**: CSS Modules with responsive design
- **HTTP Client**: Axios with retry logic
- **Testing**: Vitest + React Testing Library + MSW
- **Build Tool**: Vite for fast development and optimized builds

## Features

### Customer Interface
- Product browsing with advanced filters
- Product search with autocomplete
- Shopping cart management
- Wishlist functionality
- User authentication and profile
- Order tracking and history
- Product reviews and ratings
- Responsive mobile-first design

### Admin Interface
- Analytics dashboard with real-time stats
- Product management (CRUD operations)
- Dynamic variant builder
- Order management
- User management
- Category and catalog management
- Homepage section management
- Security monitoring

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Backend API running (see server/README.md)

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update environment variables
```

## Environment Variables

Create a `.env` file in the client directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Payment Integration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX-X

# Feature Flags (Optional)
VITE_ENABLE_WISHLIST=true
VITE_ENABLE_REVIEWS=true
VITE_ENABLE_SOCIAL_LOGIN=true
```

## Available Scripts

### Development
```bash
npm run dev              # Start development server (http://localhost:5173)
npm run preview          # Preview production build locally
```

### Building
```bash
npm run build            # Build for production
npm run build:prod       # Build with production optimizations
```

### Testing
```bash
npm test                 # Run all tests in watch mode
npm run test:run         # Run all tests once
npm run test:ui          # Run tests with interactive UI
npm run test:coverage    # Run tests with coverage report
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:components  # Run component tests
npm run test:hooks       # Run custom hooks tests
npm run test:context     # Run context provider tests
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
```

## Project Structure

```
client/
├── public/                 # Static assets
│   ├── img/               # Images
│   └── favicon.ico
├── src/
│   ├── api/               # API services
│   │   ├── core/          # Base API classes
│   │   ├── interceptors/  # Request/response interceptors
│   │   └── services/      # Service modules
│   ├── assets/            # Styles and images
│   │   └── css/           # Global styles
│   ├── components/        # React components
│   │   ├── Admin/         # Admin components
│   │   ├── Auth/          # Authentication components
│   │   ├── Cards/         # Product cards
│   │   ├── Common/        # Shared components
│   │   ├── tables/        # Data tables
│   │   ├── editor/        # Rich text editor
│   │   └── __tests__/     # Component tests
│   ├── context/           # Context providers
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   ├── ProductContext.jsx
│   │   └── AdminContext.jsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   ├── useHomepageSection.js
│   │   └── usePerformance.js
│   ├── pages/             # Page components
│   │   ├── Admin/         # Admin pages
│   │   ├── auth/          # Auth pages
│   │   ├── info/          # Info pages
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── Product.jsx
│   │   ├── Cart.jsx
│   │   └── Wishlist.jsx
│   ├── utils/             # Utility functions
│   │   ├── tokenManager.js
│   │   ├── csrfUtils.js
│   │   └── formatters.js
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── .env                   # Environment variables
├── .env.example           # Environment template
├── vite.config.js         # Vite configuration
├── vitest.config.js       # Vitest configuration
└── package.json
```

## Key Components

### Context Providers

#### AuthContext
Manages user authentication state and methods.

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.firstName}!</p>
      ) : (
        <button onClick={() => login(credentials)}>Login</button>
      )}
    </div>
  );
}
```

#### CartContext
Manages shopping cart operations.

```javascript
import { useCart } from './context/CartContext';

function ProductCard({ product }) {
  const { addToCart, cart } = useCart();
  
  return (
    <button onClick={() => addToCart(product._id, 1)}>
      Add to Cart ({cart.items.length})
    </button>
  );
}
```

#### ProductContext
Manages product data and filtering.

```javascript
import { useProduct } from './context/ProductContext';

function ProductList() {
  const { products, loadProducts, isLoading } = useProduct();
  
  useEffect(() => {
    loadProducts({ category: 'electronics' });
  }, []);
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
```

### Custom Hooks

#### useHomepageSection
Fetches and manages homepage section data.

```javascript
import { useHomepageSection, SECTION_TYPES } from './hooks/useHomepageSection';

function TopSellers() {
  const { data, loading, error, retry } = useHomepageSection(
    SECTION_TYPES.TOP_SELLERS,
    { limit: 8, autoLoad: true }
  );
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState onRetry={retry} />;
  
  return (
    <div>
      {data.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
```

## API Integration

### Base API Service

All API calls use a centralized service with automatic token management, retry logic, and error handling.

```javascript
import { productService } from './api/services';

// Get products
const products = await productService.getProducts({ 
  category: 'phones',
  limit: 20 
});

// Get product by ID
const product = await productService.getProductById(productId);

// Search products
const results = await productService.searchProducts('laptop');
```

### Available Services

- **authService**: Authentication operations
- **productService**: Product operations
- **cartService**: Shopping cart operations
- **orderService**: Order management
- **wishlistService**: Wishlist operations
- **adminService**: Admin operations

## Styling Guidelines

### CSS Modules

Components use CSS modules for scoped styling:

```javascript
import styles from './ProductCard.module.css';

function ProductCard({ product }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{product.name}</h3>
      <p className={styles.price}>{product.price}</p>
    </div>
  );
}
```

### Responsive Design

Mobile-first approach with breakpoints:

```css
/* Mobile first (default) */
.container {
  padding: 1rem;
}

/* Tablet (768px and up) */
@media (min-width: 768px) {
  .container {
    padding: 1.5rem;
  }
}

/* Desktop (992px and up) */
@media (min-width: 992px) {
  .container {
    padding: 2rem;
  }
}
```

## Testing

### Unit Tests

Test individual components and functions:

```javascript
import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';

describe('ProductCard', () => {
  test('renders product information', () => {
    const product = {
      name: 'Test Product',
      price: 99.99
    };
    
    render(<ProductCard product={product} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('99.99')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test component interactions:

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider } from './context/CartContext';
import ProductPage from './pages/Product';

test('adds product to cart', async () => {
  render(
    <CartProvider>
      <ProductPage />
    </CartProvider>
  );
  
  const addButton = screen.getByText('Add to Cart');
  fireEvent.click(addButton);
  
  await waitFor(() => {
    expect(screen.getByText('Added to cart')).toBeInTheDocument();
  });
});
```

### API Mocking with MSW

Mock API responses for testing:

```javascript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: { products: [...] }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Performance Optimization

### Code Splitting

Lazy load routes and components:

```javascript
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboard />
    </Suspense>
  );
}
```

### Memoization

Optimize expensive calculations:

```javascript
import { useMemo, useCallback } from 'react';

function ProductList({ products }) {
  const sortedProducts = useMemo(() => {
    return products.sort((a, b) => b.price - a.price);
  }, [products]);
  
  const handleClick = useCallback((id) => {
    console.log('Clicked:', id);
  }, []);
  
  return (
    <div>
      {sortedProducts.map(product => (
        <ProductCard 
          key={product._id} 
          product={product}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}
```

### Image Optimization

Use lazy loading and responsive images:

```javascript
<picture>
  <source type="image/webp" srcSet={product.imageWebp} />
  <img
    src={product.image}
    alt={product.name}
    loading="lazy"
    width="300"
    height="300"
  />
</picture>
```

## Build and Deployment

### Production Build

```bash
# Build for production
npm run build

# Output will be in dist/ directory
```

### Build Optimization

The production build includes:
- Code minification
- Tree shaking
- Asset optimization
- Source maps (optional)
- Chunk splitting
- Compression

### Deployment

Deploy the `dist/` directory to:
- Static hosting (Netlify, Vercel, GitHub Pages)
- CDN (Cloudflare, AWS CloudFront)
- Traditional web server (Nginx, Apache)

### Environment-Specific Builds

```bash
# Development build
npm run build

# Production build with optimizations
npm run build:prod
```

## Troubleshooting

### Common Issues

**Vite Dev Server Not Starting**
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

**API Connection Issues**
```bash
# Check VITE_API_URL in .env
# Ensure backend server is running
# Check CORS configuration
```

**Build Errors**
```bash
# Clear build cache
rm -rf dist
npm run build
```

**Test Failures**
```bash
# Clear test cache
npm test -- --clearCache
npm test
```

## Dependencies

### Core Dependencies
- React 19+ with React DOM
- React Router DOM v7+
- Vite 7+ (build tool)
- Zustand (state management)
- TanStack React Query (server state)
- TanStack React Table (data tables)
- React Hook Form + Zod (forms)
- Radix UI components
- TipTap (rich text editor)
- Axios (HTTP client)
- Stripe (payments)
- Socket.io-client (real-time)

### Development Dependencies
- Vitest (testing framework)
- React Testing Library
- MSW (API mocking)
- ESLint (linting)

## Support

For frontend-specific issues:
- Check the main README.md
- Review component documentation in docs/FRONTEND.md
- Open an issue on GitHub
