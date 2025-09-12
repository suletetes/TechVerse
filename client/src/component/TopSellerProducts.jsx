import React from 'react';
import ProductCard from './ProductCard';

const TopSellerProducts = () => {
    const products = [
        {
            title: '8K QLED',
            price: 'From £2999',
            link: './product/',
            imgWebp: 'img/tv-product.webp',
            imgJpg: 'img/tv-product.jpg'
        },
        {
            title: 'Tablet Ultra',
            price: 'From £1099',
            link: './product/',
            imgWebp: 'img/tablet-product.webp',
            imgJpg: 'img/tablet-product.jpg'
        },
        {
            title: 'Phone Air',
            price: 'From £699',
            link: './product/',
            imgWebp: 'img/phone-product.webp',
            imgJpg: 'img/phone-product.jpg'
        },
        {
            title: 'Laptop Pro',
            price: 'From £2599',
            link: './product/',
            imgWebp: 'img/laptop-product.webp',
            imgJpg: 'img/laptop-product.jpg'
        },
        {
            title: 'Ultra HD QLED',
            price: 'From £2999',
            link: './product/',
            imgWebp: 'img/tv-product.webp',
            imgJpg: 'img/tv-product.jpg'
        },
        {
            title: 'Phone Pro',
            price: 'From £999',
            link: './product/',
            imgWebp: 'img/phone-product.webp',
            imgJpg: 'img/phone-product.jpg'
        },
        {
            title: 'Tablet Air',
            price: 'From £699',
            link: './product/',
            imgWebp: 'img/tablet-product.webp',
            imgJpg: 'img/tablet-product.jpg'
        },
        {
            title: 'Laptop Air',
            price: 'From £999',
            link: './product/',
            imgWebp: 'img/laptop-product.webp',
            imgJpg: 'img/laptop-product.jpg'
        },
        {
            title: 'Ultra HD QLED',
            price: 'From £3999',
            link: './product/',
            imgWebp: 'img/tv-product.webp',
            imgJpg: 'img/tv-product.jpg'
        }
    ];

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
                        <div className="blocs-horizontal-scroll-container">
                            <div className="blocs-horizontal-scroll-control blocs-scroll-control-prev">
                                <span className="blocs-round-btn">
                                    <svg width="26" height="26" viewBox="0 0 32 32">
                                        <path className="horizontal-scroll-icon" d="M22,2L9,16,22,30" />
                                    </svg>
                                </span>
                            </div>
                            <div className="blocs-horizontal-scroll-area row-offset">
                                {products.map((product, index) => (
                                    <ProductCard
                                        key={index}
                                        title={product.title}
                                        price={product.price}
                                        link={product.link}
                                        imgWebp={product.imgWebp}
                                        imgJpg={product.imgJpg}
                                    />
                                ))}
                            </div>
                            <div className="blocs-horizontal-scroll-control blocs-scroll-control-next">
                                <span className="blocs-round-btn">
                                    <svg width="26" height="26" viewBox="0 0 32 32">
                                        <path className="horizontal-scroll-icon" d="M10.344,2l13,14-13,14" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopSellerProducts;