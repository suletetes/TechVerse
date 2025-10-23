import React, { useState, useEffect } from 'react';
import { useOrderUpdates } from '../../hooks/useSocket';
import { toast } from 'react-hot-toast';

const OrderStatusTracker = ({ onOrderUpdate }) => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useOrderUpdates((update) => {
    // Add to recent updates
    setRecentOrders(prev => {
      const existing = prev.find(order => order.orderId === update.orderId);
      if (existing) {
        // Update existing order
        return prev.map(order => 
          order.orderId === update.orderId 
            ? { ...order, ...update, timestamp: new Date() }
            : order
        );
      } else {
        // Add new order update
        return [update, ...prev.slice(0, 9)]; // Keep last 10 updates
      }
    });

    // Show toast notification
    const statusEmoji = {
      'pending': '⏳',
      'processing': '🔄',
      'shipped': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };

    toast.success(
      `Order ${update.orderId}: ${update.status}`,
      {
        duration: 4000,
        position: 'top-right',
        icon: statusEmoji[update.status?.toLowerCase()] || '📦'
      }
    );

    // Notify parent component
    onOrderUpdate?.(update);
  });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-warning',
      'processing': 'text-info',
      'shipped': 'text-primary',
      'delivered': 'text-success',
      'cancelled': 'text-danger'
    };
    return colors[status?.toLowerCase()] || 'text-muted';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'processing': '🔄',
      'shipped': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };
    return icons[status?.toLowerCase()] || '📦';
  };

  if (!isVisible && recentOrders.length === 0) {
    return null;
  }

  return (
    <div className="order-status-tracker">
      {/* Toggle Button */}
      <button
        className={`btn btn-outline-success btn-sm position-fixed ${recentOrders.length > 0 ? 'pulse' : ''}`}
        style={{ 
          top: '80px', 
          right: '20px', 
          zIndex: 1050,
          borderRadius: '50%',
          width: '50px',
          height: '50px'
        }}
        onClick={() => setIsVisible(!isVisible)}
        title="Order Updates"
      >
        📋
        {recentOrders.length > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {recentOrders.length}
          </span>
        )}
      </button>

      {/* Updates Panel */}
      {isVisible && (
        <div 
          className="card position-fixed shadow-lg"
          style={{ 
            top: '140px', 
            right: '20px', 
            width: '350px', 
            maxHeight: '400px',
            zIndex: 1040
          }}
        >
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">📋 Order Updates</h6>
            <button
              className="btn-close btn-sm"
              onClick={() => setIsVisible(false)}
            ></button>
          </div>
          
          <div className="card-body p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {recentOrders.length === 0 ? (
              <div className="text-center p-4 text-muted">
                <div className="mb-2">📋</div>
                <div>No recent updates</div>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {recentOrders.map((order, index) => (
                  <div key={index} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-semibold">
                          Order {order.orderId}
                        </div>
                        {order.updatedBy && (
                          <div className="small text-muted">
                            Updated by {order.updatedBy}
                          </div>
                        )}
                        <div className={`small ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status}
                        </div>
                        {order.message && (
                          <div className="small text-muted mt-1">
                            {order.message}
                          </div>
                        )}
                      </div>
                      <div className="text-end">
                        <div className="small text-muted">
                          {formatTime(order.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {recentOrders.length > 0 && (
            <div className="card-footer text-center">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setRecentOrders([])}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default OrderStatusTracker;