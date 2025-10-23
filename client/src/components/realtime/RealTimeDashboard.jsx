import React, { useState, useEffect } from 'react';
import { useSocket, useInventoryUpdates, useOrderUpdates, useAdminNotifications } from '../../hooks/useSocket';
import { InventoryMonitor, OrderStatusTracker, LiveChatSupport } from './index';

const RealTimeDashboard = ({ isAdmin = false }) => {
  const { isConnected, connectionError, reconnectAttempts, reconnect } = useSocket();
  const [stats, setStats] = useState({
    inventoryUpdates: 0,
    orderUpdates: 0,
    notifications: 0,
    connectedUsers: 0
  });

  // Track real-time events
  useInventoryUpdates(() => {
    setStats(prev => ({ ...prev, inventoryUpdates: prev.inventoryUpdates + 1 }));
  });

  useOrderUpdates(() => {
    setStats(prev => ({ ...prev, orderUpdates: prev.orderUpdates + 1 }));
  });

  useAdminNotifications(() => {
    setStats(prev => ({ ...prev, notifications: prev.notifications + 1 }));
  });

  const getConnectionStatusColor = () => {
    if (isConnected) return 'success';
    if (reconnectAttempts > 0) return 'warning';
    return 'danger';
  };

  const getConnectionStatusText = () => {
    if (isConnected) return 'Connected';
    if (reconnectAttempts > 0) return `Reconnecting... (${reconnectAttempts})`;
    return 'Disconnected';
  };

  const resetStats = () => {
    setStats({
      inventoryUpdates: 0,
      orderUpdates: 0,
      notifications: 0,
      connectedUsers: 0
    });
  };

  return (
    <div className="real-time-dashboard">
      {/* Connection Status Bar */}
      <div className={`alert alert-${getConnectionStatusColor()} d-flex justify-content-between align-items-center mb-3`}>
        <div className="d-flex align-items-center">
          <div 
            className={`status-indicator bg-${getConnectionStatusColor()}`}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              marginRight: '8px',
              animation: isConnected ? 'none' : 'blink 1s infinite'
            }}
          ></div>
          <strong>Real-time Status: {getConnectionStatusText()}</strong>
          {connectionError && (
            <small className="ms-2 text-muted">({connectionError})</small>
          )}
        </div>
        
        {!isConnected && (
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={reconnect}
          >
            Reconnect
          </button>
        )}
      </div>

      {/* Real-time Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="display-6 text-primary">📦</div>
              <h5 className="card-title">{stats.inventoryUpdates}</h5>
              <p className="card-text small text-muted">Inventory Updates</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="display-6 text-success">📋</div>
              <h5 className="card-title">{stats.orderUpdates}</h5>
              <p className="card-text small text-muted">Order Updates</p>
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="display-6 text-warning">🔔</div>
                <h5 className="card-title">{stats.notifications}</h5>
                <p className="card-text small text-muted">Notifications</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="display-6 text-info">👥</div>
              <h5 className="card-title">{isConnected ? '1+' : '0'}</h5>
              <p className="card-text small text-muted">Connected Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Features Demo */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Real-time Features</h5>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={resetStats}
              >
                Reset Stats
              </button>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <h6>📦 Inventory Monitoring</h6>
                  <ul className="list-unstyled small">
                    <li>✅ Real-time stock updates</li>
                    <li>✅ Low stock alerts</li>
                    <li>✅ Multi-user synchronization</li>
                    <li>✅ Update notifications</li>
                  </ul>
                </div>
                
                <div className="col-md-4">
                  <h6>📋 Order Tracking</h6>
                  <ul className="list-unstyled small">
                    <li>✅ Live order status updates</li>
                    <li>✅ Customer notifications</li>
                    <li>✅ Admin order management</li>
                    <li>✅ Status change tracking</li>
                  </ul>
                </div>
                
                <div className="col-md-4">
                  <h6>💬 Live Chat Support</h6>
                  <ul className="list-unstyled small">
                    <li>✅ Real-time messaging</li>
                    <li>✅ Typing indicators</li>
                    <li>✅ Admin/customer chat</li>
                    <li>✅ Message history</li>
                  </ul>
                </div>
              </div>
              
              {isAdmin && (
                <div className="mt-3 p-3 bg-light rounded">
                  <h6>🔧 Admin Features</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <ul className="list-unstyled small">
                        <li>✅ Broadcast notifications</li>
                        <li>✅ User presence tracking</li>
                        <li>✅ System-wide alerts</li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <ul className="list-unstyled small">
                        <li>✅ Real-time analytics</li>
                        <li>✅ Multi-admin coordination</li>
                        <li>✅ Emergency broadcasts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Components */}
      <InventoryMonitor />
      <OrderStatusTracker />
      <LiveChatSupport isAdmin={isAdmin} />

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        
        .status-indicator {
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default RealTimeDashboard;