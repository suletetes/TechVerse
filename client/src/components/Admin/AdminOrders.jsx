import React from "react";

const AdminOrders = ({ recentOrders, getStatusColor, formatCurrency }) => (
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
            <div className="col-md-4">
                <input type="text" className="form-control" placeholder="Search orders..." />
            </div>
            <div className="col-md-4">
                <input type="date" className="form-control" />
            </div>
            <div className="col-md-4">
                <input type="date" className="form-control" />
            </div>
        </div>
        <div className="table-responsive">
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {recentOrders.map((order) => (
                        <tr key={order.id}>
                            <td className="bold-text">{order.id}</td>
                            <td>{order.customer}</td>
                            <td>{order.date}</td>
                            <td>
                                <select className={`form-select form-select-sm badge-${getStatusColor(order.status)}`} defaultValue={order.status.toLowerCase()}>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </td>
                            <td>{order.items}</td>
                            <td className="bold-text">{formatCurrency(order.total)}</td>
                            <td>
                                <button className="btn btn-sm btn-outline-primary me-1">View</button>
                                <button className="btn btn-sm btn-outline-secondary">Print</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default AdminOrders;
