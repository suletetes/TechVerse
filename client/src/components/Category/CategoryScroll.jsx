import React from "react";
import CategoryItem from './CategoryItem';
import { HorizontalScroll } from '../Common';

const CategoryScroll = () => {
    const categories = [
        { title: 'Phones', imgSrc: 'img/phone.svg', link: '/products?category=phones' },
        { title: 'Tablets', imgSrc: 'img/tablet.svg', link: '/products?category=tablets' },
        { title: 'Computers', imgSrc: 'img/computer.svg', link: '/products?category=computers' },
        { title: 'TVs', imgSrc: 'img/tv.svg', link: '/products?category=tvs' },
        { title: 'Gaming', imgSrc: 'img/gaming.svg', link: '/products?category=gaming' },
        { title: 'Watches', imgSrc: 'img/watch.svg', link: '/products?category=watches' },
        { title: 'Audio', imgSrc: 'img/headphones.svg', link: '/products?category=audio' },
        { title: 'Cameras', imgSrc: 'img/camera.svg', link: '/products?category=cameras' },
        { title: 'Accessories', imgSrc: 'img/accessories.svg', link: '/products?category=accessories' },
        // { title: 'Gift Card', imgSrc: 'img/gift-card.svg', link: '/products?category=gift-cards' }
    ];

    return (
        <HorizontalScroll compactControls={true}>
            {categories.map((category, index) => (
                <CategoryItem
                    key={index}
                    title={category.title}
                    imgSrc={category.imgSrc}
                    link={category.link}
                />
            ))}
        </HorizontalScroll>
    );
};

export default CategoryScroll;