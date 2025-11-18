/**
 * Modal Component Tests
 * Tests for modal component with keyboard navigation and overlay clicks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal, { ConfirmationModal } from '../../components/Common/Modal';

describe('Modal Component', () => {
  let mockOnClose;

  beforeEach(() => {
    mockOnClose = vi.fn();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when overlay is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close modal when overlay is clicked if closeOnOverlayClick is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" closeOnOverlayClick={false}>
        <p>Modal content</p>
      </Modal>
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should close modal when Escape key is pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close modal when Escape key is pressed if closeOnEscape is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" closeOnEscape={false}>
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render with different size variants', () => {
    const { container, rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="small">
        <p>Content</p>
      </Modal>
    );

    expect(container.querySelector('.modal-small')).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="large">
        <p>Content</p>
      </Modal>
    );

    expect(container.querySelector('.modal-large')).toBeInTheDocument();
  });

  it('should render footer when provided', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title="Test Modal"
        footer={<button>Footer Button</button>}
      >
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Footer Button')).toBeInTheDocument();
  });

  it('should hide close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" showCloseButton={false}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByRole('button', { name: /close modal/i })).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});

describe('ConfirmationModal Component', () => {
  let mockOnClose;
  let mockOnConfirm;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnConfirm = vi.fn();
  });

  it('should render confirmation modal with message', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        message="Are you sure you want to delete this item?"
      />
    );

    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('should call onConfirm and onClose when confirm button is clicked', async () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        message="Confirm action?"
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        message="Confirm action?"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should disable buttons when isLoading is true', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        message="Confirm action?"
        isLoading={true}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /processing/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should use custom button text', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        message="Confirm action?"
        confirmText="Delete"
        cancelText="Keep"
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
  });
});
