import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { render, createMockProduct } from '../test-utils';

// Mock product components (you'd import the actual components)
const MockProductList = () => {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.data.items);
        } else {
          setError(data.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Products</h1>
      {products.length === 0 ? (
        <div>No products found</div>
      ) : (
        <ul>
          {products.map(product => (
            <li key={product.id}>
              <h3>{product.name}</h3>
              <p>Price: £{product.price}</p>
              <p>Stock: {product.stock}</p>
              <p>Status: {product.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const MockProductForm = ({ onSubmit }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        aria-label="Product Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        aria-label="Price"
        type="number"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
      />
      <input
        aria-label="Stock"
        type="number"
        value={formData.stock}
        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
      />
      <select
        aria-label="Category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      >
        <option value="">Select Category</option>
        <option value="Tablets">Tablets</option>
        <option value="Phones">Phones</option>
        <option value="Laptops">Laptops</option>
      </select>
      <textarea
        aria-label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <button type="submit">Create Product</button>
    </form>
  );
};

describe('Products Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Product List', () => {
    it('should load and display products', async () => {
      render(<MockProductList />);

      // Should show loading initially
      expect(screen.getByText(/loading products/i)).toBeInTheDocument();

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText(/products/i)).toBeInTheDocument();
        expect(screen.getByText(/tablet air/i)).toBeInTheDocument();
        expect(screen.getByText(/phone pro/i)).toBeInTheDocument();
      });

      // Check product details
      expect(screen.getByText(/price: £1999/i)).toBeInTheDocument();
      expect(screen.getByText(/stock: 45/i)).toBeInTheDocument();
      expect(screen.getByText(/status: active/i)).toBeInTheDocument();
    });

    it('should handle empty product list', async () => {
      // Override handler to return empty list
      server.use(
        http.get('/api/products', () => {
          return HttpResponse.json({
            success: true,
            data: {
              items: [],
              pagination: {
                page: 1,
                limit: 10,
                total: 0,
                pages: 0
              }
            }
          });
        })
      );

      render(<MockProductList />);

      await waitFor(() => {
        expect(screen.getByText(/no products found/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors', async () => {
      // Override handler to return error
      server.use(
        http.get('/api/products', () => {
          return HttpResponse.json(
            { success: false, error: 'Database connection failed' },
            { status: 500 }
          );
        })
      );

      render(<MockProductList />);

      await waitFor(() => {
        expect(screen.getByText(/error: database connection failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Product Creation', () => {
    it('should create a new product successfully', async () => {
      const mockOnSubmit = vi.fn();
      render(<MockProductForm onSubmit={mockOnSubmit} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/product name/i), 'New Test Product');
      await user.type(screen.getByLabelText(/price/i), '599');
      await user.type(screen.getByLabelText(/stock/i), '25');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Tablets');
      await user.type(screen.getByLabelText(/description/i), 'A great new product');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create product/i }));

      // Verify the form data was submitted
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Test Product',
        price: '599',
        stock: '25',
        category: 'Tablets',
        description: 'A great new product'
      });
    });

    it('should handle product creation API call', async () => {
      let createdProduct = null;

      // Override handler to capture created product
      server.use(
        http.post('/api/products', async ({ request }) => {
          const productData = await request.json();
          createdProduct = {
            id: '999',
            ...productData,
            sales: 0,
            createdAt: new Date().toISOString()
          };
          
          return HttpResponse.json({
            success: true,
            data: createdProduct
          }, { status: 201 });
        })
      );

      const MockProductCreator = () => {
        const [result, setResult] = React.useState(null);

        const handleCreate = async (productData) => {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          });
          const data = await response.json();
          setResult(data);
        };

        return (
          <div>
            <MockProductForm onSubmit={handleCreate} />
            {result && (
              <div>
                {result.success ? (
                  <div>Product created: {result.data.name}</div>
                ) : (
                  <div>Error: {result.error}</div>
                )}
              </div>
            )}
          </div>
        );
      };

      render(<MockProductCreator />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/product name/i), 'API Test Product');
      await user.type(screen.getByLabelText(/price/i), '299');
      await user.type(screen.getByLabelText(/stock/i), '10');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Phones');
      await user.click(screen.getByRole('button', { name: /create product/i }));

      // Wait for API response
      await waitFor(() => {
        expect(screen.getByText(/product created: api test product/i)).toBeInTheDocument();
      });

      // Verify the product was created with correct data
      expect(createdProduct).toMatchObject({
        name: 'API Test Product',
        price: '299',
        stock: '10',
        category: 'Phones'
      });
    });
  });

  describe('Product Search and Filtering', () => {
    it('should filter products by category', async () => {
      // Override handler to handle category filtering
      server.use(
        http.get('/api/products', ({ request }) => {
          const url = new URL(request.url);
          const category = url.searchParams.get('category');
          
          const allProducts = [
            createMockProduct({ id: '1', name: 'Tablet 1', category: 'Tablets' }),
            createMockProduct({ id: '2', name: 'Phone 1', category: 'Phones' }),
            createMockProduct({ id: '3', name: 'Tablet 2', category: 'Tablets' })
          ];
          
          const filteredProducts = category 
            ? allProducts.filter(p => p.category === category)
            : allProducts;
          
          return HttpResponse.json({
            success: true,
            data: {
              items: filteredProducts,
              pagination: { page: 1, limit: 10, total: filteredProducts.length, pages: 1 }
            }
          });
        })
      );

      const MockFilterableProductList = () => {
        const [products, setProducts] = React.useState([]);
        const [category, setCategory] = React.useState('');

        const loadProducts = React.useCallback(async () => {
          const params = new URLSearchParams();
          if (category) params.append('category', category);
          
          const response = await fetch(`/api/products?${params}`);
          const data = await response.json();
          setProducts(data.data.items);
        }, [category]);

        React.useEffect(() => {
          loadProducts();
        }, [loadProducts]);

        return (
          <div>
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Tablets">Tablets</option>
              <option value="Phones">Phones</option>
            </select>
            <ul>
              {products.map(product => (
                <li key={product.id}>{product.name} - {product.category}</li>
              ))}
            </ul>
          </div>
        );
      };

      render(<MockFilterableProductList />);

      // Initially should show all products
      await waitFor(() => {
        expect(screen.getByText(/tablet 1 - tablets/i)).toBeInTheDocument();
        expect(screen.getByText(/phone 1 - phones/i)).toBeInTheDocument();
        expect(screen.getByText(/tablet 2 - tablets/i)).toBeInTheDocument();
      });

      // Filter by Tablets
      await user.selectOptions(screen.getByLabelText(/filter by category/i), 'Tablets');

      await waitFor(() => {
        expect(screen.getByText(/tablet 1 - tablets/i)).toBeInTheDocument();
        expect(screen.getByText(/tablet 2 - tablets/i)).toBeInTheDocument();
        expect(screen.queryByText(/phone 1 - phones/i)).not.toBeInTheDocument();
      });
    });

    it('should search products by name', async () => {
      server.use(
        http.get('/api/products', ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get('search');
          
          const allProducts = [
            createMockProduct({ id: '1', name: 'iPad Pro', category: 'Tablets' }),
            createMockProduct({ id: '2', name: 'iPhone 15', category: 'Phones' }),
            createMockProduct({ id: '3', name: 'MacBook Pro', category: 'Laptops' })
          ];
          
          const filteredProducts = search 
            ? allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
            : allProducts;
          
          return HttpResponse.json({
            success: true,
            data: {
              items: filteredProducts,
              pagination: { page: 1, limit: 10, total: filteredProducts.length, pages: 1 }
            }
          });
        })
      );

      const MockSearchableProductList = () => {
        const [products, setProducts] = React.useState([]);
        const [search, setSearch] = React.useState('');

        const loadProducts = React.useCallback(async () => {
          const params = new URLSearchParams();
          if (search) params.append('search', search);
          
          const response = await fetch(`/api/products?${params}`);
          const data = await response.json();
          setProducts(data.data.items);
        }, [search]);

        React.useEffect(() => {
          loadProducts();
        }, [loadProducts]);

        return (
          <div>
            <input
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
            />
            <ul>
              {products.map(product => (
                <li key={product.id}>{product.name}</li>
              ))}
            </ul>
          </div>
        );
      };

      render(<MockSearchableProductList />);

      // Initially should show all products
      await waitFor(() => {
        expect(screen.getByText(/ipad pro/i)).toBeInTheDocument();
        expect(screen.getByText(/iphone 15/i)).toBeInTheDocument();
        expect(screen.getByText(/macbook pro/i)).toBeInTheDocument();
      });

      // Search for "Pro"
      await user.type(screen.getByLabelText(/search products/i), 'Pro');

      await waitFor(() => {
        expect(screen.getByText(/ipad pro/i)).toBeInTheDocument();
        expect(screen.getByText(/macbook pro/i)).toBeInTheDocument();
        expect(screen.queryByText(/iphone 15/i)).not.toBeInTheDocument();
      });
    });
  });
});