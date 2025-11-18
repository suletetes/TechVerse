import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../test/testUtils.jsx';
import LazyImage from '../../Common/LazyImage.jsx';

// Mock intersection observer
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();
let mockCallback;

beforeEach(() => {
  mockIntersectionObserver.mockImplementation((callback) => {
    mockCallback = callback;
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect
    };
  });

  global.IntersectionObserver = mockIntersectionObserver;
  
  // Mock Image constructor
  global.Image = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    src: '',
    onload: null,
    onerror: null
  }));
  
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LazyImage', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
    width: 300,
    height: 200
  };

  describe('Basic Rendering', () => {
    it('should render with placeholder initially', () => {
      renderWithProviders(<LazyImage {...defaultProps} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/img/lazyload-ph.png');
      expect(img).toHaveAttribute('alt', 'Test image');
      expect(img).toHaveClass('lazy-loading');
    });

    it('should render with custom placeholder', () => {
      const customPlaceholder = '/custom-placeholder.jpg';
      renderWithProviders(<LazyImage {...defaultProps} placeholder={customPlaceholder} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', customPlaceholder);
    });

    it('should apply custom className', () => {
      render(<LazyImage {...defaultProps} className="custom-class" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveClass('custom-class');
      expect(img).toHaveClass('lazy-loading');
    });

    it('should set width and height attributes', () => {
      render(<LazyImage {...defaultProps} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('width', '300');
      expect(img).toHaveAttribute('height', '200');
    });
  });

  describe('WebP Support', () => {
    it('should render picture element with WebP source when webpSrc provided', () => {
      render(
        <LazyImage 
          {...defaultProps} 
          webpSrc="/test-image.webp"
        />
      );
      
      const picture = screen.getByRole('img').parentElement;
      expect(picture.tagName).toBe('PICTURE');
      
      const source = picture.querySelector('source[type="image/webp"]');
      expect(source).toBeInTheDocument();
      expect(source).toHaveAttribute('srcset', '/img/lazyload-ph.png');
    });

    it('should include sizes attribute for responsive images', () => {
      const sizes = '(max-width: 768px) 100vw, 50vw';
      render(
        <LazyImage 
          {...defaultProps} 
          webpSrc="/test-image.webp"
          sizes={sizes}
        />
      );
      
      const source = screen.getByRole('img').parentElement.querySelector('source');
      expect(source).toHaveAttribute('sizes', sizes);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', sizes);
    });
  });

  describe('Lazy Loading Behavior', () => {
    it('should setup intersection observer', () => {
      render(<LazyImage {...defaultProps} />);
      
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: 0.1,
          rootMargin: '50px'
        })
      );
      expect(mockObserve).toHaveBeenCalled();
    });

    it('should load image when intersecting', async () => {
      // Mock successful image loading
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      global.Image = vi.fn(() => mockImage);

      render(<LazyImage {...defaultProps} />);
      
      // Get the intersection observer callback
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      
      // Simulate intersection
      observerCallback([{ isIntersecting: true }]);
      
      // Simulate image load
      mockImage.src = defaultProps.src;
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', defaultProps.src);
        expect(img).toHaveClass('lazy-loaded');
      });
    });

    it('should handle image load error', async () => {
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      global.Image = vi.fn(() => mockImage);

      render(<LazyImage {...defaultProps} />);
      
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true }]);
      
      // Simulate image error
      if (mockImage.onerror) {
        mockImage.onerror();
      }
      
      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveClass('lazy-image-error');
      });
    });

    it('should load immediately when priority is true', async () => {
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      global.Image = vi.fn(() => mockImage);

      render(<LazyImage {...defaultProps} priority={true} />);
      
      // Wait for the effect to run
      await waitFor(() => {
        expect(global.Image).toHaveBeenCalled();
      });
    });
  });

  describe('Event Handlers', () => {
    it('should call onLoad when image loads successfully', async () => {
      const onLoad = vi.fn();
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      global.Image = vi.fn(() => mockImage);

      render(<LazyImage {...defaultProps} onLoad={onLoad} />);
      
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true }]);
      
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await waitFor(() => {
        const img = screen.getByRole('img');
        fireEvent.load(img);
        expect(onLoad).toHaveBeenCalled();
      });
    });

    it('should call onError when image fails to load', async () => {
      const onError = vi.fn();
      const mockImage = {
        onload: null,
        onerror: null,
        src: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      global.Image = vi.fn(() => mockImage);

      render(<LazyImage {...defaultProps} onError={onError} />);
      
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true }]);
      
      if (mockImage.onerror) {
        mockImage.onerror();
      }
      
      await waitFor(() => {
        const img = screen.getByRole('img');
        fireEvent.error(img);
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should set loading attribute based on priority', () => {
      const { rerender } = render(<LazyImage {...defaultProps} />);
      
      let img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
      
      rerender(<LazyImage {...defaultProps} priority={true} />);
      
      img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('should set decoding attribute to async', () => {
      render(<LazyImage {...defaultProps} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('decoding', 'async');
    });
  });

  describe('Error Handling', () => {
    it('should show placeholder when src is invalid', () => {
      render(<LazyImage {...defaultProps} src="" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/img/lazyload-ph.png');
    });

    it('should handle missing alt text gracefully', () => {
      render(<LazyImage src="/test.jpg" />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', '');
    });

    it('should cleanup intersection observer on unmount', () => {
      const { unmount } = render(<LazyImage {...defaultProps} />);
      
      unmount();
      
      expect(mockUnobserve).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text', () => {
      render(<LazyImage {...defaultProps} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Test image');
    });

    it('should be focusable when needed', () => {
      render(<LazyImage {...defaultProps} tabIndex={0} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Performance', () => {
    it('should not create multiple Image objects for same src', async () => {
      global.Image = vi.fn(() => ({
        onload: null,
        onerror: null,
        src: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));

      render(<LazyImage {...defaultProps} />);
      
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true }]);
      
      await waitFor(() => {
        expect(global.Image).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle rapid intersection changes gracefully', () => {
      render(<LazyImage {...defaultProps} />);
      
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      
      // Rapidly toggle intersection
      observerCallback([{ isIntersecting: true }]);
      observerCallback([{ isIntersecting: false }]);
      observerCallback([{ isIntersecting: true }]);
      
      // Should not cause errors
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('should pass through additional props to img element', () => {
      render(
        <LazyImage 
          {...defaultProps} 
          data-testid="custom-image"
          title="Custom title"
        />
      );
      
      const img = screen.getByTestId('custom-image');
      expect(img).toHaveAttribute('title', 'Custom title');
    });

    it('should handle style prop correctly', () => {
      const customStyle = { border: '1px solid red' };
      render(<LazyImage {...defaultProps} style={customStyle} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveStyle('border: 1px solid red');
    });
  });
});