import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <div className="bloc bgc-6533 full-width-bloc d-bloc" id="footer">
            <div className="container bloc-md">
                <div className="row row-offset">
                    <div className="col-12 ps-lg-0 col-lg-3 col-sm-6 mb-3 mb-lg-0">
                        <h6 className="mg-md text-center text-sm-start tc-2175">About</h6>
                        <Link to="/stores" className="a-btn a-block footer-link ltc-654 mb-3">Stores</Link>
                        <Link to="/" className="a-btn a-block footer-link ltc-654 mb-3">Deals</Link>
                        <Link to="/" className="a-btn a-block footer-link ltc-654 mb-3">Careers</Link>
                    </div>
                    <div className="col-12 col-lg-3 col-sm-6 mb-3 mb-lg-0">
                        <h6 className="mg-md text-center text-sm-start tc-2175">Site Information</h6>
                        <Link to="/privacy" className="a-btn a-block footer-link ltc-654 mb-3">Privacy Policy</Link>
                        <Link to="/shipping" className="a-btn a-block footer-link ltc-654 mb-3">Cookie Policy</Link>
                        <Link to="/faq" className="a-btn a-block footer-link ltc-654">Terms & Conditions</Link>
                    </div>
                    <div className="col-12 col-lg-3 col-sm-6 mb-3 mb-sm-0">
                        <h6 className="mg-md text-center text-sm-start tc-2175">Customer Service</h6>
                        <Link to="/contact" className="a-btn a-block footer-link ltc-654 mb-3">Contact</Link>
                        <Link to="/delivery" className="a-btn a-block footer-link ltc-654 mb-3">Delivery</Link>
                        <Link to="/returns" className="a-btn a-block footer-link ltc-654">Returns</Link>
                    </div>
                    <div className="col-12 pe-lg-0 col-lg-3 col-sm-6 text-center text-sm-start">
                        <h6 className="mg-md text-center text-sm-start tc-2175">Follow Us</h6>
                        <div>
                            <div className="social-link-bric">
                                <a href="https://twitter.com/#" className="twitter-link" target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                         fill="var(--swatch-var-654)" viewBox="0 0 24 24"
                                         style={{marginLeft: '3px', marginRight: '3px'}}>
                                        <path d="m18.9 2.011h3.68l-8.04 9.31 9.46 12.664h-7.41l-5.8-7.679-6.64 7.679h-3.68l8.6-9.959-9.07-12.015h7.59l5.24 7.021zm-1.29 19.745h2.04l-13.16-17.628h-2.19z"/>
                                    </svg>
                                </a>
                                <a href="https://www.facebook.com/#" className="facebook-link" target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                         fill="var(--swatch-var-654)" viewBox="0 0 24 24"
                                         style={{marginLeft: '3px', marginRight: '3px'}}>
                                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                                    </svg>
                                </a>
                                <a href="https://www.instagram.com/#" className="instagram-link" target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                         fill="var(--swatch-var-654)" viewBox="0 0 24 24"
                                         style={{marginLeft: '3px', marginRight: '3px'}}>
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;