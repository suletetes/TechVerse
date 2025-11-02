import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// AdminHeader removed for cleaner interface
import { OrdersTable } from '../../components/tables';

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

    // Order action handlers
    const handleViewOrder = (order) => {
        console.log('View order:', order);
        // Navigate to order details or open modal
    };

    const handleEditOrder = (order) => {
        console.log('Edit order:', order);
        // Navigate to edit form or open modal
    };

    const handlePrintInvoice = (order) => {
        console.log('Print invoice for order:', order.id);
        // Generate and print invoice
    };

    const handleSendEmail = (order) => {
        console.log('Send email for order:', order.id);
        // Send email to customer
    };

    const handleMarkAsShipped = (order) => {
        setOrders(Array.isArray(orders) ? orders.map(o => 
            o.id === order.id 
                ? { ...o, status: 'Shipped' }
                : o
        ) : []);
    };

    const handlePrintLabel = (order) => {
        console.log('Print shipping label for order:', order.id);
        // Generate and print shipping label
    };

    const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
        if (filters.status !== 'all' && order.status.toLowerCase() !== filters.status.toLowerCase()) return false;
        if (filters.customer && !order.customer.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.dateFrom && new Date(order.date) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && new Date(order.date) > new Date(filters.dateTo)) return false;
        return true;
    }) : [];

    const adminData = {
        name: 'Sarah Johnson',
        role: 'Super Admin',
        email: 'sarah.johnson@techverse.com',
        avatar: null
    };

    return (
        <div className="min-vh-100 bg-light">
            {/* AdminHeader removed for cleaner interface */}
            
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
                                <h2 className="stats-value">{Array.isArray(orders) ? orders.filter(o => o.status === 'Processing').length : 0}</h2>
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
                                <h2 className="stats-value">{Array.isArray(orders) ? orders.filter(o => o.status === 'Shipped').length : 0}</h2>
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
                                <h2 className="stats-value">{Array.isArray(orders) ? orders.filter(o => o.status === 'Delivered').length : 0}</h2>
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
                        <OrdersTable
                            orders={filteredOrders}
                            onView={handleViewOrder}
                            onEdit={handleEditOrder}
                            onPrintInvoice={handlePrintInvoice}
                            onSendEmail={handleSendEmail}
                            onMarkAsShipped={handleMarkAsShipped}
                            onPrintLabel={handlePrintLabel}
                            enableSelection={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderManagement;