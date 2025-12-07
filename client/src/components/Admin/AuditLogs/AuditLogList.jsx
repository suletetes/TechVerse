import React, { useState, useEffect } from 'react';
import api from '../../../api/config';
import { useNotification } from '../../../hooks/useNotification';

const AuditLogList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
    limit: 100
  });
  const [stats, setStats] = useState(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.limit) params.limit = filters.limit;

      const response = await api.get('/api/admin/roles/audit/logs', { params });
      
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      showNotification('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/api/admin/roles/audit/stats', { params });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/api/admin/roles/audit/export', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showNotification('Audit logs exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      showNotification('Failed to export audit logs', 'error');
    }
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('created')) return 'bg-green-100 text-green-800';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-800';
    if (action.includes('deleted')) return 'bg-red-100 text-red-800';
    if (action.includes('unauthorized')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Total Events</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Unauthorized Attempts</div>
            <div className="text-3xl font-bold text-red-600">{stats.unauthorizedAttempts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Most Common Action</div>
            <div className="text-lg font-bold text-gray-900">
              {Object.entries(stats.byAction || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="role_created">Role Created</option>
              <option value="role_updated">Role Updated</option>
              <option value="role_deleted">Role Deleted</option>
              <option value="role_assigned">Role Assigned</option>
              <option value="role_revoked">Role Revoked</option>
              <option value="unauthorized_access">Unauthorized Access</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ action: '', startDate: '', endDate: '', limit: 100 })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getActionBadgeColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.performedBy ? (
                      <div>
                        <div className="font-medium">
                          {log.performedBy.firstName} {log.performedBy.lastName}
                        </div>
                        <div className="text-gray-500">{log.performedBy.email}</div>
                      </div>
                    ) : (
                      'System'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.targetUser && (
                      <div>
                        <div className="font-medium">
                          {log.targetUser.firstName} {log.targetUser.lastName}
                        </div>
                        <div className="text-gray-500">{log.targetUser.email}</div>
                      </div>
                    )}
                    {log.targetRole && (
                      <div className="font-medium">{log.targetRole.displayName}</div>
                    )}
                    {!log.targetUser && !log.targetRole && '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.metadata?.ip || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.metadata?.reason || log.metadata?.endpoint || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogList;
