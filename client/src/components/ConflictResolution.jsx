import React, { useState } from 'react';
import { useConflictResolution } from '../hooks/useDataSync.js';

/**
 * Conflict Resolution Component
 * Displays and handles data synchronization conflicts
 */
export const ConflictResolution = ({ dataKey, onResolved }) => {
  const { conflicts, resolveConflict, dismissConflict } = useConflictResolution(dataKey);
  const [resolvingConflicts, setResolvingConflicts] = useState(new Set());

  if (conflicts.length === 0) {
    return null;
  }

  const handleResolveConflict = async (conflictId, strategy, mergedData = null) => {
    setResolvingConflicts(prev => new Set([...prev, conflictId]));

    try {
      await resolveConflict(conflictId, {
        strategy,
        mergedData
      });

      if (onResolved) {
        onResolved(conflictId, strategy);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      alert('Failed to resolve conflict. Please try again.');
    } finally {
      setResolvingConflicts(prev => {
        const newSet = new Set(prev);
        newSet.delete(conflictId);
        return newSet;
      });
    }
  };

  return (
    <div className="conflict-resolution-overlay">
      <div className="conflict-resolution-modal">
        <h3>Data Synchronization Conflicts</h3>
        <p>
          Some of your changes conflict with updates from the server. 
          Please choose how to resolve each conflict:
        </p>

        {conflicts.map(conflict => (
          <ConflictItem
            key={conflict.id}
            conflict={conflict}
            isResolving={resolvingConflicts.has(conflict.id)}
            onResolve={handleResolveConflict}
            onDismiss={dismissConflict}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual Conflict Item Component
 */
const ConflictItem = ({ conflict, isResolving, onResolve, onDismiss }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [mergeData, setMergeData] = useState('');

  const localData = conflict.operation.optimisticData;
  const serverData = conflict.serverData;

  const handleMerge = () => {
    try {
      const merged = JSON.parse(mergeData);
      onResolve(conflict.id, 'merge', merged);
    } catch (error) {
      alert('Invalid JSON format for merged data');
    }
  };

  return (
    <div className="conflict-item">
      <div className="conflict-header">
        <h4>Conflict in {conflict.key}</h4>
        <span className="conflict-timestamp">
          {new Date(conflict.timestamp).toLocaleString()}
        </span>
      </div>

      <div className="conflict-summary">
        <p>Your changes conflict with server updates.</p>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="toggle-details-btn"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showDetails && (
        <div className="conflict-details">
          <div className="data-comparison">
            <div className="local-data">
              <h5>Your Changes:</h5>
              <pre>{JSON.stringify(localData, null, 2)}</pre>
            </div>
            <div className="server-data">
              <h5>Server Data:</h5>
              <pre>{JSON.stringify(serverData, null, 2)}</pre>
            </div>
          </div>

          <div className="merge-section">
            <h5>Manual Merge (Optional):</h5>
            <textarea
              value={mergeData}
              onChange={(e) => setMergeData(e.target.value)}
              placeholder="Enter merged JSON data..."
              rows={6}
              className="merge-textarea"
            />
          </div>
        </div>
      )}

      <div className="conflict-actions">
        <button
          onClick={() => onResolve(conflict.id, 'use_server')}
          disabled={isResolving}
          className="btn btn-secondary"
        >
          Use Server Version
        </button>
        
        <button
          onClick={() => onResolve(conflict.id, 'use_local')}
          disabled={isResolving}
          className="btn btn-primary"
        >
          Keep My Changes
        </button>

        {mergeData && (
          <button
            onClick={handleMerge}
            disabled={isResolving}
            className="btn btn-success"
          >
            Use Merged Data
          </button>
        )}

        <button
          onClick={() => onDismiss(conflict.id)}
          disabled={isResolving}
          className="btn btn-outline"
        >
          Dismiss
        </button>
      </div>

      {isResolving && (
        <div className="resolving-indicator">
          Resolving conflict...
        </div>
      )}
    </div>
  );
};

/**
 * Sync Status Indicator Component
 */
export const SyncStatusIndicator = ({ dataKey }) => {
  const { syncStatus } = useDataSync(dataKey);

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'red';
    if (syncStatus.isPending) return 'yellow';
    if (syncStatus.error) return 'orange';
    return 'green';
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.isPending) return 'Syncing...';
    if (syncStatus.error) return 'Sync Error';
    return 'Synced';
  };

  return (
    <div className={`sync-status sync-status-${getStatusColor()}`}>
      <div className="sync-indicator"></div>
      <span className="sync-text">{getStatusText()}</span>
      {syncStatus.lastSync && (
        <span className="last-sync">
          Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

/**
 * Offline Queue Indicator Component
 */
export const OfflineQueueIndicator = () => {
  const [queueStatus, setQueueStatus] = useState({ count: 0, processing: false });

  React.useEffect(() => {
    const handleSyncEvent = (event) => {
      if (event.event === 'sync_started') {
        setQueueStatus(prev => ({ ...prev, processing: true }));
      } else if (event.event === 'sync_completed') {
        setQueueStatus({ count: event.data.remainingCount, processing: false });
      } else if (event.event === 'queued') {
        setQueueStatus(prev => ({ ...prev, count: prev.count + 1 }));
      }
    };

    const unsubscribe = dataSyncManager.addSyncListener(handleSyncEvent);
    return unsubscribe;
  }, []);

  if (queueStatus.count === 0 && !queueStatus.processing) {
    return null;
  }

  return (
    <div className="offline-queue-indicator">
      <div className="queue-icon">📤</div>
      <div className="queue-info">
        {queueStatus.processing ? (
          <span>Syncing changes...</span>
        ) : (
          <span>{queueStatus.count} changes queued</span>
        )}
      </div>
    </div>
  );
};