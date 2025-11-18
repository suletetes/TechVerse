import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Product from '../Product';

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
        expect(screen.getByTestId('product-page')).toBeInTheDocument();
    });

    it('displays product page content', () => {
        renderWithRouter(<Product />);
        expect(screen.getByText('Product Page')).toBeInTheDocument();
    });

    it('shows placeholder content', () => {
        renderWithRouter(<Product />);
        expect(screen.getByText('This is a placeholder for the Product component.')).toBeInTheDocument();
    });
});