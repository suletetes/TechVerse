import React, { useEffect, useCallback } from "react";
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
        topSellingProducts,
        latestProducts,
        productsOnSale,
        quickPicks,
        loadTopSellingProducts,
        loadLatestProducts,
        loadProductsOnSale,
        loadQuickPicks,
        loadCategories,
        isLoading,
        error
    } = useProduct();

    // Load all product types and categories on mount
    const loadAllData = useCallback(async () => {
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
    }, [loadLatestProducts, loadTopSellingProducts, loadQuickPicks, loadProductsOnSale, loadCategories]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Retry functions for individual sections
    const retryLatestProducts = useCallback(() => {
        loadLatestProducts(12);
    }, [loadLatestProducts]);

    const retryTopSellingProducts = useCallback(() => {
        loadTopSellingProducts(12);
    }, [loadTopSellingProducts]);

    const retryQuickPicks = useCallback(() => {
        loadQuickPicks(8);
    }, [loadQuickPicks]);

    const retryProductsOnSale = useCallback(() => {
        loadProductsOnSale(10);
    }, [loadProductsOnSale]);

    return (
        <>
            {/* header */}
            <Header />
            {/* header END */}

            {/* latest-products */}
            <LatestProducts
                products={latestProducts}
                isLoading={isLoading}
                error={error}
                onRetry={retryLatestProducts}
            />
            {/* latest-products END */}

            {/* top-seller-products */}
            <TopSellerProducts
                products={topSellingProducts}
                isLoading={isLoading}
                error={error}
                onRetry={retryTopSellingProducts}
            />
            {/* top-seller-products END */}

            {/* service */}
            <Service />
            {/* service END */}

            {/* quick-picks */}
            <QuickPicks
                products={quickPicks}
                isLoading={isLoading}
                error={error}
                onRetry={retryQuickPicks}
            />
            {/* quick-picks END */}

            {/* weekly-deals */}
            <WeeklyDeals
                products={productsOnSale}
                isLoading={isLoading}
                error={error}
                onRetry={retryProductsOnSale}
            />
            {/* weekly-deals END */}

        </>
    );
};

export default Home;
