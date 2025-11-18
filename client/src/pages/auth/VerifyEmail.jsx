import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification, user, isAuthenticated } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error, pending
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleVerification();
    } else {
      setStatus('pending');
      setMessage('Please check your email for the verification link.');
    }
  }, [token]);

  const handleVerification = async () => {
    try {
      setStatus('verifying');
      await verifyEmail(token);
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Verification failed. The link may be expired or invalid.');
    }
  };

  const handleResendEmail = async () => {
    if (!isAuthenticated || !user?.email) {
      setMessage('Please log in to resend verification email.');
      return;
    }

    try {
      setResending(true);
      await resendVerification(user.email);
      setStatus('success');
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to send verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  {status === 'verifying' && (
                    <>
                      <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <h3 className="mb-2">Verifying Email</h3>
                      <p className="text-muted">Please wait while we verify your email address...</p>
                    </>
                  )}

                  {status === 'success' && (
                    <>
                      <div className="text-success mb-3">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <h3 className="mb-2 text-success">Email Verified!</h3>
                      <p className="text-muted">{message}</p>
                      <p className="text-muted small">Redirecting to login...</p>
                    </>
                  )}

                  {status === 'error' && (
                    <>
                      <div className="text-danger mb-3">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                      </div>
                      <h3 className="mb-2 text-danger">Verification Failed</h3>
                      <p className="text-muted">{message}</p>
                    </>
                  )}

                  {status === 'pending' && (
                    <>
                      <div className="text-warning mb-3">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                      </div>
                      <h3 className="mb-2">Verify Your Email</h3>
                      <p className="text-muted">{message}</p>
                      {isAuthenticated && user?.email && (
                        <p className="text-muted small">
                          Verification email sent to: <strong>{user.email}</strong>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {status === 'pending' && (
                  <div className="mt-4">
                    <div className="alert alert-info">
                      <h6 className="alert-heading mb-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        Until you verify your email, you cannot:
                      </h6>
                      <ul className="mb-0 small">
                        <li>Place orders or make purchases</li>
                        <li>Write product reviews</li>
                        <li>Save addresses for checkout</li>
                        <li>Access your order history</li>
                        <li>Receive important account notifications</li>
                      </ul>
                    </div>

                    {isAuthenticated && user?.email && (
                      <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={handleResendEmail}
                        disabled={resending}
                      >
                        {resending ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                            Resend Verification Email
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {status === 'error' && (
                  <div className="mt-4">
                    {isAuthenticated && user?.email && (
                      <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={handleResendEmail}
                        disabled={resending}
                      >
                        {resending ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          'Resend Verification Email'
                        )}
                      </button>
                    )}
                  </div>
                )}

                <div className="text-center mt-4">
                  <Link to="/login" className="text-decoration-none">
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
