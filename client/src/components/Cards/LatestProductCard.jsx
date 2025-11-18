import React  from "react";
const LatestProductCard = ({ link, imgWebp, imgJpg, title, price, stock, inStock = true }) => {
    const getStockStatus = () => {
        if (!stock || !stock.trackQuantity) return { text: 'In Stock', class: 'text-success' };
        if (stock.quantity === 0) return { text: 'Out of Stock', class: 'text-danger' };
        if (stock.quantity <= stock.lowStockThreshold) return { text: `Low Stock (${stock.quantity})`, class: 'text-warning' };
        return { text: 'In Stock', class: 'text-success' };
    };

    const stockStatus = getStockStatus();

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
                    <p className="tc-6533 float-lg-none mb-1">{price}</p>
                    <small className={`${stockStatus.class} fw-bold`}>{stockStatus.text}</small>
                </div>
                <div className="col-lg-3 align-self-end">
                    <a 
                        href={link} 
                        className={`btn btn-sm btn-rd float-lg-end buy-btn ${!inStock ? 'btn-secondary disabled' : 'btn-c-2101'}`}
                        style={{ pointerEvents: !inStock ? 'none' : 'auto' }}
                    >
                        {inStock ? 'Buy' : 'Out of Stock'}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LatestProductCard;
