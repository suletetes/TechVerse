import React  from "react";
const CategoryItem = ({ link, imgSrc, title }) => {
    return (
        <div className="ms-1 me-1 me-sm-2 ms-sm-2 ms-md-3 me-md-3 ms-lg-5 me-lg-5">
            <a href={link}>
                <img
                    src="img/lazyload-ph.png"
                    data-src={imgSrc}
                    className="img-fluid mx-auto d-block category-icon primary-gradient-bg lazyload"
                    alt={title}
                    width="40"
                    height="40"
                />
            </a>
            <h5 className="mb-4 text-center tc-6533 mt-2 category-title">{title}</h5>
        </div>
    );
};

export default CategoryItem;
