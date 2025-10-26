import React  from "react";
export default function QuickPickCard({ imageWebp, imageJpg, title, price, link, stock, inStock = true }) {
    const getStockStatus = () => {
        if (!stock || !stock.trackQuantity) return { text: 'In Stock', class: 'text-success' };
        if (stock.quantity === 0) return { text: 'Out of Stock', class: 'text-danger' };
        if (stock.quantity <= stock.lowStockThreshold) return { text: 'Low Stock', class: 'text-warning' };
        return { text: 'In Stock', class: 'text-success' };
    };

    const stockStatus = getStockStatus();

    return (
        <div className="store-card xs-card text-center">
            <a href={link}>
                <picture>
                    <source type="image/webp" srcSet="img/lazyload-ph.png" data-srcset={imageWebp} />
                    <img
                        src="img/lazyload-ph.png"
                        data-src={imageJpg}
                        className="img-fluid mx-auto d-block lazyload"
                        alt={title}
                        width="160"
                        height="160"
                    />
                </picture>
            </a>
            <div className="card-content">
                <h6 className="tc-6533 xs-product-title">{title}</h6>
                <small className={`${stockStatus.class} fw-bold d-block mb-2`}>{stockStatus.text}</small>
                <a 
                    href={link} 
                    className={`btn btn-sm btn-rd buy-btn w-100 ${!inStock ? 'btn-secondary disabled' : 'btn-c-2101'}`}
                    style={{ pointerEvents: !inStock ? 'none' : 'auto' }}
                >
                    {inStock ? `Buy ${price}` : 'Out of Stock'}
                </a>
            </div>
        </div>
    );
}
