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
        topSellingProducts,
        latestProducts,
        productsOnSale,
        quickPicks,
        loadFeaturedProducts,
        loadTopSellingProducts,
        loadLatestProducts,
        loadProductsOnSale,
        loadQuickPicks,
        loadCategories,
        isLoading 
    } = useProduct();

    // Load all product types and categories on mount
    useEffect(() => {
        const loadAllData = async () => {
            try {
                await Promise.all([
                    loadLatestProducts(12),
                    loadTopSellingProducts(12),
                    loadQuickPicks(8),
                    loadProductsOnSale(10),
                    loadCategories()
                ]);
            } catch (error) {
                console.error('Error loading home page data:', error);
            }
        };

        loadAllData();
    }, [loadLatestProducts, loadTopSellingProducts, loadQuickPicks, loadProductsOnSale, loadCategories]);

    return (
        <>
            {/* header */}
            <Header/>
            {/* header END */}

            {/* latest-products */}
            <LatestProducts 
                products={latestProducts}
                isLoading={isLoading}
            />
            {/* latest-products END */}

            {/* top-seller-products */}
            <TopSellerProducts 
                products={topSellingProducts}
                isLoading={isLoading}
            />
            {/* top-seller-products END */}

            {/* service */}
            <Service/>
            {/* service END */}

            {/* quick-picks */}
            <QuickPicks 
                products={quickPicks}
                isLoading={isLoading}
            />
            {/* quick-picks END */}

            {/* weekly-deals */}
            <WeeklyDeals 
                products={productsOnSale}
                isLoading={isLoading}
            />
            {/* weekly-deals END */}

        </>
    );
};

export default Home;
