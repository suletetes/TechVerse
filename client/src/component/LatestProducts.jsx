import React, { useRef } from 'react';
import LatestProductCard from './LatestProductCard';

const LatestProducts = () => {
    const scrollRef = useRef(null);

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };
    const products = [
        {
            title: 'Ultra HD QLED',
            price: 'From £2000',
            link: './product/',
            imgWebp: 'img/tv-product.webp',
            imgJpg: 'img/tv-product.jpg'
        },
        {
            title: 'Laptop Air',
            price: 'From £999',
            link: './product/',
            imgWebp: 'img/laptop-product.webp',
            imgJpg: 'img/laptop-product.jpg'
        },
        {
            title: 'Tablet Pro',
            price: 'From £899',
            link: './product/',
            imgWebp: 'img/tablet-product.webp',
            imgJpg: 'img/tablet-product.jpg'
        },
        {
            title: 'Phone Pro',
            price: 'From £999',
            link: './product/',
            imgWebp: 'img/phone-product.webp',
            imgJpg: 'img/phone-product.jpg'
        },
        {
            title: 'Tablet',
            price: 'From £299',
            link: './product/',
            imgWebp: 'img/tablet-product.webp',
            imgJpg: 'img/tablet-product.jpg'
        },
        {
            title: 'Phone',
            price: 'From £699',
            link: './product/',
            imgWebp: 'img/phone-product.webp',
            imgJpg: 'img/phone-product.jpg'
        },
        {
            title: 'HD LED',
            price: 'From £899',
            link: './product/',
            imgWebp: 'img/tv-product.webp',
            imgJpg: 'img/tv-product.jpg'
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
                        <div className="blocs-horizontal-scroll-container">
                            <div className="blocs-horizontal-scroll-control blocs-scroll-control-prev" onClick={scrollLeft}>
                                <span className="blocs-round-btn">
                                    <svg width="26" height="26" viewBox="0 0 32 32">
                                        <path className="horizontal-scroll-icon" d="M22,2L9,16,22,30" />
                                    </svg>
                                </span>
                            </div>
                            <div className="blocs-horizontal-scroll-area row-offset" ref={scrollRef}>
                                {products.map((product, index) => (
                                    <LatestProductCard
                                        key={index}
                                        title={product.title}
                                        price={product.price}
                                        link={product.link}
                                        imgWebp={product.imgWebp}
                                        imgJpg={product.imgJpg}
                                    />
                                ))}
                            </div>
                            <div className="blocs-horizontal-scroll-control blocs-scroll-control-next" onClick={scrollRight}>
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

export default LatestProducts;