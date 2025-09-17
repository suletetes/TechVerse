import React from "react";
import { Link, useLocation } from "react-router-dom";

const NavLink = ({ to, children, exact = false, className = "" }) => {
    const location = useLocation();
    
    // Check if the current path matches the link
    const isActive = exact 
        ? location.pathname === to 
        : location.pathname.startsWith(to) && to !== '/';
    
    // Special case for home route
    const isHomeActive = to === '/' && location.pathname === '/';
    const finalIsActive = to === '/' ? isHomeActive : isActive;
    
    return (
        <li className="nav-item">
            <Link
                to={to}
                className={`nav-link a-btn ${className} ${finalIsActive ? "active-page-link" : ""}`}
            >
                {children}
            </Link>
        </li>
    );
};

export default NavLink;
