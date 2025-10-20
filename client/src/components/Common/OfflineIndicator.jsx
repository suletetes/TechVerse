import React, { useState } from 'react';
import { useOffline } from '../../context/OfflineContext.jsx';
import { useNetworkStatus } from '../../hooks/useNetworkStatus.js';

const OfflineIndicator = ({ 
  position = 'top-right', 
  showDetails = false,
  className = '' 
}) => {
  const { isOffline, offlineQueue, syncInProgress, lastSyncTime, connectionQuality } = useOffline();
  const { isOnline, effectiveType, downlink } = useNetworkStatus();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isOffline && connectionQuality !== 'poor') return null;

  const positionClasses = {
    'top-left': 'position-fixed top-0 start-0 m-3',
    'top-right': 'position-fixed top-0 end-0 m-3',
    'bottom-left': 'position-fixed bottom-0 start-0 m-3',
    'bottom-right': 'position-fixed bottom-0 end-0 m-3'
  };

  const getStatusColor = () => {
    if (isOffline) return 'danger';
    if (connectionQuality === 'poor') return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (syncInProgress) {
      return (
        <div className="spinner-border spinner-border-sm text-light" role="status">
          <span className="visually-hidden">Syncing...</span>
        </div>
      );
    }

    if (isOffline) {
      return (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.706 3.294A12.545 12.545 0 0 0 8 3C5.259 3 2.723 3.681.663 4.853.387 4.984.11 5.776.8 6.4l.556-.832A11.593 11.593 0 0 1 8 4.414c2.556 0 4.96.664 6.644 1.154.208-.793.167-1.58-.938-1.274z"/>
          <path d="M13 7.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1 0-1h9a.5.5 0 0 1 .5.5zM13 9.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1 0-1h9a.5.5 0 0 1 .5.5z"/>
          <path fillRule="evenodd" d="M4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0z"/>
        </svg>
      );
    }

    return (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </svg>
    );
  };

  const getStatusText = () => {
    if (syncInProgress) return 'Syncing...';
    if (isOffline) return 'Offline';
    if (connectionQuality === 'poor') return 'Poor Connection';
    return 'Online';
  };

  return (
    <div className={`${positionClasses[position]} ${className}`} style={{ zIndex: 1040 }}>
      <div 
        className={`alert alert-${getStatusColor()} d-flex align-items-center py-2 px-3 mb-0 shadow-sm`}
        role="alert"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="me-2">{getStatusIcon()}</span>
        <span className="small fw-bold">{getStatusText()}</span>
        
        {offlineQueue.length > 0 && (
          <span className="badge bg-light text-dark ms-2 small">
            {offlineQueue.length}
          </span>
        )}

        {showDetails && (
          <button 
            className="btn btn-sm btn-link p-0 ms-2 text-decoration-none"
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Tooltip with detailed information */}
      {showTooltip && (
        <div 
          className="position-absolute bg-dark text-white p-3 rounded shadow"
          style={{ 
            top: position.includes('top') ? '100%' : 'auto',
            bottom: position.includes('bottom') ? '100%' : 'auto',
            left: position.includes('left') ? '0' : 'auto',
            right: position.includes('right') ? '0' : 'auto',
            minWidth: '250px',
            zIndex: 1050
          }}
        >
          <div className="small">
            <div className="mb-2">
              <strong>Connection Status</strong>
            </div>
            
            <div className="mb-1">
              Status: <span className={`text-${getStatusColor()}`}>{getStatusText()}</span>
            </div>
            
            {!isOffline && (
              <>
                <div className="mb-1">
                  Type: {effectiveType || 'Unknown'}
                </div>
                {downlink && (
                  <div className="mb-1">
                    Speed: {downlink} Mbps
                  </div>
                )}
              </>
            )}
            
            {offlineQueue.length > 0 && (
              <div className="mb-1">
                Queued: {offlineQueue.length} operations
              </div>
            )}
            
            {lastSyncTime && (
              <div className="mb-1">
                Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Offline Banner Component
const OfflineBanner = ({ 
  showRetry = true, 
  onRetry = null,
  className = '' 
}) => {
  const { isOffline, syncOfflineQueue, offlineQueue, syncInProgress } = useOffline();

  if (!isOffline) return null;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      syncOfflineQueue();
    }
  };

  return (
    <div className={`alert alert-warning d-flex align-items-center justify-content-between mb-0 ${className}`}>
      <div className="d-flex align-items-center">
        <svg width="20" height="20" className="me-2" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.706 3.294A12.545 12.545 0 0 0 8 3C5.259 3 2.723 3.681.663 4.853.387 4.984.11 5.776.8 6.4l.556-.832A11.593 11.593 0 0 1 8 4.414c2.556 0 4.96.664 6.644 1.154.208-.793.167-1.58-.938-1.274z"/>
          <path d="M13 7.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1 0-1h9a.5.5 0 0 1 .5.5zM13 9.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1 0-1h9a.5.5 0 0 1 .5.5z"/>
        </svg>
        <div>
          <strong>You're offline</strong>
          <div className="small text-muted">
            Some features may be limited. 
            {offlineQueue.length > 0 && ` ${offlineQueue.length} operations queued for sync.`}
          </div>
        </div>
      </div>

      {showRetry && (
        <button 
          className="btn btn-sm btn-outline-warning"
          onClick={handleRetry}
          disabled={syncInProgress}
        >
          {syncInProgress ? (
            <>
              <div className="spinner-border spinner-border-sm me-1" role="status">
                <span className="visually-hidden">Syncing...</span>
              </div>
              Syncing...
            </>
          ) : (
            'Retry'
          )}
        </button>
      )}
    </div>
  );
};

// Connection Quality Indicator
const ConnectionQualityIndicator = ({ showLabel = false }) => {
  const { connectionQuality } = useOffline();
  const { isOnline } = useNetworkStatus();

  if (!isOnline) return null;

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'poor': return 'warning';
      default: return 'secondary';
    }
  };

  const getQualityBars = () => {
    const bars = [];
    const maxBars = 4;
    let activeBars = 0;

    switch (connectionQuality) {
      case 'excellent': activeBars = 4; break;
      case 'good': activeBars = 3; break;
      case 'poor': activeBars = 1; break;
      default: activeBars = 2; break;
    }

    for (let i = 0; i < maxBars; i++) {
      bars.push(
        <div
          key={i}
          className={`bg-${i < activeBars ? getQualityColor() : 'light'}`}
          style={{
            width: '3px',
            height: `${(i + 1) * 3}px`,
            marginRight: '1px'
          }}
        />
      );
    }

    return bars;
  };

  return (
    <div className="d-flex align-items-center">
      <div className="d-flex align-items-end me-1">
        {getQualityBars()}
      </div>
      {showLabel && (
        <span className={`small text-${getQualityColor()}`}>
          {connectionQuality}
        </span>
      )}
    </div>
  );
};

export { OfflineIndicator, OfflineBanner, ConnectionQualityIndicator };
export default OfflineIndicator;