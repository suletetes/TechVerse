import React from 'react';
import {QuickPickCard} from '../Cards';
import { HorizontalScroll, SkeletonCard, ErrorState } from '../Common';

const QuickPicks = ({ products = [], isLoading = false, error = null, onRetry = null }) => {
    const safeProducts = Array.isArray(products) ? products : [];
    
    // Transform API data to component format
    const transformedProducts = safeProducts.map(product => ({
        id: product._id,
        title: product.name,
        price: `£${product.price}`,
        link: `/product/${product.slug || product._id}`,
        imageWebp: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.webp',
        imageJpg: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.jpg'
    }));

    const renderContent = () => {
        if (isLoading) {
            return (
                <HorizontalScroll>
                    {Array.from({ length: 4 }, (_, index) => (
                        <SkeletonCard key={index} variant="quickpick" />
                    ))}
                </HorizontalScroll>
            );
        }

        if (error) {
            return (
                <ErrorState
                    message="Unable to load quick picks. Please try again."
                    onRetry={onRetry}
                    variant="network"
                />
            );
        }

        if (transformedProducts.length === 0) {
            return (
                <ErrorState
                    message="No quick picks available at the moment."
                    showRetry={false}
                    variant="empty"
                />
            );
        }

        return (
            <HorizontalScroll>
                {transformedProducts.map((product, index) => (
                    <QuickPickCard
                        key={product.id || index}
                        title={product.title}
                        price={product.price}
                        link={product.link}
                        imageWebp={product.imageWebp}
                        imageJpg={product.imageJpg}
                    />
                ))}
            </HorizontalScroll>
        );
    };

    return (
        <div className="bloc full-width-bloc bgc-5700 l-bloc" id="quick-picks">
            <div className="container bloc-md">
                <div className="row g-0">
                    <div className="col-lg-10 col-10 offset-1 offset-lg-1">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">Quick Picks.</span>&nbsp;Perfect gifts at perfect prices.
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

export default QuickPicks;