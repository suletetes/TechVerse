import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminHeader } from '../../components/Admin';

const AdminOrderManagement = () => {
    const [orders, setOrders] = useState([
        {
            id: 'TV-2024-001234',
            customer: 'John Smith',
            email: 'john.smith@email.com',
            date: '2024-01-15',
            status: 'Processing',
            total: 2999.00,
            items: 2,
            paymentMethod: 'Credit Card',
            shippingAddress: '123 Main St, London, UK'
        },
        {
            id: 'TV-2024-001233',
            customer: 'Emma Wilson',
            email: 'emma.wilson@email.com',
            date: '2024-01-15',
            status: 'Shipped',
            total: 1299.00,
            items: 1,
            paymentMethod: 'PayPal',
            shippingAddress: '456 Oak Ave, Manchester, UK'
        },
        {
            id: 'TV-2024-001232',
            customer: 'Michael Brown',
            email: 'michael.brown@email.com',
            date: '2024-01-14',
            status: 'Delivered',
            total: 899.00,
            items: 3,
            paymentMethod: 'Credit Card',
            shippingAddress: '789 Pine Rd, Birmingham, UK'
        },
        {
            id: 'TV-2024-001231',
            customer: 'Lisa Davis',
            email: 'lisa.davis@email.com',
            date: '2024-01-14',
            status: 'Cancelled',
            total: 1599.00,
            items: 1,
            paymentMethod: 'Credit Card',
            shippingAddress: '321 Elm St, Liverpool, UK'
        }
    ]);

    const [filters, setFilters] = useState({
        status: 'all',
        dateFrom: '',
        dateTo: '',
        customer: ''
    });

    const [expandedOrders, setExpandedOrders] = useState(new Set());

    const formatCurrency = (amount) => `£${amount.toLocaleString('en-GB', {minimumFractionDigits: 2})}`;

    const toggleOrderExpansion = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const filteredOrders = orders.filter(order => {
        if (filters.status !== 'all' && order.status.toLowerCase() !== filters.status.toLowerCase()) return false;
        if (filters.customer && !order.customer.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.dateFrom && new Date(order.date) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && new Date(order.date) > new Date(filters.dateTo)) return false;
        return true;
    });

    const adminData = {
        name: 'Sarah Johnson',
        role: 'Super Admin',
        email: 'sarah.johnson@techverse.com',
        avatar: null
    };

    return (
        <div className="min-vh-100 bg-light">
            <AdminHeader 
                activeTab="orders"
                adminData={adminData}
                sidebarOpen={false}
                setSidebarOpen={() => {}}
            />
            
            <div className="container-fluid p-4">
                {/* Page Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="h3 mb-1">Order Management</h1>
                                <p className="text-muted mb-0">Manage and track all customer orders</p>
                            </div>
                            <div className="d-flex gap-2">
                                <Link to="/admin" className="btn btn-outline-secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                    Back to Dashboard
                                </Link>
                                <button className="btn btn-primary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                                    </svg>
                                    Create Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-lg-3 col-md-6">
                        <div className="dashboard-stats-card orders-card">
                            <div className="stats-card-header">
                                <div className="stats-icon-container">
                                    <div className="stats-icon bg-primary">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="stats-growth">
                                    <span className="growth-badge positive">
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        +8.3%
                                    </span>
                                </div>
                            </div>
                            <div className="stats-content">
                                <h2 className="stats-value">{orders.length}</h2>
                                <p className="stats-label">Total Orders</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <div className="dashboard-stats-card">
                            <div className="stats-card-header">
                                <div className="stats-icon-container">
                                    <div className="stats-icon bg-warning">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="stats-growth">
                                    <span className="growth-badge positive">
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        +12%
                                    </span>
                                </div>
                            </div>
                            <div className="stats-content">
                                <h2 className="stats-value">{orders.filter(o => o.status === 'Processing').length}</h2>
                                <p className="stats-label">Processing</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <div className="dashboard-stats-card">
                            <div className="stats-card-header">
                                <div className="stats-icon-container">
                                    <div className="stats-icon bg-info">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="stats-growth">
                                    <span className="growth-badge positive">
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        +5%
                                    </span>
                                </div>
                            </div>
                            <div className="stats-content">
                                <h2 className="stats-value">{orders.filter(o => o.status === 'Shipped').length}</h2>
                                <p className="stats-label">Shipped</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <div className="dashboard-stats-card">
                            <div className="stats-card-header">
                                <div className="stats-icon-container">
                                    <div className="stats-icon bg-success">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="stats-growth">
                                    <span className="growth-badge positive">
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                            <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                        </svg>
                                        +15%
                                    </span>
                                </div>
                            </div>
                            <div className="stats-content">
                                <h2 className="stats-value">{orders.filter(o => o.status === 'Delivered').length}</h2>
                                <p className="stats-label">Delivered</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Status</label>
                                <select 
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                                >
                                    <option value="all">All Status</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Customer</label>
                                <input 
                                    type="text"
                                    className="form-control"
                                    placeholder="Search customer..."
                                    value={filters.customer}
                                    onChange={(e) => setFilters({...filters, customer: e.target.value})}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">From Date</label>
                                <input 
                                    type="date"
                                    className="form-control"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">To Date</label>
                                <input 
                                    type="date"
                                    className="form-control"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">&nbsp;</label>
                                <button 
                                    className="btn btn-outline-secondary w-100"
                                    onClick={() => setFilters({status: 'all', dateFrom: '', dateTo: '', customer: ''})}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Orders ({filteredOrders.length})</h5>
                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-primary btn-sm">
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                                </svg>
                                Export
                            </button>
                            <button className="btn btn-outline-secondary btn-sm">
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-1">
                                    <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        <div className="admin-table-container">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="border-0 fw-semibold" width="50"></th>
                                            <th className="border-0 fw-semibold">Order ID</th>
                                            <th className="border-0 fw-semibold">Customer</th>
                                            <th className="border-0 fw-semibold">Date</th>
                                            <th className="border-0 fw-semibold">Status</th>
                                            <th className="border-0 fw-semibold">Items</th>
                                            <th className="border-0 fw-semibold">Total</th>
                                            <th className="border-0 fw-semibold text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((order) => (
                                            <React.Fragment key={order.id}>
                                                <tr>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => toggleOrderExpansion(order.id)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" className={`transition-transform ${expandedOrders.has(order.id) ? 'rotate-90' : ''}`}>
                                                                <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <span className="fw-semibold text-primary">{order.id}</span>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="fw-semibold">{order.customer}</div>
                                                            <small className="text-muted">{order.email}</small>
                                                        </div>
                                                    </td>
                                                    <td>{new Date(order.date).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td>{order.items}</td>
                                                    <td className="fw-semibold">{formatCurrency(order.total)}</td>
                                                    <td className="text-center">
                                                        <div className="btn-group btn-group-sm">
                                                            <button className="btn btn-outline-primary btn-sm" title="View Details">
                                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                                    <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                                                </svg>
                                                            </button>
                                                            <button className="btn btn-outline-secondary btn-sm" title="Edit Order">
                                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                                    <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                                                </svg>
                                                            </button>
                                                            <button className="btn btn-outline-info btn-sm" title="Print Invoice">
                                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                                    <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expandedOrders.has(order.id) && (
                                                    <tr className="expanded-details">
                                                        <td colSpan="8" className="p-0">
                                                            <div className="bg-light border-top p-4">
                                                                <div className="row">
                                                                    <div className="col-md-6">
                                                                        <h6 className="fw-bold mb-3">Order Details</h6>
                                                                        <div className="mb-2">
                                                                            <strong>Payment Method:</strong> {order.paymentMethod}
                                                                        </div>
                                                                        <div className="mb-2">
                                                                            <strong>Shipping Address:</strong><br />
                                                                            {order.shippingAddress}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        <h6 className="fw-bold mb-3">Quick Actions</h6>
                                                                        <div className="d-flex gap-2 flex-wrap">
                                                                            <button className="btn btn-sm btn-outline-primary">
                                                                                Send Email
                                                                            </button>
                                                                            <button className="btn btn-sm btn-outline-success">
                                                                                Mark as Shipped
                                                                            </button>
                                                                            <button className="btn btn-sm btn-outline-info">
                                                                                Print Label
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderManagement;