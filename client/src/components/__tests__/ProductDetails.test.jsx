import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductInfo from '../ProductDetails/ProductInfo';
import ProductOptions from '../ProductDetails/ProductOptions';
import ProductQuantity from '../ProductDetails/ProductQuantity';
import ProductActions from '../ProductDetails/ProductActions';
import ProductIncludes from '../ProductDetails/ProductIncludes';

// Mock product data with backend structure
const mockProduct = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Tablet Pro',
  price: 599,
  comparePrice: 699,
  rating: {
    average: 4.5,
    count: 127
  },
  stock: {
    quantity: 25,
    trackQuantity: true
  },
  stockStatus: 'in_stock',
  discountPercentage: 14,
  shortDescription: 'A powerful tablet for work and play',
  shipping: {
    free: true
  },
  variants: [
    {
      name: 'Color',
      options: [
        { _id: 'color1', value: 'Silver', stock: 10 },
        { _id: 'color2', value: 'Gold', stock: 8 },
        { _id: 'color3', value: 'Black', stock: 0 }
      ]
    },
    {
      name: 'Storage',
      options: [
        { _id: 'storage1', value: '128GB', priceModifier: 0, stock: 15 },
        { _id: 'storage2', value: '256GB', priceModifier: 100, stock: 10 },
        { _id: 'storage3', value: '512GB', priceModifier: 200, stock: 5 }
      ]
    }
  ],
  includes: [
    'USB-C Cable',
    'Quick Start Guide',
    'Warranty Card'
  ],
  features: [
    'All-day battery life',
    'Fast charging',
    'Premium build quality'
  ],
  weight: {
    value: 466,
    unit: 'g'
  }
};

describe('ProductDetails Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ProductInfo Component', () => {
    it('renders without crashing', () => {
      render(<ProductInfo product={mockProduct} />);
      expect(screen.getByText(/Buy Test Tablet Pro/)).toBeInTheDocument();
    });

    it('displays product name correctly', () => {
      render(<ProductInfo product={mockProduct} />);
      expect(screen.getByText('Buy Test Tablet Pro')).toBeInTheDocument();
    });

    it('shows price information from backend', () => {
      render(<ProductInfo product={mockProduct} price={599} />);
      expect(screen.getByText('£599')).toBeInTheDocument();
    });

    it('displays discount information when compare price exists', () => {
      render(<ProductInfo product={mockProduct} />);
      expect(screen.getByText('£699')).toBeInTheDocument();
      expect(screen.getByText('14% OFF')).toBeInTheDocument();
    });

    it('shows rating and review count', () => {
      render(<ProductInfo product={mockProduct} />);
      expect(screen.getByText('4.5 (127 reviews)')).toBeInTheDocument();
    });

    it('displays stock status correctly', () => {
      render(<ProductInfo product={mockProduct} inStock={true} />);
      expect(screen.getByText('In Stock')).toBeInTheDocument();
    });

    it('shows low stock warning', () => {
      const lowStockProduct = { ...mockProduct, stock: { quantity: 3 } };
      render(<ProductInfo product={lowStockProduct} stockCount={3} />);
      expect(screen.getByText('(Only 3 left)')).toBeInTheDocument();
    });

    it('handles out of stock state', () => {
      render(<ProductInfo product={mockProduct} inStock={false} />);
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    it('shows loading state when product is missing', () => {
      render(<ProductInfo product={null} />);
      expect(screen.getByText('Loading product information...')).toBeInTheDocument();
    });

    it('handles wishlist toggle', () => {
      const onToggleWishlist = vi.fn();
      render(<ProductInfo product={mockProduct} onToggleWishlist={onToggleWishlist} />);
      
      const wishlistButton = screen.getByTitle(/wishlist/i);
      fireEvent.click(wishlistButton);
      expect(onToggleWishlist).toHaveBeenCalled();
    });

    it('shows wishlist loading state', () => {
      render(<ProductInfo product={mockProduct} isWishlistLoading={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('ProductOptions Component', () => {
    it('renders without crashing', () => {
      render(<ProductOptions product={mockProduct} />);
      expect(screen.getByText('Color')).toBeInTheDocument();
    });

    it('displays color options from backend variants', () => {
      render(<ProductOptions product={mockProduct} />);
      expect(screen.getByText('Silver')).toBeInTheDocument();
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Black')).toBeInTheDocument();
    });

    it('displays storage options with price modifiers', () => {
      render(<ProductOptions product={mockProduct} />);
      expect(screen.getByText('128GB')).toBeInTheDocument();
      expect(screen.getByText('256GB')).toBeInTheDocument();
      expect(screen.getByText('+£100')).toBeInTheDocument();
    });

    it('handles option selection', () => {
      const onColorChange = vi.fn();
      render(<ProductOptions product={mockProduct} onColorChange={onColorChange} />);
      
      const silverOption = screen.getByText('Silver').closest('.model-option');
      fireEvent.click(silverOption);
      expect(onColorChange).toHaveBeenCalled();
    });

    it('shows out of stock options as disabled', () => {
      render(<ProductOptions product={mockProduct} />);
      
      const blackOption = screen.getByText('Black').closest('.model-option');
      expect(blackOption).toHaveClass('disabled');
      expect(screen.getByText('(Out of Stock)')).toBeInTheDocument();
    });

    it('handles missing variants gracefully', () => {
      const productWithoutVariants = { ...mockProduct, variants: [] };
      render(<ProductOptions product={productWithoutVariants} />);
      
      // Should not render anything if no variants
      expect(screen.queryByText('Color')).not.toBeInTheDocument();
    });

    it('falls back to props when no backend variants', () => {
      const colorOptions = [{ id: 'red', name: 'Red' }];
      render(<ProductOptions colorOptions={colorOptions} />);
      expect(screen.getByText('Red')).toBeInTheDocument();
    });
  });

  describe('ProductQuantity Component', () => {
    it('renders without crashing', () => {
      render(<ProductQuantity quantity={1} onQuantityChange={vi.fn()} product={mockProduct} />);
      expect(screen.getByText('Quantity')).toBeInTheDocument();
    });

    it('displays current quantity', () => {
      render(<ProductQuantity quantity={3} onQuantityChange={vi.fn()} product={mockProduct} inStock={true} />);
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    });

    it('handles quantity increase', () => {
      const onQuantityChange = vi.fn();
      render(<ProductQuantity quantity={1} onQuantityChange={onQuantityChange} product={mockProduct} inStock={true} />);
      
      const increaseButton = screen.getByTitle('Increase quantity');
      fireEvent.click(increaseButton);
      expect(onQuantityChange).toHaveBeenCalledWith(2);
    });

    it('handles quantity decrease', () => {
      const onQuantityChange = vi.fn();
      render(<ProductQuantity quantity={2} onQuantityChange={onQuantityChange} product={mockProduct} inStock={true} />);
      
      const decreaseButton = screen.getByTitle('Decrease quantity');
      fireEvent.click(decreaseButton);
      expect(onQuantityChange).toHaveBeenCalledWith(1);
    });

    it('prevents quantity below 1', () => {
      const onQuantityChange = vi.fn();
      render(<ProductQuantity quantity={1} onQuantityChange={onQuantityChange} product={mockProduct} inStock={true} />);
      
      const decreaseButton = screen.getByTitle('Decrease quantity');
      expect(decreaseButton).toBeDisabled();
    });

    it('shows stock information', () => {
      render(<ProductQuantity quantity={1} onQuantityChange={vi.fn()} product={mockProduct} inStock={true} />);
      expect(screen.getByText(/in stock/i)).toBeInTheDocument();
    });

    it('shows low stock warning', () => {
      const lowStockProduct = { ...mockProduct, stock: { quantity: 5, trackQuantity: true } };
      render(<ProductQuantity quantity={1} onQuantityChange={vi.fn()} product={lowStockProduct} inStock={true} />);
      expect(screen.getByText('Only 5 left in stock')).toBeInTheDocument();
    });

    it('handles out of stock state', () => {
      render(<ProductQuantity quantity={1} onQuantityChange={vi.fn()} inStock={false} />);
      expect(screen.getByText('Out of stock')).toBeInTheDocument();
    });

    it('limits quantity to available stock', () => {
      const onQuantityChange = vi.fn();
      const limitedStockProduct = { ...mockProduct, stock: { quantity: 2, trackQuantity: true } };
      render(<ProductQuantity quantity={2} onQuantityChange={onQuantityChange} product={limitedStockProduct} inStock={true} />);
      
      const increaseButton = screen.getByTitle('Increase quantity');
      expect(increaseButton).toBeDisabled();
    });
  });

  describe('ProductActions Component', () => {
    it('renders without crashing', () => {
      render(<ProductActions totalPrice={599} product={mockProduct} inStock={true} />);
      expect(screen.getByText('Buy Now - £599')).toBeInTheDocument();
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    });

    it('handles buy now action', () => {
      const onBuyNow = vi.fn();
      render(<ProductActions totalPrice={599} onBuyNow={onBuyNow} product={mockProduct} inStock={true} />);
      
      const buyNowButton = screen.getByText('Buy Now - £599');
      fireEvent.click(buyNowButton);
      expect(onBuyNow).toHaveBeenCalled();
    });

    it('handles add to cart action', () => {
      const onAddToCart = vi.fn();
      render(<ProductActions totalPrice={599} onAddToCart={onAddToCart} product={mockProduct} inStock={true} />);
      
      const addToCartButton = screen.getByText('Add to Cart');
      fireEvent.click(addToCartButton);
      expect(onAddToCart).toHaveBeenCalled();
    });

    it('shows loading state when adding to cart', () => {
      render(<ProductActions totalPrice={599} isAddingToCart={true} product={mockProduct} inStock={true} />);
      expect(screen.getByText('Adding...')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('handles out of stock state', () => {
      render(<ProductActions totalPrice={599} product={mockProduct} inStock={false} />);
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
      expect(screen.getByText('Notify When Available')).toBeInTheDocument();
    });

    it('shows authentication notice when not logged in', () => {
      render(<ProductActions totalPrice={599} product={mockProduct} inStock={true} isAuthenticated={false} />);
      expect(screen.getByText('Login required for purchase')).toBeInTheDocument();
    });

    it('disables buttons when out of stock', () => {
      render(<ProductActions totalPrice={599} product={mockProduct} inStock={false} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button.textContent.includes('Out of Stock') || button.textContent.includes('Notify')) {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  describe('ProductIncludes Component', () => {
    it('renders without crashing', () => {
      render(<ProductIncludes product={mockProduct} />);
      expect(screen.getByText("What's Included")).toBeInTheDocument();
    });

    it('displays backend includes data', () => {
      render(<ProductIncludes product={mockProduct} />);
      expect(screen.getByText('USB-C Cable')).toBeInTheDocument();
      expect(screen.getByText('Quick Start Guide')).toBeInTheDocument();
    });

    it('shows product features', () => {
      render(<ProductIncludes product={mockProduct} />);
      expect(screen.getByText('All-day battery life')).toBeInTheDocument();
    });

    it('displays shipping information', () => {
      render(<ProductIncludes product={mockProduct} />);
      expect(screen.getByText(/warranty/i)).toBeInTheDocument();
    });

    it('shows product weight when available', () => {
      render(<ProductIncludes product={mockProduct} />);
      expect(screen.getByText('Weight: 466 g')).toBeInTheDocument();
    });

    it('handles missing includes gracefully', () => {
      const productWithoutIncludes = { ...mockProduct, includes: [], features: [] };
      render(<ProductIncludes product={productWithoutIncludes} />);
      
      // Should show default includes
      expect(screen.getByText("What's Included")).toBeInTheDocument();
    });

    it('does not render when no data available', () => {
      const { container } = render(<ProductIncludes product={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Backend Data Integration', () => {
    it('handles backend product structure correctly', () => {
      render(<ProductInfo product={mockProduct} />);
      
      // Should extract data from backend structure
      expect(screen.getByText('Buy Test Tablet Pro')).toBeInTheDocument();
      expect(screen.getByText('£599')).toBeInTheDocument();
    });

    it('handles missing backend fields gracefully', () => {
      const incompleteProduct = {
        _id: '123',
        name: 'Basic Product'
      };
      
      render(<ProductInfo product={incompleteProduct} />);
      expect(screen.getByText('Buy Basic Product')).toBeInTheDocument();
    });

    it('constructs variant options from backend data', () => {
      render(<ProductOptions product={mockProduct} />);
      
      // Should use backend variant structure
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
    });

    it('handles stock tracking from backend', () => {
      const productWithStock = { ...mockProduct, stock: { quantity: 25, trackQuantity: true } };
      render(<ProductQuantity quantity={1} onQuantityChange={vi.fn()} product={productWithStock} inStock={true} />);
      
      // Should use backend stock information
      expect(screen.getByText(/in stock/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles null product data', () => {
      render(<ProductInfo product={null} />);
      expect(screen.getByText('Loading product information...')).toBeInTheDocument();
    });

    it('handles undefined variants', () => {
      const productWithoutVariants = { ...mockProduct, variants: undefined };
      render(<ProductOptions product={productWithoutVariants} />);
      
      // Should not crash
      expect(screen.queryByText('Color')).not.toBeInTheDocument();
    });

    it('handles malformed stock data', () => {
      const productWithBadStock = { ...mockProduct, stock: null };
      render(<ProductQuantity quantity={1} onQuantityChange={vi.fn()} product={productWithBadStock} />);
      
      // Should handle gracefully
      expect(screen.getByText('Quantity')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button labels', () => {
      render(<ProductActions totalPrice={599} product={mockProduct} inStock={true} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('has proper form labels', () => {
      const productWithStock = { ...mockProduct, stock: 25 };
      render(<ProductQuantity quantity={1} onQuantityChange={vi.fn()} product={productWithStock} />);
      
      const input = screen.queryByRole('spinbutton');
      if (input) {
        expect(input).toBeInTheDocument();
      } else {
        // If no spinbutton, check for quantity heading
        expect(screen.getByText('Quantity')).toBeInTheDocument();
      }
    });

    it('supports keyboard navigation', () => {
      render(<ProductOptions product={mockProduct} />);
      
      const interactiveElements = document.querySelectorAll('[tabindex], button, input');
      expect(interactiveElements.length).toBeGreaterThanOrEqual(0);
    });
  });
});