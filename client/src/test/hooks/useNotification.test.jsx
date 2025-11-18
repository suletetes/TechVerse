/**
 * useNotification Hook Tests
 * Tests for notification hook with all methods
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { NotificationProvider } from '../../context/NotificationContext';
import { useNotification } from '../../hooks/useNotification';

const wrapper = ({ children }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('useNotification Hook', () => {
  it('should provide notification methods', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    expect(result.current).toHaveProperty('showSuccess');
    expect(result.current).toHaveProperty('showError');
    expect(result.current).toHaveProperty('showWarning');
    expect(result.current).toHaveProperty('showInfo');
    expect(result.current).toHaveProperty('dismiss');
    expect(result.current).toHaveProperty('notifications');
  });

  it('should add success notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showSuccess('Success message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Success message',
      type: 'success'
    });
  });

  it('should add error notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showError('Error message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Error message',
      type: 'error'
    });
  });

  it('should add warning notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showWarning('Warning message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Warning message',
      type: 'warning'
    });
  });

  it('should add info notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showInfo('Info message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Info message',
      type: 'info'
    });
  });

  it('should add multiple notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showSuccess('Message 1');
      result.current.showError('Message 2');
      result.current.showWarning('Message 3');
    });

    expect(result.current.notifications).toHaveLength(3);
  });

  it('should remove notification by id', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    let notificationId;
    act(() => {
      notificationId = result.current.showSuccess('Test message');
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.dismiss(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showSuccess('Message 1');
      result.current.showError('Message 2');
      result.current.showWarning('Message 3');
    });

    expect(result.current.notifications).toHaveLength(3);

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should return notification id when adding notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    let notificationId;
    act(() => {
      notificationId = result.current.showSuccess('Test message');
    });

    expect(notificationId).toBeTruthy();
    expect(typeof notificationId).toBe('string');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      renderHook(() => useNotification());
    }).toThrow('useNotification must be used within a NotificationProvider');

    console.error = originalError;
  });
});
