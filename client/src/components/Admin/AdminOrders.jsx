import React, { useState } from "react";

const AdminOrders = ({ 
    recentOrders, 
    getStatusColor, 
    formatCurrency,
    bulkActions,
    setBulkActions,
    handleBulkAction,
    handleQuickAction,
    filters,
    updateFilter,
    clearFilters,
    handleExport
}) => {
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const toggleOrderExpansion = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const filteredOrders = recentOrders.filter(order => {
        if (searchTerm && !order.id.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !order.customer.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        if (statusFilter && order.status.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
        }
        if (dateFrom && new Date(order.date) < new Date(dateFrom)) {
            return false;
        }
        if (dateTo && new Date(order.date) > new Date(dateTo)) {
            return false;
        }
        return true;
    });

    return (
    <div className="store-card fill-card">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="tc-6533 bold-text mb-0">Order Management</h3>
            <div className="d-flex gap-2">
                <button className="btn btn-outline-success btn-rd btn-sm">Export</button>
                <select className="form-select w-auto">
                    <option value="">All Orders</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                </select>
            </div>
        </div>
        <div className="row mb-3">
            <div className="col-md-3">
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
                        placeholder="Search orders or customers..." 
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
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            <div className="col-md-3">
                <input 
                    type="date" 
                    className="form-control" 
                    placeholder="From date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                />
            </div>
            <div className="col-md-3">
                <input 
                    type="date" 
                    className="form-control" 
                    placeholder="To date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                />
            </div>
        </div>
        <div className="admin-table-container">
            <div className="table-responsive">
                <table className="table table-hover">
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
                            <tr className="border-bottom">
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => toggleOrderExpansion(order.id)}
                                        style={{ width: '32px', height: '32px' }}
                                    >
                                        <svg 
                                            width="14" 
                                            height="14" 
                                            viewBox="0 0 24 24" 
                                            style={{ 
                                                transform: expandedOrders.has(order.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        >
                                            <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                                        </svg>
                                    </button>
                                </td>
                                <td className="fw-bold text-primary">{order.id}</td>
                                <td>
                                    <div>
                                        <div className="fw-medium">{order.customer}</div>
                                        {order.customerEmail && (
                                            <small className="text-muted">{order.customerEmail}</small>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <div>{new Date(order.date).toLocaleDateString()}</div>
                                        <small className="text-muted">{new Date(order.date).toLocaleTimeString()}</small>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td>
                                    <span className="fw-medium">{order.items}</span> items
                                </td>
                                <td className="fw-bold tc-6533">{formatCurrency(order.total)}</td>
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
                                        <div className="bg-light border-top">
                                            <div className="p-4">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <h6 className="fw-bold mb-3">Order Details</h6>
                                                        <div className="mb-2">
                                                            <strong>Order ID:</strong> {order.id}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Order Date:</strong> {new Date(order.date).toLocaleString()}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Payment Method:</strong> {order.paymentMethod || 'Credit Card'}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Payment Status:</strong> 
                                                            <span className={`badge bg-${order.paymentStatus === 'paid' ? 'success' : 'warning'} ms-2`}>
                                                                {order.paymentStatus || 'Paid'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <h6 className="fw-bold mb-3">Customer Information</h6>
                                                        <div className="mb-2">
                                                            <strong>Name:</strong> {order.customer}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Email:</strong> {order.customerEmail || 'customer@example.com'}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Phone:</strong> {order.customerPhone || '+1 (555) 123-4567'}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Shipping Address:</strong><br />
                                                            <small className="text-muted">
                                                                {order.shippingAddress || '123 Main St, City, State 12345'}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <hr className="my-4" />
                                                
                                                <h6 className="fw-bold mb-3">Order Items</h6>
                                                <div className="table-responsive">
                                                    <table className="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Product</th>
                                                                <th>SKU</th>
                                                                <th>Quantity</th>
                                                                <th>Unit Price</th>
                                                                <th>Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(order.orderItems || [
                                                                { id: 1, name: 'Tablet Air', sku: 'TAB-001', quantity: 1, price: order.total / order.items },
                                                                { id: 2, name: 'Phone Pro', sku: 'PHN-002', quantity: order.items - 1, price: 50 }
                                                            ]).map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <img 
                                                                                src={item.image || '../img/product-placeholder.jpg'} 
                                                                                alt={item.name}
                                                                                className="rounded me-2"
                                                                                width="40"
                                                                                height="40"
                                                                                style={{ objectFit: 'cover' }}
                                                                            />
                                                                            <div>
                                                                                <div className="fw-medium">{item.name}</div>
                                                                                {item.variant && (
                                                                                    <small className="text-muted">{item.variant}</small>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td><small className="text-muted">{item.sku}</small></td>
                                                                    <td>{item.quantity}</td>
                                                                    <td>{formatCurrency(item.price)}</td>
                                                                    <td className="fw-medium">{formatCurrency(item.price * item.quantity)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr>
                                                                <td colSpan="4" className="text-end fw-bold">Subtotal:</td>
                                                                <td className="fw-bold">{formatCurrency(order.subtotal || order.total * 0.9)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td colSpan="4" className="text-end">Shipping:</td>
                                                                <td>{formatCurrency(order.shipping || order.total * 0.05)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td colSpan="4" className="text-end">Tax:</td>
                                                                <td>{formatCurrency(order.tax || order.total * 0.05)}</td>
                                                            </tr>
                                                            <tr className="table-active">
                                                                <td colSpan="4" className="text-end fw-bold">Total:</td>
                                                                <td className="fw-bold text-success">{formatCurrency(order.total)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                                
                                                <div className="mt-3 d-flex gap-2">
                                                    <button className="btn btn-primary btn-sm">
                                                        Update Status
                                                    </button>
                                                    <button className="btn btn-outline-secondary btn-sm">
                                                        Print Invoice
                                                    </button>
                                                    <button className="btn btn-outline-info btn-sm">
                                                        Send Email
                                                    </button>
                                                    <button className="btn btn-outline-warning btn-sm">
                                                        Add Note
                                                    </button>
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
    );
};

export default AdminOrders;
