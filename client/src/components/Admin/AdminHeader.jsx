import React from 'react';

const AdminHeader = ({ activeTab, adminData, sidebarOpen, setSidebarOpen }) => (
    <div className="bg-white border-bottom px-4 py-3">
        <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
                <button
                    className="btn btn-outline-primary btn-sm me-3 d-lg-none"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
                    </svg>
                </button>
                <div>
                    <h1 className="h4 mb-0 tc-6533 fw-bold">
                        {activeTab === 'dashboard' && 'Admin Dashboard'}
                        {activeTab === 'products' && 'Product Management'}
                        {activeTab === 'add-product' && 'Add New Product'}
                        {activeTab === 'orders' && 'Order Management'}
                        {activeTab === 'users' && 'User Management'}
                        {activeTab === 'activity' && 'Activity Log'}
                        {activeTab === 'security' && 'Security & Sessions'}
                        {activeTab === 'settings' && 'Admin Settings'}
                    </h1>
                    <p className="mb-0 text-muted small">
                        {activeTab === 'dashboard' && `Welcome back, ${adminData.name}`}
                        {activeTab === 'products' && 'Manage your product inventory'}
                        {activeTab === 'add-product' && 'Create a new product listing'}
                        {activeTab === 'orders' && 'Process and track customer orders'}
                        {activeTab === 'users' && 'Manage customer accounts'}
                        {activeTab === 'activity' && 'View system activities and changes'}
                        {activeTab === 'security' && 'Monitor security events and sessions'}
                        {activeTab === 'settings' && 'Configure system settings'}
                    </p>
                </div>
            </div>
            <div className="d-flex align-items-center d-none d-sm-flex">
                <div className="text-end me-3">
                    <div className="fw-semibold tc-6533 small">{adminData.name}</div>
                    <small className="text-muted">{adminData.role}</small>
                </div>
                <div className="position-relative">
                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <span className="text-white fw-bold small">{adminData.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white" style={{ width: '12px', height: '12px' }}></div>
                </div>
            </div>
        </div>
    </div>
);

export default AdminHeader;
