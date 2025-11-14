import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { LoadingSpinner } from '../../components/Common';

const Signup = () => {
    const navigate = useNavigate();
    const { register, isLoading, error, isAuthenticated, clearError } = useAuth();
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
        subscribeNewsletter: false
    });

    const [validationErrors, setValidationErrors] = useState({});

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Clear errors when component mounts
    useEffect(() => {
        clearError();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const validateForm = () => {
        const errors = {};

        // Name validation
        if (!formData.firstName.trim()) {
            errors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            errors.lastName = 'Last name is required';
        }

        // Email validation
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        // Terms validation
        if (!formData.agreeToTerms) {
            errors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            const userData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                confirmPassword: formData.confirmPassword
            };

            const result = await register(userData);

            if (result.requiresVerification) {
                // Redirect to verification page or show message
                navigate('/login', { 
                    state: { 
                        message: 'Registration successful! Please check your email to verify your account.',
                        email: userData.email
                    }
                });
            } else {
                // Registration successful, user is logged in
                navigate('/');
            }
        } catch (err) {
            // Error is handled by AuthContext and displayed via notifications
            console.error('Registration error:', err);
        }
    };

    const handleGoogleSignup = () => {
        // TODO: Implement Google OAuth
        console.log('Google signup clicked');
    };

    const handleAppleSignup = () => {
        // TODO: Implement Apple OAuth
        console.log('Apple signup clicked');
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="signup-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="row">
                            {/* Welcome Section */}
                            <div className="text-start mb-4 mb-lg-0 d-flex col-lg-5 offset-lg-1 col-sm-10 offset-sm-1">
                                <div className="store-card fill-card primary-gradient-bg">
                                    <h1 className="mb-4 tc-2175 bold-text">
                                        Join TechVerse
                                    </h1>
                                    <p className="mb-4 tc-654 lg-sub-title">
                                        Create your <span className="tc-2175 bold-text">TechVerse</span> account and unlock a world of cutting-edge technology at unbeatable prices.
                                    </p>
                                    <div className="mb-4">
                                        <h5 className="tc-2175 mb-3">Member Benefits</h5>
                                        <ul className="tc-654" style={{listStyle: 'none', padding: 0}}>
                                            <li className="mb-2"> Exclusive member-only deals</li>
                                            <li className="mb-2"> Free shipping on orders over £50</li>
                                            <li className="mb-2"> Early access to new products</li>
                                            <li className="mb-2"> Easy returns and exchanges</li>
                                            <li className="mb-2"> Priority customer support</li>
                                        </ul>
                                    </div>
                                    <p className="tc-654 sm-text">
                                        Already have an account? <Link to="/login" className="tc-2175 bold-text">Sign in here</Link>
                                    </p>
                                </div>
                            </div>

                            {/* Signup Form Section */}
                            <div className="text-start offset-lg-0 col-lg-5 offset-sm-1 col-sm-10">
                                <div className="store-card fill-card">
                                    <h2 className="mb-4 tc-6533 bold-text text-center">Create Account</h2>
                                    
                                    {/* Social Signup Buttons */}
                                    <div className="mb-4">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-dark w-100 mb-3 d-flex align-items-center justify-content-center"
                                            onClick={handleGoogleSignup}
                                            style={{padding: '12px'}}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                            </svg>
                                            Sign up with Google
                                        </button>
                                        
                                        <button 
                                            type="button" 
                                            className="btn btn-dark w-100 mb-3 d-flex align-items-center justify-content-center"
                                            onClick={handleAppleSignup}
                                            style={{padding: '12px'}}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                            </svg>
                                            Sign up with Apple
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="text-center mb-4">
                                        <div className="d-flex align-items-center">
                                            <hr className="flex-grow-1"/>
                                            <span className="px-3 tc-6533 sm-text">or</span>
                                            <hr className="flex-grow-1"/>
                                        </div>
                                    </div>

                                    {/* Error Display */}
                                    {error && (
                                        <div className="alert alert-danger mb-4" role="alert">
                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                            {error}
                                        </div>
                                    )}

                                    {/* Signup Form */}
                                    <form onSubmit={handleSubmit}>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group mb-3">
                                                    <label className="form-label tc-6533 bold-text">
                                                        First Name
                                                    </label>
                                                    <input 
                                                        type="text"
                                                        name="firstName"
                                                        className={`form-control ${validationErrors.firstName ? 'is-invalid' : ''}`}
                                                        placeholder="First name"
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        disabled={isLoading}
                                                        style={{padding: '12px'}}
                                                    />
                                                    {validationErrors.firstName && (
                                                        <div className="invalid-feedback">
                                                            {validationErrors.firstName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group mb-3">
                                                    <label className="form-label tc-6533 bold-text">
                                                        Last Name
                                                    </label>
                                                    <input 
                                                        type="text"
                                                        name="lastName"
                                                        className={`form-control ${validationErrors.lastName ? 'is-invalid' : ''}`}
                                                        placeholder="Last name"
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        disabled={isLoading}
                                                        style={{padding: '12px'}}
                                                    />
                                                    {validationErrors.lastName && (
                                                        <div className="invalid-feedback">
                                                            {validationErrors.lastName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label tc-6533 bold-text">
                                                Email Address
                                            </label>
                                            <input 
                                                type="email"
                                                name="email"
                                                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                                                placeholder="Enter your email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                                style={{padding: '12px'}}
                                            />
                                            {validationErrors.email && (
                                                <div className="invalid-feedback">
                                                    {validationErrors.email}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label tc-6533 bold-text">
                                                Password
                                            </label>
                                            <input 
                                                type="password"
                                                name="password"
                                                className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                                                placeholder="Create a password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                                style={{padding: '12px'}}
                                            />
                                            {validationErrors.password && (
                                                <div className="invalid-feedback">
                                                    {validationErrors.password}
                                                </div>
                                            )}
                                            <div className="form-text">
                                                Password must be at least 8 characters with uppercase, lowercase, and number.
                                            </div>
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label tc-6533 bold-text">
                                                Confirm Password
                                            </label>
                                            <input 
                                                type="password"
                                                name="confirmPassword"
                                                className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                                                placeholder="Confirm your password"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                                style={{padding: '12px'}}
                                            />
                                            {validationErrors.confirmPassword && (
                                                <div className="invalid-feedback">
                                                    {validationErrors.confirmPassword}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-check mb-3">
                                            <input 
                                                className={`form-check-input ${validationErrors.agreeToTerms ? 'is-invalid' : ''}`}
                                                type="checkbox" 
                                                name="agreeToTerms"
                                                id="agreeToTerms"
                                                checked={formData.agreeToTerms}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                            />
                                            <label className="form-check-label tc-6533 sm-text" htmlFor="agreeToTerms">
                                                I agree to the <Link to="/terms" className="tc-2101"> Terms of Service </Link> and <Link to="/privacy" className="tc-2101"> Privacy Policy</Link>
                                            </label>
                                            {validationErrors.agreeToTerms && (
                                                <div className="invalid-feedback d-block">
                                                    {validationErrors.agreeToTerms}
                                                </div>
                                            )}
                                        </div>

                                        {/* 
                                        <div className="form-check mb-4">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                name="subscribeNewsletter"
                                                id="subscribeNewsletter"
                                                checked={formData.subscribeNewsletter}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                            />
                                            <label className="form-check-label tc-6533 sm-text" htmlFor="subscribeNewsletter">
                                                Subscribe to our newsletter for exclusive deals and updates
                                            </label>
                                        </div>
                                         */}

                                        <button 
                                            className="bloc-button btn btn-lg w-100 btn-c-2101 btn-rd mb-3" 
                                            type="submit"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <LoadingSpinner size="sm" className="me-2" />
                                                    Creating Account...
                                                </>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </button>
                                    </form>

                                    {/* Login Link */}
                                    <div className="text-center">
                                        <p className="tc-6533 sm-text mb-0">
                                            Already have an account? 
                                            <Link to="/login" className="tc-2101 bold-text ms-1">
                                                Sign in here
                                            </Link>
                                        </p>
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

export default Signup;