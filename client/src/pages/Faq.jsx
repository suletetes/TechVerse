// src/components/FAQ.jsx
import React from "react";

const faqData = [
    {
        title: "Terms & Conditions",
        content: `By using our website and services, you agree to comply with our terms
    and conditions. These include respecting intellectual property rights,
    using the platform responsibly, and following all applicable laws.
    Any violation of these terms may result in account suspension or
    service restrictions.`,
    },
    {
        title: "Our Products",
        content: `We ensure that all our products are of the highest quality before they
    reach you. Product details, including specifications, colors, and sizes,
    are provided on each product page. While we strive for accuracy, slight
    variations may occur due to screen settings or manufacturing updates.`,
    },
    {
        title: "Delivery",
        content: `We partner with trusted courier services to deliver your orders safely
    and on time. Delivery timelines may vary depending on your location.
    Tracking details will be shared once your order has been dispatched.
    Please ensure your delivery information is correct to avoid delays.`,
    },
    {
        title: "Returns Policy",
        content: `If you are not satisfied with your purchase, you may request a return
    within 14 days of receiving your order. Items must be unused, in their
    original packaging, and accompanied by proof of purchase. Refunds will
    be processed within 7 business days after we receive your return.
    Certain products, such as personal care items, may not be eligible for
    return due to hygiene reasons.`,
    },
];

const Faq = () => {
    return (
        <section className="faq-section l-bloc full-width-bloc" id="faq">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    <div className="text-start offset-sm-1 col-sm-10 offset-lg-1 col-lg-10">
                        {faqData.map((item, index) => (
                            <div key={index} className="mb-5">
                                <h3 className="mb-3 tc-6533">{item.title}</h3>
                                <p>{item.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Faq;
