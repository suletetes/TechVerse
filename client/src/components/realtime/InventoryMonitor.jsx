import React, { useState, useEffect } from 'react';
import { useInventoryUpdates } from '../../hooks/useSocket';
import { toast } from 'react-hot-toast';

const InventoryMonitor = ({ onInventoryChange }) => {
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useInventoryUpdates((update) => {
    // Add to recent updates
    setRecentUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
    
    // Show toast notification
    const stockChange = update.newStock - update.previousStock;
    const changeText = stockChange > 0 ? `+${stockChange}` : `${stockChange}`;
    
    toast.success(
      `Inventory Updated: Product ${update.productId} (${changeText})`,
      {
        duration: 4000,
        position: 'top-right',
        icon: '📦'
      }
    );

    // Notify parent component
    onInventoryChange?.(update);
  });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStockChangeColor = (current, previous) => {
    if (current > previous) return 'text-success';
    if (current < previous) return 'text-danger';
    return 'text-muted';
  };

  const getStockChangeIcon = (current, previous) => {
    if (current > previous) return '📈';
    if (current < previous) return '📉';
    return '➡️';
  };

  if (!isVisible && recentUpdates.length === 0) {
    return null;
  }

  return (
    <div className="inventory-monitor">
      {/* Toggle Button */}
      <button
        className={`btn btn-outline-primary btn-sm position-fixed ${recentUpdates.length > 0 ? 'pulse' : ''}`}
        style={{ 
          top: '20px', 
          right: '20px', 
          zIndex: 1050,
          borderRadius: '50%',
          width: '50px',
          height: '50px'
        }}
        onClick={() => setIsVisible(!isVisible)}
        title="Inventory Updates"
      >
        📦
        {recentUpdates.length > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {recentUpdates.length}
          </span>
        )}
      </button>

      {/* Updates Panel */}
      {isVisible && (
        <div 
          className="card position-fixed shadow-lg"
          style={{ 
            top: '80px', 
            right: '20px', 
            width: '350px', 
            maxHeight: '400px',
            zIndex: 1040
          }}
        >
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">📦 Inventory Updates</h6>
            <button
              className="btn-close btn-sm"
              onClick={() => setIsVisible(false)}
            ></button>
          </div>
          
          <div className="card-body p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {recentUpdates.length === 0 ? (
              <div className="text-center p-4 text-muted">
                <div className="mb-2">📦</div>
                <div>No recent updates</div>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {recentUpdates.map((update, index) => (
                  <div key={index} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-semibold">Product {update.productId}</div>
                        <div className="small text-muted">
                          Updated by {update.updatedBy}
                        </div>
                        <div className={`small ${getStockChangeColor(update.newStock, update.previousStock)}`}>
                          {getStockChangeIcon(update.newStock, update.previousStock)}
                          {update.previousStock} → {update.newStock}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="small text-muted">
                          {formatTime(update.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {recentUpdates.length > 0 && (
            <div className="card-footer text-center">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setRecentUpdates([])}
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
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default InventoryMonitor;