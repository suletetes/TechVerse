import React, { useEffect } from "react";
import { useProduct } from "../context";
import {
    Header,
    LatestProducts,
    TopSellerProducts,
    Service,
    QuickPicks,
    WeeklyDeals,
} from "../components";

const Home = () => {
    const { loadCategories } = useProduct();

    // Load categories on mount (still needed for other parts of the app)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                await loadCategories();
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        loadInitialData();
    }, [loadCategories]);

    return (
        <>
            {/* header */}
            <Header />
            {/* header END */}

            {/* latest-products */}
            <LatestProducts
                limit={8}
                autoLoad={true}
            />
            {/* latest-products END */}

            {/* top-seller-products */}
            <TopSellerProducts
                limit={8}
                autoLoad={true}
            />
            {/* top-seller-products END */}

            {/* service */}
            <Service />
            {/* service END */}

            {/* quick-picks */}
            <QuickPicks
                limit={8}
                autoLoad={true}
                onSuccess={(data) => console.log('Quick picks loaded:', data.length)}
                onError={(error) => console.error('Quick picks error:', error)}
            />
            {/* quick-picks END */}

            {/* weekly-deals */}
            <WeeklyDeals
                limit={10}
                autoLoad={true}
                onSuccess={(data) => console.log('Weekly deals loaded:', data.length)}
                onError={(error) => console.error('Weekly deals error:', error)}
            />
            {/* weekly-deals END */}

        </>
    );
};

export default Home;
