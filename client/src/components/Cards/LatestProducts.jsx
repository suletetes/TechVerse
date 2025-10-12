import React from 'react';
import LatestProductCard from './LatestProductCard';
import { HorizontalScroll } from '../Common';

const LatestProducts = ({ products = [], isLoading = false }) => {
    // Transform API data to component format
    const transformedProducts = products.map(product => ({
        id: product._id,
        title: product.name,
        price: `From £${product.price}`,
        link: `/product/${product.slug || product._id}`,
        imgWebp: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.webp',
        imgJpg: product.primaryImage?.url || product.images?.[0]?.url || 'img/placeholder-product.jpg'
    }));

    // Use real products if available, otherwise show fallback
    const displayProducts = transformedProducts.length > 0 ? transformedProducts : [
        {
            id: 'fallback-1',
            title: 'Ultra HD QLED',
            price: 'From £2000',
            link: './product/',
            imgWebp: 'img/tv-product.webp',
            imgJpg: 'img/tv-product.jpg'
        },
        {
            id: 'fallback-2',
            title: 'Laptop Air',
            price: 'From £999',
            link: './product/',
            imgWebp: 'img/laptop-product.webp',
            imgJpg: 'img/laptop-product.jpg'
        },
        {
            id: 'fallback-3',
            title: 'Tablet Pro',
            price: 'From £899',
            link: './product/',
            imgWebp: 'img/tablet-product.webp',
            imgJpg: 'img/tablet-product.jpg'
        }
    ];

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
                        <HorizontalScroll>
                            {isLoading ? (
                                <div className="text-center p-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                displayProducts.map((product, index) => (
                                    <LatestProductCard
                                        key={product.id || index}
                                        title={product.title}
                                        price={product.price}
                                        link={product.link}
                                        imgWebp={product.imgWebp}
                                        imgJpg={product.imgJpg}
                                    />
                                ))
                            )}
                        </HorizontalScroll>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LatestProducts;