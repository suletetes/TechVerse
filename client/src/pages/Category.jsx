// src/components/Phones.jsx
import React from "react";
import { Link } from "react-router-dom";

// Example product data
const phones = [
    {
        id: 1,
        name: "Phone Pro",
        price: "From £2000",
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/1",
    },
    {
        id: 2,
        name: "Phone Lite",
        price: "From £1500",
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/2",
    },
    {
        id: 3,
        name: "Phone Ultra",
        price: "From £2500",
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/3",
    },
    // ➕ add as many as you want
];

const Category = () => {
    return (
        <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="bloc-8">
            <div className="container bloc-md-sm bloc-md bloc-lg-md">
                <div className="row row-offset">
                    <div className="col-lg-12 ps-0 pe-0 mb-4">
                        <h1 className="tc-6533 mb-0">Phones</h1>
                    </div>

                    {phones.map((phone) => (
                        <div
                            className="text-start d-flex col-md-6 col-lg-4 mb-2"
                            key={phone.id}
                        >
                            <div className="store-card fill-card">
                                <Link to={phone.link}>
                                    <picture>
                                        <source type="image/webp" srcSet={phone.webp} />
                                        <img
                                            src={phone.image}
                                            alt={phone.name}
                                            className="img-fluid mx-auto d-block"
                                            width="360"
                                            height="360"
                                        />
                                    </picture>
                                </Link>
                                <div className="row g-0">
                                    <div className="col-lg-9">
                                        <h5 className="tc-6533 mb-0 lg-sub-title">{phone.name}</h5>
                                        <p className="tc-6533 float-lg-none mb-2">{phone.price}</p>
                                    </div>
                                    <div className="col-lg-3 align-self-end">
                                        <Link
                                            to={phone.link}
                                            className="btn btn-sm btn-rd btn-c-2101 float-lg-end buy-btn"
                                        >
                                            Buy
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Category;
