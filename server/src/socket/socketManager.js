import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/enhancedLogger.js';

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.adminUsers = new Set();
    this.rooms = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Socket.io server initialized');
    return this.io;
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.userEmail = decoded.email;

        logger.info(`User ${decoded.email} connected via Socket.io`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      this.setupSocketEvents(socket);
    });
  }

  handleConnection(socket) {
    // Store user connection
    this.connectedUsers.set(socket.userId, {
      socketId: socket.id,
      email: socket.userEmail,
      role: socket.userRole,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Add to admin room if user is admin
    if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
      socket.join('admin-room');
      this.adminUsers.add(socket.userId);

      // Notify other admins
      socket.to('admin-room').emit('admin-connected', {
        userId: socket.userId,
        email: socket.userEmail,
        connectedAt: new Date()
      });
    }

    // Join user-specific room
    socket.join(`user-${socket.userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to real-time updates',
      userId: socket.userId,
      timestamp: new Date()
    });

    // Update user activity
    this.updateUserActivity(socket.userId);

    logger.info(`Socket connected: ${socket.userEmail} (${socket.id})`);
  }

  setupSocketEvents(socket) {
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle user activity updates
    socket.on('user-activity', () => {
      this.updateUserActivity(socket.userId);
    });

    // Handle inventory updates
    socket.on('inventory-update', (data) => {
      this.handleInventoryUpdate(socket, data);
    });

    // Handle order updates
    socket.on('order-update', (data) => {
      this.handleOrderUpdate(socket, data);
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
      this.handleChatMessage(socket, data);
    });

    // Handle admin notifications
    socket.on('admin-notification', (data) => {
      this.handleAdminNotification(socket, data);
    });

    // Handle real-time collaboration
    socket.on('join-room', (roomId) => {
      this.handleJoinRoom(socket, roomId);
    });

    socket.on('leave-room', (roomId) => {
      this.handleLeaveRoom(socket, roomId);
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      socket.to(data.roomId).emit('user-typing', {
        userId: socket.userId,
        email: socket.userEmail,
        timestamp: new Date()
      });
    });

    socket.on('typing-stop', (data) => {
      socket.to(data.roomId).emit('user-stopped-typing', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  }

  handleDisconnection(socket, reason) {
    // Remove from connected users
    this.connectedUsers.delete(socket.userId);
    this.adminUsers.delete(socket.userId);

    // Notify admin room if admin disconnected
    if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
      socket.to('admin-room').emit('admin-disconnected', {
        userId: socket.userId,
        email: socket.userEmail,
        disconnectedAt: new Date(),
        reason
      });
    }

    logger.info(`Socket disconnected: ${socket.userEmail} (${socket.id}) - Reason: ${reason}`);
  }

  handleInventoryUpdate(socket, data) {
    try {
      // Validate admin permission
      if (!this.isAdmin(socket)) {
        socket.emit('error', { message: 'Unauthorized: Admin access required' });
        return;
      }

      // Broadcast inventory update to all connected users
      this.io.emit('inventory-updated', {
        productId: data.productId,
        newStock: data.newStock,
        previousStock: data.previousStock,
        updatedBy: socket.userEmail,
        timestamp: new Date()
      });

      // Log the update
      logger.info(`Inventory updated by ${socket.userEmail}: Product ${data.productId}, Stock: ${data.previousStock} → ${data.newStock}`);
    } catch (error) {
      logger.error('Error handling inventory update:', error);
      socket.emit('error', { message: 'Failed to update inventory' });
    }
  }

  handleOrderUpdate(socket, data) {
    try {
      // Validate admin permission for status changes
      if (data.statusChange && !this.isAdmin(socket)) {
        socket.emit('error', { message: 'Unauthorized: Admin access required' });
        return;
      }

      // Notify customer about order update
      if (data.customerId) {
        this.io.to(`user-${data.customerId}`).emit('order-updated', {
          orderId: data.orderId,
          status: data.status,
          message: data.message,
          timestamp: new Date()
        });
      }

      // Notify all admins about order updates
      this.io.to('admin-room').emit('order-status-changed', {
        orderId: data.orderId,
        status: data.status,
        updatedBy: socket.userEmail,
        timestamp: new Date()
      });

      logger.info(`Order ${data.orderId} updated by ${socket.userEmail}: Status changed to ${data.status}`);
    } catch (error) {
      logger.error('Error handling order update:', error);
      socket.emit('error', { message: 'Failed to update order' });
    }
  }

  handleChatMessage(socket, data) {
    try {
      const message = {
        id: Date.now().toString(),
        userId: socket.userId,
        userEmail: socket.userEmail,
        userRole: socket.userRole,
        message: data.message,
        roomId: data.roomId || 'general',
        timestamp: new Date()
      };

      // Broadcast to room or specific user
      if (data.roomId) {
        socket.to(data.roomId).emit('chat-message', message);
      } else if (data.targetUserId) {
        this.io.to(`user-${data.targetUserId}`).emit('chat-message', message);
      }

      // Store message (in a real app, save to database)
      logger.info(`Chat message from ${socket.userEmail}: ${data.message}`);
    } catch (error) {
      logger.error('Error handling chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  handleAdminNotification(socket, data) {
    try {
      if (!this.isAdmin(socket)) {
        socket.emit('error', { message: 'Unauthorized: Admin access required' });
        return;
      }

      // Broadcast to all admins
      this.io.to('admin-room').emit('admin-notification', {
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'normal',
        sentBy: socket.userEmail,
        timestamp: new Date()
      });

      logger.info(`Admin notification sent by ${socket.userEmail}: ${data.title}`);
    } catch (error) {
      logger.error('Error handling admin notification:', error);
      socket.emit('error', { message: 'Failed to send notification' });
    }
  }

  handleJoinRoom(socket, roomId) {
    socket.join(roomId);

    // Track room membership
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(socket.userId);

    // Notify room members
    socket.to(roomId).emit('user-joined-room', {
      userId: socket.userId,
      email: socket.userEmail,
      roomId,
      timestamp: new Date()
    });

    logger.info(`User ${socket.userEmail} joined room: ${roomId}`);
  }

  handleLeaveRoom(socket, roomId) {
    socket.leave(roomId);

    // Remove from room tracking
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(socket.userId);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }

    // Notify room members
    socket.to(roomId).emit('user-left-room', {
      userId: socket.userId,
      email: socket.userEmail,
      roomId,
      timestamp: new Date()
    });

    logger.info(`User ${socket.userEmail} left room: ${roomId}`);
  }

  // Utility methods
  updateUserActivity(userId) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      user.lastActivity = new Date();
    }
  }

  isAdmin(socket) {
    return socket.userRole === 'admin' || socket.userRole === 'super_admin';
  }

  // Public methods for external use
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  broadcastToAdmins(event, data) {
    this.io.to('admin-room').emit(event, data);
  }

  sendToUser(userId, event, data) {
    this.io.to(`user-${userId}`).emit(event, data);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  getConnectedAdmins() {
    return Array.from(this.connectedUsers.values()).filter(user =>
      this.adminUsers.has(user.socketId)
    );
  }

  getRoomMembers(roomId) {
    return this.rooms.get(roomId) || new Set();
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager;