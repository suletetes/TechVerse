
const ProductCard = ({ link, imgWebp, imgJpg, title, price }) => {
    return (
        <div className="store-card sm-card">
            <a href={link}>
                <picture>
                    <source type="image/webp" srcSet="img/lazyload-ph.png" data-srcset={imgWebp} />
                    <img
                        src="img/lazyload-ph.png"
                        data-src={imgJpg}
                        className="img-fluid mx-auto d-block lazyload"
                        alt={title}
                        width="240"
                        height="240"
                    />
                </picture>
            </a>
            <div className="card-content">
                <h5 className="sm-product-title tc-6533">{title}</h5>
                <p className="tc-6533 mb-0">{price}</p>
                <a href={link}>
                    <img
                        className="img-fluid float-lg-end arrow-btn sm-arrow-btn lazyload"
                        src="img/lazyload-ph.png"
                        data-src="img/arrow.svg"
                        alt="arrow dark"
                        data-bs-placement="top"
                        data-bs-toggle="tooltip"
                        title="View Product"
                        width="26"
                        height="26"
                    />
                </a>
            </div>
        </div>
    );
};

export default ProductCard;
