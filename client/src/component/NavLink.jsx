import {Link} from "react-router-dom";

const NavLink = ({to, children, active}) => {
    return (
        <li className="nav-item">
            <Link
                to={to}
                className={`nav-link a-btn ${active ? "active-page-link" : ""}`}
            >
                {children}
            </Link>
        </li>
    );
};

export default NavLink;
