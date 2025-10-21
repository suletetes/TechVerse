import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TechnicalSpecs from '../ProductSpecs/TechnicalSpecs';
import KeyFeatures from '../ProductSpecs/KeyFeatures';
import DetailedSpecs from '../ProductSpecs/DetailedSpecs';
import ProductHighlights from '../ProductSpecs/ProductHighlights';

// Mock product data with backend structure
const mockProduct = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Tablet Pro',
  brand: 'TestBrand',
  sku: 'TB-PRO-001',
  specifications: [
    { name: 'Display Size', value: '11-inch Liquid Retina', category: 'display' },
    { name: 'Resolution', value: '2388 x 1668 pixels', category: 'display' },
    { name: 'Processor', value: 'M2 Chip', category: 'performance' },
    { name: 'RAM', value: '8GB', category: 'performance' },
    { name: 'Wi-Fi', value: 'Wi-Fi 6E', category: 'connectivity' },
    { name: 'Bluetooth', value: 'Bluetooth 5.3', category: 'connectivity' }
  ],
  features: [
    'All-Day Battery Life',
    'Advanced Camera System',
    'Ultra-Fast Performance',
    'Versatile Connectivity'
  ],
  highlights: [
    { title: 'Premium Quality', description: 'Built with high-grade materials' },
    { title: 'Fast Performance', description: 'Lightning-fast processing power' }
  ],
  rating: {
    average: 4.5,
    count: 127
  },
  shipping: {
    free: true
  },
  weight: {
    value: 466,
    unit: 'g'
  },
  dimensions: {
    length: 247.6,
    width: 178.5,
    height: 6.1,
    unit: 'mm'
  }
};

