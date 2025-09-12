import React from "react";

const storeLocations = [
    {
        city: "Tokyo",
        area: "Chiyoda-ku",
        description:
            "Located in the heart of Tokyo, our flagship store brings you the best shopping experience with modern designs and exclusive collections.",
    },
    {
        city: "Kyoto",
        area: "Kyoto-shi",
        description:
            "Discover our Kyoto branch, inspired by the city’s rich cultural heritage and offering a curated selection of local favorites.",
    },
    {
        city: "California",
        area: "San Francisco",
        description:
            "Our San Francisco store blends technology and lifestyle, serving as a hub for innovation and unique shopping experiences.",
    },
    {
        city: "New York",
        area: "Upper West Side",
        description:
            "Visit our New York store, designed for trendsetters who want style, quality, and convenience all in one place.",
    },
    {
        city: "Central London",
        area: "Regent Street",
        description:
            "In the heart of London, our Regent Street store offers timeless fashion and world-class customer service.",
    },
    {
        city: "Tyne and Wear",
        area: "Newcastle upon Tyne",
        description:
            "Our Newcastle branch connects tradition and modernity, offering products loved by families across the UK.",
    },
];

const Stores = () => {
    return (
        <section className="stores-section bgc-5700 full-width-bloc l-bloc" id="stores">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Section Intro */}
                    <div className="text-start col-md-10 offset-md-1 col-lg-5 col-12">
                        <div className="store-card mb-3 primary-gradient-bg fill-card p-4">
                            <h1 className="mb-4 tc-2175">Our Stores</h1>
                            <p className="tc-654">
                                We are proud to serve customers around the world through our key
                                store locations. Each branch reflects the local culture while
                                delivering the same premium experience. Find the nearest store
                                to you and enjoy shopping with us.
                            </p>
                        </div>
                    </div>

                    {/* Store Locations */}
                    <div className="text-start d-flex col-md-10 offset-md-1 col-lg-5 col-12">
                        <div className="store-card fill-card p-4 w-100">
                            {storeLocations.map((store, index) => (
                                <div key={index} className="mb-5">
                                    <h3 className="primary-text">{store.city}</h3>
                                    <h4 className="mb-3 tc-6533">{store.area}</h4>
                                    <p>{store.description}</p>
                                    <a
                                        href="#"
                                        className="btn btn-sm btn-rd btn-c-2101 buy-btn mt-2"
                                    >
                                        Get Directions
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Stores;
