import React, { useEffect } from 'react';
import { useUserProfile } from '../../context/UserProfileContext';

const PaymentMethodsTab = ({ handlePaymentMethodAction }) => {
    const { paymentMethods, loading, error, loadPaymentMethods } = useUserProfile();

    useEffect(() => {
        loadPaymentMethods();
    }, [loadPaymentMethods]);
    return (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Payment Methods</h3>
                <button 
                    className="btn btn-c-2101 btn-rd"
                    onClick={() => handlePaymentMethodAction(null, 'add')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Payment Method
                </button>
            </div>

            {loading && (
                <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading payment methods...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {!loading && !error && paymentMethods.length === 0 && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.11,4 20,4Z" />
                    </svg>
                    <h5 className="text-muted">No Payment Methods</h5>
                    <p className="text-muted mb-4">You haven't added any payment methods yet.</p>
                </div>
            )}

            <div className="row">
                {!loading && paymentMethods.map((method) => (
                    <div key={method._id} className="col-md-6 mb-4">
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
                                                    onClick={() => handlePaymentMethodAction(method._id, 'setDefault')}
                                                >
                                                    Set as Default
                                                </button>
                                            </li>
                                        )}
                                        <li>
                                            <button
                                                className="dropdown-item text-danger"
                                                onClick={() => handlePaymentMethodAction(method._id, 'delete')}
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