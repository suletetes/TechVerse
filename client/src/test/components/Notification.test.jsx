/**
 * Notification Component Tests
 * Tests for notification component with different types and auto-dismiss
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Notification from '../../components/Common/Notification';

describe('Notification Component', () => {
  let mockOnClose;

  beforeEach(() => {
    mockOnClose = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render notification with message', () => {
    render(
      <Notification
        id="test-1"
        message="Test notification message"
        type="info"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Test notification message')).toBeInTheDocument();
  });

  it('should render success notification with correct styling', () => {
    const { container } = render(
      <Notification
        id="test-1"
        message="Success message"
        type="success"
        onClose={mockOnClose}
      />
    );

    const notification = container.querySelector('.notification-success');
    expect(notification).toBeInTheDocument();
  });

  it('should render error notification with correct styling', () => {
    const { container } = render(
      <Notification
        id="test-1"
        message="Error message"
        type="error"
        onClose={mockOnClose}
      />
    );

    const notification = container.querySelector('.notification-error');
    expect(notification).toBeInTheDocument();
  });

  it('should render warning notification with correct styling', () => {
    const { container } = render(
      <Notification
        id="test-1"
        message="Warning message"
        type="warning"
        onClose={mockOnClose}
      />
    );

    const notification = container.querySelector('.notification-warning');
    expect(notification).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <Notification
        id="test-1"
        message="Test message"
        type="info"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Wait for animation
    vi.advanceTimersByTime(300);

    expect(mockOnClose).toHaveBeenCalledWith('test-1');
  });

  it('should auto-dismiss after specified duration', () => {
    render(
      <Notification
        id="test-1"
        message="Test message"
        type="info"
        onClose={mockOnClose}
        duration={3000}
      />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    // Wait for animation
    vi.advanceTimersByTime(300);

    expect(mockOnClose).toHaveBeenCalledWith('test-1');
  });

  it('should not auto-dismiss when duration is 0', () => {
    render(
      <Notification
        id="test-1"
        message="Test message"
        type="info"
        onClose={mockOnClose}
        duration={0}
      />
    );

    vi.advanceTimersByTime(10000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <Notification
        id="test-1"
        message="Test message"
        type="info"
        onClose={mockOnClose}
      />
    );

    const notification = screen.getByRole('alert');
    expect(notification).toHaveAttribute('aria-live', 'polite');
  });
});
