import QuickPickCard from "./QuickPickCard";

export default function QuickPicks() {
    const quickPicks = [
        {
            title: "Ultra HD QLED",
            price: "$2999",
            link: "./product/",
            imageWebp: "img/tv-product.webp",
            imageJpg: "img/tv-product.jpg",
        },
        {
            title: "Tablet Pro",
            price: "$1099",
            link: "./product/",
            imageWebp: "img/tablet-product.webp",
            imageJpg: "img/tablet-product.jpg",
        },
        {
            title: "Phone 15",
            price: "$899",
            link: "./product/",
            imageWebp: "img/phone-product.webp",
            imageJpg: "img/phone-product.jpg",
        },
        {
            title: "Laptop Pro",
            price: "$2599",
            link: "./product/",
            imageWebp: "img/laptop-product.webp",
            imageJpg: "img/laptop-product.jpg",
        },
        {
            title: "HD TV Plus",
            price: "$5999",
            link: "./product/",
            imageWebp: "img/tv-product.webp",
            imageJpg: "img/tv-product.jpg",
        },
        {
            title: "Phone Air",
            price: "$699",
            link: "./product/",
            imageWebp: "img/phone-product.webp",
            imageJpg: "img/phone-product.jpg",
        },
    ];

    return (
        <div className="bloc full-width-bloc bgc-5700 l-bloc" id="quick-picks">
            <div className="container bloc-md">
                <div className="row g-0">
                    <div className="col-lg-10 col-10 offset-1">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">Quick Picks.</span>&nbsp;Perfect gifts at perfect prices.
                        </h3>
                    </div>
                    <div className="col-lg-12">
                        <div className="blocs-horizontal-scroll-container">
                            <div className="blocs-horizontal-scroll-control blocs-scroll-control-prev">
                <span className="blocs-round-btn">
                  <svg width="26" height="26" viewBox="0 0 32 32">
                    <path className="horizontal-scroll-icon" d="M22,2L9,16,22,30"></path>
                  </svg>
                </span>
                            </div>

                            <div className="blocs-horizontal-scroll-area row-offset">
                                {quickPicks.map((item, index) => (
                                    <QuickPickCard key={index} {...item} />
                                ))}
                            </div>

                            <div className="blocs-horizontal-scroll-control blocs-scroll-control-next">
                <span className="blocs-round-btn">
                  <svg width="26" height="26" viewBox="0 0 32 32">
                    <path className="horizontal-scroll-icon" d="M10.344,2l13,14-13,14"></path>
                  </svg>
                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