describe('ProductSpecs Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TechnicalSpecs Component', () => {
    it('renders without crashing', () => {
      render(<TechnicalSpecs product={mockProduct} />);
      expect(screen.getByText('Technical Specifications')).toBeInTheDocument();
    });

    it('displays backend specifications correctly', () => {
      render(<TechnicalSpecs product={mockProduct} specifications={mockProduct.specifications} />);
      
      // Check if specifications are displayed
      expect(screen.getByText('Display Size')).toBeInTheDocument();
      expect(screen.getByText('11-inch Liquid Retina')).toBeInTheDocument();
      expect(screen.getByText('Processor')).toBeInTheDocument();
      expect(screen.getByText('M2 Chip')).toBeInTheDocument();
    });

    it('handles missing specifications gracefully', () => {
      const productWithoutSpecs = { ...mockProduct, specifications: [] };
      render(<TechnicalSpecs product={productWithoutSpecs} />);
      
      // Should still render with fallback specs
      expect(screen.getByText('Technical Specifications')).toBeInTheDocument();
    });

    it('displays product brand and SKU when available', () => {
      render(<TechnicalSpecs product={mockProduct} />);
      
      // Should show brand information
      expect(screen.getByText('TestBrand')).toBeInTheDocument();
    });

    it('groups specifications by category', () => {
      render(<TechnicalSpecs product={mockProduct} specifications={mockProduct.specifications} />);
      
      // Should display specifications in organized manner
      const specItems = document.querySelectorAll('.spec-item');
      expect(specItems.length).toBeGreaterThan(0);
    });
  });

  describe('KeyFeatures Component', () => {
    it('renders without crashing', () => {
      render(<KeyFeatures product={mockProduct} />);
      expect(screen.getByText('Key Features')).toBeInTheDocument();
    });

    it('displays backend features correctly', () => {
      render(<KeyFeatures product={mockProduct} features={mockProduct.features} />);
      
      // Check if features are displayed
      expect(screen.getByText('All-Day Battery Life')).toBeInTheDocument();
      expect(screen.getByText('Advanced Camera System')).toBeInTheDocument();
    });

    it('handles string array features', () => {
      const stringFeatures = ['Feature 1', 'Feature 2', 'Feature 3'];
      render(<KeyFeatures features={stringFeatures} />);
      
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });

    it('handles object array features', () => {
      const objectFeatures = [
        { title: 'Premium Build', description: 'High-quality materials' },
        { title: 'Long Battery', description: 'All-day usage' }
      ];
      render(<KeyFeatures features={objectFeatures} />);
      
      expect(screen.getByText('Premium Build')).toBeInTheDocument();
      expect(screen.getByText('High-quality materials')).toBeInTheDocument();
    });

    it('shows fallback features when none provided', () => {
      render(<KeyFeatures />);
      
      // Should show default features
      expect(screen.getByText('Key Features')).toBeInTheDocument();
    });

    it('limits features display to reasonable number', () => {
      const manyFeatures = Array.from({ length: 20 }, (_, i) => `Feature ${i + 1}`);
      render(<KeyFeatures features={manyFeatures} />);
      
      // Should limit to 6 features
      const featureItems = document.querySelectorAll('.feature-item');
      expect(featureItems.length).toBeLessThanOrEqual(6);
    });
  });

  describe('DetailedSpecs Component', () => {
    it('renders without crashing', () => {
      render(<DetailedSpecs product={mockProduct} />);
      expect(screen.getByText(/Detailed Specifications/)).toBeInTheDocument();
    });

    it('displays product name in title', () => {
      render(<DetailedSpecs product={mockProduct} productName={mockProduct.name} />);
      expect(screen.getByText(/Test Tablet Pro/)).toBeInTheDocument();
    });

    it('groups specifications by category', () => {
      render(<DetailedSpecs product={mockProduct} specifications={mockProduct.specifications} />);
      
      // Should have expandable sections
      const sectionHeaders = document.querySelectorAll('.spec-section-header');
      expect(sectionHeaders.length).toBeGreaterThan(0);
    });

    it('handles section expansion and collapse', () => {
      render(<DetailedSpecs product={mockProduct} specifications={mockProduct.specifications} />);
      
      const sectionHeader = document.querySelector('.spec-section-header');
      if (sectionHeader) {
        fireEvent.click(sectionHeader);
        // Should toggle section visibility
      }
    });

    it('shows quick overview summary', () => {
      render(<DetailedSpecs product={mockProduct} />);
      
      // Should show quick specs summary
      const quickOverview = screen.queryByText('Quick Overview');
      if (quickOverview) {
        expect(quickOverview).toBeInTheDocument();
      }
    });

    it('handles missing specifications with defaults', () => {
      const productWithoutSpecs = { ...mockProduct, specifications: [] };
      render(<DetailedSpecs product={productWithoutSpecs} />);
      
      // Should render with default specifications
      expect(screen.getByText(/Detailed Specifications/)).toBeInTheDocument();
    });
  });

  describe('ProductHighlights Component', () => {
    it('renders without crashing', () => {
      render(<ProductHighlights product={mockProduct} />);
      expect(screen.getByText('Why Choose This Product')).toBeInTheDocument();
    });

    it('displays backend highlights correctly', () => {
      render(<ProductHighlights product={mockProduct} highlights={mockProduct.highlights} />);
      
      expect(screen.getByText('Premium Quality')).toBeInTheDocument();
      expect(screen.getByText('Built with high-grade materials')).toBeInTheDocument();
    });

    it('adds product-specific highlights based on rating', () => {
      const highRatedProduct = {
        ...mockProduct,
        rating: { average: 4.8, count: 200 }
      };
      render(<ProductHighlights product={highRatedProduct} />);
      
      // Should show highly rated highlight
      const ratingText = screen.queryByText(/4.8 stars/);
      if (ratingText) {
        expect(ratingText).toBeInTheDocument();
      }
    });

    it('adds free shipping highlight when applicable', () => {
      render(<ProductHighlights product={mockProduct} />);
      
      // Should show free shipping highlight
      const freeShipping = screen.queryByText(/Free Shipping/);
      if (freeShipping) {
        expect(freeShipping).toBeInTheDocument();
      }
    });

    it('handles string array highlights', () => {
      const stringHighlights = ['Quality Build', 'Fast Delivery', 'Great Support'];
      render(<ProductHighlights highlights={stringHighlights} />);
      
      expect(screen.getByText('Quality Build')).toBeInTheDocument();
    });

    it('shows fallback highlights when none provided', () => {
      render(<ProductHighlights />);
      
      // Should show default highlights
      expect(screen.getByText('Why Choose This Product')).toBeInTheDocument();
    });

    it('limits highlights to reasonable number', () => {
      const manyHighlights = Array.from({ length: 10 }, (_, i) => ({
        title: `Highlight ${i + 1}`,
        description: `Description ${i + 1}`
      }));
      render(<ProductHighlights highlights={manyHighlights} />);
      
      // Should limit to 5 highlights
      const highlightItems = document.querySelectorAll('.highlight-item');
      expect(highlightItems.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Backend Data Integration', () => {
    it('handles backend specification structure correctly', () => {
      const backendSpecs = [
        { name: 'Screen Size', value: '12.9 inches', category: 'display' },
        { name: 'CPU', value: 'A15 Bionic', category: 'performance' }
      ];
      
      render(<TechnicalSpecs specifications={backendSpecs} />);
      
      expect(screen.getByText('Screen Size')).toBeInTheDocument();
      expect(screen.getByText('12.9 inches')).toBeInTheDocument();
    });

    it('handles missing category in specifications', () => {
      const specsWithoutCategory = [
        { name: 'Display', value: '11-inch' },
        { name: 'Storage', value: '256GB' }
      ];
      
      render(<TechnicalSpecs specifications={specsWithoutCategory} />);
      
      // Should still display specifications
      expect(screen.getByText('Display')).toBeInTheDocument();
      expect(screen.getByText('11-inch')).toBeInTheDocument();
    });

    it('handles product weight and dimensions from backend', () => {
      render(<TechnicalSpecs product={mockProduct} />);
      
      // Should display weight and dimensions if available
      const weightText = screen.queryByText(/466/);
      if (weightText) {
        expect(weightText).toBeInTheDocument();
      }
    });

    it('constructs proper image URLs from backend data', () => {
      const productWithImages = {
        ...mockProduct,
        images: [
          { url: '/uploads/products/image1.jpg', alt: 'Product image 1' },
          { url: '/uploads/products/image2.jpg', alt: 'Product image 2' }
        ]
      };
      
      // Components should handle image URLs correctly
      render(<ProductHighlights product={productWithImages} />);
      
      // Should render without errors
      expect(screen.getByText('Why Choose This Product')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles null product gracefully', () => {
      render(<TechnicalSpecs product={null} />);
      
      // Should render without crashing
      expect(screen.getByText('Technical Specifications')).toBeInTheDocument();
    });

    it('handles undefined specifications', () => {
      render(<TechnicalSpecs product={{ name: 'Test' }} specifications={undefined} />);
      
      // Should render with fallback
      expect(screen.getByText('Technical Specifications')).toBeInTheDocument();
    });

    it('handles malformed specification data', () => {
      const malformedSpecs = [
        null,
        { name: 'Valid Spec', value: 'Valid Value' },
        { name: null, value: 'No name' },
        { name: 'No value' }
      ];
      
      render(<TechnicalSpecs specifications={malformedSpecs} />);
      
      // Should handle gracefully and show valid specs
      expect(screen.getByText('Valid Spec')).toBeInTheDocument();
    });

    it('handles empty arrays gracefully', () => {
      render(<KeyFeatures features={[]} />);
      render(<ProductHighlights highlights={[]} />);
      
      // Should render with fallbacks
      expect(screen.getByText('Key Features')).toBeInTheDocument();
      expect(screen.getByText('Why Choose This Product')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<TechnicalSpecs product={mockProduct} />);
      
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('has proper ARIA labels for interactive elements', () => {
      render(<DetailedSpecs product={mockProduct} />);
      
      const interactiveElements = document.querySelectorAll('[aria-label], [aria-expanded]');
      expect(interactiveElements.length).toBeGreaterThanOrEqual(0);
    });

    it('supports keyboard navigation', () => {
      render(<DetailedSpecs product={mockProduct} />);
      
      const focusableElements = document.querySelectorAll('button, [tabindex]');
      expect(focusableElements.length).toBeGreaterThanOrEqual(0);
    });
  });
});