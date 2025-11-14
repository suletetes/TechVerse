import React, { useState } from "react";
import { Toast } from '../Common';

const AdminOrders = ({ 
    recentOrders = [], 
    getStatusColor, 
    formatCurrency,
    onUpdateOrderStatus,
    onCancelOrder,
    onRefundOrder,
    onViewOrder,
    onPrintInvoice,
    onSendEmail,
    bulkActions,
    setBulkActions,
    handleBulkAction,
    handleQuickAction,
    filters,
    updateFilter,
    clearFilters,
    handleExport,
    isLoading = false,
    error = null
}) => {
    const [toast, setToast] = useState(null);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedOrders, setSelectedOrders] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);

    const toggleOrderExpansion = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const toggleOrderSelection = (orderId) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrders(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === filteredOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id || o._id)));
        }
    };

    const handleViewOrder = (order) => {
        console.log('👁️ View order clicked:', order);
        
        if (onViewOrder) {
            onViewOrder(order);
        } else {
            // Open order details in new tab
            const orderId = order._id || order.id;
            window.open(`/order/${orderId}`, '_blank');
        }
        
        setToast({
            message: 'Opening order details...',
            type: 'info'
        });
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        console.log('🔄 Update status clicked:', orderId, newStatus);
        
        try {
            if (onUpdateOrderStatus) {
                await onUpdateOrderStatus(orderId, newStatus);
                setToast({
                    message: `Order status updated to ${newStatus}!`,
                    type: 'success'
                });
            } else {
                console.log('⚠️ No onUpdateOrderStatus function provided');
                setToast({
                    message: `Order status updated to ${newStatus}! (Demo mode)`,
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('❌ Error updating order status:', error);
            setToast({
                message: error.message || 'Failed to update order status',
                type: 'error'
            });
        }
    };

    const handleCancelOrder = async (orderId) => {
        console.log('❌ Cancel order clicked:', orderId);
        
        if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            try {
                if (onCancelOrder) {
                    await onCancelOrder(orderId);
                    setToast({
                        message: 'Order cancelled successfully!',
                        type: 'success'
                    });
                } else {
                    console.log('⚠️ No onCancelOrder function provided');
                    setToast({
                        message: 'Order cancelled successfully! (Demo mode)',
                        type: 'success'
                    });
                }
            } catch (error) {
                console.error('❌ Error cancelling order:', error);
                setToast({
                    message: error.message || 'Failed to cancel order',
                    type: 'error'
                });
            }
        }
    };

    const handleRefundOrder = async (orderId) => {
        console.log('💰 Refund order clicked:', orderId);
        
        if (window.confirm('Are you sure you want to refund this order?')) {
            try {
                if (onRefundOrder) {
                    await onRefundOrder(orderId);
                    setToast({
                        message: 'Order refunded successfully!',
                        type: 'success'
                    });
                } else {
                    console.log('⚠️ No onRefundOrder function provided');
                    setToast({
                        message: 'Order refunded successfully! (Demo mode)',
                        type: 'success'
                    });
                }
            } catch (error) {
                console.error('❌ Error refunding order:', error);
                setToast({
                    message: error.message || 'Failed to refund order',
                    type: 'error'
                });
            }
        }
    };

    const handlePrintInvoice = (order) => {
        console.log('🖨️ Print invoice clicked:', order);
        
        if (onPrintInvoice) {
            onPrintInvoice(order);
        } else {
            window.print();
        }
        
        setToast({
            message: 'Preparing invoice for printing...',
            type: 'info'
        });
    };

    const handleSendEmail = async (orderId, emailType = 'confirmation') => {
        console.log('📧 Send email clicked:', orderId, emailType);
        
        try {
            if (onSendEmail) {
                await onSendEmail(orderId, emailType);
                setToast({
                    message: 'Email sent successfully!',
                    type: 'success'
                });
            } else {
                console.log('⚠️ No onSendEmail function provided');
                setToast({
                    message: 'Email sent successfully! (Demo mode)',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('❌ Error sending email:', error);
            setToast({
                message: error.message || 'Failed to send email',
                type: 'error'
            });
        }
    };

    const handleExportOrders = () => {
        console.log('📥 Export orders clicked');
        
        if (handleExport) {
            handleExport(filteredOrders);
        } else {
            // Create CSV export
            const csv = [
                ['Order ID', 'Customer', 'Date', 'Status', 'Items', 'Total'],
                ...filteredOrders.map(order => [
                    order.id,
                    order.customer,
                    new Date(order.date).toLocaleDateString(),
                    order.status,
                    Array.isArray(order.items) ? order.items.length : (order.orderItems?.length || order.items || 0),
                    order.total
                ])
            ].map(row => row.join(',')).join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        }
        
        setToast({
            message: 'Orders exported successfully!',
            type: 'success'
        });
    };

    // Ensure recentOrders is an array
    const safeOrders = Array.isArray(recentOrders) ? recentOrders : [];
    const filteredOrders = safeOrders.filter(order => {
        if (searchTerm) {
            const orderId = (order.orderNumber || order.id || order._id || '').toString().toLowerCase();
            const customerName = (order.customer || order.user?.name || order.shippingAddress?.fullName || '').toLowerCase();
            const customerEmail = (order.customerEmail || order.user?.email || '').toLowerCase();
            
            if (!orderId.includes(searchTerm.toLowerCase()) && 
                !customerName.includes(searchTerm.toLowerCase()) &&
                !customerEmail.includes(searchTerm.toLowerCase())) {
                return false;
            }
        }
        if (statusFilter && order.status.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
        }
        const orderDate = order.date || order.createdAt;
        if (dateFrom && orderDate && new Date(orderDate) < new Date(dateFrom)) {
            return false;
        }
        if (dateTo && orderDate && new Date(orderDate) > new Date(dateTo)) {
            return false;
        }
        return true;
    });

    // Pagination
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    // Order statistics
    const orderStats = {
        total: safeOrders.length,
        pending: safeOrders.filter(o => o.status === 'pending').length,
        processing: safeOrders.filter(o => o.status === 'processing').length,
        shipped: safeOrders.filter(o => o.status === 'shipped').length,
        delivered: safeOrders.filter(o => o.status === 'delivered').length,
        cancelled: safeOrders.filter(o => o.status === 'cancelled').length,
        totalRevenue: safeOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };

    return (
    <div className="store-card fill-card">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
            <div>
                <h3 className="tc-6533 bold-text mb-1">Order Management</h3>
                <p className="text-muted mb-0">Manage and track all customer orders</p>
            </div>
            <div className="d-flex gap-2">
                <button 
                    className="btn btn-outline-success btn-rd d-flex align-items-center"
                    onClick={handleExportOrders}
                    title="Export Orders to CSV"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    Export
                </button>
            </div>
        </div>

        {/* Order Statistics */}
        <div className="row mb-4">
            <div className="col-12">
                <div className="card bg-light border-0">
                    <div className="card-body p-3">
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <div className="d-flex gap-3 flex-wrap">
                                    <span className="badge bg-primary bg-opacity-15 text-primary px-3 py-2">
                                        <strong>{orderStats.total}</strong> Total Orders
                                    </span>
                                    <span className="badge bg-warning bg-opacity-15 text-warning px-3 py-2">
                                        <strong>{orderStats.pending}</strong> Pending
                                    </span>
                                    <span className="badge bg-info bg-opacity-15 text-info px-3 py-2">
                                        <strong>{orderStats.processing}</strong> Processing
                                    </span>
                                    <span className="badge bg-secondary bg-opacity-15 text-secondary px-3 py-2">
                                        <strong>{orderStats.shipped}</strong> Shipped
                                    </span>
                                    <span className="badge bg-success bg-opacity-15 text-success px-3 py-2">
                                        <strong>{orderStats.delivered}</strong> Delivered
                                    </span>
                                    <span className="badge bg-danger bg-opacity-15 text-danger px-3 py-2">
                                        <strong>{orderStats.cancelled}</strong> Cancelled
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-4 text-md-end mt-2 mt-md-0">
                                <div className="text-muted small">Total Revenue</div>
                                <div className="h5 mb-0 text-success fw-bold">{formatCurrency(orderStats.totalRevenue)}</div>
                            </div>
                        </div>
                    </div>
                </div>
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
                    <option value="pending">Pending</option>
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
        {/* Loading State */}
        {isLoading && (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading orders...</span>
                </div>
                <p className="mt-2 text-muted">Loading orders from database...</p>
            </div>
        )}

        {/* Error State */}
        {error && (
            <div className="alert alert-danger mx-4">
                <h5 className="alert-heading">Error Loading Orders</h5>
                <p className="mb-0">{error}</p>
            </div>
        )}

        {/* Orders Table */}
        {!isLoading && !error && (
            <>
                <div className="admin-table-container">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="border-0 fw-semibold" width="40">
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input"
                                            checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
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
                                {currentOrders.map((order) => {
                                    const orderId = order.id || order._id;
                                    return (
                                        <React.Fragment key={orderId}>
                                            <tr className="border-bottom">
                                                <td>
                                                    <input 
                                                        type="checkbox" 
                                                        className="form-check-input"
                                                        checked={selectedOrders.has(orderId)}
                                                        onChange={() => toggleOrderSelection(orderId)}
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => toggleOrderExpansion(orderId)}
                                                        style={{ width: '32px', height: '32px' }}
                                                    >
                                                        <svg 
                                                            width="14" 
                                                            height="14" 
                                                            viewBox="0 0 24 24" 
                                                            style={{ 
                                                                transform: expandedOrders.has(orderId) ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                transition: 'transform 0.2s ease'
                                                            }}
                                                        >
                                                            <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                <td className="fw-bold text-primary">
                                    {order.orderNumber || order.id || order._id || 'N/A'}
                                </td>
                                <td>
                                    <div>
                                        <div className="fw-medium">
                                            {order.customer || 
                                             order.user?.name || 
                                             order.shippingAddress?.fullName || 
                                             order.user?.email?.split('@')[0] || 
                                             'Guest'}
                                        </div>
                                        {(order.customerEmail || order.user?.email) && (
                                            <small className="text-muted">
                                                {order.customerEmail || order.user?.email}
                                            </small>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <div>
                                            {order.date 
                                                ? new Date(order.date).toLocaleDateString()
                                                : order.createdAt 
                                                    ? new Date(order.createdAt).toLocaleDateString()
                                                    : 'N/A'
                                            }
                                        </div>
                                        <small className="text-muted">
                                            {order.date 
                                                ? new Date(order.date).toLocaleTimeString()
                                                : order.createdAt 
                                                    ? new Date(order.createdAt).toLocaleTimeString()
                                                    : ''
                                            }
                                        </small>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td>
                                    <span className="fw-medium">
                                        {Array.isArray(order.items) 
                                            ? order.items.length 
                                            : (order.orderItems?.length || order.items || 0)
                                        }
                                    </span> items
                                </td>
                                <td className="fw-bold tc-6533">{formatCurrency(order.total)}</td>
                                                <td className="text-center">
                                                    <div className="btn-group btn-group-sm">
                                                        <button 
                                                            className="btn btn-outline-info btn-sm" 
                                                            onClick={() => handleViewOrder(order)}
                                                            title="View Order Details"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            className="btn btn-outline-primary btn-sm" 
                                                            onClick={() => handlePrintInvoice(order)}
                                                            title="Print Invoice"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                                <path fill="currentColor" d="M18,3H6V7H18M19,12A1,1 0 0,1 18,11A1,1 0 0,1 19,10A1,1 0 0,1 20,11A1,1 0 0,1 19,12M16,19H8V14H16M19,8H5A3,3 0 0,0 2,11V17H6V21H18V17H22V11A3,3 0 0,0 19,8Z" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            className="btn btn-outline-success btn-sm" 
                                                            onClick={() => handleSendEmail(orderId, 'confirmation')}
                                                            title="Send Email"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24">
                                                                <path fill="currentColor" d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                                                            </svg>
                                                        </button>
                                                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                            <button 
                                                                className="btn btn-outline-danger btn-sm" 
                                                                onClick={() => handleCancelOrder(orderId)}
                                                                title="Cancel Order"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                                    <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedOrders.has(orderId) && (
                                                <tr className="expanded-details">
                                                    <td colSpan="9" className="p-0">
                                        <div className="bg-light border-top">
                                            <div className="p-4">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <h6 className="fw-bold mb-3">Order Details</h6>
                                                        <div className="mb-2">
                                                            <strong>Order ID:</strong> {order.orderNumber || order.id || order._id || 'N/A'}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Order Date:</strong> {
                                                                order.date 
                                                                    ? new Date(order.date).toLocaleString()
                                                                    : order.createdAt 
                                                                        ? new Date(order.createdAt).toLocaleString()
                                                                        : 'N/A'
                                                            }
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Payment Method:</strong> {order.paymentMethod || order.payment?.method || 'Credit Card'}
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
                                                            <strong>Name:</strong> {
                                                                order.customer || 
                                                                order.user?.name || 
                                                                order.shippingAddress?.fullName || 
                                                                'N/A'
                                                            }
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Email:</strong> {
                                                                order.customerEmail || 
                                                                order.user?.email || 
                                                                'N/A'
                                                            }
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Phone:</strong> {
                                                                order.customerPhone || 
                                                                order.shippingAddress?.phone || 
                                                                order.user?.phone || 
                                                                'N/A'
                                                            }
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Shipping Address:</strong><br />
                                                            <small className="text-muted">
                                                                {order.shippingAddress && typeof order.shippingAddress === 'object' 
                                                                    ? `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zipCode || ''}`
                                                                    : order.shippingAddress || 'N/A'
                                                                }
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
                                                            {(order.orderItems || order.items || [
                                                                { id: 1, name: 'Tablet Air', sku: 'TAB-001', quantity: 1, price: order.total / 2 },
                                                                { id: 2, name: 'Phone Pro', sku: 'PHN-002', quantity: 1, price: 50 }
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
                                                                                {item.variants && typeof item.variants === 'object' && (
                                                                                    <small className="text-muted">
                                                                                        {Object.entries(item.variants)
                                                                                            .map(([key, value]) => `${key}: ${value}`)
                                                                                            .join(', ')}
                                                                                    </small>
                                                                                )}
                                                                                {item.variant && typeof item.variant === 'string' && (
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
                                                
                                                                <div className="mt-3 d-flex gap-2 flex-wrap">
                                                                    <select 
                                                                        className="form-select form-select-sm w-auto"
                                                                        onChange={(e) => handleUpdateStatus(orderId, e.target.value)}
                                                                        defaultValue={order.status}
                                                                    >
                                                                        <option value="">Update Status</option>
                                                                        <option value="pending">Pending</option>
                                                                        <option value="processing">Processing</option>
                                                                        <option value="shipped">Shipped</option>
                                                                        <option value="delivered">Delivered</option>
                                                                        <option value="cancelled">Cancelled</option>
                                                                    </select>
                                                                    <button 
                                                                        className="btn btn-outline-primary btn-sm"
                                                                        onClick={() => handlePrintInvoice(order)}
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                                                            <path fill="currentColor" d="M18,3H6V7H18M19,12A1,1 0 0,1 18,11A1,1 0 0,1 19,10A1,1 0 0,1 20,11A1,1 0 0,1 19,12M16,19H8V14H16M19,8H5A3,3 0 0,0 2,11V17H6V21H18V17H22V11A3,3 0 0,0 19,8Z" />
                                                                        </svg>
                                                                        Print Invoice
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-outline-success btn-sm"
                                                                        onClick={() => handleSendEmail(orderId, 'confirmation')}
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                                                            <path fill="currentColor" d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                                                                        </svg>
                                                                        Send Email
                                                                    </button>
                                                                    {order.status === 'delivered' && (
                                                                        <button 
                                                                            className="btn btn-outline-warning btn-sm"
                                                                            onClick={() => handleRefundOrder(orderId)}
                                                                        >
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                                                                <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,17V16H9V14H13A1,1 0 0,0 14,13V11A1,1 0 0,0 13,10H9V8H15V7H13V6H11V7H9A1,1 0 0,0 8,8V10A1,1 0 0,0 9,11H13V13H7V14H9V15H11V17Z" />
                                                                            </svg>
                                                                            Refund Order
                                                                        </button>
                                                                    )}
                                                                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                                        <button 
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            onClick={() => handleCancelOrder(orderId)}
                                                                        >
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" className="me-1">
                                                                                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                                                            </svg>
                                                                            Cancel Order
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="text-muted">
                            Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
                        </div>
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = index + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = index + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + index;
                                    } else {
                                        pageNum = currentPage - 2 + index;
                                    }
                                    
                                    return (
                                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                })}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}

                {/* Empty State */}
                {filteredOrders.length === 0 && (
                    <div className="text-center py-5">
                        <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                            <path fill="currentColor" d="M19,7H18V6A2,2 0 0,0 16,4H8A2,2 0 0,0 6,6V7H5A2,2 0 0,0 3,9V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V9A2,2 0 0,0 19,7M8,6H16V7H8V6M19,20H5V9H19V20Z" />
                        </svg>
                        <h5 className="text-muted">No orders found</h5>
                        <p className="text-muted">
                            {searchTerm || statusFilter || dateFrom || dateTo
                                ? 'Try adjusting your search or filter criteria'
                                : 'No orders have been placed yet'
                            }
                        </p>
                        {(searchTerm || statusFilter || dateFrom || dateTo) && (
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('');
                                    setDateFrom('');
                                    setDateTo('');
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </>
        )}

        {/* Toast Notifications */}
        {toast && (
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
            />
        )}
    </div>
    );
};

export default AdminOrders;
