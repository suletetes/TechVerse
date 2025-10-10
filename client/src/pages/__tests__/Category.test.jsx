import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Category from '../Category';

// Mock components
vi.mock('../../components/Category/CategoryScroll', () => ({
    default: ({ category }) => <div data-testid="category-scroll">Category: {category}</div>
}));

vi.mock('../../components/Cards/LatestProducts', () => ({
    default: () => <div data-testid="latest-products">Latest Products</div>
}));

vi.mock('../../components/Cards/TopSellerProducts', () => ({
    default: () => <div data-testid="top-seller-products">Top Sellers</div>
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ category: 'laptops' }),
        useSearchParams: () => [new URLSearchParams('sort=price&filter=brand'), vi.fn()],
    };
});

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('Category Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        renderWithRouter(<Category />);
        expect(screen.getByTestId('category-scroll')).toBeInTheDocument();
    });

    it('displays category name correctly', () => {
        renderWithRouter(<Category />);
        expect(screen.getByText('Category: laptops')).toBeInTheDocument();
    });

    it('shows latest products section', () => {
        renderWithRouter(<Category />);
        expect(screen.getByTestId('latest-products')).toBeInTheDocument();
    });

    it('displays top seller products', () => {
        renderWithRouter(<Category />);
        expect(screen.getByTestId('top-seller-products')).toBeInTheDocument();
    });

    it('handles different category parameters', () => {
        vi.mocked(require('react-router-dom').useParams).mockReturnValue({ category: 'phones' });
        renderWithRouter(<Category />);
        expect(screen.getByText('Category: phones')).toBeInTheDocument();
    });

    it('handles missing category parameter', () => {
        vi.mocked(require('react-router-dom').useParams).mockReturnValue({ category: null });
        renderWithRouter(<Category />);
        // Should still render without crashing
        expect(screen.getByTestId('category-scroll')).toBeInTheDocument();
    });

    it('processes search parameters correctly', () => {
        const mockSetSearchParams = vi.fn();
        vi.mocked(require('react-router-dom').useSearchParams).mockReturnValue([
            new URLSearchParams('sort=name&filter=price'),
            mockSetSearchParams
        ]);
        
        renderWithRouter(<Category />);
        expect(screen.getByTestId('category-scroll')).toBeInTheDocument();
    });
});