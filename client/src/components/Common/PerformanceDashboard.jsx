import React, { useState, useEffect } from 'react';
import { useSystemPerformance } from '../../hooks/usePerformance.js';

const PerformanceDashboard = ({ isVisible = false, onClose }) => {
  const {
    performanceData,
    isLoading,
    alerts,
    getApiStats,
    getMemoryStats,
    getWebVitals,
    getBottlenecks,
    clearAlerts
  } = useSystemPerformance();

  const [activeTab, setActiveTab] = useState('overview');

  if (!isVisible) return null;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  const memoryStats = getMemoryStats();
  const webVitals = getWebVitals();
  const apiStats = getApiStats();
  const bottlenecks = getBottlenecks();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Performance Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'api', label: 'API Performance' },
            { id: 'memory', label: 'Memory Usage' },
            { id: 'vitals', label: 'Web Vitals' },
            { id: 'alerts', label: `Alerts (${alerts.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">API Calls</h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {Object.values(apiStats || {}).reduce((sum, stats) => sum + stats.count, 0)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">Memory Usage</h3>
                  <p className="text-2xl font-bold text-green-900">
                    {formatBytes(memoryStats?.current || 0)}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800">Bottlenecks</h3>
                  <p className="text-2xl font-bold text-yellow-900">
                    {bottlenecks.length}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800">Alerts</h3>
                  <p className="text-2xl font-bold text-purple-900">
                    {alerts.length}
                  </p>
                </div>
              </div>

              {/* Web Vitals Summary */}
              {webVitals && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Core Web Vitals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {webVitals.lcp && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Largest Contentful Paint</p>
                        <p className={`text-xl font-bold ${getRatingColor(webVitals.lcp.rating)}`}>
                          {formatDuration(webVitals.lcp.value)}
                        </p>
                        <p className="text-xs text-gray-500">{webVitals.lcp.rating}</p>
                      </div>
                    )}
                    {webVitals.fid && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">First Input Delay</p>
                        <p className={`text-xl font-bold ${getRatingColor(webVitals.fid.rating)}`}>
                          {formatDuration(webVitals.fid.value)}
                        </p>
                        <p className="text-xs text-gray-500">{webVitals.fid.rating}</p>
                      </div>
                    )}
                    {webVitals.cls && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Cumulative Layout Shift</p>
                        <p className={`text-xl font-bold ${getRatingColor(webVitals.cls.rating)}`}>
                          {webVitals.cls.value.toFixed(3)}
                        </p>
                        <p className="text-xs text-gray-500">{webVitals.cls.rating}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">API Performance</h3>
              {apiStats && Object.keys(apiStats).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Endpoint
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Calls
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Response
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          P95
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Max
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(apiStats).map(([endpoint, stats]) => (
                        <tr key={endpoint}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {endpoint}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stats.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDuration(stats.average)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDuration(stats.p95)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDuration(stats.max)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No API performance data available</p>
              )}
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Memory Usage</h3>
              {memoryStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900">Current Usage</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatBytes(memoryStats.current)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900">Peak Usage</h4>
                      <p className="text-2xl font-bold text-red-600">
                        {formatBytes(memoryStats.peak)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900">Average Usage</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatBytes(memoryStats.average)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900">Trend</h4>
                      <p className={`text-2xl font-bold ${
                        memoryStats.trend === 'increasing' ? 'text-red-600' :
                        memoryStats.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {memoryStats.trend}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Memory monitoring not available</p>
              )}
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Core Web Vitals</h3>
              {webVitals && Object.keys(webVitals).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(webVitals).map(([metric, data]) => (
                    <div key={metric} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">
                          {metric.toUpperCase()}
                        </h4>
                        <span className={`px-2 py-1 rounded text-sm ${getRatingColor(data.rating)}`}>
                          {data.rating}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {metric === 'cls' ? data.value.toFixed(3) : formatDuration(data.value)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Recorded {new Date(data.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No Web Vitals data available yet</p>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Performance Alerts</h3>
                {alerts.length > 0 && (
                  <button
                    onClick={clearAlerts}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{alert.type}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.data.endpoint && `Endpoint: ${alert.data.endpoint}`}
                            {alert.data.duration && ` - Duration: ${formatDuration(alert.data.duration)}`}
                            {alert.data.used && ` - Memory: ${formatBytes(alert.data.used)}`}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(alert.data.severity)}`}>
                          {alert.data.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No performance alerts</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;