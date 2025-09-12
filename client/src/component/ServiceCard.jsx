import React  from "react";
export default function ServiceCard({title, description, icon, gradient}) {
    return (
        <div
            className={`store-card ${gradient ? "primary-gradient-bg bgc-2101 box-card" : "fill-card box-card"}`}
        >
            <h4 className={`sm-product-title ${gradient ? "tc-2175" : "tc-2101"}`}>{title}</h4>
            <p className={`${gradient ? "tc-654" : "tc-6533"} lg-sub-title mb-0`}>
                {description}
            </p>
            {icon && <div className="large-icon">{icon}</div>}
        </div>
    );
}
