import React from 'react';
import { Link } from 'react-router-dom';

const OrdersTab = ({ orders, onTrackOrder }) => {
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'success';
            case 'shipped': return 'info';
            case 'processing': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    };

    return (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Order History</h3>
                <span className="badge bg-secondary">{orders.length} orders</span>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-5">
                    <h5 className="tc-6533 mb-3">No orders yet</h5>
                    <p className="tc-6533 mb-4">Start shopping to see your orders here</p>
                    <Link to="/" className="btn btn-c-2101 btn-rd">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {orders.map((order) => (
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
                                                    onClick={onTrackOrder}
                                                >
                                                    Track
                                                </button>
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