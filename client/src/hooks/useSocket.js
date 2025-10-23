import { useEffect, useState, useCallback, useRef } from 'react';
import socketService from '../services/socketService';
import { useAuthStore } from '../stores/authStore';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { isAuthenticated, token } = useAuthStore();
  const connectionAttempted = useRef(false);

  useEffect(() => {
    if (isAuthenticated && token && !connectionAttempted.current) {
      connectionAttempted.current = true;
      
      const connect = async () => {
        try {
          await socketService.connect();
          setIsConnected(true);
          setConnectionError(null);
        } catch (error) {
          setConnectionError(error.message);
          setIsConnected(false);
        }
      };

      connect();
    }

    return () => {
      if (!isAuthenticated) {
        socketService.disconnect();
        setIsConnected(false);
        connectionAttempted.current = false;
      }
    };
  }, [isAuthenticated, token]);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      const status = socketService.getConnectionStatus();
      setIsConnected(status.connected);
      setReconnectAttempts(status.reconnectAttempts);
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  const reconnect = useCallback(async () => {
    try {
      await socketService.connect();
      setConnectionError(null);
    } catch (error) {
      setConnectionError(error.message);
    }
  }, []);

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    reconnect,
    socket: socketService
  };
};

export const useSocketEvent = (event, callback, dependencies = []) => {
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const wrappedCallback = (data) => {
      callbackRef.current(data);
    };

    socketService.on(event, wrappedCallback);

    return () => {
      socketService.off(event, wrappedCallback);
    };
  }, [event, ...dependencies]);
};

export const useInventoryUpdates = (onInventoryUpdate) => {
  useSocketEvent('inventory-updated', onInventoryUpdate);
};

export const useOrderUpdates = (onOrderUpdate) => {
  useSocketEvent('order-updated', onOrderUpdate);
  useSocketEvent('order-status-changed', onOrderUpdate);
};

export const useChatMessages = (onMessage) => {
  useSocketEvent('chat-message', onMessage);
};

export const useAdminNotifications = (onNotification) => {
  useSocketEvent('admin-notification', onNotification);
};

export const useUserPresence = (onUserJoined, onUserLeft) => {
  useSocketEvent('user-joined-room', onUserJoined);
  useSocketEvent('user-left-room', onUserLeft);
  useSocketEvent('admin-connected', onUserJoined);
  useSocketEvent('admin-disconnected', onUserLeft);
};

export const useTypingIndicator = (onTypingStart, onTypingStop) => {
  useSocketEvent('user-typing', onTypingStart);
  useSocketEvent('user-stopped-typing', onTypingStop);
};

export const useRealTimeChat = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(new Map());

  // Join room on mount
  useEffect(() => {
    if (roomId) {
      socketService.joinRoom(roomId);
      return () => socketService.leaveRoom(roomId);
    }
  }, [roomId]);

  // Handle incoming messages
  useChatMessages(useCallback((message) => {
    if (!roomId || message.roomId === roomId) {
      setMessages(prev => [...prev, message]);
    }
  }, [roomId]));

  // Handle typing indicators
  useTypingIndicator(
    useCallback((data) => {
      setTypingUsers(prev => new Set([...prev, data.userId]));
      
      // Clear typing after timeout
      if (typingTimeoutRef.current.has(data.userId)) {
        clearTimeout(typingTimeoutRef.current.get(data.userId));
      }
      
      const timeout = setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        typingTimeoutRef.current.delete(data.userId);
      }, 3000);
      
      typingTimeoutRef.current.set(data.userId, timeout);
    }, []),
    useCallback((data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      
      if (typingTimeoutRef.current.has(data.userId)) {
        clearTimeout(typingTimeoutRef.current.get(data.userId));
        typingTimeoutRef.current.delete(data.userId);
      }
    }, [])
  );

  const sendMessage = useCallback((message) => {
    socketService.sendChatMessage(message, roomId);
  }, [roomId]);

  const startTyping = useCallback(() => {
    socketService.startTyping(roomId);
  }, [roomId]);

  const stopTyping = useCallback(() => {
    socketService.stopTyping(roomId);
  }, [roomId]);

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    startTyping,
    stopTyping
  };
};