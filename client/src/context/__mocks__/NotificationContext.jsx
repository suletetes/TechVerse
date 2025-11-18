import { vi } from 'vitest';

export const useNotification = vi.fn(() => ({
  notifications: [],
  addNotification: vi.fn(),
  removeNotification: vi.fn(),
  clearNotifications: vi.fn()
}));

export const NotificationProvider = ({ children }) => children;