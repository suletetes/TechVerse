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
