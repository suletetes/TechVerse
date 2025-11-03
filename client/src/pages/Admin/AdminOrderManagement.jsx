import React from 'react';
import { Link } from 'react-router-dom';
import AdminOrdersNew from '../../components/Admin/AdminOrdersNew';

const AdminOrderManagement = () => {
    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid p-4">
                {/* Page Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="h3 mb-1">Order Management</h1>
                                <p className="text-muted mb-0">Manage customer orders and fulfillment</p>
                            </div>
                            <div className="d-flex gap-2">
                                <Link to="/admin" className="btn btn-outline-secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                    Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Component */}
                <AdminOrdersNew />
            </div>
        </div>
    );
};

export default AdminOrderManagement;