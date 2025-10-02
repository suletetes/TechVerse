import React from 'react';

const PaymentMethodsTab = ({ paymentMethods, handlePaymentMethodAction }) => {
    return (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Payment Methods</h3>
                <button className="btn btn-c-2101 btn-rd">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add Payment Method
                </button>
            </div>

            <div className="row">
                {paymentMethods.map((method) => (
                    <div key={method.id} className="col-md-6 mb-4">
                        <div className="border rounded p-3 h-100">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="d-flex align-items-center">
                                    <div className="me-3">
                                        {method.brand === 'visa' && (
                                            <div className="bg-primary text-white px-2 py-1 rounded small fw-bold">VISA</div>
                                        )}
                                        {method.brand === 'mastercard' && (
                                            <div className="bg-warning text-dark px-2 py-1 rounded small fw-bold">MC</div>
                                        )}
                                    </div>
                                    <div>
                                        <h6 className="tc-6533 mb-1">•••• •••• •••• {method.last4}</h6>
                                        {method.isDefault && (
                                            <span className="badge bg-primary">Default</span>
                                        )}
                                    </div>
                                </div>
                                <div className="dropdown">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                    >
                                        ⋮
                                    </button>
                                    <ul className="dropdown-menu">
                                        {!method.isDefault && (
                                            <li>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => handlePaymentMethodAction(method.id, 'setDefault')}
                                                >
                                                    Set as Default
                                                </button>
                                            </li>
                                        )}
                                        <li>
                                            <button
                                                className="dropdown-item text-danger"
                                                onClick={() => handlePaymentMethodAction(method.id, 'delete')}
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 bold-text">{method.holderName}</p>
                                <p className="mb-1 text-muted">Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}</p>
                                <div className="d-flex align-items-center mt-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-success">
                                        <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                    </svg>
                                    <small className="text-muted">Secured with 256-bit encryption</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Security Notice */}
            <div className="alert alert-info mt-4">
                <div className="d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                    </svg>
                    <div>
                        <h6 className="alert-heading mb-1">Your payment information is secure</h6>
                        <small className="mb-0">We use industry-standard encryption to protect your payment details. Your card information is never stored on our servers.</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodsTab;