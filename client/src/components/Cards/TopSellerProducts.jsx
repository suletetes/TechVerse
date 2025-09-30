import ProductCard from './ProductCard';
import { HorizontalScroll } from '../Common';

const TopSellerProducts = () => {
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
                        <HorizontalScroll>
                            {products.map((product, index) => (
                                <ProductCard
                                    key={index}
                                    product={product}
                                />
                            ))}
                        </HorizontalScroll>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopSellerProducts;