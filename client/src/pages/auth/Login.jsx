import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        emailOrUsername: '',
        password: '',
        rememberMe: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Login form submitted:', formData);
        // Handle login logic here
    };

    const handleGoogleLogin = () => {
        console.log('Google login clicked');
        // Handle Google OAuth
    };

    const handleAppleLogin = () => {
        console.log('Apple login clicked');
        // Handle Apple OAuth
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="login-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="row">
                            {/* Welcome Section */}
                            <div className="text-start mb-4 mb-lg-0 d-flex col-lg-5 offset-lg-1 col-sm-10 offset-sm-1">
                                <div className="store-card fill-card primary-gradient-bg">
                                    <h1 className="mb-4 tc-2175 bold-text">
                                        Welcome Back
                                    </h1>
                                    <p className="mb-4 tc-654 lg-sub-title">
                                        Sign in to your <span className="tc-2175 bold-text">TechVerse</span> account to access exclusive deals, track your orders, and enjoy a personalized shopping experience.
                                    </p>
                                    <div className="mb-4">
                                        <h5 className="tc-2175 mb-3">Why sign in?</h5>
                                        <ul className="tc-654" style={{listStyle: 'none', padding: 0}}>
                                            <li className="mb-2">✓ Faster checkout process</li>
                                            <li className="mb-2">✓ Order tracking and history</li>
                                            <li className="mb-2">✓ Exclusive member deals</li>
                                            <li className="mb-2">✓ Personalized recommendations</li>
                                        </ul>
                                    </div>
                                    <p className="tc-654 sm-text">
                                        Don't have an account? <Link to="/signup" className="tc-2175 bold-text">Create one here</Link>
                                    </p>
                                </div>
                            </div>

                            {/* Login Form Section */}
                            <div className="text-start offset-lg-0 col-lg-5 offset-sm-1 col-sm-10">
                                <div className="store-card fill-card">
                                    <h2 className="mb-4 tc-6533 bold-text text-center">Sign In</h2>
                                    
                                    {/* Social Login Buttons */}
                                    <div className="mb-4">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-dark w-100 mb-3 d-flex align-items-center justify-content-center"
                                            onClick={handleGoogleLogin}
                                            style={{padding: '12px'}}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                            </svg>
                                            Continue with Google
                                        </button>
                                        
                                        <button 
                                            type="button" 
                                            className="btn btn-dark w-100 mb-3 d-flex align-items-center justify-content-center"
                                            onClick={handleAppleLogin}
                                            style={{padding: '12px'}}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                            </svg>
                                            Continue with Apple
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

                                    {/* Login Form */}
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-group mb-3">
                                            <label className="form-label tc-6533 bold-text">
                                                Email or Username
                                            </label>
                                            <input 
                                                type="text"
                                                name="emailOrUsername"
                                                className="form-control"
                                                placeholder="Enter your email or username"
                                                value={formData.emailOrUsername}
                                                onChange={handleInputChange}
                                                required
                                                style={{padding: '12px'}}
                                            />
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label tc-6533 bold-text">
                                                Password
                                            </label>
                                            <input 
                                                type="password"
                                                name="password"
                                                className="form-control"
                                                placeholder="Enter your password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                required
                                                style={{padding: '12px'}}
                                            />
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <div className="form-check">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    name="rememberMe"
                                                    id="rememberMe"
                                                    checked={formData.rememberMe}
                                                    onChange={handleInputChange}
                                                />
                                                <label className="form-check-label tc-6533 sm-text" htmlFor="rememberMe">
                                                    Remember me
                                                </label>
                                            </div>
                                            <Link to="/forgot-password" className="tc-2101 sm-text">
                                                Forgot password?
                                            </Link>
                                        </div>

                                        <button 
                                            className="bloc-button btn btn-lg w-100 btn-c-2101 btn-rd mb-3" 
                                            type="submit"
                                        >
                                            Sign In
                                        </button>
                                    </form>

                                    {/* Sign Up Link */}
                                    <div className="text-center">
                                        <p className="tc-6533 sm-text mb-0">
                                            Don't have an account? 
                                            <Link to="/signup" className="tc-2101 bold-text ms-1">
                                                Sign up here
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

export default Login;