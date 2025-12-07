import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
    this.connectionPromise = null;
  }

  async connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const { token } = useAuthStore.getState();
        
        if (!token) {
          reject(new Error('No authentication token available'));
          return;
        }

        this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        });

        this.setupEventHandlers();
        
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          this.isConnected = false;
          this.connectionPromise = null;
          reject(error);
        });

      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      this.isConnected = false;
    });

    // Application events
    this.socket.on('connected', (data) => {
      // Connection established
    });

    this.socket.on('error', (error) => {
      // Socket error occurred
    });

    // Real-time update events
    this.socket.on('inventory-updated', (data) => {
      this.emit('inventory-updated', data);
    });

    this.socket.on('order-updated', (data) => {
      this.emit('order-updated', data);
    });

    this.socket.on('order-status-changed', (data) => {
      this.emit('order-status-changed', data);
    });

    this.socket.on('chat-message', (data) => {
      this.emit('chat-message', data);
    });

    this.socket.on('admin-notification', (data) => {
      this.emit('admin-notification', data);
    });

    // User presence events
    this.socket.on('admin-connected', (data) => {
      this.emit('admin-connected', data);
    });

    this.socket.on('admin-disconnected', (data) => {
      this.emit('admin-disconnected', data);
    });

    this.socket.on('user-joined-room', (data) => {
      this.emit('user-joined-room', data);
    });

    this.socket.on('user-left-room', (data) => {
      this.emit('user-left-room', data);
    });

    // Typing indicators
    this.socket.on('user-typing', (data) => {
      this.emit('user-typing', data);
    });

    this.socket.on('user-stopped-typing', (data) => {
      this.emit('user-stopped-typing', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }
  }

  // Event emission methods
  updateInventory(productId, newStock, previousStock) {
    if (!this.isConnected) return;
    
    this.socket.emit('inventory-update', {
      productId,
      newStock,
      previousStock,
      timestamp: new Date()
    });
  }

  updateOrderStatus(orderId, status, customerId, message) {
    if (!this.isConnected) return;
    
    this.socket.emit('order-update', {
      orderId,
      status,
      customerId,
      message,
      statusChange: true,
      timestamp: new Date()
    });
  }

  sendChatMessage(message, roomId = null, targetUserId = null) {
    if (!this.isConnected) return;
    
    this.socket.emit('chat-message', {
      message,
      roomId,
      targetUserId,
      timestamp: new Date()
    });
  }

  sendAdminNotification(type, title, message, priority = 'normal') {
    if (!this.isConnected) return;
    
    this.socket.emit('admin-notification', {
      type,
      title,
      message,
      priority,
      timestamp: new Date()
    });
  }

  joinRoom(roomId) {
    if (!this.isConnected) return;
    
    this.socket.emit('join-room', roomId);
  }

  leaveRoom(roomId) {
    if (!this.isConnected) return;
    
    this.socket.emit('leave-room', roomId);
  }

  startTyping(roomId) {
    if (!this.isConnected) return;
    
    this.socket.emit('typing-start', { roomId });
  }

  stopTyping(roomId) {
    if (!this.isConnected) return;
    
    this.socket.emit('typing-stop', { roomId });
  }

  updateActivity() {
    if (!this.isConnected) return;
    
    this.socket.emit('user-activity');
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Event listener error
        }
      });
    }
  }

  // Utility methods
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null
    };
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;