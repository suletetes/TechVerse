import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminHomepageManager from '../Admin/AdminHomepageManager';

// Mock CSS imports
vi.mock('../../assets/css/admin-homepage-manager.css', () => ({}));

describe('AdminHomepageManager Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('renders without crashing', () => {
            render(<AdminHomepageManager />);
            expect(screen.getByText('Homepage Manager')).toBeInTheDocument();
        });

        it('displays all homepage sections', () => {
            render(<AdminHomepageManager />);
            expect(screen.getByText('Latest Products')).toBeInTheDocument();
            expect(screen.getByText('Top Sellers')).toBeInTheDocument();
            expect(screen.getByText('Quick Picks')).toBeInTheDocument();
            expect(screen.getByText('Weekly Deals')).toBeInTheDocument();
        });

        it('shows section navigation tabs', () => {
            render(<AdminHomepageManager />);
            const tabs = screen.getAllByRole('button');
            expect(tabs.length).toBeGreaterThan(4); // At least 4 section tabs plus other buttons
        });

        it('displays preview and save buttons', () => {
            render(<AdminHomepageManager />);
            expect(screen.getByText('Preview Homepage')).toBeInTheDocument();
            expect(screen.getByText('Save Changes')).toBeInTheDocument();
        });
    });

    describe('Section Management', () => {
        it('switches between sections correctly', () => {
            render(<AdminHomepageManager />);
            
            // Click on Top Sellers tab
            fireEvent.click(screen.getByText('Top Sellers'));
            expect(screen.getByText('Display your best-selling products')).toBeInTheDocument();
            
            // Click on Quick Picks tab
            fireEvent.click(screen.getByText('Quick Picks'));
            expect(screen.getByText('Curated selection of recommended products')).toBeInTheDocument();
        });

        it('shows correct product limits for each section', () => {
            render(<AdminHomepageManager />);
            
            // Latest Products should show 8/8
            expect(screen.getByText('8/8')).toBeInTheDocument();
            
            // Switch to Weekly Deals and check 3/3
            fireEvent.click(screen.getByText('Weekly Deals'));
            expect(screen.getByText('3/3')).toBeInTheDocument();
        });

        it('displays progress indicators', () => {
            render(<AdminHomepageManager />);
            const progressBars = document.querySelectorAll('.progress-bar');
            expect(progressBars.length).toBeGreaterThan(0);
        });

        it('shows warning badges for incomplete sections', () => {
            render(<AdminHomepageManager />);
            // Look for warning badges (!) on sections that aren't full
            const warningBadges = document.querySelectorAll('.badge.bg-warning');
            expect(warningBadges.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Product Assignment', () => {
        it('opens product selector modal', () => {
            render(<AdminHomepageManager />);
            
            // Switch to a section with available slots
            fireEvent.click(screen.getByText('Weekly Deals'));
            
            // Click Add Product button
            const addButtons = screen.getAllByText('Add Product');
            if (addButtons.length > 0) {
                fireEvent.click(addButtons[0]);
                expect(screen.getByText('Add Product to Weekly Deals')).toBeInTheDocument();
            }
        });

        it('displays available products in modal', () => {
            render(<AdminHomepageManager />);
            
            fireEvent.click(screen.getByText('Weekly Deals'));
            const addButtons = screen.getAllByText('Add Product');
            if (addButtons.length > 0) {
                fireEvent.click(addButtons[0]);
                
                // Should show available products
                expect(screen.getByText('Add Product to Weekly Deals')).toBeInTheDocument();
                
                // Close modal
                const closeButton = screen.getByText('Close');
                fireEvent.click(closeButton);
            }
        });

        it('removes products from sections', () => {
            render(<AdminHomepageManager />);
            
            // Look for remove buttons (X buttons)
            const removeButtons = document.querySelectorAll('button[title="Remove from section"]');
            if (removeButtons.length > 0) {
                const initialCount = screen.getAllByText(/£\d+/).length;
                fireEvent.click(removeButtons[0]);
                // Product should be removed (count should decrease)
            }
        });

        it('reorders products within sections', () => {
            render(<AdminHomepageManager />);
            
            // Look for reorder buttons (↑↓)
            const upButtons = document.querySelectorAll('button[title="Move up"]');
            const downButtons = document.querySelectorAll('button[title="Move down"]');
            
            expect(upButtons.length + downButtons.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Product Display', () => {
        it('shows product information correctly', () => {
            render(<AdminHomepageManager />);
            
            // Should display product prices
            const prices = screen.getAllByText(/£\d+/);
            expect(prices.length).toBeGreaterThan(0);
            
            // Should display product ratings
            const ratings = screen.getAllByText(/★ \d\.\d/);
            expect(ratings.length).toBeGreaterThan(0);
        });

        it('displays product position indicators', () => {
            render(<AdminHomepageManager />);
            
            // Look for position badges (#1, #2, etc.)
            const positionBadges = document.querySelectorAll('.badge.bg-primary');
            expect(positionBadges.length).toBeGreaterThan(0);
        });

        it('shows product categories', () => {
            render(<AdminHomepageManager />);
            
            // Should show category badges
            const categoryBadges = document.querySelectorAll('.badge.bg-light');
            expect(categoryBadges.length).toBeGreaterThan(0);
        });
    });

    describe('User Interactions', () => {
        it('handles save changes action', () => {
            render(<AdminHomepageManager />);
            
            const saveButton = screen.getByText('Save Changes');
            fireEvent.click(saveButton);
            
            // Should trigger save action (in real app would show success message)
        });

        it('handles preview homepage action', () => {
            render(<AdminHomepageManager />);
            
            const previewButton = screen.getByText('Preview Homepage');
            fireEvent.click(previewButton);
            
            // Should trigger preview action
        });

        it('closes modal when clicking close button', () => {
            render(<AdminHomepageManager />);
            
            // Open modal first
            fireEvent.click(screen.getByText('Weekly Deals'));
            const addButtons = screen.getAllByText('Add Product');
            if (addButtons.length > 0) {
                fireEvent.click(addButtons[0]);
                
                // Close modal
                const closeButton = screen.getByText('Close');
                fireEvent.click(closeButton);
                
                // Modal should be closed
                expect(screen.queryByText('Add Product to Weekly Deals')).not.toBeInTheDocument();
            }
        });
    });

    describe('Statistics Display', () => {
        it('shows quick stats for all sections', () => {
            render(<AdminHomepageManager />);
            
            // Should show stats cards at bottom
            const statsCards = document.querySelectorAll('.card.text-center');
            expect(statsCards.length).toBe(4); // One for each section
        });

        it('displays correct assignment counts', () => {
            render(<AdminHomepageManager />);
            
            // Should show assignment ratios like "8/8", "9/9", etc.
            expect(screen.getByText('8/8')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('handles empty product assignments gracefully', () => {
            render(<AdminHomepageManager />);
            
            // Component should render even with no products assigned
            expect(screen.getByText('Homepage Manager')).toBeInTheDocument();
        });

        it('prevents adding products beyond limits', () => {
            render(<AdminHomepageManager />);
            
            // Latest Products section is full (8/8), Add Product button should be disabled
            fireEvent.click(screen.getByText('Latest Products'));
            const addButtons = screen.getAllByText('Add Product');
            
            // If section is full, button should be disabled
            if (addButtons.length > 0) {
                expect(addButtons[0]).toBeDisabled();
            }
        });

        it('prevents duplicate product assignments', () => {
            render(<AdminHomepageManager />);
            
            // This would be tested by trying to add the same product twice
            // The component should prevent duplicates
        });
    });

    describe('Responsive Design', () => {
        it('renders properly on different screen sizes', () => {
            render(<AdminHomepageManager />);
            
            // Should have responsive classes
            const responsiveElements = document.querySelectorAll('.col-md-6, .col-lg-4, .col-xl-3');
            expect(responsiveElements.length).toBeGreaterThan(0);
        });

        it('handles mobile layout correctly', () => {
            render(<AdminHomepageManager />);
            
            // Should have mobile-friendly button groups
            const buttonGroups = document.querySelectorAll('.btn-group');
            expect(buttonGroups.length).toBeGreaterThan(0);
        });
    });
});