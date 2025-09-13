import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
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
                                        <li className="nav-item">
                                            <Link to="/" className="nav-link">Home</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin" className="nav-link a-btn">Admin</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/user" className="nav-link a-btn">User</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/signup" className="a-btn nav-link">Signup</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/login" className="a-btn nav-link">Login</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/signup" className="a-btn nav-link">Signup</Link>
                                        </li>
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