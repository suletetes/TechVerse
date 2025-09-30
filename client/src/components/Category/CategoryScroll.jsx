import React, { useEffect, useRef, useState } from "react";
import CategoryItem from './CategoryItem';

const CategoryScroll = () => {
    const scrollAreaRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    
    const categories = [
        { title: 'Phones', imgSrc: 'img/phone.svg', link: './category/' },
        { title: 'Tablets', imgSrc: 'img/tablet.svg', link: './category/' },
        { title: 'Computers', imgSrc: 'img/computer.svg', link: './category/' },
        { title: 'TVs', imgSrc: 'img/tv.svg', link: './category/' },
        { title: 'Gaming', imgSrc: 'img/gaming.svg', link: './category/' },
        { title: 'Watches', imgSrc: 'img/watch.svg', link: './category/' },
        { title: 'Audio', imgSrc: 'img/headphones.svg', link: './category/' },
        { title: 'Cameras', imgSrc: 'img/camera.svg', link: './category/' },
        { title: 'Accessories', imgSrc: 'img/accessories.svg', link: './category/' },
        { title: 'Gift Card', imgSrc: 'img/gift-card.svg', link: './category/' }
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
            // Initial check
            updateScrollButtons();
            
            // Add scroll listener
            scrollArea.addEventListener('scroll', updateScrollButtons);
            
            // Check after a short delay to ensure content is loaded
            const timer = setTimeout(updateScrollButtons, 100);
            
            return () => {
                scrollArea.removeEventListener('scroll', updateScrollButtons);
                clearTimeout(timer);
            };
        }
    }, []);

    // Also update on window resize
    useEffect(() => {
        const handleResize = () => {
            setTimeout(updateScrollButtons, 100);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="blocs-horizontal-scroll-container compact-blocs-controls show-controls">
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
                {categories.map((category, index) => (
                    <CategoryItem
                        key={index}
                        title={category.title}
                        imgSrc={category.imgSrc}
                        link={category.link}
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
    );
};

export default CategoryScroll;