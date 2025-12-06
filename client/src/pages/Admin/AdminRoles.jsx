/**
 * Admin Roles Management Page
 * Full CRUD for roles with permission management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tokenManager } from '../../utils/tokenManager';

const API_HOST = 'http://localhost:5000';

// Default permissions list for the permission selector
const ALL_PERMISSIONS = [
  // Products
  { key: 'products.view', label: 'View Products', category: 'Products' },
  { key: 'products.create', label: 'Create Products', category: 'Products' },
  { key: 'products.update', label: 'Update Products', category: 'Products' },
  { key: 'products.delete', label: 'Delete Products', category: 'Products' },
  { key: 'products.publish', label: 'Publish Products', category: 'Products' },
  // Orders
  { key: 'orders.view', label: 'View Orders', category: 'Orders' },
  { key: 'orders.update', label: 'Update Orders', category: 'Orders' },
  { key: 'orders.cancel', label: 'Cancel Orders', category: 'Orders' },
  { key: 'orders.refund', label: 'Refund Orders', category: 'Orders' },
  // Users
  { key: 'users.view', label: 'View Users', category: 'Users' },
  { key: 'users.create', label: 'Create Users', category: 'Users' },
  { key: 'users.update', label: 'Update Users', category: 'Users' },
  { key: 'users.delete', label: 'Delete Users', category: 'Users' },
  { key: 'users.assign_role', label: 'Assign Roles', category: 'Users' },
  // Content
  { key: 'content.view', label: 'View Content', category: 'Content' },
  { key: 'content.create', label: 'Create Content', category: 'Content' },
  { key: 'content.update', label: 'Update Content', category: 'Content' },
  { key: 'content.delete', label: 'Delete Content', category: 'Content' },
  { key: 'content.moderate', label: 'Moderate Content', category: 'Content' },
  // Reviews
  { key: 'reviews.view', label: 'View Reviews', category: 'Reviews' },
  { key: 'reviews.moderate', label: 'Moderate Reviews', category: 'Reviews' },
  { key: 'reviews.delete', label: 'Delete Reviews', category: 'Reviews' },
  // Inventory
  { key: 'inventory.view', label: 'View Inventory', category: 'Inventory' },
  { key: 'inventory.update', label: 'Update Inventory', category: 'Inventory' },
  { key: 'inventory.adjust', label: 'Adjust Inventory', category: 'Inventory' },
  // Marketing
  { key: 'marketing.view', label: 'View Marketing', category: 'Marketing' },
  { key: 'marketing.create', label: 'Create Campaigns', category: 'Marketing' },
  { key: 'marketing.send', label: 'Send Campaigns', category: 'Marketing' },
  // Analytics
  { key: 'analytics.view', label: 'View Analytics', category: 'Analytics' },
  { key: 'analytics.export', label: 'Export Analytics', category: 'Analytics' },
  // Settings
  { key: 'settings.view', label: 'View Settings', category: 'Settings' },
  { key: 'settings.update', label: 'Update Settings', category: 'Settings' },
  // Roles
  { key: 'roles.view', label: 'View Roles', category: 'Roles' },
  { key: 'roles.create', label: 'Create Roles', category: 'Roles' },
  { key: 'roles.update', label: 'Update Roles', category: 'Roles' },
  { key: 'roles.delete', label: 'Delete Roles', category: 'Roles' },
  // Audit
  { key: 'audit.view', label: 'View Audit Logs', category: 'Audit' },
  { key: 'audit.export', label: 'Export Audit Logs', category: 'Audit' },
];

const AdminRoles = () => {
  const { user, isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    priority: 1,
    isActive: true
  });

  const getAuthHeaders = useCallback(() => {
    const token = tokenManager.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_HOST}/api/admin/roles`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setRoles(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch roles');
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle permission toggle
  const handlePermissionToggle = (permission) => {
    setFormData(prev => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
  };

  // Select all permissions in a category
  const handleSelectCategory = (category, select) => {
    const categoryPermissions = ALL_PERMISSIONS
      .filter(p => p.category === category)
      .map(p => p.key);
    
    setFormData(prev => {
      let permissions;
      if (select) {
        permissions = [...new Set([...prev.permissions, ...categoryPermissions])];
      } else {
        permissions = prev.permissions.filter(p => !categoryPermissions.includes(p));
      }
      return { ...prev, permissions };
    });
  };

  // Start creating new role
  const handleCreate = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: [],
      priority: 1,
      isActive: true
    });
    setSelectedRole(null);
    setIsCreating(true);
    setIsEditing(false);
  };

  // Start editing role
  const handleEdit = (role) => {
    setFormData({
      name: role.name,
      displayName: role.displayName || role.name,
      description: role.description || '',
      permissions: role.permissions || [],
      priority: role.priority || 1,
      isActive: role.isActive !== false
    });
    setSelectedRole(role);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Cancel editing/creating
  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedRole(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: [],
      priority: 1,
      isActive: true
    });
  };

  // Save role (create or update)
  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        showToast('Role name is required', 'error');
        return;
      }

      const url = isCreating 
        ? `${API_HOST}/api/admin/roles`
        : `${API_HOST}/api/admin/roles/${selectedRole._id}`;
      
      const method = isCreating ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast(isCreating ? 'Role created successfully' : 'Role updated successfully', 'success');
        handleCancel();
        fetchRoles();
      } else {
        throw new Error(data.message || 'Failed to save role');
      }
    } catch (err) {
      console.error('Error saving role:', err);
      showToast(err.message, 'error');
    }
  };

  // Delete role
  const handleDelete = async (role) => {
    if (role.isSystemRole) {
      showToast('Cannot delete system roles', 'error');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete the role "${role.displayName || role.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_HOST}/api/admin/roles/${role._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('Role deleted successfully', 'success');
        fetchRoles();
      } else {
        throw new Error(data.message || 'Failed to delete role');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      showToast(err.message, 'error');
    }
  };

  // Group permissions by category
  const permissionsByCategory = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Toast */}
      {toast && (
        <div className={`alert alert-${toast.type === 'error' ? 'danger' : toast.type} alert-dismissible fade show position-fixed`} 
             style={{ top: '20px', right: '20px', zIndex: 9999 }}>
          {toast.message}
          <button type="button" className="btn-close" onClick={() => setToast(null)}></button>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Role Management</h3>
          <p className="text-muted mb-0">Manage user roles and permissions</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
            <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
          </svg>
          Create Role
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchRoles}>
            Retry
          </button>
        </div>
      )}

      <div className="row">
        {/* Roles List */}
        <div className={isEditing || isCreating ? 'col-md-5' : 'col-12'}>
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Roles ({roles.length})</h5>
            </div>
            <div className="card-body p-0">
              {roles.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No roles found. Create one to get started.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {roles.map(role => (
                    <div key={role._id} 
                         className={`list-group-item d-flex justify-content-between align-items-center ${selectedRole?._id === role._id ? 'active' : ''}`}>
                      <div>
                        <h6 className="mb-1">
                          {role.displayName || role.name}
                          {role.isSystemRole && (
                            <span className="badge bg-secondary ms-2">System</span>
                          )}
                          {role.permissions?.includes('*') && (
                            <span className="badge bg-danger ms-2">Super Admin</span>
                          )}
                        </h6>
                        <small className={selectedRole?._id === role._id ? 'text-light' : 'text-muted'}>
                          {role.description || `${role.permissions?.length || 0} permissions`}
                        </small>
                      </div>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => handleEdit(role)}
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                          </svg>
                        </button>
                        {!role.isSystemRole && (
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(role)}
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit/Create Form */}
        {(isEditing || isCreating) && (
          <div className="col-md-7">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{isCreating ? 'Create New Role' : `Edit: ${selectedRole?.displayName || selectedRole?.name}`}</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
              <div className="card-body">
                {/* Basic Info */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Role Name (slug)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., content_editor"
                      disabled={isEditing && selectedRole?.isSystemRole}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Display Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="e.g., Content Editor"
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Describe what this role can do..."
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Priority</label>
                    <input
                      type="number"
                      className="form-control"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                    />
                    <small className="text-muted">Higher = more authority</small>
                  </div>
                  <div className="col-md-6 d-flex align-items-center">
                    <div className="form-check mt-4">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        id="isActive"
                      />
                      <label className="form-check-label" htmlFor="isActive">
                        Active
                      </label>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="mb-3">
                  <label className="form-label">
                    Permissions ({formData.permissions.length} selected)
                  </label>
                  <div className="border rounded p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {Object.entries(permissionsByCategory).map(([category, perms]) => {
                      const selectedInCategory = perms.filter(p => formData.permissions.includes(p.key)).length;
                      const allSelected = selectedInCategory === perms.length;
                      
                      return (
                        <div key={category} className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>{category}</strong>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleSelectCategory(category, !allSelected)}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <div className="row">
                            {perms.map(perm => (
                              <div key={perm.key} className="col-md-6 col-lg-4">
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={perm.key}
                                    checked={formData.permissions.includes(perm.key)}
                                    onChange={() => handlePermissionToggle(perm.key)}
                                  />
                                  <label className="form-check-label" htmlFor={perm.key}>
                                    {perm.label}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2">
                  <button className="btn btn-primary" onClick={handleSave}>
                    {isCreating ? 'Create Role' : 'Save Changes'}
                  </button>
                  <button className="btn btn-outline-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoles;
