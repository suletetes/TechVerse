import React from 'react';
import { Link } from 'react-router-dom';

const OrdersTab = ({ 
    orders, 
    orderFilters, 
    setOrderFilters, 
    getFilteredOrders, 
    handleOrderAction, 
    getStatusColor 
}) => {
    return (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Order History</h3>
                <span className="badge bg-secondary">{getFilteredOrders().length} orders</span>
            </div>

            {/* Order Filters */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by order ID..."
                        value={orderFilters.searchTerm}
                        onChange={(e) => setOrderFilters({ ...orderFilters, searchTerm: e.target.value })}
                    />
                </div>
                <div className="col-md-4 mb-3">
                    <select
                        className="form-select"
                        value={orderFilters.status}
                        onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value })}
                    >
                        <option value="all">All Status</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="col-md-4 mb-3">
                    <select
                        className="form-select"
                        value={orderFilters.dateRange}
                        onChange={(e) => setOrderFilters({ ...orderFilters, dateRange: e.target.value })}
                    >
                        <option value="all">All Time</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                        <option value="1year">Last Year</option>
                    </select>
                </div>
            </div>

            {getFilteredOrders().length === 0 ? (
                <div className="text-center py-5">
                    <h5 className="tc-6533 mb-3">No orders yet</h5>
                    <p className="tc-6533 mb-4">Start shopping to see your orders here</p>
                    <Link to="/" className="btn btn-c-2101 btn-rd">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {getFilteredOrders().map((order) => (
                        <div key={order.id} className="col-12 mb-3">
                            <div className="border rounded p-3">
                                <div className="row align-items-center">
                                    <div className="col-md-2 col-3 mb-3 mb-md-0">
                                        <img
                                            src={order.image}
                                            className="img-fluid rounded"
                                            alt="Order"
                                            width="60"
                                            height="60"
                                        />
                                    </div>
                                    <div className="col-md-3 col-9 mb-3 mb-md-0">
                                        <h6 className="tc-6533 mb-1">Order #{order.id}</h6>
                                        <p className="tc-6533 sm-text mb-1">{order.date}</p>
                                        <p className="tc-6533 sm-text mb-0">{order.items} items</p>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3 mb-md-0">
                                        <span className={`badge bg-${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="col-md-2 col-6 mb-3 mb-md-0">
                                        <p className="tc-6533 bold-text mb-0">£{order.total.toFixed(2)}</p>
                                    </div>
                                    <div className="col-md-3 col-12">
                                        <div className="d-flex gap-1 flex-wrap">
                                            <button className="btn btn-sm btn-outline-primary btn-rd">
                                                View Details
                                            </button>
                                            {order.trackingNumber && (
                                                <button
                                                    className="btn btn-sm btn-outline-info btn-rd"
                                                    onClick={() => handleOrderAction(order.id, 'track')}
                                                >
                                                    Track
                                                </button>
                                            )}
                                            {order.canReturn && (
                                                <button
                                                    className="btn btn-sm btn-outline-warning btn-rd"
                                                    onClick={() => handleOrderAction(order.id, 'return')}
                                                >
                                                    Return
                                                </button>
                                            )}
                                            {order.canReorder && (
                                                <button
                                                    className="btn btn-sm btn-outline-secondary btn-rd"
                                                    onClick={() => handleOrderAction(order.id, 'reorder')}
                                                >
                                                    Reorder
                                                </button>
                                            )}
                                            {order.status === 'Delivered' && (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-success btn-rd"
                                                        onClick={() => handleOrderAction(order.id, 'confirm')}
                                                    >
                                                        Confirm Receipt
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-c-2101 btn-rd"
                                                        onClick={() => handleOrderAction(order.id, 'review')}
                                                    >
                                                        Write Review
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersTab;