// src/main.jsx
import React from "react";

// import components from barrel file
import {
    Header,
    LatestProducts,
    TopSellerProducts,
    Service,
    QuickPicks,
    WeeklyDeals,
} from "../component";
// import "./assets/css/bootstrap.min.css"

const Home = () => {
    return (
        <>
            {/* header */}
            <Header/>
            {/* header END */}

            {/* latest-products */}
            <LatestProducts/>
            {/* latest-products END */}

            {/* top-seller-products */}
            <TopSellerProducts/>
            {/* top-seller-products END */}

            {/* service */}
            <Service/>
            {/* service END */}

            {/* quick-picks */}
            <QuickPicks/>
            {/* quick-picks END */}

            {/* weekly-deals */}
            <WeeklyDeals/>
            {/* weekly-deals END */}

        </>
    );
};

export default Home;
