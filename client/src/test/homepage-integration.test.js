// Simple integration test for homepage components
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LatestProducts from '../components/Cards/LatestProducts.jsx';
import TopSellerProducts from '../components/Cards/TopSellerProducts.jsx';
import QuickPicks from '../components/QuickPicks/QuickPicks.jsx';
import WeeklyDeals from '../components/Cards/WeeklyDeals.jsx';

// Mock data that matches API response format
const mockProducts = [
  {
    _id: '1',
    name: 'Test Product 1',
    price: 999,
    slug: 'test-product-1',
    images: [{ url: 'test-image-1.jpg' }],
    brand: 'TestBrand',
    category: { name: 'electronics' },
    rating: { average: 4.5 }
  },
  {
    _id: '2',
    name: 'Test Product 2',
    price: 1299,
    slug: 'test-product-2',
    images: [{ url: 'test-image-2.jpg' }],
    brand: 'TestBrand',
    category: { name: 'computers' },
    rating: { average: 4.8 }
  }
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Homepage Components Integration', () => {
  describe('LatestProducts', () => {
    it('renders products from API data', () => {
      renderWithRouter(
        <LatestProducts products={mockProducts} isLoading={false} />
      );
      
      expect(screen.getByText('The Latest.')).toBeInTheDocument();
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('From £999')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderWithRouter(
        <LatestProducts products={[]} isLoading={true} />
      );
      
      expect(screen.getByText('The Latest.')).toBeInTheDocument();
      // Should show skeleton loading cards
    });

    it('shows error state with retry', () => {
      const mockRetry = vi.fn();
      renderWithRouter(
        <LatestProducts 
          products={[]} 
          isLoading={false} 
          error="Network error" 
          onRetry={mockRetry} 
        />
      );
      
      expect(screen.getByText('Unable to load latest products. Please try again.')).toBeInTheDocument();
    });

    it('shows empty state when no products', () => {
      renderWithRouter(
        <LatestProducts products={[]} isLoading={false} />
      );
      
      expect(screen.getByText('No latest products available at the moment.')).toBeInTheDocument();
    });
  });

  describe('TopSellerProducts', () => {
    it('renders products from API data', () => {
      renderWithRouter(
        <TopSellerProducts products={mockProducts} isLoading={false} />
      );
      
      expect(screen.getByText('Top Sellers.')).toBeInTheDocument();
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('From £999')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderWithRouter(
        <TopSellerProducts products={[]} isLoading={true} />
      );
      
      expect(screen.getByText('Top Sellers.')).toBeInTheDocument();
    });
  });

  describe('QuickPicks', () => {
    it('renders products from API data', () => {
      renderWithRouter(
        <QuickPicks products={mockProducts} isLoading={false} />
      );
      
      expect(screen.getByText('Quick Picks.')).toBeInTheDocument();
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('£999')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderWithRouter(
        <QuickPicks products={[]} isLoading={true} />
      );
      
      expect(screen.getByText('Quick Picks.')).toBeInTheDocument();
    });
  });

  describe('WeeklyDeals', () => {
    it('renders products from API data', () => {
      renderWithRouter(
        <WeeklyDeals products={mockProducts} isLoading={false} />
      );
      
      expect(screen.getByText('Weekly Deals.')).toBeInTheDocument();
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('From £999')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderWithRouter(
        <WeeklyDeals products={[]} isLoading={true} />
      );
      
      expect(screen.getByText('Weekly Deals.')).toBeInTheDocument();
    });
  });
});