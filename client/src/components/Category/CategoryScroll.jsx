import React  from "react";
import CategoryItem from './CategoryItem';

const CategoryScroll = () => {
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

    return (
        <div className="blocs-horizontal-scroll-container compact-blocs-controls">
            <div className="blocs-horizontal-scroll-control blocs-scroll-control-prev">
                <span className="blocs-round-btn">
                    <svg width="26" height="26" viewBox="0 0 32 32">
                        <path className="horizontal-scroll-icon" d="M22,2L9,16,22,30" />
                    </svg>
                </span>
            </div>
            <div className="blocs-horizontal-scroll-area row-offset">
                {categories.map((category, index) => (
                    <CategoryItem
                        key={index}
                        title={category.title}
                        imgSrc={category.imgSrc}
                        link={category.link}
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
    );
};

export default CategoryScroll;