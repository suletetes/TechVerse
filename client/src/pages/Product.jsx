import React from "react";

const Product = () => {
    return (
        <section className="bloc l-bloc full-width-bloc" id="bloc-7">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Title */}
                    <div className="text-start offset-lg-1 col-lg-10 mb-4 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        <h1 className="tc-6533 mb-0">Tablet Air</h1>
                    </div>

                    {/* Large product image */}
                    <div className="text-start offset-lg-1 mb-4 col-lg-6 mb-md-4 mb-lg-0 col-md-10 offset-md-1 col-sm-10 offset-sm-1 col-10 offset-1">
                        <div className="store-card outline-card fill-card">
                            <picture>
                                <source
                                    type="image/webp"
                                    srcSet="/img/lazyload-ph.png"
                                    data-srcset="../img/tablet-lg.webp"
                                />
                                <img
                                    src="/img/lazyload-ph.png"
                                    data-src="../img/tablet-lg.jpg"
                                    className="img-fluid mx-auto d-block img-rd-lg img-fluid-up lazyload"
                                    alt="tablet product"
                                    width="1014"
                                    height="1014"
                                />
                            </picture>
                        </div>
                    </div>

                    {/* Product details */}
                    <div className="text-start col-lg-4 col-md-10 offset-md-1 offset-lg-0 col-sm-10 offset-sm-1 col-10 offset-1">
                        <div className="store-card outline-card fill-card">
                            <p className="sm-product-title tc-2101 mb-0">Free Delivery</p>
                            <h3 className="tc-6533">Buy Tablet Air</h3>
                            <p className="tc-6533 float-lg-none mb-4">From £1999</p>
                            <p>
                                Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean
                                commodo ligula eget dolor. Lorem ipsum dolor sit amet,
                                consectetuer adipiscing elit.
                            </p>

                            <div className="divider-h"></div>

                            {/* Colour Options */}
                            <h5 className="tc-6533 mb-3">Colour</h5>
                            <div className="blocs-grid-container mb-4 colour-option-grid">
                                <div className="text-lg-start primary-outline model-option">
                                    <p className="mb-0">
                                        <span className="color-dot silver-dot">•</span> Silver
                                    </p>
                                </div>
                                <div className="text-lg-start model-option">
                                    <p className="mb-0">
                                        <span className="color-dot blue-dot">•</span> Blue
                                    </p>
                                </div>
                                <div className="text-lg-start model-option">
                                    <p className="mb-0">
                                        <span className="color-dot white-dot">•</span> White
                                    </p>
                                </div>
                                <div className="text-lg-start model-option">
                                    <p className="mb-0">
                                        <span className="color-dot">•</span> Black
                                    </p>
                                </div>
                                <div className="text-lg-start model-option">
                                    <p className="mb-0">
                                        <span className="color-dot red-dot">•</span> Red
                                    </p>
                                </div>
                                <div className="text-lg-start model-option">
                                    <p className="mb-0">
                                        <span className="color-dot green-dot">•</span> Green
                                    </p>
                                </div>
                            </div>

                            <div className="divider-h"></div>

                            {/* Storage Options */}
                            <h5 className="tc-6533 mb-3">Storage</h5>
                            <ul className="list-unstyled list-sp-lg">
                                <li>
                                    <div className="text-lg-start primary-outline model-option">
                                        <p className="mb-0 float-lg-none">
                                            128GB{" "}
                                            <span className="price-right token primary-gradient-bg">
                        $1999
                      </span>
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <div className="text-lg-start model-option">
                                        <p className="mb-0 float-lg-none">
                                            256GB <span className="price-right token">$2099</span>
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <div className="text-lg-start model-option">
                                        <p className="mb-0 float-lg-none">
                                            512GB <span className="price-right token">$2199</span>
                                        </p>
                                    </div>
                                </li>
                            </ul>

                            <div className="divider-h"></div>

                            {/* Buy Button */}
                            <a
                                href="."
                                data-active-page="active-page-link"
                                className="btn btn-rd btn-c-2101 buy-btn float-lg-none ps-5 pe-5 w-100 btn-lg"
                            >
                                Buy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Product;
