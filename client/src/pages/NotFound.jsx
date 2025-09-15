import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <section className="bloc l-bloc full-width-bloc bgc-5700" id="bloc-404">
            <div className="container bloc-lg">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-10 col-sm-12 text-center">
                        {/* 404 Illustration */}
                        <div className="store-card outline-card fill-card mb-5">
                            <div className="p-5">
                                {/* Large 404 Number */}
                                <div className="mb-4">
                                    <h1 className="display-1 fw-bold primary-text mb-0" style={{ fontSize: '8rem', lineHeight: '1' }}>
                                        404
                                    </h1>
                                    <div className="d-flex justify-content-center mb-3">
                                        <div className="bg-primary rounded-pill" style={{ width: '100px', height: '4px' }}></div>
                                    </div>
                                </div>

                                {/* Error Icon */}
                                <div className="mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle p-4 mb-3" style={{ width: '120px', height: '120px' }}>
                                        <svg width="60" height="60" viewBox="0 0 24 24" className="text-primary">
                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Error Message */}
                                <h2 className="tc-6533 mb-3 fw-bold">Page Not Found</h2>
                                <p className="tc-6533 mb-4 lead">
                                    Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
                                </p>

                                {/* Suggestions */}
                                <div className="row g-3 mb-5">
                                    <div className="col-md-4">
                                        <div className="d-flex align-items-center justify-content-center mb-2">
                                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary me-2">
                                                <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                                            </svg>
                                            <small className="text-muted">Go back to homepage</small>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="d-flex align-items-center justify-content-center mb-2">
                                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary me-2">
                                                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                            </svg>
                                            <small className="text-muted">Search for products</small>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="d-flex align-items-center justify-content-center mb-2">
                                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary me-2">
                                                <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                            <small className="text-muted">Check our deals</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                                    <Link
                                        to="/"
                                        className="btn btn-rd btn-c-2101 btn-lg d-flex align-items-center justify-content-center px-4"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                                        </svg>
                                        Back to Home
                                    </Link>
                                    <Link
                                        to="/category"
                                        className="btn btn-outline-primary btn-rd btn-lg d-flex align-items-center justify-content-center px-4"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="m21 21-4.35-4.35" />
                                        </svg>
                                        Browse Products
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Popular Categories */}
                        <div className="store-card outline-card fill-card">
                            <div className="p-4">
                                <h5 className="tc-6533 fw-bold mb-3">Popular Categories</h5>
                                <div className="row g-2">
                                    <div className="col-6 col-md-3">
                                        <Link to="/category" className="btn btn-outline-secondary btn-sm w-100 rounded-pill">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="currentColor">
                                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" />
                                            </svg>
                                            Laptops
                                        </Link>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <Link to="/category" className="btn btn-outline-secondary btn-sm w-100 rounded-pill">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="currentColor">
                                                <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
                                            </svg>
                                            Tablets
                                        </Link>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <Link to="/category" className="btn btn-outline-secondary btn-sm w-100 rounded-pill">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="currentColor">
                                                <path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 20h-4v-1h4v1zm3.25-3H6.75V4h10.5v14z" />
                                            </svg>
                                            Phones
                                        </Link>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <Link to="/category" className="btn btn-outline-secondary btn-sm w-100 rounded-pill">
                                            <svg width="16" height="16" viewBox="0 0 24 24" className="me-1" fill="currentColor">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                            Deals
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NotFound;