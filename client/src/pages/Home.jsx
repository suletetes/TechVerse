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
    const { 
        featuredProducts, 
        loadFeaturedProducts, 
        loadCategories,
        isLoading 
    } = useProduct();

    // Load featured products and categories on mount
    useEffect(() => {
        loadFeaturedProducts(12); // Load 12 featured products
        loadCategories();
    }, [loadFeaturedProducts, loadCategories]);

    return (
        <>
            {/* header */}
            <Header/>
            {/* header END */}

            {/* latest-products */}
            <LatestProducts 
                products={featuredProducts}
                isLoading={isLoading}
            />
            {/* latest-products END */}

            {/* top-seller-products */}
            <TopSellerProducts 
                products={featuredProducts}
                isLoading={isLoading}
            />
            {/* top-seller-products END */}

            {/* service */}
            <Service/>
            {/* service END */}

            {/* quick-picks */}
            <QuickPicks 
                products={featuredProducts}
                isLoading={isLoading}
            />
            {/* quick-picks END */}

            {/* weekly-deals */}
            <WeeklyDeals 
                products={featuredProducts}
                isLoading={isLoading}
            />
            {/* weekly-deals END */}

        </>
    );
};

export default Home;
