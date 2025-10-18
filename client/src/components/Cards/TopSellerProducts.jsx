import React from 'react'

import ProductCard from './ProductCard';
import { HorizontalScroll, SkeletonCard, ErrorState } from '../Common';

const TopSellerProducts = ({ products = [], isLoading = false, error = null, onRetry = null }) => {
    // Ensure products is an array
    const safeProducts = Array.isArray(products) ? products : [];
    
    // Transform API data to component format
    const transformedProducts = safeProducts.map(product => ({
        id: product._id,
        name: product.name,
        price: `From £${product.price}`,
        link: `/product/${product.slug || product._id}`,
        webp: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.webp',
        image: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.jpg',
        brand: product.brand || 'TechVerse',
        category: product.category?.name || 'premium',
        rating: product.rating?.average || 4.5
    }));

    const renderContent = () => {
        if (isLoading) {
            return (
                <HorizontalScroll>
                    {Array.from({ length: 6 }, (_, index) => (
                        <SkeletonCard key={index} variant="product" />
                    ))}
                </HorizontalScroll>
            );
        }

        if (error) {
            return (
                <ErrorState
                    message="Unable to load top selling products. Please try again."
                    onRetry={onRetry}
                    variant="network"
                />
            );
        }

        if (transformedProducts.length === 0) {
            return (
                <ErrorState
                    message="No top selling products available at the moment."
                    showRetry={false}
                    variant="empty"
                />
            );
        }

        return (
            <HorizontalScroll>
                {transformedProducts.map((product, index) => (
                    <ProductCard
                        key={product.id || index}
                        product={product}
                    />
                ))}
            </HorizontalScroll>
        );
    };

    return (
        <div className="bloc full-width-bloc bgc-5700 l-bloc" id="top-seller-products">
            <div className="container bloc-md">
                <div className="row g-0">
                    <div className="col-lg-10 offset-lg-1 col-10 offset-1">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">Top Sellers.</span>&nbsp;Find the perfect gift.
                        </h3>
                    </div>
                    <div className="text-start offset-lg-0 col-lg-12 col">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopSellerProducts;