// src/components/AdminSidebar.jsx
import React from "react";

const AdminSidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, adminData }) => (
    <div className="bg-white h-100 border-end">
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
                {/* Dashboard */}
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'dashboard' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('dashboard');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'dashboard' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'dashboard' ? 'bg-primary' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Dashboard</div>
                        <small className="text-muted">Overview & Analytics</small>
                    </div>
                </button>
                {/* Products */}
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'products' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('products');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'products' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'products' ? 'bg-primary' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'products' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Products</div>
                        <small className="text-muted">Manage Inventory</small>
                    </div>
                </button>
                {/* Add Product */}
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'add-product' ? 'active bg-success bg-opacity-10 text-success' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('add-product');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'add-product' && <div className="position-absolute start-0 top-0 bottom-0 bg-success" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'add-product' ? 'bg-success' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'add-product' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Add Product</div>
                        <small className="text-muted">Create New Item</small>
                    </div>
                </button>
                {/* Orders */}
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'orders' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('orders');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'orders' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'orders' ? 'bg-primary' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'orders' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z" />
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Orders</div>
                        <small className="text-muted">Process & Track</small>
                    </div>
                </button>
                {/* Users */}
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'users' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('users');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'users' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'users' ? 'bg-primary' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'users' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Users</div>
                        <small className="text-muted">Customer Management</small>
                    </div>
                </button>
                {/* Catalog Management */}
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'catalog' ? 'active bg-secondary bg-opacity-10 text-secondary' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('catalog');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'catalog' && <div className="position-absolute start-0 top-0 bottom-0 bg-secondary" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'catalog' ? 'bg-secondary' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'catalog' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Catalog</div>
                        <small className="text-muted">Categories & Specs</small>
                    </div>
                </button>
                {/* Homepage Manager */}
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'homepage' ? 'active bg-warning bg-opacity-10 text-warning' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('homepage');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'homepage' && <div className="position-absolute start-0 top-0 bottom-0 bg-warning" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'homepage' ? 'bg-warning' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'homepage' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Homepage</div>
                        <small className="text-muted">Manage Sections</small>
                    </div>
                </button>
                {/* Activity Log
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'activity' ? 'active bg-info bg-opacity-10 text-info' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('activity');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'activity' && <div className="position-absolute start-0 top-0 bottom-0 bg-info" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'activity' ? 'bg-info' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'activity' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Activity Log</div>
                        <small className="text-muted">System Activities</small>
                    </div>
                </button>
                 */}
                {/* Security */}
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'security' ? 'active bg-warning bg-opacity-10 text-warning' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('security');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'security' && <div className="position-absolute start-0 top-0 bottom-0 bg-warning" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'security' ? 'bg-warning' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'security' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10V11.5H13.8V10C13.8,8.7 12.8,8.2 12,8.2Z"/>
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Security</div>
                        <small className="text-muted">Sessions & Logs</small>
                    </div>
                </button>
                {/* Settings */}
                <button
                    className={`nav-link d-flex align-items-center px-4 py-3 border-0 text-start position-relative ${activeTab === 'settings' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}
                    onClick={() => {
                        setActiveTab('settings');
                        setSidebarOpen(false);
                    }}
                >
                    {activeTab === 'settings' && <div className="position-absolute start-0 top-0 bottom-0 bg-primary" style={{ width: '3px' }}></div>}
                    <div className={`rounded-2 p-2 me-3 ${activeTab === 'settings' ? 'bg-primary' : 'bg-light'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`flex-shrink-0 ${activeTab === 'settings' ? 'text-white' : 'text-muted'}`}>
                            <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
                        </svg>
                    </div>
                    <div>
                        <div className="fw-semibold">Settings</div>
                        <small className="text-muted">System Configuration</small>
                    </div>
                </button>
            </nav>
        </div>
    </div>
);

export default AdminSidebar;
