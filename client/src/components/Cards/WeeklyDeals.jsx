import React from 'react'

import DealCard from "./DealCard";
import { SkeletonCard, ErrorState } from '../Common';

const WeeklyDeals = ({ products = [], isLoading = false, error = null, onRetry = null }) => {
    // Ensure products is an array
    const safeProducts = Array.isArray(products) ? products : [];
    
    // Transform API data to component format
    const transformedProducts = safeProducts.map(product => ({
        title: product.name,
        price: `From £${product.price}`,
        discount: product.comparePrice ? `Save £${(product.comparePrice - product.price).toFixed(2)}` : 'Special Offer',
        link: `/product/${product.slug || product._id}`,
        imageWebp: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.webp',
        imageJpg: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.jpg'
    }));

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 3 }, (_, index) => (
                <SkeletonCard key={index} variant="deal" />
            ));
        }

        if (error) {
            return (
                <div className="col-12">
                    <ErrorState
                        message="Unable to load weekly deals. Please try again."
                        onRetry={onRetry}
                        variant="network"
                    />
                </div>
            );
        }

        if (transformedProducts.length === 0) {
            return (
                <div className="col-12">
                    <ErrorState
                        message="No weekly deals available at the moment."
                        showRetry={false}
                        variant="empty"
                    />
                </div>
            );
        }

        return transformedProducts.map((deal, index) => (
            <DealCard key={index} {...deal} />
        ));
    };

    return (
        <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="weekly-deals">
            <div className="container bloc-md">
                <div className="row row-offset">
                    <div className="col-lg-12 ps-0 pe-0">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">Weekly Deals.</span> Discover our amazing offers.
                        </h3>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default WeeklyDeals;
