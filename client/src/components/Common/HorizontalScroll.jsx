import React, { useEffect, useRef, useState } from 'react';

const HorizontalScroll = ({ 
    children, 
    className = '', 
    containerClassName = '',
    scrollAmount = 300,
    showControls = true,
    compactControls = false,
    autoHide = true
}) => {
    const scrollAreaRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

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
    }, [children]);

    useEffect(() => {
        const handleResize = () => {
            setTimeout(updateScrollButtons, 100);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const containerClasses = [
        'blocs-horizontal-scroll-container',
        compactControls ? 'compact-blocs-controls' : '',
        showControls ? 'show-controls' : '',
        containerClassName
    ].filter(Boolean).join(' ');

    const scrollAreaClasses = [
        'blocs-horizontal-scroll-area',
        'row-offset',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            {/* Left Scroll Button */}
            {showControls && (
                <button 
                    className={`blocs-horizontal-scroll-control blocs-scroll-control-prev ${!canScrollLeft ? 'disabled' : ''}`}
                    onClick={scrollLeft}
                    disabled={!canScrollLeft}
                    style={{ 
                        display: autoHide ? (canScrollLeft ? 'flex' : 'none') : 'flex',
                        opacity: canScrollLeft ? 1 : 0.3
                    }}
                    aria-label="Scroll left"
                >
                    <span className="blocs-round-btn">
                        <svg width="26" height="26" viewBox="0 0 32 32">
                            <path className="horizontal-scroll-icon" d="M22,2L9,16,22,30" />
                        </svg>
                    </span>
                </button>
            )}

            {/* Scrollable Content Area */}
            <div 
                className={scrollAreaClasses}
                ref={scrollAreaRef}
            >
                {children}
            </div>

            {/* Right Scroll Button */}
            {showControls && (
                <button 
                    className={`blocs-horizontal-scroll-control blocs-scroll-control-next ${!canScrollRight ? 'disabled' : ''}`}
                    onClick={scrollRight}
                    disabled={!canScrollRight}
                    style={{ 
                        display: autoHide ? (canScrollRight ? 'flex' : 'none') : 'flex',
                        opacity: canScrollRight ? 1 : 0.3
                    }}
                    aria-label="Scroll right"
                >
                    <span className="blocs-round-btn">
                        <svg width="26" height="26" viewBox="0 0 32 32">
                            <path className="horizontal-scroll-icon" d="M10.344,2l13,14-13,14" />
                        </svg>
                    </span>
                </button>
            )}
        </div>
    );
};

export default HorizontalScroll;