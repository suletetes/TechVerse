import React from 'react';
import CategoryScroll from "./CategoryScroll";

const Header = () => {
    return (
        <div className="bloc full-width-bloc l-bloc" id="header">
            <div className="container bloc-md">
                <div className="row g-0">
                    <div className="offset-lg-1 mb-4 col-lg-4 col-10 offset-1">
                        <h1 className="mb-4 bold-text">
                            <span className="primary-text">Our Store.</span> The best way to buy the products you love.
                        </h1>
                    </div>
                    <div className="text-start offset-md-0 col-md-12 col">
                        <CategoryScroll />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
