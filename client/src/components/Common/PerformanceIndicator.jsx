import React, { useState } from 'react';
import { usePerformanceContext } from '../../context/PerformanceContext.jsx';
import PerformanceDashboard from './PerformanceDashboard.jsx';

const PerformanceIndicator = ({ 
  position = 'bottom-right',
  showAlerts = true,
  showHealthScore = true,
  compact = false 
}) => {
  const [showDashboard, setShowDashboard] = useState(false);
  const { 
    isMonitoring, 
    alerts, 
    getPerformanceSummary,
    formatBytes,
    formatDuration 
  } = usePerformanceContext();

  if (!isMonitoring) return null;

  const summary = getPerformanceSummary();
  const hasAlerts = alerts.length > 0;
  const recentAlerts = alerts.slice(0, 3);

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-40';
    switch (position) {
      case 'top-left': return `${baseClasses} top-4 left-4`;
      case 'top-right': return `${baseClasses} top-4 right-4`;
      case 'bottom-left': return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right': return `${baseClasses} bottom-4 right-4`;
      default: return `${baseClasses} bottom-4 right-4`;
    }
  };

  if (compact) {
    return (
      <>
        <div className={getPositionClasses()}>
          <button
            onClick={() => setShowDashboard(true)}
            className={`
              relative p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110
              ${summary ? getHealthColor(summary.healthScore) : 'text-gray-600 bg-gray-100'}
              ${hasAlerts ? 'animate-pulse' : ''}
            `}
            title={`Performance Health: ${summary?.healthScore || 0}/100`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            
            {hasAlerts && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>
        </div>

        {showDashboard && (
          <PerformanceDashboard
            isVisible={showDashboard}
            onClose={() => setShowDashboard(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={getPositionClasses()}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Performance</h3>
            <button
              onClick={() => setShowDashboard(true)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Details
            </button>
          </div>

          {/* Health Score */}
          {showHealthScore && summary && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Health Score</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${getHealthColor(summary.healthScore)}`}>
                  {summary.healthScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    summary.healthScore >= 80 ? 'bg-green-500' :
                    summary.healthScore >= 60 ? 'bg-yellow-500' :
                    summary.healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${summary.healthScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {summary && (
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div>
                <span className="text-gray-600">API Calls:</span>
                <span className="ml-1 font-medium">{summary.totalApiCalls}</span>
              </div>
              <div>
                <span className="text-gray-600">Avg Response:</span>
                <span className="ml-1 font-medium">{formatDuration(summary.averageApiResponse)}</span>
              </div>
              <div>
                <span className="text-gray-600">Memory:</span>
                <span className="ml-1 font-medium">{formatBytes(summary.memoryUsage)}</span>
              </div>
              <div>
                <span className="text-gray-600">Issues:</span>
                <span className="ml-1 font-medium">{summary.activeBottlenecks}</span>
              </div>
            </div>
          )}

          {/* Alerts */}
          {showAlerts && hasAlerts && (
            <div className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-900">Recent Alerts</span>
                <span className="text-xs text-red-600">{alerts.length}</span>
              </div>
              <div className="space-y-1">
                {recentAlerts.map((alert, index) => (
                  <div key={index} className="text-xs text-gray-600 truncate">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      alert.data.severity === 'high' ? 'bg-red-500' :
                      alert.data.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    {alert.type.replace(/_/g, ' ')}
                  </div>
                ))}
                {alerts.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{alerts.length - 3} more alerts
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDashboard && (
        <PerformanceDashboard
          isVisible={showDashboard}
          onClose={() => setShowDashboard(false)}
        />
      )}
    </>
  );
};

export default PerformanceIndicator;