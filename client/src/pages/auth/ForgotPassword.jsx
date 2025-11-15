import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }

    try {
      setStatus('loading');
      setMessage('');
      
      await forgotPassword(email);
      
      setStatus('success');
      setMessage('Password reset instructions have been sent to your email.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to send reset email. Please try again.');
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
                  <div className="text-primary mb-3">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </div>
                  <h3 className="mb-2">Forgot Password?</h3>
                  <p className="text-muted">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>

                {status === 'success' ? (
                  <div className="alert alert-success" role="alert">
                    <div className="d-flex align-items-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <div>
                        <strong>Email Sent!</strong>
                        <p className="mb-0 small">{message}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {status === 'error' && (
                      <div className="alert alert-danger" role="alert">
                        {message}
                      </div>
                    )}

                    <div className="mb-4">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        disabled={status === 'loading'}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 mb-3"
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : (
                        'Send Reset Instructions'
                      )}
                    </button>
                  </form>
                )}

                <div className="text-center mt-4">
                  <Link to="/login" className="text-decoration-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="me-1" style={{ verticalAlign: 'middle' }}>
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    Back to Login
                  </Link>
                </div>

                {status === 'success' && (
                  <div className="text-center mt-3">
                    <p className="text-muted small mb-0">
                      Didn't receive the email? Check your spam folder or{' '}
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => setStatus('idle')}
                      >
                        try again
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
