import React, { useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard';

const TopSellerProducts = () => {
    const scrollAreaRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const products = [
        {
            name: '8K QLED',
            price: 'From £2999',
            link: './product/',
            webp: 'img/tv-product.webp',
            image: 'img/tv-product.jpg',
            brand: 'TechVerse',
            category: 'premium',
            rating: 4.8
        },
        {
            name: 'Tablet Ultra',
            price: 'From £1099',
            link: './product/',
            webp: 'img/tablet-product.webp',
            image: 'img/tablet-product.jpg',
            brand: 'TechVerse',
            category: 'premium',
            rating: 4.7
        },
        {
            name: 'Phone Air',
            price: 'From £699',
            link: './product/',
            webp: 'img/phone-product.webp',
            image: 'img/phone-product.jpg',
            brand: 'TechVerse',
            category: 'mid-range',
            rating: 4.5
        },
        {
            name: 'Laptop Pro',
            price: 'From £2599',
            link: './product/',
            webp: 'img/laptop-product.webp',
            image: 'img/laptop-product.jpg',
            brand: 'TechVerse',
            category: 'premium',
            rating: 4.9
        },
        {
            name: 'Ultra HD QLED',
            price: 'From £2999',
            link: './product/',
            webp: 'img/tv-product.webp',
            image: 'img/tv-product.jpg',
            brand: 'TechVerse',
            category: 'premium',
            rating: 4.6
        },
        {
            name: 'Phone Pro',
            price: 'From £999',
            link: './product/',
            webp: 'img/phone-product.webp',
            image: 'img/phone-product.jpg',
            brand: 'TechVerse',
            category: 'premium',
            rating: 4.8
        },
        {
            name: 'Tablet Air',
            price: 'From £699',
            link: './product/',
            webp: 'img/tablet-product.webp',
            image: 'img/tablet-product.jpg',
            brand: 'TechVerse',
            category: 'mid-range',
            rating: 4.4
        },
        {
            name: 'Laptop Air',
            price: 'From £999',
            link: './product/',
            webp: 'img/laptop-product.webp',
            image: 'img/laptop-product.jpg',
            brand: 'TechVerse',
            category: 'mid-range',
            rating: 4.3
        },
        {
            name: 'Ultra HD QLED',
            price: 'From £3999',
            link: './product/',
            webp: 'img/tv-product.webp',
            image: 'img/tv-product.jpg',
            brand: 'TechVerse',
            category: 'premium',
            rating: 4.9
        }
    ];

    const scrollAmount = 300;

    const updateScrollButtons = () => {
        if (scrollAreaRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollAreaRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    const scrollLeft = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const scrollRight = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
            updateScrollButtons();
            scrollArea.addEventListener('scroll', updateScrollButtons);
            const timer = setTimeout(updateScrollButtons, 100);

            return () => {
                scrollArea.removeEventListener('scroll', updateScrollButtons);
                clearTimeout(timer);
            };
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setTimeout(updateScrollButtons, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                        <div className="blocs-horizontal-scroll-container show-controls">
                            <button
                                className={`blocs-horizontal-scroll-control blocs-scroll-control-prev ${!canScrollLeft ? 'disabled' : ''}`}
                                onClick={scrollLeft}
                                disabled={!canScrollLeft}
                                style={{ display: canScrollLeft ? 'flex' : 'none' }}
                            >
                                <span className="blocs-round-btn">
                                    <svg width="26" height="26" viewBox="0 0 32 32">
                                        <path className="horizontal-scroll-icon" d="M22,2L9,16,22,30" />
                                    </svg>
                                </span>
                            </button>
                            <div
                                className="blocs-horizontal-scroll-area row-offset"
                                ref={scrollAreaRef}
                            >
                                {products.map((product, index) => (
                                    <ProductCard
                                        key={index}
                                        product={product}
                                    />
                                ))}
                            </div>
                            <button
                                className={`blocs-horizontal-scroll-control blocs-scroll-control-next ${!canScrollRight ? 'disabled' : ''}`}
                                onClick={scrollRight}
                                disabled={!canScrollRight}
                                style={{ display: canScrollRight ? 'flex' : 'none' }}
                            >
                                <span className="blocs-round-btn">
                                    <svg width="26" height="26" viewBox="0 0 32 32">
                                        <path className="horizontal-scroll-icon" d="M10.344,2l13,14-13,14" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopSellerProducts;