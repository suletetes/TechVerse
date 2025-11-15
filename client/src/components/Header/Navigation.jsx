import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart, useWishlist } from '../../context';
import NavLink from './NavLink';

const Navigation = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, isAdmin } = useAuth();
    const { itemCount } = useCart();
    const { getWishlistCount } = useWishlist();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Debug logging removed for cleaner console

    const wishlistCount = isAuthenticated ? getWishlistCount() : 0;

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="bloc bgc-6533 full-width-bloc d-bloc" id="navigation">
            <div className="container bloc-sm">
                <div className="row row-offset">
                    <div className="col ps-0 pe-0">
                        <nav className="navbar navbar-light row navbar-expand-md" role="navigation">
                            <div className="container-fluid">
                                <Link
                                    className="navbar-brand ltc-2175 bold-text uppercase-text"
                                    to="/"
                                >
                                    <span className="primary-text">Tech</span>Verse
                                </Link>
                                <button
                                    id="nav-toggle"
                                    type="button"
                                    className="ui-navbar-toggler navbar-toggler border-0 p-0 ms-auto"
                                    aria-expanded="false"
                                    aria-label="Toggle navigation"
                                    data-bs-toggle="collapse"
                                    data-bs-target=".navbar-44712"
                                >
                                    <span className="navbar-toggler-icon">
                                        <svg height="32" viewBox="0 0 32 32" width="32">
                                            <path
                                                className="svg-menu-icon menu-icon-thin-bars menu-icon-stroke"
                                                d="m2 9h28m-28 7h28m-28 7h28"
                                            />
                                        </svg>
                                    </span>
                                </button>
                                <div className="collapse navbar-collapse navbar-35179 navbar-44712">
                                    <ul className="site-navigation nav navbar-nav ms-auto">
                                        <NavLink to="/" exact>
                                            Home
                                        </NavLink>

                                        <NavLink to="/categories">
                                            Categories
                                        </NavLink>

                                        <NavLink to="/products">
                                            Products
                                        </NavLink>

                                        {/* Admin Link - Only show for admins */}
                                        {isAuthenticated && isAdmin() && (
                                            <NavLink to="/admin">
                                                Admin
                                            </NavLink>
                                        )}

                                        {/* Cart with item count */}
                                        <li className="nav-item">
                                            <Link
                                                to="/cart"
                                                className="nav-link ltc-2175 position-relative"
                                            >
                                                Cart
                                                {itemCount > 0 && (
                                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                                        {itemCount > 99 ? '99+' : itemCount}
                                                        <span className="visually-hidden">items in cart</span>
                                                    </span>
                                                )}
                                            </Link>
                                        </li>

                                        {/* Wishlist with item count */}
                                        <li className="nav-item">
                                            <Link
                                                to="/wishlist"
                                                className="nav-link ltc-2175 position-relative"
                                            >
                                                Wishlist
                                                {wishlistCount > 0 && (
                                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">
                                                        {wishlistCount > 99 ? '99+' : wishlistCount}
                                                        <span className="visually-hidden">items in wishlist</span>
                                                    </span>
                                                )}
                                            </Link>
                                        </li>

                                        {/* Authentication Links */}
                                        {isAuthenticated ? (
                                            <>
                                                {/* User Profile Dropdown */}
                                                <li className="nav-item dropdown">
                                                    <a
                                                        className="nav-link dropdown-toggle ltc-2175"
                                                        href="#"
                                                        role="button"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false"
                                                    >
                                                        {user?.firstName || 'Account'}
                                                    </a>
                                                    <ul className="dropdown-menu" style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: '0.375rem', boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)' }}>
                                                        {isAdmin() ? (
                                                            <>
                                                                <li>
                                                                    <Link className="dropdown-item" to="/admin" style={{ color: '#212529', padding: '0.5rem 1rem' }}>
                                                                        <i className="fas fa-cog me-2"></i>
                                                                        Admin Panel
                                                                    </Link>
                                                                </li>
                                                                <li>
                                                                    <Link className="dropdown-item" to="/admin/reviews" style={{ color: '#212529', padding: '0.5rem 1rem' }}>
                                                                        <i className="fas fa-star me-2"></i>
                                                                        Review Management
                                                                    </Link>
                                                                </li>
                                                                <li>
                                                                    <Link className="dropdown-item" to="/admin/roles" style={{ color: '#212529', padding: '0.5rem 1rem' }}>
                                                                        <i className="fas fa-user-shield me-2"></i>
                                                                        Role Management
                                                                    </Link>
                                                                </li>
                                                                <li><hr className="dropdown-divider" /></li>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <li>
                                                                    <Link className="dropdown-item" to="/user" style={{ color: '#212529', padding: '0.5rem 1rem' }}>
                                                                        <i className="fas fa-user me-2"></i>
                                                                        Profile
                                                                    </Link>
                                                                </li>
                                                                <li>
                                                                    <Link className="dropdown-item" to="/user/orders" style={{ color: '#212529', padding: '0.5rem 1rem' }}>
                                                                        <i className="fas fa-shopping-bag me-2"></i>
                                                                        Orders
                                                                    </Link>
                                                                </li>
                                                                <li>
                                                                    <Link className="dropdown-item" to="/user/addresses" style={{ color: '#212529', padding: '0.5rem 1rem' }}>
                                                                        <i className="fas fa-map-marker-alt me-2"></i>
                                                                        Addresses
                                                                    </Link>
                                                                </li>
                                                                <li><hr className="dropdown-divider" /></li>
                                                            </>
                                                        )}
                                                        <li>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={handleLogout}
                                                                disabled={isLoggingOut}
                                                                style={{ color: '#212529', padding: '0.5rem 1rem', border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                                                            >
                                                                <i className="fas fa-sign-out-alt me-2"></i>
                                                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </li>
                                            </>
                                        ) : (
                                            <>
                                                <NavLink to="/login">
                                                    Login
                                                </NavLink>
                                                <NavLink to="/signup">
                                                    Sign Up
                                                </NavLink>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navigation;