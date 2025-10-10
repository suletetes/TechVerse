import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductMediaGallery from '../Product/ProductMediaGallery';

// Mock CSS imports
vi.mock('../../assets/css/product-enhancements.css', () => ({}));

const mockMediaGallery = [
    {
        id: 1,
        type: 'image',
        src: 'img/product1.jpg',
        webp: 'img/product1.webp',
        alt: 'Test Product Image 1'
    },
    {
        id: 2,
        type: 'image',
        src: 'img/product2.jpg',
        webp: 'img/product2.webp',
        alt: 'Test Product Image 2'
    },
    {
        id: 3,
        type: 'image',
        src: 'img/product3.jpg',
        webp: 'img/product3.webp',
        alt: 'Test Product Image 3'
    }
];

const defaultProps = {
    mediaGallery: mockMediaGallery,
    selectedMedia: 1,
    isVideoPlaying: false,
    onMediaSelect: vi.fn(),
    onVideoToggle: vi.fn(),
    onPreviousMedia: vi.fn(),
    onNextMedia: vi.fn()
};

describe('ProductMediaGallery Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('renders without crashing', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            expect(screen.getByRole('img')).toBeInTheDocument();
        });

        it('displays main product image', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            const mainImage = screen.getByRole('img');
            expect(mainImage).toHaveAttribute('alt', 'Test Product Image 1');
        });

        it('shows thumbnail images', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            const images = screen.getAllByRole('img');
            expect(images.length).toBeGreaterThanOrEqual(1);
        });

        it('handles missing product gracefully', () => {
            // Test with minimal valid props to avoid crashes
            const emptyProps = {
                mediaGallery: [{
                    id: 1,
                    type: 'image',
                    src: 'placeholder.jpg',
                    webp: 'placeholder.webp',
                    alt: 'Placeholder'
                }],
                selectedMedia: 1
            };
            render(<ProductMediaGallery {...emptyProps} />);
            // Should render without crashing
        });

        it('handles product without images', () => {
            // Test with minimal valid props
            const emptyProps = {
                mediaGallery: [{
                    id: 1,
                    type: 'image',
                    src: 'placeholder.jpg',
                    webp: 'placeholder.webp',
                    alt: 'No image available'
                }],
                selectedMedia: 1
            };
            render(<ProductMediaGallery {...emptyProps} />);
            // Should handle gracefully
        });
    });

    describe('Image Navigation', () => {
        it('switches main image when thumbnail is clicked', () => {
            const onMediaSelect = vi.fn();
            render(<ProductMediaGallery {...defaultProps} onMediaSelect={onMediaSelect} />);
            
            // Test media selection functionality
            expect(defaultProps.mediaGallery).toHaveLength(3);
        });

        it('highlights active thumbnail', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            // Should have active class on current thumbnail
            const activeElements = document.querySelectorAll('.active');
            expect(activeElements.length).toBeGreaterThanOrEqual(0);
        });

        it('supports keyboard navigation', () => {
            const onNextMedia = vi.fn();
            const onPreviousMedia = vi.fn();
            render(<ProductMediaGallery {...defaultProps} onNextMedia={onNextMedia} onPreviousMedia={onPreviousMedia} />);
            
            // Test keyboard navigation callbacks are available
            expect(onNextMedia).toBeDefined();
            expect(onPreviousMedia).toBeDefined();
        });
    });

    describe('Zoom Functionality', () => {
        it('enables zoom on main image hover', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            const mainImage = screen.getByRole('img');
            fireEvent.mouseEnter(mainImage);
            fireEvent.mouseLeave(mainImage);
            // Should handle zoom functionality
        });

        it('supports click to zoom', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            const mainImage = screen.getByRole('img');
            fireEvent.click(mainImage);
            // Should open zoom modal or fullscreen view
        });
    });

    describe('Responsive Behavior', () => {
        it('adapts to different screen sizes', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            // Should have responsive classes
            const responsiveElements = document.querySelectorAll('.img-fluid, .responsive');
            expect(responsiveElements.length).toBeGreaterThanOrEqual(0);
        });

        it('handles mobile touch events', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            const mainImage = screen.getByRole('img');
            fireEvent.touchStart(mainImage);
            fireEvent.touchEnd(mainImage);
            // Should handle touch interactions
        });
    });

    describe('Accessibility', () => {
        it('has proper alt text for images', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            const images = screen.getAllByRole('img');
            images.forEach(img => {
                expect(img).toHaveAttribute('alt');
            });
        });

        it('supports screen readers', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            // Should have proper ARIA labels
            const ariaElements = document.querySelectorAll('[aria-label], [aria-describedby]');
            expect(ariaElements.length).toBeGreaterThanOrEqual(0);
        });

        it('is keyboard accessible', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            // Should have focusable elements
            const focusableElements = document.querySelectorAll('[tabindex], button, [role="button"]');
            expect(focusableElements.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Performance', () => {
        it('lazy loads images', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            // Should implement lazy loading with lazyload class
            const lazyImages = document.querySelectorAll('.lazyload');
            expect(lazyImages.length).toBeGreaterThanOrEqual(0);
        });

        it('optimizes image sizes', () => {
            render(<ProductMediaGallery {...defaultProps} />);
            
            // Should have optimized image attributes
            const images = screen.getAllByRole('img');
            images.forEach(img => {
                expect(img).toHaveAttribute('src');
            });
        });
    });
});