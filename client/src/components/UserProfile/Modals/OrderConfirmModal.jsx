import React from 'react';

const OrderConfirmModal = ({ 
    onClose, 
    order, 
    onConfirm,
    title = 'Confirm Order Receipt',
    message = 'Please confirm that you have received your order in good condition.',
    confirmText = 'Confirm Receipt',
    confirmClass = 'btn-success'
}) => {
    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title tc-6533 fw-bold">
                            {title}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="text-center mb-4">
                            <div className="mb-3">
                                <svg width="64" height="64" viewBox="0 0 24 24" className={confirmClass.includes('danger') ? 'text-danger' : confirmClass.includes('warning') ? 'text-warning' : 'text-success'}>
                                    <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                                </svg>
                            </div>
                            <h5 className="tc-6533 mb-2">{title} #{order.id}</h5>
                            <p className="text-muted mb-3">
                                {message}
                            </p>
                        </div>

                        <div className="border rounded p-3 mb-4">
                            <div className="row align-items-center">
                                <div className="col-3">
                                    <img
                                        src={order.image}
                                        alt="Order"
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '60px', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="col-9">
                                    <h6 className="tc-6533 mb-1">Order #{order.id}</h6>
                                    <p className="mb-1 small text-muted">
                                        {order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}
                                    </p>
                                    <p className="mb-0 small">
                                        <strong>Total: ${order.total.toFixed(2)}</strong> • {order.items} items
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h6 className="tc-6533 mb-3">Order Condition</h6>
                            <div className="form-check mb-2">
                                <input className="form-check-input" type="radio" name="condition" id="condition-good" defaultChecked />
                                <label className="form-check-label" htmlFor="condition-good">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-success">
                                        <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                                    </svg>
                                    All items received in perfect condition
                                </label>
                            </div>
                            <div className="form-check mb-2">
                                <input className="form-check-input" type="radio" name="condition" id="condition-minor" />
                                <label className="form-check-label" htmlFor="condition-minor">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-warning">
                                        <path fill="currentColor" d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
                                    </svg>
                                    Minor packaging damage, items are fine
                                </label>
                            </div>
                            <div className="form-check mb-3">
                                <input className="form-check-input" type="radio" name="condition" id="condition-damaged" />
                                <label className="form-check-label" htmlFor="condition-damaged">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-danger">
                                        <path fill="currentColor" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                                    </svg>
                                    Items damaged or missing
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label tc-6533 fw-semibold">Additional Comments (Optional)</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Any additional feedback about your delivery experience..."
                            ></textarea>
                        </div>

                        <div className="alert alert-info">
                            <small>
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                    <path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                </svg>
                                Confirming receipt helps us improve our delivery service and enables you to leave product reviews.
                            </small>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary btn-rd" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={`btn ${confirmClass} btn-rd`}
                            onClick={() => {
                                if (onConfirm) {
                                    onConfirm();
                                } else {
                                    alert('Thank you for confirming receipt of your order!');
                                    onClose();
                                }
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="white">
                                <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                            </svg>
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmModal;