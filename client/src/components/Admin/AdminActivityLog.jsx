import React from 'react';

const AdminActivityLog = ({ activityLog }) => {
    return (
        <div className="row">
            <div className="col-12 mb-4">
                <h2>Activity Log</h2>
                <p className="text-muted">Recent system activities and changes</p>
            </div>
            
            {/* Activity Filters */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Activity Type</label>
                                <select className="form-select">
                                    <option value="all">All Activities</option>
                                    <option value="order">Orders</option>
                                    <option value="product">Products</option>
                                    <option value="user">Users</option>
                                    <option value="system">System</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Date Range</label>
                                <select className="form-select">
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Admin User</label>
                                <select className="form-select">
                                    <option value="all">All Admins</option>
                                    <option value="sarah">Sarah Johnson</option>
                                    <option value="mike">Mike Wilson</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">&nbsp;</label>
                                <button className="btn btn-primary w-100">Apply Filters</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Recent Activities</h5>
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                                </svg>
                                Export
                            </button>
                            <button className="btn btn-sm btn-outline-secondary">
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {activityLog.length === 0 ? (
                            <div className="text-center py-5">
                                <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                <p className="text-muted">No recent activity</p>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {activityLog.map(activity => (
                                    <div key={activity.id} className="list-group-item border-start-0 border-end-0">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="d-flex align-items-start">
                                                <div className={`rounded-circle p-2 me-3 ${
                                                    activity.type === 'order' ? 'bg-primary bg-opacity-10 text-primary' :
                                                    activity.type === 'product' ? 'bg-success bg-opacity-10 text-success' :
                                                    activity.type === 'user' ? 'bg-info bg-opacity-10 text-info' :
                                                    'bg-warning bg-opacity-10 text-warning'
                                                }`}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                                        {activity.type === 'order' && (
                                                            <path fill="currentColor" d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z"/>
                                                        )}
                                                        {activity.type === 'product' && (
                                                            <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                        )}
                                                        {activity.type === 'user' && (
                                                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                        )}
                                                        {activity.type === 'system' && (
                                                            <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                                                        )}
                                                    </svg>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-1">
                                                        <h6 className="mb-0 me-2">{activity.action}</h6>
                                                        <span className={`badge badge-sm ${
                                                            activity.type === 'order' ? 'bg-primary' :
                                                            activity.type === 'product' ? 'bg-success' :
                                                            activity.type === 'user' ? 'bg-info' :
                                                            'bg-warning'
                                                        }`}>
                                                            {activity.type}
                                                        </span>
                                                    </div>
                                                    <p className="mb-1 text-muted small">{activity.details}</p>
                                                    <div className="d-flex align-items-center text-muted small">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                        </svg>
                                                        <span className="me-3">{activity.user}</span>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 17.5L8.5 15 12 12.5 15.5 15 12 17.5z"/>
                                                        </svg>
                                                        <span>{activity.timestamp}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-end">
                                                <button className="btn btn-sm btn-outline-secondary">
                                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                                        <path fill="currentColor" d="M12 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {activityLog.length > 0 && (
                        <div className="card-footer bg-light">
                            <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">Showing {activityLog.length} of 150 activities</small>
                                <button className="btn btn-sm btn-outline-primary">Load More</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminActivityLog;