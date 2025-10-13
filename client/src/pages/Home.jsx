import React, { useEffect, useState } from "react";
import { productService } from "../api/services";
import {
    Header,
    LatestProducts,
    TopSellerProducts,
    Service,
    QuickPicks,
    WeeklyDeals,
} from "../components";

const Home = () => {
    const [homeData, setHomeData] = useState({
        latestProducts: [],
        topSellingProducts: [],
        quickPicks: [],
        weeklyDeals: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load all product types on mount
    useEffect(() => {
        const loadAllData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const [latestResponse, topSellersResponse, quickPicksResponse, weeklyDealsResponse] = await Promise.all([
                    productService.getLatestProducts(12),
                    productService.getTopSellingProducts(12),
                    productService.getQuickPicks(8),
                    productService.getWeeklyDeals(6)
                ]);

                setHomeData({
                    latestProducts: latestResponse.data?.products || [],
                    topSellingProducts: topSellersResponse.data?.products || [],
                    quickPicks: quickPicksResponse.data?.products || [],
                    weeklyDeals: weeklyDealsResponse.data?.products || []
                });
            } catch (error) {
                console.error('Error loading home page data:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadAllData();
    }, []);

    return (
        <>
            {/* header */}
            <Header />
            {/* header END */}

            {/* Error display */}
            {error && (
                <div className="container my-4">
                    <div className="alert alert-danger" role="alert">
                        <h4 className="alert-heading">Error Loading Data</h4>
                        <p>{error}</p>
                        <button 
                            className="btn btn-outline-danger" 
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* latest-products */}
            <LatestProducts
                products={homeData.latestProducts}
                isLoading={isLoading}
            />
            {/* latest-products END */}

            {/* top-seller-products */}
            <TopSellerProducts
                products={homeData.topSellingProducts}
                isLoading={isLoading}
            />
            {/* top-seller-products END */}

            {/* service */}
            <Service />
            {/* service END */}

            {/* quick-picks */}
            <QuickPicks
                products={homeData.quickPicks}
                isLoading={isLoading}
            />
            {/* quick-picks END */}

            {/* weekly-deals */}
            <WeeklyDeals
                products={homeData.weeklyDeals}
                isLoading={isLoading}
            />
            {/* weekly-deals END */}

        </>
    );
};

export default Home;
