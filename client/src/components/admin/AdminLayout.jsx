import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ children, activeTab, setActiveTab, adminData }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid p-0">
                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
                        style={{ zIndex: 1040 }}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <div className="row g-0 min-vh-100">
                    {/* Sidebar */}
                    <AdminSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        adminData={adminData}
                    />

                    {/* Main Content */}
                    <div className="col-lg-9 col-xl-10">
                        {/* Header */}
                        <AdminHeader
                            activeTab={activeTab}
                            adminData={adminData}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                        />

                        {/* Content Area */}
                        <div className="p-4">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;