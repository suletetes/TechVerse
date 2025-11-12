import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const PaymentFailed = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const errorMessage = location.state?.error || 'Payment could not be processed';
    const orderData = location.state?.orderData;

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="payment-failed-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        {/* Error Header */}
                        <div className="text-center mb-5">
                            <div className="store-card fill-card">
                                <div className="py-5">
                                    {/* Error Icon */}
                                    <div className="mb-4">
                                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="mx-auto">
                                            <circle cx="12" cy="12" r="10" fill="#dc3545"/>
                                            <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    
                                    <h1 className="tc-6533 bold-text mb-3">Payment Failed</h1>
                                    <p className="tc-6533 lg-sub-title mb-4">
                                        We couldn't process your payment. Please try again or use a different payment method.
                                    </p>
                                    
                                    {/* Error Message */}
                                    <div className="alert alert-danger mx-auto" style={{ maxWidth: '500px' }}>
                                        <strong>Error:</strong> {errorMessage}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* What Happened */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="store-card fill-card">
                                    <h3 className="tc-6533 bold-text mb-4">What Happened?</h3>
                                    <p className="tc-6533 mb-3">
                                        Your payment could not be completed. This could be due to:
                                    </p>
                                    <ul className="tc-6533">
                                        <li>Insufficient funds in your account</li>
                                        <li>Incorrect card details</li>
                                        <li>Card declined by your bank</li>
                                        <li>Network or connection issues</li>
                                        <li>Card security verification failed</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="store-card fill-card">
                                    <h3 className="tc-6533 bold-text mb-4">What Can You Do?</h3>
                                    
                                    <div className="d-grid gap-3">
                                        {/* Try Again */}
                                        <button 
                                            onClick={() => navigate('/payment')}
                                            className="btn btn-c-2101 btn-lg btn-rd"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                                            </svg>
                                            Try Payment Again
                                        </button>

                                        {/* Use Different Card */}
                                        <button 
                                            onClick={() => navigate('/payment', { state: { retry: true } })}
                                            className="btn btn-outline-primary btn-lg btn-rd"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                                                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                                            </svg>
                                            Use Different Payment Method
                                        </button>

                                        {/* Return to Cart */}
                                        <Link 
                                            to="/cart"
                                            className="btn btn-outline-secondary btn-lg btn-rd"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                                            </svg>
                                            Return to Cart
                                        </Link>

                                        {/* Continue Shopping */}
                                        <Link 
                                            to="/"
                                            className="btn btn-link btn-lg"
                                        >
                                            Continue Shopping
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary (if available) */}
                        {orderData && (
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="store-card fill-card">
                                        <h3 className="tc-6533 bold-text mb-4">Your Order Summary</h3>
                                        <p className="tc-6533 mb-3">
                                            Your items are still in your cart. You can try again when you're ready.
                                        </p>
                                        <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded">
                                            <span className="tc-6533 bold-text">Total Amount:</span>
                                            <span className="tc-6533 bold-text h5 mb-0">
                                                ${orderData.total?.toFixed(2) || '0.00'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Help Section */}
                        <div className="row">
                            <div className="col-12">
                                <div className="alert alert-info">
                                    <div className="d-flex align-items-start">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="me-3 mt-1">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                        </svg>
                                        <div>
                                            <strong>Need Help?</strong>
                                            <p className="mb-2">
                                                If you continue to experience issues, please contact your bank or our customer support team.
                                            </p>
                                            <Link to="/contact" className="btn btn-sm btn-outline-primary btn-rd">
                                                Contact Support
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailed;
