import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Category from '../Category';

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
        expect(screen.getByTestId('category-page')).toBeInTheDocument();
    });

    it('displays category page content', () => {
        renderWithRouter(<Category />);
        expect(screen.getByText('Category Page')).toBeInTheDocument();
    });

    it('shows placeholder content', () => {
        renderWithRouter(<Category />);
        expect(screen.getByText('This is a placeholder for the Category component.')).toBeInTheDocument();
    });
});