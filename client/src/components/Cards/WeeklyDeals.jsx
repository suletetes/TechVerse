import React from 'react'

import DealCard from "./DealCard";

const WeeklyDeals = ({ products = [], isLoading = false }) => {
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

    // Fallback deals for when no products are available
    const fallbackDeals = [
        {
            title: "Ultra Laptop",
            price: "From £2000",
            discount: "Save $1000",
            link: "./product/",
            imageWebp: "img/laptop-product.webp",
            imageJpg: "img/laptop-product.jpg",
        },
        {
            title: "Tablet Air",
            price: "From £1999",
            discount: "Save $400",
            link: "./product/",
            imageWebp: "img/tablet-product.webp",
            imageJpg: "img/tablet-product.jpg",
        },
        {
            title: "Phone Ultra",
            price: "From £999",
            discount: "Save $100",
            link: "./product/",
            imageWebp: "img/phone-product.webp",
            imageJpg: "img/phone-product.jpg",
        },
    ];

    // Use real products if available, otherwise show fallback
    const displayDeals = transformedProducts.length > 0 ? transformedProducts : fallbackDeals;

    return (
        <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="weekly-deals">
            <div className="container bloc-md">
                <div className="row row-offset">
                    <div className="col-lg-12 ps-0 pe-0">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">Weekly Deals.</span> Discover our amazing offers.
                        </h3>
                    </div>
                    {isLoading ? (
                        <div className="col-12 text-center p-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        displayDeals.map((deal, index) => (
                            <DealCard key={index} {...deal} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeeklyDeals;
