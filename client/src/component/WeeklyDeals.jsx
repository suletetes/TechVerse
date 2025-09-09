import React from "react";
import DealCard from "./DealCard";

export default function WeeklyDeals() {
    const deals = [
        {
            title: "Ultra Laptop",
            price: "From £2000",
            discount: "Save $1000",
            link: "./product/",
            imageWebp: "img/laptop-product.webp",
            imageJpg: "img/laptop-product.jpg",
        },
        {
            title: "Tablet Air",
            price: "From £1999",
            discount: "Save $400",
            link: "./product/",
            imageWebp: "img/tablet-product.webp",
            imageJpg: "img/tablet-product.jpg",
        },
        {
            title: "Phone Ultra",
            price: "From £999",
            discount: "Save $100",
            link: "./product/",
            imageWebp: "img/phone-product.webp",
            imageJpg: "img/phone-product.jpg",
        },
    ];

    return (
        <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="weekly-deals">
            <div className="container bloc-md">
                <div className="row row-offset">
                    <div className="col-lg-12 ps-0 pe-0">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">Weekly Deals.</span> Discover our amazing offers.
                        </h3>
                    </div>
                    {deals.map((deal, index) => (
                        <DealCard key={index} {...deal} />
                    ))}
                </div>
            </div>
        </div>
    );
}
