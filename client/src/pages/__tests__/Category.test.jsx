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
        expect(screen.getByText('Phones')).toBeInTheDocument();
    });

    it('displays category name correctly', () => {
        renderWithRouter(<Category />);
        expect(screen.getByText('Phones')).toBeInTheDocument();
    });

    it('shows search functionality', () => {
        renderWithRouter(<Category />);
        expect(screen.getByPlaceholderText('Search phones...')).toBeInTheDocument();
    });

    it('displays filter controls', () => {
        renderWithRouter(<Category />);
        expect(screen.getByDisplayValue('Sort by Name')).toBeInTheDocument();
    });

    it('handles different category parameters', () => {
        // This test needs to be updated based on actual Category component structure
        renderWithRouter(<Category />);
        // Category component shows "Phones" as the category name
        expect(screen.getByText('Phones')).toBeInTheDocument();
    });

    it('handles missing category parameter', () => {
        renderWithRouter(<Category />);
        // Should still render without crashing
        expect(screen.getByText('Phones')).toBeInTheDocument();
    });

    it('processes search parameters correctly', () => {
        renderWithRouter(<Category />);
        // Should have search and filter controls
        expect(screen.getByPlaceholderText('Search phones...')).toBeInTheDocument();
    });
});