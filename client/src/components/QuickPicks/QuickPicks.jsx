import React, { useEffect, useRef, useState } from 'react';
import {QuickPickCard} from '../Cards';

const QuickPicks = () => {
    const scrollAreaRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    
    const products = [
        {
            title: 'Ultra HD QLED',
            price: '$2999',
            link: './product/',
            imageWebp: 'img/tv-product.webp',
            imageJpg: 'img/tv-product.jpg'
        },
        {
            title: 'Tablet Pro',
            price: '$1099',
            link: './product/',
            imageWebp: 'img/tablet-product.webp',
            imageJpg: 'img/tablet-product.jpg'
        },
        {
            title: 'Phone 15',
            price: '$899',
            link: './product/',
            imageWebp: 'img/phone-product.webp',
            imageJpg: 'img/phone-product.jpg'
        },
        {
            title: 'Laptop Pro',
            price: '$2599',
            link: './product/',
            imageWebp: 'img/laptop-product.webp',
            imageJpg: 'img/laptop-product.jpg'
        },
        {
            title: 'HD TV Plus',
            price: '$5999',
            link: './product/',
            imageWebp: 'img/tv-product.webp',
            imageJpg: 'img/tv-product.jpg'
        },
        {
            title: 'Phone Air',
            price: '$699',
            link: './product/',
            imageWebp: 'img/phone-product.webp',
            imageJpg: 'img/phone-product.jpg'
        },
        {
            title: 'Ultra Laptop',
            price: '$2999',
            link: './product/',
            imageWebp: 'img/laptop-product.webp',
            imageJpg: 'img/laptop-product.jpg'
        },
        {
            title: 'Tablet Pro',
            price: '$999',
            link: './product/',
            imageWebp: 'img/tablet-product.webp',
            imageJpg: 'img/tablet-product.jpg'
        },
        {
            title: 'Phone 15',
            price: '$699',
            link: './product/',
            imageWebp: 'img/phone-product.webp',
            imageJpg: 'img/phone-product.jpg'
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
        <div className="bloc full-width-bloc bgc-5700 l-bloc" id="quick-picks">
            <div className="container bloc-md">
                <div className="row g-0">
                    <div className="col-lg-10 col-10 offset-1 offset-lg-1">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">Quick Picks.</span>&nbsp;Perfect gifts at perfect prices.
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
                                    <QuickPickCard
                                        key={index}
                                        title={product.title}
                                        price={product.price}
                                        link={product.link}
                                        imageWebp={product.imageWebp}
                                        imageJpg={product.imageJpg}
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

export default QuickPicks;