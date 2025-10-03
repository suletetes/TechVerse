import React, { useState } from "react";

const AdminUsers = ({ users, getStatusColor, formatCurrency, onAddUser, onEditUser, onDeleteUser }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'customer',
        status: 'active',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        },
        preferences: {
            newsletter: true,
            smsNotifications: false,
            emailNotifications: true
        }
    });

    const handleAddUser = () => {
        setNewUser({
            name: '',
            email: '',
            phone: '',
            role: 'customer',
            status: 'active',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            preferences: {
                newsletter: true,
                smsNotifications: false,
                emailNotifications: true
            }
        });
        setEditingUser(null);
        setShowAddForm(true);
    };

    const handleEditUser = (user) => {
        setNewUser({
            ...user,
            address: user.address || {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            preferences: user.preferences || {
                newsletter: true,
                smsNotifications: false,
                emailNotifications: true
            }
        });
        setEditingUser(user.id);
        setShowAddForm(true);
    };

    const handleSaveUser = () => {
        if (!newUser.name.trim() || !newUser.email.trim()) {
            alert('Name and email are required');
            return;
        }

        const userData = {
            ...newUser,
            id: editingUser || Date.now(),
            joinDate: editingUser ? users.find(u => u.id === editingUser)?.joinDate : new Date().toISOString().split('T')[0],
            orders: editingUser ? users.find(u => u.id === editingUser)?.orders : 0,
            totalSpent: editingUser ? users.find(u => u.id === editingUser)?.totalSpent : 0
        };

        if (editingUser) {
            onEditUser(userData);
        } else {
            onAddUser(userData);
        }
        
        setShowAddForm(false);
        setEditingUser(null);
    };

    const filteredUsers = users.filter(user => {
        if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        if (statusFilter && user.status.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
        }
        return true;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'date':
                return new Date(b.joinDate) - new Date(a.joinDate);
            case 'orders':
                return b.orders - a.orders;
            case 'spent':
                return b.totalSpent - a.totalSpent;
            default:
                return 0;
        }
    });

    if (showAddForm) {
        return (
            <div className="store-card fill-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="tc-6533 bold-text mb-0">
                        {editingUser ? 'Edit User' : 'Add New User'}
                    </h3>
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => setShowAddForm(false)}
                    >
                        Back to Users
                    </button>
                </div>

                <div className="row">
                    {/* Basic Information */}
                    <div className="col-12 mb-4">
                        <h5>Basic Information</h5>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Email Address *</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-select"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                                >
                                    <option value="customer">Customer</option>
                                    <option value="vip">VIP Customer</option>
                                    <option value="admin">Admin</option>
                                    <option value="moderator">Moderator</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={newUser.status}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="col-12 mb-4">
                        <h5>Address Information</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <label className="form-label">Street Address</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newUser.address.street}
                                    onChange={(e) => setNewUser(prev => ({
                                        ...prev,
                                        address: { ...prev.address, street: e.target.value }
                                    }))}
                                    placeholder="Enter street address"
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">City</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newUser.address.city}
                                    onChange={(e) => setNewUser(prev => ({
                                        ...prev,
                                        address: { ...prev.address, city: e.target.value }
                                    }))}
                                    placeholder="Enter city"
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">State</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newUser.address.state}
                                    onChange={(e) => setNewUser(prev => ({
                                        ...prev,
                                        address: { ...prev.address, state: e.target.value }
                                    }))}
                                    placeholder="Enter state"
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">ZIP Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newUser.address.zipCode}
                                    onChange={(e) => setNewUser(prev => ({
                                        ...prev,
                                        address: { ...prev.address, zipCode: e.target.value }
                                    }))}
                                    placeholder="Enter ZIP code"
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Country</label>
                                <select
                                    className="form-select"
                                    value={newUser.address.country}
                                    onChange={(e) => setNewUser(prev => ({
                                        ...prev,
                                        address: { ...prev.address, country: e.target.value }
                                    }))}
                                >
                                    <option value="">Select Country</option>
                                    <option value="US">United States</option>
                                    <option value="CA">Canada</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="AU">Australia</option>
                                    <option value="DE">Germany</option>
                                    <option value="FR">France</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="col-12 mb-4">
                        <h5>Communication Preferences</h5>
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={newUser.preferences.newsletter}
                                        onChange={(e) => setNewUser(prev => ({
                                            ...prev,
                                            preferences: { ...prev.preferences, newsletter: e.target.checked }
                                        }))}
                                    />
                                    <label className="form-check-label">
                                        Newsletter Subscription
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={newUser.preferences.emailNotifications}
                                        onChange={(e) => setNewUser(prev => ({
                                            ...prev,
                                            preferences: { ...prev.preferences, emailNotifications: e.target.checked }
                                        }))}
                                    />
                                    <label className="form-check-label">
                                        Email Notifications
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={newUser.preferences.smsNotifications}
                                        onChange={(e) => setNewUser(prev => ({
                                            ...prev,
                                            preferences: { ...prev.preferences, smsNotifications: e.target.checked }
                                        }))}
                                    />
                                    <label className="form-check-label">
                                        SMS Notifications
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => setShowAddForm(false)}
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn btn-success"
                        onClick={handleSaveUser}
                    >
                        {editingUser ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </div>
        );
    }

    return (
    <div className="store-card fill-card">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
            <div>
                <h3 className="tc-6533 bold-text mb-1">User Management</h3>
                <p className="text-muted mb-0">Manage customer accounts and user information</p>
            </div>
            <button 
                className="btn btn-success btn-rd d-flex align-items-center"
                onClick={handleAddUser}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" className="me-2" fill="white">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Add New User
            </button>
        </div>

        {/* Summary Stats */}
        <div className="row mb-4">
            <div className="col-md-3 mb-3">
                <div className="card border-0 bg-primary bg-opacity-10">
                    <div className="card-body text-center">
                        <h4 className="text-primary mb-1">{users.length}</h4>
                        <small className="text-muted">Total Users</small>
                    </div>
                </div>
            </div>
            <div className="col-md-3 mb-3">
                <div className="card border-0 bg-success bg-opacity-10">
                    <div className="card-body text-center">
                        <h4 className="text-success mb-1">{users.filter(u => u.status === 'Active').length}</h4>
                        <small className="text-muted">Active Users</small>
                    </div>
                </div>
            </div>
            <div className="col-md-3 mb-3">
                <div className="card border-0 bg-warning bg-opacity-10">
                    <div className="card-body text-center">
                        <h4 className="text-warning mb-1">{users.filter(u => u.status === 'VIP').length}</h4>
                        <small className="text-muted">VIP Users</small>
                    </div>
                </div>
            </div>
            <div className="col-md-3 mb-3">
                <div className="card border-0 bg-info bg-opacity-10">
                    <div className="card-body text-center">
                        <h4 className="text-info mb-1">
                            {users.filter(u => {
                                const joinDate = new Date(u.joinDate);
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                return joinDate > thirtyDaysAgo;
                            }).length}
                        </h4>
                        <small className="text-muted">New This Month</small>
                    </div>
                </div>
            </div>
        </div>

        <div className="row mb-4">
            <div className="col-md-4">
                <div className="input-group">
                    <span className="input-group-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                    </span>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search users or emails..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="col-md-3">
                <select 
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="vip">VIP</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>
            <div className="col-md-3">
                <select 
                    className="form-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="">Sort by</option>
                    <option value="name">Name</option>
                    <option value="date">Join Date</option>
                    <option value="orders">Orders</option>
                    <option value="spent">Total Spent</option>
                </select>
            </div>
            <div className="col-md-2">
                <button className="btn btn-outline-secondary w-100">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                        <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    Export
                </button>
            </div>
        </div>
        <div className="table-responsive">
            <table className="table table-hover align-middle">
                <thead className="table-light">
                    <tr>
                        <th className="border-0 fw-semibold">
                            <input type="checkbox" className="form-check-input" />
                        </th>
                        <th className="border-0 fw-semibold">User</th>
                        <th className="border-0 fw-semibold">Contact</th>
                        <th className="border-0 fw-semibold d-none d-md-table-cell">Join Date</th>
                        <th className="border-0 fw-semibold d-none d-lg-table-cell">Orders</th>
                        <th className="border-0 fw-semibold d-none d-xl-table-cell">Total Spent</th>
                        <th className="border-0 fw-semibold">Status</th>
                        <th className="border-0 fw-semibold text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-bottom">
                            <td>
                                <input type="checkbox" className="form-check-input" />
                            </td>
                            <td>
                                <div className="d-flex align-items-center">
                                    <div className="position-relative me-3">
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="rounded-circle"
                                                width="45"
                                                height="45"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                                <span className="text-white fw-medium">
                                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <span className={`position-absolute bottom-0 end-0 rounded-circle border border-2 border-white ${
                                            user.status === 'Active' ? 'bg-success' : 
                                            user.status === 'VIP' ? 'bg-warning' : 'bg-secondary'
                                        }`} style={{ width: '12px', height: '12px' }}></span>
                                    </div>
                                    <div>
                                        <h6 className="mb-1 fw-semibold">{user.name}</h6>
                                        <small className="text-muted">ID: {user.id}</small>
                                        {user.role && user.role !== 'customer' && (
                                            <div>
                                                <span className="badge bg-info bg-opacity-15 text-info border border-info border-opacity-25 rounded-pill px-2 py-1">
                                                    {user.role}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <div className="fw-medium">{user.email}</div>
                                    {user.phone && (
                                        <small className="text-muted">{user.phone}</small>
                                    )}
                                </div>
                            </td>
                            <td className="d-none d-md-table-cell">
                                <div>
                                    <div>{new Date(user.joinDate).toLocaleDateString()}</div>
                                    <small className="text-muted">
                                        {Math.floor((new Date() - new Date(user.joinDate)) / (1000 * 60 * 60 * 24))} days ago
                                    </small>
                                </div>
                            </td>
                            <td className="d-none d-lg-table-cell">
                                <div className="text-center">
                                    <div className="fw-bold">{user.orders}</div>
                                    <small className="text-muted">orders</small>
                                </div>
                            </td>
                            <td className="d-none d-xl-table-cell">
                                <div className="text-end">
                                    <div className="fw-bold tc-6533">{formatCurrency(user.totalSpent)}</div>
                                    <small className="text-muted">lifetime value</small>
                                </div>
                            </td>
                            <td>
                                <span className={`badge bg-${getStatusColor(user.status)} bg-opacity-15 text-${getStatusColor(user.status)} border border-${getStatusColor(user.status)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="text-center">
                                <div className="btn-group btn-group-sm">
                                    <button className="btn btn-outline-primary btn-sm" title="View Profile">
                                        <svg width="14" height="14" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                        </svg>
                                    </button>
                                    <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => handleEditUser(user)}
                                        title="Edit User"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                        </svg>
                                    </button>
                                    <button className="btn btn-outline-info btn-sm" title="Send Email">
                                        <svg width="14" height="14" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                                        </svg>
                                    </button>
                                    <button 
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => onDeleteUser && onDeleteUser(user.id)}
                                        title="Delete User"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
            <div className="text-center py-5">
                <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                    <path fill="currentColor" d="M16,4C18.11,4 19.8,5.69 19.8,7.8C19.8,9.91 18.11,11.6 16,11.6C13.89,11.6 12.2,9.91 12.2,7.8C12.2,5.69 13.89,4 16,4M16,13.4C18.67,13.4 24,14.73 24,17.4V20H8V17.4C8,14.73 13.33,13.4 16,13.4M8.8,11.6C6.69,11.6 5,9.91 5,7.8C5,5.69 6.69,4 8.8,4C10.91,4 12.6,5.69 12.6,7.8C12.6,9.91 10.91,11.6 8.8,11.6M8.8,13.4C11.47,13.4 16.8,14.73 16.8,17.4V20H1V17.4C1,14.73 6.33,13.4 8.8,13.4Z" />
                </svg>
                <h5 className="text-muted">No users found</h5>
                <p className="text-muted">
                    {searchTerm || statusFilter 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Create your first user to get started'
                    }
                </p>
                {(searchTerm || statusFilter) && (
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('');
                        }}
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > 10 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
                <div className="text-muted">
                    Showing {Math.min(10, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <nav>
                    <ul className="pagination pagination-sm mb-0">
                        <li className="page-item">
                            <button className="page-link">Previous</button>
                        </li>
                        <li className="page-item active">
                            <button className="page-link">1</button>
                        </li>
                        <li className="page-item">
                            <button className="page-link">2</button>
                        </li>
                        <li className="page-item">
                            <button className="page-link">3</button>
                        </li>
                        <li className="page-item">
                            <button className="page-link">Next</button>
                        </li>
                    </ul>
                </nav>
            </div>
        )}
    </div>
    );
};

export default AdminUsers;
