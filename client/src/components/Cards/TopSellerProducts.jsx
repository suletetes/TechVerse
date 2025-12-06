import React from 'react'

import ProductCard from './ProductCard';
import { HorizontalScroll, SkeletonCard, ErrorState } from '../Common';
import { useHomepageSection, SECTION_TYPES } from '../../hooks/useHomepageSection.js';

const TopSellerProducts = ({
    limit = 12,
    autoLoad = true,
    onSuccess,
    onError,
    // Legacy props for backward compatibility
    products: legacyProducts,
    isLoading: legacyLoading,
    error: legacyError,
    onRetry: legacyRetry
}) => {
    // Use the new hook for data fetching
    const {
        data: hookProducts,
        loading: hookLoading,
        error: hookError,
        retry: hookRetry,
        isEmpty,
        hasData
    } = useHomepageSection(SECTION_TYPES.TOP_SELLERS, {
        limit,
        autoLoad,
        onSuccess,
        onError
    });

    // Use hook data if available, otherwise fall back to legacy props
    const products = hookProducts.length > 0 ? hookProducts : (legacyProducts || []);
    const isLoading = hookLoading || legacyLoading || false;
    const error = hookError || legacyError || null;
    const onRetry = hookRetry || legacyRetry || (() => { });
    // Ensure products is an array
    const safeProducts = Array.isArray(products) ? products : [];

    // Transform API data to component format
    const transformedProducts = safeProducts.map(product => {
        return {
            id: product._id,
            _id: product._id,
            slug: product.slug,
            name: product.name,
            price: `From £${product.price}`,
            link: `/product/${product.slug || product._id}`,
            webp: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.webp',
            image: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.jpg',
            images: product.images,
            brand: product.brand || 'TechVerse',
            category: product.category?.name || 'premium',
            stock: product.stock,
            status: product.status,
            rating: product.rating
        };
    });

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