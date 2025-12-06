import React, { useState, useEffect } from 'react';
import PermissionSelector from './PermissionSelector';
import api from '../../../api/config';
import { useNotification } from '../../../hooks/useNotification';

const RoleForm = ({ role, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    priority: 50,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { showNotification } = useNotification();

  const isEditMode = !!role;
  const isSystemRole = role?.isSystemRole;

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        displayName: role.displayName || '',
        description: role.description || '',
        permissions: role.permissions || [],
        priority: role.priority || 50,
        isActive: role.isActive !== undefined ? role.isActive : true
      });
    }
  }, [role]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (!/^[a-z_]+$/.test(formData.name)) {
      newErrors.name = 'Role name must contain only lowercase letters and underscores';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = 'At least one permission is required';
    }

    if (formData.priority < 1 || formData.priority > 100) {
      newErrors.priority = 'Priority must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        // Update existing role
        const updateData = {
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions,
          priority: formData.priority,
          isActive: formData.isActive
        };

        await api.put(`/api/admin/roles/${role._id}`, updateData);
        showNotification('Role updated successfully', 'success');
      } else {
        // Create new role
        await api.post('/api/admin/roles', formData);
        showNotification('Role created successfully', 'success');
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save role:', error);
      const message = error.response?.data?.message || 'Failed to save role';
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditMode ? 'Edit Role' : 'Create New Role'}
        </h2>

        {isSystemRole && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <i className="fas fa-info-circle"></i>
              <span className="font-medium">System Role</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              System roles have limited editing capabilities. Only certain fields can be modified.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value.toLowerCase())}
              disabled={isEditMode || loading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., content_manager"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Lowercase letters and underscores only
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              disabled={isSystemRole || loading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.displayName ? 'border-red-500' : 'border-gray-300'
              } ${isSystemRole ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., Content Manager"
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={isSystemRole || loading}
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            } ${isSystemRole ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder="Describe the role's responsibilities and access level"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => handleChange('priority', parseInt(e.target.value))}
              disabled={isSystemRole || loading}
              min="1"
              max="100"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.priority ? 'border-red-500' : 'border-gray-300'
              } ${isSystemRole ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Higher priority = more privileged (1-100)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <PermissionSelector
          selectedPermissions={formData.permissions}
          onChange={(permissions) => handleChange('permissions', permissions)}
          disabled={isSystemRole || loading}
        />
        {errors.permissions && (
          <p className="mt-2 text-sm text-red-600">{errors.permissions}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <i className="fas fa-spinner fa-spin"></i>}
          {isEditMode ? 'Update Role' : 'Create Role'}
        </button>
      </div>
    </form>
  );
};

export default RoleForm;
