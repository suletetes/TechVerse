import React  from "react";
const LatestProductCard = ({ link, imgWebp, imgJpg, title, price }) => {
    return (
        <div className="store-card">
            <a href={link}>
                <picture>
                    <source type="image/webp" srcSet="img/lazyload-ph.png" data-srcset={imgWebp} />
                    <img
                        src="img/lazyload-ph.png"
                        data-src={imgJpg}
                        className="img-fluid mx-auto d-block lazyload"
                        alt={title}
                        width="360"
                        height="360"
                    />
                </picture>
            </a>

            <div className="row g-0">
                <div className="col-lg-9">
                    <h5 className="tc-6533 mb-0 lg-sub-title">{title}</h5>
                    <p className="tc-6533 float-lg-none mb-2">{price}</p>
                </div>
                <div className="col-lg-3 align-self-end">
                    <a href={link} className="btn btn-sm btn-rd btn-c-2101 float-lg-end buy-btn">
                        Buy
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LatestProductCard;
