import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../api/services/index.js';
import { useAuth } from '../../context/AuthContext';

const AdminUsersNew = () => {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        role: '',
        status: '',
        search: '',
        emailVerified: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10
    });
    const [sortBy, setSortBy] = useState('firstName');
    const [sortOrder, setSortOrder] = useState('asc');

    // Load users on mount
    useEffect(() => {
        loadUsers();
    }, []);
    
    // Reset to page 1 when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [filters, sortBy, sortOrder]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminService.getAdminUsers({ limit: 1000 });
            
            let backendUsers = [];
            if (response?.data?.users) {
                backendUsers = response.data.users;
            } else if (response?.users) {
                backendUsers = response.users;
            } else if (Array.isArray(response)) {
                backendUsers = response;
            }
            
            setAllUsers(backendUsers);
            
        } catch (err) {
            console.error('Error loading users:', err);
            setError(err.message);
            
            // Try direct API call as fallback
            try {
                const token = localStorage.getItem('token');
                const directResponse = await fetch('http://localhost:5000/api/admin/users?limit=1000', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (directResponse.ok) {
                    const directData = await directResponse.json();
                    const directUsers = directData?.data?.users || directData?.users || directData || [];
                    setAllUsers(directUsers);
                } else {
                    throw new Error(`API returned ${directResponse.status}`);
                }
            } catch (directErr) {
                console.error('Failed to load users:', directErr);
                setError(`Failed to load users: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            // Update user role via API
            // await adminService.updateUserRole(userId, newRole);
            await loadUsers();
        } catch (error) {
            // Role update failed
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            // Update user status via API
            // await adminService.updateUserStatus(userId, newStatus);
            await loadUsers();
        } catch (error) {
            // Status update failed
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Computed filtered and paginated users
    const { filteredUsers, paginatedUsers, totalPages } = useMemo(() => {
        let filtered = [...allUsers];
        
        // Apply search filter
        if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase().trim();
            filtered = filtered.filter(user =>
                user.firstName?.toLowerCase().includes(searchTerm) ||
                user.lastName?.toLowerCase().includes(searchTerm) ||
                user.email?.toLowerCase().includes(searchTerm) ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply role filter
        if (filters.role) {
            filtered = filtered.filter(user => user.role === filters.role);
        }
        
        // Apply status filter
        if (filters.status) {
            filtered = filtered.filter(user => {
                const userStatus = user.accountStatus || user.status || 'active';
                return userStatus === filters.status;
            });
        }
        
        // Apply email verified filter
        if (filters.emailVerified) {
            const isVerified = filters.emailVerified === 'verified';
            filtered = filtered.filter(user => {
                const verified = user.isEmailVerified || user.emailVerified || false;
                return verified === isVerified;
            });
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'firstName':
                    aValue = (a.firstName || '').toLowerCase();
                    bValue = (b.firstName || '').toLowerCase();
                    break;
                case 'lastName':
                    aValue = (a.lastName || '').toLowerCase();
                    bValue = (b.lastName || '').toLowerCase();
                    break;
                case 'email':
                    aValue = (a.email || '').toLowerCase();
                    bValue = (b.email || '').toLowerCase();
                    break;
                case 'role':
                    aValue = (a.role || 'customer').toLowerCase();
                    bValue = (b.role || 'customer').toLowerCase();
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt || 0);
                    bValue = new Date(b.createdAt || 0);
                    break;
                default:
                    aValue = (a.firstName || '').toLowerCase();
                    bValue = (b.firstName || '').toLowerCase();
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Calculate pagination
        const totalPages = Math.ceil(filtered.length / pagination.limit);
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginated = filtered.slice(startIndex, endIndex);
        
        return {
            filteredUsers: filtered,
            paginatedUsers: paginated,
            totalPages
        };
    }, [allUsers, filters, sortBy, sortOrder, pagination.page, pagination.limit]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            role: '',
            status: '',
            search: '',
            emailVerified: ''
        });
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
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
                        onChange={(e) => handleFilterChange('role', e.target.value)}
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
                        onChange={(e) => handleFilterChange('status', e.target.value)}
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
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <label className="form-label">&nbsp;</label>
                    <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={handleClearFilters}
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
                            <h3 className="text-primary mb-1">{allUsers.length}</h3>
                            <p className="text-muted mb-0">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-success mb-1">
                                {allUsers.filter(u => (u.status || 'active') === 'active').length}
                            </h3>
                            <p className="text-muted mb-0">Active</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-info bg-opacity-10 border-info border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-info mb-1">
                                {allUsers.filter(u => (u.role || 'customer') === 'customer').length}
                            </h3>
                            <p className="text-muted mb-0">Customers</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
                        <div className="card-body text-center">
                            <h3 className="text-warning mb-1">
                                {allUsers.filter(u => ['admin', 'super_admin', 'moderator'].includes(u.role || 'customer')).length}
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
                            <th 
                                className="border-0 fw-semibold cursor-pointer" 
                                onClick={() => handleSortChange('firstName')}
                            >
                                User {sortBy === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="border-0 fw-semibold cursor-pointer"
                                onClick={() => handleSortChange('email')}
                            >
                                Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="border-0 fw-semibold cursor-pointer"
                                onClick={() => handleSortChange('role')}
                            >
                                Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="border-0 fw-semibold">Status</th>
                            <th 
                                className="border-0 fw-semibold cursor-pointer"
                                onClick={() => handleSortChange('createdAt')}
                            >
                                Joined {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="border-0 fw-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map((user) => (
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    Previous
                                </button>
                            </li>
                            {[...Array(totalPages)].map((_, index) => {
                                const pageNum = index + 1;
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                                ) {
                                    return (
                                        <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                                            <button 
                                                className="page-link"
                                                onClick={() => handlePageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                } else if (
                                    pageNum === pagination.page - 3 ||
                                    pageNum === pagination.page + 3
                                ) {
                                    return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                                }
                                return null;
                            })}
                            <li className={`page-item ${pagination.page === totalPages ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === totalPages}
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* Empty State */}
            {paginatedUsers.length === 0 && !loading && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2V18h2v-4h3v4h2v2H2v-2h2z" />
                    </svg>
                    <h5 className="text-muted">No Users Found</h5>
                    <p className="text-muted mb-0">
                        {allUsers.length === 0 ? 'No users in database.' : 'No users match your current filters.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminUsersNew;