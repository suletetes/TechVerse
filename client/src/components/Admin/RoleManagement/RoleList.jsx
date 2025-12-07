import React, { useState, useEffect } from 'react';
import api from '../../../api/config';
import { useNotification } from '../../../hooks/useNotification';

const RoleList = ({ onEdit, onDelete, onAssign }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { showNotification } = useNotification();

  useEffect(() => {
    loadRoles();
  }, [filter]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filter === 'active') params.isActive = true;
      if (filter === 'inactive') params.isActive = false;
      if (filter === 'system') params.isSystemRole = true;
      if (filter === 'custom') params.isSystemRole = false;

      const response = await api.get('/api/admin/roles', { params });
      
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      showNotification('Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (priority) => {
    if (priority >= 90) return 'bg-purple-100 text-purple-800';
    if (priority >= 50) return 'bg-blue-100 text-blue-800';
    if (priority >= 20) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Roles</h2>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="system">System Roles</option>
              <option value="custom">Custom Roles</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {role.displayName}
                      </div>
                      <div className="text-sm text-gray-500">{role.name}</div>
                    </div>
                    {role.isSystemRole && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        System
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {role.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(role.priority)}`}>
                    {role.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {role.permissionCount || role.permissions?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {role.metadata?.userCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    role.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(role)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  {!role.isSystemRole && (
                    <button
                      onClick={() => onDelete(role)}
                      className="text-red-600 hover:text-red-900"
                      disabled={role.metadata?.userCount > 0}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No roles found</p>
        </div>
      )}
    </div>
  );
};

export default RoleList;
