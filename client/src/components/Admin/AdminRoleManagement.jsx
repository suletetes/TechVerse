import { useState, useEffect } from 'react';
import { useNotification } from '../../context';
import roleService from '../../api/services/roleService';

const AdminRoleManagement = () => {
    const { showSuccess, showError } = useNotification();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [roleStats, setRoleStats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            
            // Load roles, users, and stats using the service
            const [rolesRes, usersRes, statsRes] = await Promise.all([
                roleService.getAllRoles(),
                roleService.getAllUsers({ limit: 100 }),
                roleService.getRoleStats()
            ]);

            if (rolesRes.success) setRoles(rolesRes.data.roles);
            if (usersRes.success) setUsers(usersRes.data.users);
            if (statsRes.success) setRoleStats(statsRes.data.stats);

        } catch (error) {
            console.error('Load error:', error);
            showError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRole) {
            showError('Please select a user and role');
            return;
        }

        try {
            const data = await roleService.assignRole(selectedUser._id, selectedRole);

            if (data.success) {
                showSuccess('Role assigned successfully');
                setSelectedUser(null);
                setSelectedRole('');
                await loadData();
            } else {
                showError(data.message || 'Failed to assign role');
            }
        } catch (error) {
            console.error('Assign error:', error);
            showError(error.message || 'Failed to assign role');
        }
    };

    const getRoleBadgeColor = (role) => {
        const roleInfo = (roles || []).find(r => r.value === role);
        return roleInfo?.color || 'secondary';
    };

    const filteredUsers = (users || []).filter(user => {
        const matchesSearch = !searchTerm || 
            user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = !filterRole || user.role === filterRole;
        
        return matchesSearch && matchesRole;
    });

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <h2 className="mb-4">Role Management</h2>

            {/* Role Statistics */}
            <div className="row mb-4">
                {(roleStats || []).map(stat => (
                    <div key={stat.role} className="col-md-3 mb-3">
                        <div className={`card border-${stat.roleInfo?.color || 'secondary'}`}>
                            <div className="card-body">
                                <h6 className="card-title">{stat.roleInfo?.label || stat.role}</h6>
                                <h3 className="mb-0">{stat.count || 0}</h3>
                                <small className="text-muted">
                                    {stat.active || 0} active, {stat.inactive || 0} inactive
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Available Roles */}
            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="mb-0">Available Roles</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        {(roles || []).filter(r => r.value !== 'user').map(role => (
                            <div key={role.value} className="col-md-6 mb-3">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 className="mb-1">
                                                    <span className={`badge bg-${role.color} me-2`}>
                                                        Level {role.level}
                                                    </span>
                                                    {role.label}
                                                </h6>
                                                <p className="small text-muted mb-2">{role.description}</p>
                                                <details>
                                                    <summary className="small text-primary" style={{ cursor: 'pointer' }}>
                                                        View Permissions ({role.permissions.length})
                                                    </summary>
                                                    <ul className="small mt-2 mb-0">
                                                        {(role.permissions || []).slice(0, 10).map(perm => (
                                                            <li key={perm}>{perm}</li>
                                                        ))}
                                                        {role.permissions.length > 10 && (
                                                            <li className="text-muted">
                                                                +{role.permissions.length - 10} more...
                                                            </li>
                                                        )}
                                                    </ul>
                                                </details>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Management */}
            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">Assign Roles to Users</h5>
                </div>
                <div className="card-body">
                    {/* Filters */}
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <select
                                className="form-select"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="">All Roles</option>
                                {(roles || []).map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Current Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user._id}>
                                        <td>
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge bg-${getRoleBadgeColor(user.role)}`}>
                                                {roles.find(r => r.value === user.role)?.label || user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge bg-${user.isActive ? 'success' : 'danger'}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setSelectedRole(user.role);
                                                }}
                                            >
                                                Change Role
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Role Assignment Modal */}
            {selectedUser && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Assign Role</h5>
                                <button
                                    className="btn-close"
                                    onClick={() => {
                                        setSelectedUser(null);
                                        setSelectedRole('');
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    <strong>User:</strong> {selectedUser.firstName} {selectedUser.lastName}
                                    <br />
                                    <strong>Email:</strong> {selectedUser.email}
                                    <br />
                                    <strong>Current Role:</strong>{' '}
                                    <span className={`badge bg-${getRoleBadgeColor(selectedUser.role)}`}>
                                        {roles.find(r => r.value === selectedUser.role)?.label || selectedUser.role}
                                    </span>
                                </p>

                                <div className="mb-3">
                                    <label className="form-label">New Role</label>
                                    <select
                                        className="form-select"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                    >
                                        <option value="">Select a role...</option>
                                        {(roles || []).filter(r => r.value !== 'super_admin').map(role => (
                                            <option key={role.value} value={role.value}>
                                                {role.label} - {role.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedRole && selectedRole !== selectedUser.role && (
                                    <div className="alert alert-info">
                                        <strong>New Permissions:</strong>
                                        <ul className="small mb-0 mt-2">
                                            {((roles || []).find(r => r.value === selectedRole)?.permissions || []).slice(0, 5).map(perm => (
                                                <li key={perm}>{perm}</li>
                                            ))}
                                            {((roles || []).find(r => r.value === selectedRole)?.permissions || []).length > 5 && (
                                                <li className="text-muted">
                                                    +{((roles || []).find(r => r.value === selectedRole)?.permissions || []).length - 5} more...
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setSelectedUser(null);
                                        setSelectedRole('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAssignRole}
                                    disabled={!selectedRole || selectedRole === selectedUser.role}
                                >
                                    Assign Role
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRoleManagement;
