import React from "react";
import { usePermissions } from '../../context/PermissionContext';
import './AdminSidebar.css';

const AdminSidebarWithPermissions = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, adminData }) => {
  const { hasPermission, hasAnyPermission } = usePermissions();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      subtitle: 'Overview & Analytics',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
      color: 'primary',
      permission: null // Always visible
    },
    {
      id: 'products',
      label: 'Products',
      subtitle: 'Manage Inventory',
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      color: 'primary',
      permission: 'products.view'
    },
    {
      id: 'add-product',
      label: 'Add Product',
      subtitle: 'Create New Item',
      icon: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
      color: 'success',
      permission: 'products.create'
    },
    {
      id: 'orders',
      label: 'Orders',
      subtitle: 'Manage Orders',
      icon: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
      color: 'primary',
      permission: 'orders.view'
    },
    {
      id: 'users',
      label: 'Users',
      subtitle: 'Manage Users',
      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
      color: 'primary',
      permission: 'users.view'
    },
    {
      id: 'reviews',
      label: 'Reviews',
      subtitle: 'Moderate Reviews',
      icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
      color: 'primary',
      permission: 'reviews.view'
    },
    {
      id: 'roles',
      label: 'Roles & Permissions',
      subtitle: 'Manage Access Control',
      icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
      color: 'warning',
      permission: 'roles.view'
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      subtitle: 'Security & Activity',
      icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      color: 'info',
      permission: 'audit.view'
    },
    {
      id: 'categories',
      label: 'Categories',
      subtitle: 'Manage Categories',
      icon: 'M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z',
      color: 'primary',
      permission: hasAnyPermission(['products.view', 'content.view']) ? null : 'products.view'
    },
    {
      id: 'profile',
      label: 'Profile',
      subtitle: 'Account Settings',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
      color: 'primary',
      permission: null // Always visible
    }
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) return true; // Always show items without permission requirement
    return hasPermission(item.permission);
  });

  const handleMenuClick = (itemId) => {
    setActiveTab(itemId);
    setSidebarOpen(false);
  };

  return (
    <div className={`admin-sidebar-container bg-white h-100 border-end ${sidebarOpen ? 'show' : ''}`}>
      {/* Mobile Close Button */}
      <div className="d-flex justify-content-between align-items-center p-3 d-lg-none border-bottom">
        <div className="d-flex align-items-center">
          <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
            <span className="text-white fw-bold small">{adminData.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <h6 className="mb-0 tc-6533 fw-bold">Admin Menu</h6>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary rounded-circle p-2"
          onClick={() => setSidebarOpen(false)}
          style={{ width: '36px', height: '36px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Admin Profile Section */}
      <div className="p-4 border-bottom d-none d-lg-block">
        <div className="d-flex align-items-center">
          <div className="position-relative me-3">
            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <span className="text-white fw-bold">{adminData.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white" style={{ width: '12px', height: '12px' }}></div>
          </div>
          <div>
            <h6 className="mb-0 tc-6533 fw-bold">{adminData.name}</h6>
            <small className="text-muted">{adminData.role}</small>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="py-3">
        <nav className="nav flex-column">
          {visibleMenuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${
                activeTab === item.id 
                  ? `active bg-${item.color} bg-opacity-10 text-${item.color}` 
                  : 'text-dark'
              }`}
              onClick={() => handleMenuClick(item.id)}
            >
              {activeTab === item.id && (
                <div className={`position-absolute start-0 top-0 bottom-0 bg-${item.color}`} style={{ width: '3px' }}></div>
              )}
              <div className={`rounded-2 p-2 me-3 ${activeTab === item.id ? `bg-${item.color}` : 'bg-light'}`}>
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  className={`flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-muted'}`}
                >
                  <path fill="currentColor" d={item.icon} />
                </svg>
              </div>
              <div>
                <div className="fw-semibold">{item.label}</div>
                <small className="text-muted">{item.subtitle}</small>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Permission Indicator (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-3 border-top">
          <small className="text-muted">
            Visible: {visibleMenuItems.length}/{menuItems.length} items
          </small>
        </div>
      )}
    </div>
  );
};

export default AdminSidebarWithPermissions;
