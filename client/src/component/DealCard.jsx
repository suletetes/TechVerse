import React from "react";

export default function DealCard({ imageWebp, imageJpg, title, price, discount, link }) {
    return (
        <div className="text-start d-flex mb-4 col-md-6 col-lg-4">
            <div className="store-card fill-card w-100">
                <a href={link}>
                    <picture>
                        <source type="image/webp" srcSet="img/lazyload-ph.png" data-srcset={imageWebp} />
                        <img
                            src="img/lazyload-ph.png"
                            data-src={imageJpg}
                            className="img-fluid mx-auto d-block lazyload"
                            alt={title}
                            width="360"
                            height="360"
                        />
                    </picture>
                </a>
                <div className="row g-0">
                    <div className="col-lg-12">
                        <h4 className="tc-6533 mb-0 lg-sub-title">{title}</h4>
                    </div>
                    <div className="col-lg-8">
                        <p className="tc-6533 mb-0">{price}</p>
                        <p className="tc-2101 bold-text sm-text mb-2">{discount}</p>
                    </div>
                    <div className="align-self-end col-lg-4">
                        <a href={link} className="btn btn-sm btn-rd btn-c-2101 float-lg-end buy-btn">
                            Buy
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
