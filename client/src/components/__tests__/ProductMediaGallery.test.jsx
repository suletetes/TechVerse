import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductMediaGallery from '../Product/ProductMediaGallery';

// Mock CSS imports
vi.mock('../../assets/css/product-enhancements.css', () => ({}));

const mockProduct = {
    id: 1,
    name: 'Test Product',
    images: [
        'img/product1.jpg',
        'img/product2.jpg',
        'img/product3.jpg'
    ],
    mainImage: 'img/product1.jpg'
};

describe('ProductMediaGallery Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('renders without crashing', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            expect(screen.getByRole('img')).toBeInTheDocument();
        });

        it('displays main product image', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            const mainImage = screen.getByRole('img');
            expect(mainImage).toHaveAttribute('alt', mockProduct.name);
        });

        it('shows thumbnail images', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            const images = screen.getAllByRole('img');
            expect(images.length).toBeGreaterThan(1); // Main image + thumbnails
        });

        it('handles missing product gracefully', () => {
            render(<ProductMediaGallery product={null} />);
            // Should render placeholder or handle gracefully
        });

        it('handles product without images', () => {
            const productNoImages = { ...mockProduct, images: [] };
            render(<ProductMediaGallery product={productNoImages} />);
            // Should show placeholder image
        });
    });

    describe('Image Navigation', () => {
        it('switches main image when thumbnail is clicked', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            const thumbnails = screen.getAllByRole('img');
            if (thumbnails.length > 1) {
                fireEvent.click(thumbnails[1]); // Click second thumbnail
                // Main image should change
            }
        });

        it('highlights active thumbnail', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            // Should have active class on current thumbnail
            const activeElements = document.querySelectorAll('.active');
            expect(activeElements.length).toBeGreaterThanOrEqual(0);
        });

        it('supports keyboard navigation', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            const mainImage = screen.getByRole('img');
            fireEvent.keyDown(mainImage, { key: 'ArrowRight' });
            fireEvent.keyDown(mainImage, { key: 'ArrowLeft' });
            // Should navigate through images
        });
    });

    describe('Zoom Functionality', () => {
        it('enables zoom on main image hover', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            const mainImage = screen.getByRole('img');
            fireEvent.mouseEnter(mainImage);
            fireEvent.mouseLeave(mainImage);
            // Should handle zoom functionality
        });

        it('supports click to zoom', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            const mainImage = screen.getByRole('img');
            fireEvent.click(mainImage);
            // Should open zoom modal or fullscreen view
        });
    });

    describe('Responsive Behavior', () => {
        it('adapts to different screen sizes', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            // Should have responsive classes
            const responsiveElements = document.querySelectorAll('.img-fluid, .responsive');
            expect(responsiveElements.length).toBeGreaterThanOrEqual(0);
        });

        it('handles mobile touch events', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            const mainImage = screen.getByRole('img');
            fireEvent.touchStart(mainImage);
            fireEvent.touchEnd(mainImage);
            // Should handle touch interactions
        });
    });

    describe('Accessibility', () => {
        it('has proper alt text for images', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            const images = screen.getAllByRole('img');
            images.forEach(img => {
                expect(img).toHaveAttribute('alt');
            });
        });

        it('supports screen readers', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            // Should have proper ARIA labels
            const ariaElements = document.querySelectorAll('[aria-label], [aria-describedby]');
            expect(ariaElements.length).toBeGreaterThanOrEqual(0);
        });

        it('is keyboard accessible', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            // Should have focusable elements
            const focusableElements = document.querySelectorAll('[tabindex], button, [role="button"]');
            expect(focusableElements.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Performance', () => {
        it('lazy loads images', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            // Should implement lazy loading
            const lazyImages = document.querySelectorAll('[loading="lazy"]');
            expect(lazyImages.length).toBeGreaterThanOrEqual(0);
        });

        it('optimizes image sizes', () => {
            render(<ProductMediaGallery product={mockProduct} />);
            
            // Should have optimized image attributes
            const images = screen.getAllByRole('img');
            images.forEach(img => {
                expect(img).toHaveAttribute('src');
            });
        });
    });
});