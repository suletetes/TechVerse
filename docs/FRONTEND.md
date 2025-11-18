# TechVerse Frontend Documentation

## Overview

The TechVerse frontend is built with React and provides a modern, responsive e-commerce interface. This documentation covers the component architecture, context providers, and development guidelines.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Context Providers](#context-providers)
3. [Components](#components)
4. [Services](#services)
5. [Hooks](#hooks)
6. [Development Guidelines](#development-guidelines)

## Project Structure

```
client/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── product/
│   │   ├── cart/
│   │   └── admin/
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   ├── WishlistContext.jsx
│   │   └── ContextSelector.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── UserProfile.jsx
│   │   └── admin/
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── cartService.js
│   │   └── adminService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   ├── useWishlist.js
│   │   └── useApi.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── validation.js
│   └── styles/
│       ├── globals.css
│       └── components/
├── package.json
└── README.md
```

## Context Providers

### AuthContext

Manages user authentication state and provides authentication methods.

**Usage:**
```jsx
import { useAuth } from '../context/AuthContext';

function LoginComponent() {
  const { user, login, logout, loading } = useAuth();
  
  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.firstName}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

**Available Methods:**
- `login(credentials)` - Authenticate user
- `logout()` - Sign out user
- `register(userData)` - Register new user
- `updateProfile(profileData)` - Update user profile
- `refreshToken()` - Refresh authentication token

**State Properties:**
- `user` - Current user object or null
- `loading` - Authentication loading state
- `error` - Authentication error message

### CartContext

Manages shopping cart state and operations.

**Usage:**
```jsx
import { useCart } from '../context/CartContext';

function CartComponent() {
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    loading 
  } = useCart();
  
  const handleAddToCart = async (productId, quantity) => {
    try {
      await addToCart(productId, quantity);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };
  
  return (
    <div>
      <h2>Cart ({cart.items.length} items)</h2>
      {cart.items.map(item => (
        <div key={item._id}>
          <span>{item.product.name}</span>
          <span>Qty: {item.quantity}</span>
          <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>
            +
          </button>
          <button onClick={() => removeFromCart(item._id)}>
            Remove
          </button>
        </div>
      ))}
      <p>Total: £{cart.totalAmount}</p>
    </div>
  );
}
```

**Available Methods:**
- `addToCart(productId, quantity)` - Add item to cart
- `removeFromCart(itemId)` - Remove item from cart
- `updateQuantity(itemId, quantity)` - Update item quantity
- `clearCart()` - Clear all cart items
- `getCart()` - Refresh cart data

**State Properties:**
- `cart` - Cart object with items and totals
- `loading` - Cart operation loading state
- `error` - Cart operation error message

### WishlistContext

Manages user wishlist functionality.

**Usage:**
```jsx
import { useWishlist } from '../context/WishlistContext';

function WishlistComponent() {
  const { 
    wishlist, 
    addToWishlist, 
    removeFromWishlist, 
    loading 
  } = useWishlist();
  
  return (
    <div>
      <h2>Wishlist ({wishlist.items.length} items)</h2>
      {wishlist.items.map(item => (
        <div key={item._id}>
          <span>{item.product.name}</span>
          <span>£{item.product.price}</span>
          <button onClick={() => removeFromWishlist(item.product._id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Components

### Common Components

#### Button
```jsx
import Button from '../components/common/Button';

<Button 
  variant="primary" 
  size="large" 
  onClick={handleClick}
  loading={isLoading}
  disabled={isDisabled}
>
  Click Me
</Button>
```

**Props:**
- `variant` - 'primary', 'secondary', 'danger', 'success'
- `size` - 'small', 'medium', 'large'
- `loading` - Show loading spinner
- `disabled` - Disable button
- `onClick` - Click handler

#### Input
```jsx
import Input from '../components/common/Input';

<Input
  type="text"
  placeholder="Enter text"
  value={value}
  onChange={handleChange}
  error={errorMessage}
  required
/>
```

#### Modal
```jsx
import Modal from '../components/common/Modal';

<Modal 
  isOpen={isModalOpen} 
  onClose={closeModal}
  title="Modal Title"
>
  <p>Modal content goes here</p>
</Modal>
```

### Product Components

#### ProductCard
```jsx
import ProductCard from '../components/product/ProductCard';

<ProductCard 
  product={product}
  onAddToCart={handleAddToCart}
  onAddToWishlist={handleAddToWishlist}
/>
```

#### ProductGrid
```jsx
import ProductGrid from '../components/product/ProductGrid';

<ProductGrid 
  products={products}
  loading={loading}
  onLoadMore={handleLoadMore}
/>
```

#### ProductFilter
```jsx
import ProductFilter from '../components/product/ProductFilter';

<ProductFilter
  filters={filters}
  onFilterChange={handleFilterChange}
  categories={categories}
  brands={brands}
  priceRange={priceRange}
/>
```

### Layout Components

#### Header
```jsx
import Header from '../components/layout/Header';

<Header 
  user={user}
  cartItemCount={cartItemCount}
  onSearch={handleSearch}
/>
```

#### Footer
```jsx
import Footer from '../components/layout/Footer';

<Footer />
```

#### Sidebar
```jsx
import Sidebar from '../components/layout/Sidebar';

<Sidebar 
  isOpen={sidebarOpen}
  onClose={closeSidebar}
>
  <Navigation />
</Sidebar>
```

## Services

### API Service

Base API service for making HTTP requests.

```jsx
import api from '../services/api';

// GET request
const products = await api.get('/products');

// POST request
const newProduct = await api.post('/admin/products', productData);

// PUT request
const updatedProduct = await api.put(`/admin/products/${id}`, updateData);

// DELETE request
await api.delete(`/admin/products/${id}`);
```

### Auth Service

Authentication-related API calls.

```jsx
import authService from '../services/authService';

// Login
const { user, tokens } = await authService.login(credentials);

// Register
const { user, tokens } = await authService.register(userData);

// Get current user
const user = await authService.getCurrentUser();

// Update profile
const updatedUser = await authService.updateProfile(profileData);
```

### Product Service

Product-related API calls.

```jsx
import productService from '../services/productService';

// Get products with filters
const { products, pagination } = await productService.getProducts({
  page: 1,
  limit: 20,
  category: 'electronics',
  minPrice: 100,
  maxPrice: 1000
});

// Get product by ID
const product = await productService.getProductById(productId);

// Search products
const searchResults = await productService.searchProducts({
  q: 'gaming laptop',
  sortBy: 'price',
  sortOrder: 'asc'
});
```

### Cart Service

Shopping cart API calls.

```jsx
import cartService from '../services/cartService';

// Get cart
const cart = await cartService.getCart();

// Add to cart
const updatedCart = await cartService.addToCart(productId, quantity);

// Update cart item
const updatedCart = await cartService.updateCartItem(itemId, quantity);

// Remove from cart
const updatedCart = await cartService.removeFromCart(itemId);

// Clear cart
await cartService.clearCart();
```

## Hooks

### useAuth

Custom hook for authentication functionality.

```jsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, login, logout, loading, error } = useAuth();
  
  // Hook automatically handles token refresh and persistence
  
  return (
    <div>
      {user ? `Welcome ${user.firstName}` : 'Please login'}
    </div>
  );
}
```

### useCart

Custom hook for cart functionality.

```jsx
import { useCart } from '../hooks/useCart';

function ProductPage({ product }) {
  const { addToCart, loading } = useCart();
  
  const handleAddToCart = () => {
    addToCart(product._id, 1);
  };
  
  return (
    <button onClick={handleAddToCart} disabled={loading}>
      Add to Cart
    </button>
  );
}
```

### useApi

Custom hook for API calls with loading and error states.

```jsx
import { useApi } from '../hooks/useApi';

function ProductList() {
  const { data: products, loading, error, refetch } = useApi('/products');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useLocalStorage

Custom hook for localStorage management.

```jsx
import { useLocalStorage } from '../hooks/useLocalStorage';

function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  return (
    <div>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
    </div>
  );
}
```

## Development Guidelines

### Component Structure

```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ComponentName.css';

/**
 * ComponentName - Brief description of what the component does
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The title to display
 * @param {Function} props.onAction - Callback function for actions
 */
function ComponentName({ title, onAction, children }) {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    // Side effects
  }, []);
  
  const handleAction = () => {
    onAction?.();
  };
  
  return (
    <div className="component-name">
      <h2>{title}</h2>
      {children}
      <button onClick={handleAction}>Action</button>
    </div>
  );
}

ComponentName.propTypes = {
  title: PropTypes.string.isRequired,
  onAction: PropTypes.func,
  children: PropTypes.node
};

ComponentName.defaultProps = {
  onAction: null,
  children: null
};

export default ComponentName;
```

### Error Handling

```jsx
import { useState } from 'react';
import { toast } from 'react-toastify';

function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleAsyncAction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await someApiCall();
      
      toast.success('Action completed successfully');
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleAsyncAction} disabled={loading}>
        {loading ? 'Loading...' : 'Submit'}
      </button>
    </div>
  );
}
```

### Form Handling

```jsx
import { useState } from 'react';
import { validateForm } from '../utils/validation';

function ContactForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Your Name"
        required
      />
      <Input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Your Email"
        required
      />
      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        placeholder="Your Message"
        required
      />
      {errors.message && <span className="error">{errors.message}</span>}
      
      <Button type="submit">Send Message</Button>
    </form>
  );
}
```

### Performance Optimization

```jsx
import React, { memo, useMemo, useCallback } from 'react';

const ProductCard = memo(({ product, onAddToCart }) => {
  // Memoize expensive calculations
  const discountPercentage = useMemo(() => {
    if (!product.comparePrice) return 0;
    return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
  }, [product.price, product.comparePrice]);
  
  // Memoize event handlers
  const handleAddToCart = useCallback(() => {
    onAddToCart(product._id);
  }, [product._id, onAddToCart]);
  
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} loading="lazy" />
      <h3>{product.name}</h3>
      <div className="price">
        <span className="current">£{product.price}</span>
        {product.comparePrice && (
          <span className="original">£{product.comparePrice}</span>
        )}
        {discountPercentage > 0 && (
          <span className="discount">{discountPercentage}% off</span>
        )}
      </div>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
});

export default ProductCard;
```

### Testing Guidelines

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import LoginForm from './LoginForm';

// Mock API calls
jest.mock('../services/authService');

describe('LoginForm', () => {
  const renderWithProvider = (component) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };
  
  test('renders login form', () => {
    renderWithProvider(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  test('handles form submission', async () => {
    const mockLogin = jest.fn();
    renderWithProvider(<LoginForm onLogin={mockLogin} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

### Styling Guidelines

Use CSS modules or styled-components for component-specific styles:

```css
/* ProductCard.module.css */
.productCard {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s ease;
}

.productCard:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.productImage {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.productTitle {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 12px 0 8px;
  color: #333;
}

.priceContainer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.currentPrice {
  font-size: 1.2rem;
  font-weight: 700;
  color: #e74c3c;
}

.originalPrice {
  font-size: 1rem;
  text-decoration: line-through;
  color: #999;
}

.discountBadge {
  background: #e74c3c;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}
```