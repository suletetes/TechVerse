import React from 'react'
import LatestProductCard from './LatestProductCard';
import { HorizontalScroll, SkeletonCard, ErrorState } from '../Common';
import { useHomepageSection, SECTION_TYPES } from '../../hooks/useHomepageSection.js';

const LatestProducts = ({ 
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
    } = useHomepageSection(SECTION_TYPES.LATEST, {
        limit,
        autoLoad,
        onSuccess,
        onError
    });

    // Use hook data if available, otherwise fall back to legacy props
    const products = hookProducts.length > 0 ? hookProducts : (legacyProducts || []);
    const isLoading = hookLoading || legacyLoading || false;
    const error = hookError || legacyError || null;
    const onRetry = hookRetry || legacyRetry || (() => {});
    // Ensure products is an array
    const safeProducts = Array.isArray(products) ? products : [];

    // Transform API data to component format
    const transformedProducts = safeProducts.map(product => ({
        id: product._id,
        title: product.name,
        price: `From £${product.price}`,
        link: `/product/${product.slug || product._id}`,
        imgWebp: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.webp',
        imgJpg: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.jpg',
        stock: product.stock,
        inStock: product.stock?.quantity > 0 && product.status === 'active'
    }));

    const renderContent = () => {
        if (isLoading) {
            return (
                <HorizontalScroll>
                    {Array.from({ length: 3 }, (_, index) => (
                        <SkeletonCard key={index} variant="latest" />
                    ))}
                </HorizontalScroll>
            );
        }

        if (error) {
            return (
                <ErrorState
                    message="Unable to load latest products. Please try again."
                    onRetry={onRetry}
                    variant="network"
                />
            );
        }

        if (transformedProducts.length === 0) {
            return (
                <ErrorState
                    message="No latest products available at the moment."
                    showRetry={false}
                    variant="empty"
                />
            );
        }

        return (
            <HorizontalScroll>
                {transformedProducts.map((product, index) => (
                    <LatestProductCard
                        key={product.id || index}
                        title={product.title}
                        price={product.price}
                        link={product.link}
                        imgWebp={product.imgWebp}
                        imgJpg={product.imgJpg}
                    />
                ))}
            </HorizontalScroll>
        );
    };

    return (
        <div className="bloc full-width-bloc bgc-5700 l-bloc" id="latest-products">
            <div className="container bloc-md-lg bloc-md">
                <div className="row g-0">
                    <div className="col-lg-10 offset-lg-1 col-10 offset-1">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">The Latest.</span> Take a look at what's new.
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

export default LatestProducts;