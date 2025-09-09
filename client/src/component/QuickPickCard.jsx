export default function QuickPickCard({ imageWebp, imageJpg, title, price, link }) {
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
                <a href={link} className="btn btn-sm btn-rd btn-c-2101 buy-btn w-100">
                    Buy {price}
                </a>
            </div>
        </div>
    );
}
