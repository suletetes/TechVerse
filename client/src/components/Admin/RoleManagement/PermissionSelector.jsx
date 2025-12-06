import React, { useState, useEffect } from 'react';

const PERMISSION_GROUPS = {
  products: {
    label: 'Products',
    icon: 'fa-box',
    permissions: [
      { key: 'products.view', label: 'View Products', risk: 'low' },
      { key: 'products.create', label: 'Create Products', risk: 'medium' },
      { key: 'products.update', label: 'Update Products', risk: 'medium' },
      { key: 'products.delete', label: 'Delete Products', risk: 'high' },
      { key: 'products.publish', label: 'Publish Products', risk: 'medium' }
    ]
  },
  orders: {
    label: 'Orders',
    icon: 'fa-shopping-cart',
    permissions: [
      { key: 'orders.view', label: 'View Orders', risk: 'low' },
      { key: 'orders.update', label: 'Update Orders', risk: 'medium' },
      { key: 'orders.cancel', label: 'Cancel Orders', risk: 'high' },
      { key: 'orders.refund', label: 'Refund Orders', risk: 'high' }
    ]
  },
  users: {
    label: 'Users',
    icon: 'fa-users',
    permissions: [
      { key: 'users.view', label: 'View Users', risk: 'medium' },
      { key: 'users.create', label: 'Create Users', risk: 'high' },
      { key: 'users.update', label: 'Update Users', risk: 'high' },
      { key: 'users.delete', label: 'Delete Users', risk: 'critical' },
      { key: 'users.assign_role', label: 'Assign Roles', risk: 'critical' }
    ]
  },
  content: {
    label: 'Content',
    icon: 'fa-file-alt',
    permissions: [
      { key: 'content.view', label: 'View Content', risk: 'low' },
      { key: 'content.create', label: 'Create Content', risk: 'low' },
      { key: 'content.update', label: 'Update Content', risk: 'low' },
      { key: 'content.delete', label: 'Delete Content', risk: 'medium' },
      { key: 'content.moderate', label: 'Moderate Content', risk: 'medium' }
    ]
  },
  reviews: {
    label: 'Reviews',
    icon: 'fa-star',
    permissions: [
      { key: 'reviews.view', label: 'View Reviews', risk: 'low' },
      { key: 'reviews.moderate', label: 'Moderate Reviews', risk: 'medium' },
      { key: 'reviews.delete', label: 'Delete Reviews', risk: 'medium' }
    ]
  },
  inventory: {
    label: 'Inventory',
    icon: 'fa-warehouse',
    permissions: [
      { key: 'inventory.view', label: 'View Inventory', risk: 'low' },
      { key: 'inventory.update', label: 'Update Inventory', risk: 'medium' },
      { key: 'inventory.adjust', label: 'Adjust Inventory', risk: 'high' }
    ]
  },
  marketing: {
    label: 'Marketing',
    icon: 'fa-bullhorn',
    permissions: [
      { key: 'marketing.view', label: 'View Campaigns', risk: 'low' },
      { key: 'marketing.create', label: 'Create Campaigns', risk: 'medium' },
      { key: 'marketing.send', label: 'Send Campaigns', risk: 'high' }
    ]
  },
  analytics: {
    label: 'Analytics',
    icon: 'fa-chart-line',
    permissions: [
      { key: 'analytics.view', label: 'View Analytics', risk: 'low' },
      { key: 'analytics.export', label: 'Export Analytics', risk: 'medium' }
    ]
  },
  settings: {
    label: 'Settings',
    icon: 'fa-cog',
    permissions: [
      { key: 'settings.view', label: 'View Settings', risk: 'medium' },
      { key: 'settings.update', label: 'Update Settings', risk: 'critical' }
    ]
  },
  roles: {
    label: 'Roles & Permissions',
    icon: 'fa-user-shield',
    permissions: [
      { key: 'roles.view', label: 'View Roles', risk: 'medium' },
      { key: 'roles.create', label: 'Create Roles', risk: 'critical' },
      { key: 'roles.update', label: 'Update Roles', risk: 'critical' },
      { key: 'roles.delete', label: 'Delete Roles', risk: 'critical' }
    ]
  },
  audit: {
    label: 'Audit Logs',
    icon: 'fa-clipboard-list',
    permissions: [
      { key: 'audit.view', label: 'View Audit Logs', risk: 'medium' },
      { key: 'audit.export', label: 'Export Audit Logs', risk: 'high' }
    ]
  }
};

const PermissionSelector = ({ selectedPermissions = [], onChange, disabled = false }) => {
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    // Expand groups that have selected permissions
    const groupsToExpand = new Set();
    Object.keys(PERMISSION_GROUPS).forEach(groupKey => {
      const hasSelected = PERMISSION_GROUPS[groupKey].permissions.some(
        perm => selectedPermissions.includes(perm.key)
      );
      if (hasSelected) {
        groupsToExpand.add(groupKey);
      }
    });
    setExpandedGroups(groupsToExpand);
  }, []);

  const toggleGroup = (groupKey) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const togglePermission = (permissionKey) => {
    if (disabled) return;

    const newPermissions = selectedPermissions.includes(permissionKey)
      ? selectedPermissions.filter(p => p !== permissionKey)
      : [...selectedPermissions, permissionKey];

    onChange(newPermissions);
  };

  const toggleAllInGroup = (groupKey) => {
    if (disabled) return;

    const groupPermissions = PERMISSION_GROUPS[groupKey].permissions.map(p => p.key);
    const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));

    let newPermissions;
    if (allSelected) {
      // Deselect all in group
      newPermissions = selectedPermissions.filter(p => !groupPermissions.includes(p));
    } else {
      // Select all in group
      const toAdd = groupPermissions.filter(p => !selectedPermissions.includes(p));
      newPermissions = [...selectedPermissions, ...toAdd];
    }

    onChange(newPermissions);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
        <div className="text-sm text-gray-500">
          {selectedPermissions.length} selected
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
          const isExpanded = expandedGroups.has(groupKey);
          const groupPermissions = group.permissions.map(p => p.key);
          const selectedCount = groupPermissions.filter(p => selectedPermissions.includes(p)).length;
          const allSelected = selectedCount === groupPermissions.length;

          return (
            <div key={groupKey} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupKey)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                  </button>
                  <i className={`fas ${group.icon} text-gray-600`}></i>
                  <span className="font-medium text-gray-900">{group.label}</span>
                  {selectedCount > 0 && (
                    <span className="text-sm text-blue-600">
                      ({selectedCount}/{groupPermissions.length})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleAllInGroup(groupKey)}
                  disabled={disabled}
                  className={`text-sm ${
                    disabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-2">
                  {group.permissions.map((permission) => {
                    const isSelected = selectedPermissions.includes(permission.key);

                    return (
                      <label
                        key={permission.key}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
                          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePermission(permission.key)}
                          disabled={disabled}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {permission.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {permission.key}
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${getRiskColor(permission.risk)}`}>
                          {permission.risk}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionSelector;
