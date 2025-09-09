import CategoryItem from "./CategoryItem";

const categories = [
    { link: "./category/", imgSrc: "img/phone.svg", title: "Phones" },
    { link: "./category/", imgSrc: "img/tablet.svg", title: "Tablets" },
    { link: "./category/", imgSrc: "img/computer.svg", title: "Computers" },
    { link: "./category/", imgSrc: "img/tv.svg", title: "TVs" },
    { link: "./category/", imgSrc: "img/gaming.svg", title: "Gaming" },
    { link: "./category/", imgSrc: "img/watch.svg", title: "Watches" },
    { link: "./category/", imgSrc: "img/headphones.svg", title: "Audio" },
    { link: "./category/", imgSrc: "img/camera.svg", title: "Cameras" },
    { link: "./category/", imgSrc: "img/accessories.svg", title: "Accessories" },
    { link: "./category/", imgSrc: "img/gift-card.svg", title: "Gift Card" },
];

const CategoryScroll = () => {
    return (
        <div className="blocs-horizontal-scroll-container compact-blocs-controls">
            <div className="blocs-horizontal-scroll-control blocs-scroll-control-prev">
        <span className="blocs-round-btn">
          <svg width="26" height="26" viewBox="0 0 32 32">
            <path className="horizontal-scroll-icon" d="M22,2L9,16,22,30"></path>
          </svg>
        </span>
            </div>

            <div className="blocs-horizontal-scroll-area row-offset">
                {categories.map((cat, index) => (
                    <CategoryItem key={index} {...cat} />
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
    );
};

export default CategoryScroll;
