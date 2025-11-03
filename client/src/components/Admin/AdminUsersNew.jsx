import React, { useState, useEffect } from 'react';
import { adminDataManager } from '../../utils/AdminDataManager.js';

const AdminUsersNew = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        role: '',
        status: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    // Load users
    useEffect(() => {
        loadUsers();
    }, [filters]);

    // Set up data manager listener
    useEffect(() => {
        const unsubscribe = adminDataManager.addListener('users', (data) => {
            setLoading(data.loading);
            setError(data.error);
            if (data.data) {
                setUsers(data.data);
            }
            if (data.pagination) {
                setPagination(data.pagination);
            }
        });

        return unsubscribe;
    }, []);

    const loadUsers = async () => {
        try {
            await adminDataManager.loadUsers(filters);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            console.log(`Updating user ${userId} to role: ${newRole}`);
            // Update user role via API
            // await adminService.updateUserRole(userId, newRole);
            // Reload users after update
            await loadUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            console.log(`Updating user ${userId} to status: ${newStatus}`);
            // Update user status via API
            // await adminService.updateUserStatus(userId, newStatus);
            // Reload users after update
            await loadUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'active': 'success',
            'inactive': 'secondary',
            'suspended': 'warning',
            'banned': 'danger'
        };
        return colors[status?.toLowerCase()] || 'secondary';
    };

    const getRoleColor = (role) => {
        const colors = {
            'admin': 'danger',
            'super_admin': 'dark',
            'moderator': 'warning',
            'customer': 'primary',
            'user': 'info'
        };
        return colors[role?.toLowerCase()] || 'secondary';
    };

    if (loading) {
        return (
            <div className="store-card fill-card">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading users...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading users from database...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="store-card fill-card">
                <div className="text-center py-5">
                    <div className="alert alert-danger mx-4">
                        <h5 className="alert-heading">Error Loading Users</h5>
                        <p className="mb-0">{error}</p>
                        <hr />
                        <div className="d-flex gap-2 justify-content-center">
                            <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => window.resetTechVerseAuth?.()}
                            >
                                Reset Auth
                            </button>
                            <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={loadUsers}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="store-card fill-card">
            {/* Header */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
                <div>
                    <h3 className="tc-6533 bold-text mb-1">User Management</h3>
                    <p className="text-muted mb-0">Manage customer accounts and user information</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-secondary btn-rd"
                        onClick={loadUsers}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                        </svg>
                        Refresh
                    </button>
                    <button className="btn btn-success btn-rd">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                        </svg>
                        Add User
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <label className="form-label">Role</label>
                    <select 
                        className="form-select"
                        value={filters.role}
                        onChange={(e) => setFilters({...filters, role: e.target.value})}
                    >
                        <option value="">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <label className="form-label">Status</label>
                    <select 
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label">Search</label>
                    <input 
                        type="text"
                        className="form-control"
                        placeholder="Name, email, or ID..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                <div className="col-md-2">
                    <label className="form-label">&nbsp;</label>
                    <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={() => setFilters({role: '', status: '', search: ''})}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* User Stats */}
            <div className="row g-3 mb-4">
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-primary mb-1">{users.length}</h3>
                            <p className="text-muted mb-0">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-success mb-1">
                                {users.filter(u => u.status === 'active').length}
                            </h3>
                            <p className="text-muted mb-0">Active</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-info bg-opacity-10 border-info border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-info mb-1">
                                {users.filter(u => u.role === 'customer').length}
                            </h3>
                            <p className="text-muted mb-0">Customers</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-warning mb-1">
                                {users.filter(u => ['admin', 'super_admin', 'moderator'].includes(u.role)).length}
                            </h3>
                            <p className="text-muted mb-0">Staff</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th className="border-0 fw-semibold">User</th>
                            <th className="border-0 fw-semibold">Email</th>
                            <th className="border-0 fw-semibold">Role</th>
                            <th className="border-0 fw-semibold">Status</th>
                            <th className="border-0 fw-semibold">Joined</th>
                            <th className="border-0 fw-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id || user.id}>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-circle me-3">
                                            {user.avatar ? (
                                                <img 
                                                    src={user.avatar} 
                                                    alt={user.firstName || user.email}
                                                    className="rounded-circle"
                                                    width="40"
                                                    height="40"
                                                />
                                            ) : (
                                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="fw-medium">
                                                {user.firstName && user.lastName 
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : user.email?.split('@')[0] || 'Unknown User'
                                                }
                                            </div>
                                            <small className="text-muted">
                                                ID: {user._id?.slice(-8) || user.id || 'N/A'}
                                            </small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <div>{user.email}</div>
                                        {user.isEmailVerified ? (
                                            <small className="text-success">
                                                <svg width="12" height="12" viewBox="0 0 24 24" className="me-1">
                                                    <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                                                </svg>
                                                Verified
                                            </small>
                                        ) : (
                                            <small className="text-warning">Not verified</small>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge bg-${getRoleColor(user.role)} bg-opacity-15 text-${getRoleColor(user.role)} border border-${getRoleColor(user.role)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                        {user.role || 'customer'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge bg-${getStatusColor(user.status)} bg-opacity-15 text-${getStatusColor(user.status)} border border-${getStatusColor(user.status)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                        {user.status || 'active'}
                                    </span>
                                </td>
                                <td>
                                    <span className="text-muted">
                                        {formatDate(user.createdAt)}
                                    </span>
                                </td>
                                <td>
                                    <div className="btn-group btn-group-sm">
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            title="View User"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                            </svg>
                                        </button>
                                        <select
                                            className="form-select form-select-sm"
                                            value={user.role || 'customer'}
                                            onChange={(e) => handleRoleChange(user._id || user.id, e.target.value)}
                                            style={{ minWidth: '100px' }}
                                        >
                                            <option value="customer">Customer</option>
                                            <option value="moderator">Moderator</option>
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                        <select
                                            className="form-select form-select-sm"
                                            value={user.status || 'active'}
                                            onChange={(e) => handleStatusChange(user._id || user.id, e.target.value)}
                                            style={{ minWidth: '100px' }}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="banned">Banned</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {users.length === 0 && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2V18h2v-4h3v4h2v2H2v-2h2z" />
                    </svg>
                    <h5 className="text-muted">No Users Found</h5>
                    <p className="text-muted mb-0">No users match your current filters.</p>
                </div>
            )}
        </div>
    );
};

export default AdminUsersNew;