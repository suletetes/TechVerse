import React from "react";
import CategoryItem from './CategoryItem';
import { HorizontalScroll } from '../Common';

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