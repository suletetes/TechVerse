import React from "react";
import {Outlet} from "react-router-dom";

import {
    SubFooter,
    Footer,
    Navigation,
    ScrollToTopButton
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
        </>
    );
};

export default HomeLayout;
