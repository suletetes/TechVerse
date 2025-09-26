import React from 'react';
import { Link } from 'react-router-dom';
import RelatedProductCard from './RelatedProductCard';

const RelatedProducts = () => {
    const relatedProducts = [
        {
            id: 1,
            name: "Phone Pro Max",
            price: "From £1,199",
            originalPrice: "£1,299",
            image: "../img/phone-product.jpg",
            webp: "../img/phone-product.webp",
            rating: 4.9,
            reviews: 89,
            badge: "Best Seller"
        },
        {
            id: 2,
            name: "Laptop Ultra",
            price: "From £2,499",
            originalPrice: null,
            image: "../img/laptop-product.jpg",
            webp: "../img/laptop-product.webp",
            rating: 4.7,
            reviews: 156,
            badge: "New"
        },
        {
            id: 3,
            name: "Watch Series 9",
            price: "From £399",
            originalPrice: "£449",
            image: "../img/watch-product.jpg",
            webp: "../img/watch-product.webp",
            rating: 4.8,
            reviews: 234,
            badge: "Sale"
        },
        {
            id: 4,
            name: "AirPods Pro",
            price: "From £249",
            originalPrice: null,
            image: "../img/airpods-product.jpg",
            webp: "../img/airpods-product.webp",
            rating: 4.6,
            reviews: 312,
            badge: null
        }
    ];

    return (
        <div className="store-card outline-card fill-card">
            <div className="p-4">
                <h3 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="me-2 text-primary">
                        <path fill="currentColor"
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    You Might Also Like
                </h3>

                <div className="row g-4">
                    {relatedProducts.map((product) => (
                        <div key={product.id} className="col-lg-3 col-md-6 col-sm-6">
                            <RelatedProductCard product={product} />
                        </div>
                    ))}
                </div>

                <div className="text-center mt-4">
                    <Link to="/category" className="btn btn-outline-primary btn-rd px-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor"
                                  d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"/>
                        </svg>
                        View All Products
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RelatedProducts;