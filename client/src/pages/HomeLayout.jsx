import React from "react";
import {Outlet} from "react-router-dom";

import {
    SubFooter,
    Footer,
    Navigation,
    ScrollToTopButton,
    ErrorTestComponent
} from "../components";


const HomeLayout = () => {
    return (
        <>
            {/* navigation */}
            <Navigation/>
            {/* navigation END */}

            <Outlet/>

            {/* ScrollToTop Button */}
            <ScrollToTopButton/>
            {/* ScrollToTop Button END */}

            {/* sub-footer */}
            <SubFooter/>
            {/* sub-footer END */}

            {/* footer */}
            <Footer/>
            {/* footer END */}

            {/* Error Test Component (Development Only) */}
            <ErrorTestComponent/>
            {/* Error Test Component END */}
        </>
    );
};

export default HomeLayout;
