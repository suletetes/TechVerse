// src/main.jsx
import React from "react";

// import components from barrel file
import {
    Navigation,
    Header,
    SubFooter,
    Footer, ScrollToTopButton
    // ScrollToTopButton, // Uncomment if needed
} from "../component";
import {Outlet} from "react-router-dom";
// import "./assets/css/bootstrap.min.css"

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
