import NavLink from "./NavLink";

const Navigation = () => {
    return (<div className="bloc bgc-6533 full-width-bloc d-bloc" id="navigation">
        <div className="container bloc-sm">
            <div className="row row-offset">
                <div className="col ps-0 pe-0">
                    <nav
                        className="navbar navbar-light row navbar-expand-md"
                        role="navigation"
                    >
                        <div className="container-fluid">
                            {/* Brand */}
                            <a
                                className="navbar-brand ltc-2175 bold-text uppercase-text"
                                href="./"
                            >
                                <span className="primary-text">Tech</span>Verse
                            </a>

                            {/* Toggler */}
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
                      ></path>
                    </svg>
                  </span>
                            </button>
                            {/* Nav Links */}
                            <div className="collapse navbar-collapse navbar-35179 navbar-44712">
                                <ul className="site-navigation nav navbar-nav ms-auto">
                                    <NavLink to="/" active>Home</NavLink>
                                    <NavLink to="/stores">Stores</NavLink>
                                    <NavLink to="/account">Account</NavLink>
                                    <NavLink to="/signup">Signup</NavLink>
                                    <NavLink to="/login">Login</NavLink>
                                </ul>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    </div>);
};

export default Navigation;
