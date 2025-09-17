import React from "react";

const AdminUsers = ({ users, getStatusColor, formatCurrency }) => (
    <div className="store-card fill-card">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="tc-6533 bold-text mb-0">User Management</h3>
            <button className="btn btn-c-2101 btn-rd">
                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V8c0-.55-.45-1-1-1s-1 .45-1 1v2H2c-.55 0-1 .45-1 1s.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1H6z" />
                </svg>
                Add User
            </button>
        </div>
        <div className="row mb-3">
            <div className="col-md-6">
                <input type="text" className="form-control" placeholder="Search users..." />
            </div>
            <div className="col-md-3">
                <select className="form-select">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="vip">VIP</option>
                    <option value="new">New</option>
                </select>
            </div>
            <div className="col-md-3">
                <select className="form-select">
                    <option value="">Sort by</option>
                    <option value="name">Name</option>
                    <option value="date">Join Date</option>
                    <option value="orders">Orders</option>
                    <option value="spent">Total Spent</option>
                </select>
            </div>
        </div>
        <div className="table-responsive">
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Join Date</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                        <span className="text-white">{user.name.split(' ').map(n => n[0]).join('')}</span>
                                    </div>
                                    <div>
                                        <h6 className="mb-0">{user.name}</h6>
                                        <small className="text-muted">ID: {user.id}</small>
                                    </div>
                                </div>
                            </td>
                            <td>{user.email}</td>
                            <td>{user.joinDate}</td>
                            <td>{user.orders}</td>
                            <td className="bold-text">{formatCurrency(user.totalSpent)}</td>
                            <td>
                                <span className={`badge bg-${getStatusColor(user.status)}`}>{user.status}</span>
                            </td>
                            <td>
                                <button className="btn btn-sm btn-outline-primary me-1">View</button>
                                <button className="btn btn-sm btn-outline-secondary">Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default AdminUsers;
