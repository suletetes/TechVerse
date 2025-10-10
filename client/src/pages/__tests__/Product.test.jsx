import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Product from '../Product';

// Mock components
vi.mock('../../components/Product/ProductMediaGallery', () => ({
    default: ({ product }) => <div data-testid="product-media-gallery">{product?.name} Gallery</div>
}));

vi.mock('../../components/ProductDetails/ProductInfo', () => ({
    default: ({ product }) => <div data-testid="product-info">{product?.name} Info</div>
}));

vi.mock('../../components/ProductSpecs/ProductHighlights', () => ({
    default: ({ product }) => <div data-testid="product-highlights">{product?.name} Highlights</div>
}));

vi.mock('../../components/Reviews/ReviewsSection', () => ({
    default: ({ productId }) => <div data-testid="reviews-section">Reviews for {productId}</div>
}));

vi.mock('../../components/RelatedProducts/RelatedProducts', () => ({
    default: ({ category }) => <div data-testid="related-products">Related {category} Products</div>
}));

vi.mock('../../components/FAQ/ProductFAQ', () => ({
    default: ({ productId }) => <div data-testid="product-faq">FAQ for {productId}</div>
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: '1' }),
        useNavigate: () => mockNavigate,
    };
});

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('Product Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        renderWithRouter(<Product />);
        expect(screen.getByTestId('product-media-gallery')).toBeInTheDocument();
    });

    it('displays product information correctly', () => {
        renderWithRouter(<Product />);
        expect(screen.getByTestId('product-info')).toBeInTheDocument();
        expect(screen.getByTestId('product-highlights')).toBeInTheDocument();
    });

    it('shows reviews section', () => {
        renderWithRouter(<Product />);
        expect(screen.getByTestId('reviews-section')).toBeInTheDocument();
    });

    it('displays related products', () => {
        renderWithRouter(<Product />);
        expect(screen.getByTestId('related-products')).toBeInTheDocument();
    });

    it('shows product FAQ', () => {
        renderWithRouter(<Product />);
        expect(screen.getByTestId('product-faq')).toBeInTheDocument();
    });

    it('handles missing product ID gracefully', () => {
        vi.mocked(require('react-router-dom').useParams).mockReturnValue({ id: null });
        renderWithRouter(<Product />);
        // Should still render without crashing
        expect(screen.getByTestId('product-media-gallery')).toBeInTheDocument();
    });
});