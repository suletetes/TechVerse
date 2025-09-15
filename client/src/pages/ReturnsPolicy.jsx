import React from "react";
import Accordion from "../components/Accordion";

const ReturnsPolicy = () => {
    const returnsItems = [
        {
            title: "How to return a product to us",
            content: (
                <p>
                    To return a product, please contact our customer service team at{" "}
                    <a href="mailto:support@yourstore.com">support@yourstore.com</a> with
                    your order number and reason for return. Once approved, you will receive
                    instructions on how and where to send your package.
                </p>
            )
        },
        {
            title: "How to report a damaged product",
            content: (
                <p>
                    If your order arrives damaged or defective, please report it within{" "}
                    <strong>48 hours</strong> of delivery. Send clear photos of the product
                    and packaging to our support team. We will arrange a replacement or
                    refund at no additional cost to you.
                </p>
            )
        },
        {
            title: "What do I do if my new product is faulty?",
            content: (
                <p>
                    In the unlikely event that your product is faulty, please notify us as
                    soon as possible. Faulty items are eligible for free repair, replacement,
                    or a full refund depending on the issue. We may request proof of the
                    fault before processing your claim.
                </p>
            )
        },
        {
            title: "How to return a faulty product",
            content: (
                <p>
                    If your faulty product needs to be returned, our team will provide a
                    prepaid shipping label. Please pack the item securely, include your order
                    details, and drop it off at the designated courier point. Once received,
                    we will inspect the item and process your refund or replacement within{" "}
                    <strong>5–7 business days</strong>.
                </p>
            )
        },
        {
            title: "Non-returnable items",
            content: (
                <p>
                    Please note that some items such as perishable goods, custom-made
                    products, and digital downloads are not eligible for return unless they
                    arrive faulty or damaged.
                </p>
            )
        }
    ];

    return (
        <div className="bloc l-bloc full-width-bloc" id="bloc-8">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    <div className="text-start offset-lg-1 col-lg-10 offset-sm-1 col-sm-10">
                        <h1 className="mb-4 tc-6533">Returns Policy</h1>
                        <p className="mb-4">
                            At <strong>YourStore</strong>, we want you to be completely satisfied with
                            your purchase. If for any reason you are not happy with your product,
                            you may return it within <strong>7 days</strong> of delivery for a refund
                            or exchange, provided it meets the conditions below.
                        </p>

                        <Accordion items={returnsItems} allowMultiple={true} />

                        <p className="mt-4">
                            If you have any questions regarding our Returns Policy, please contact
                            us at <a href="mailto:support@yourstore.com">support@yourstore.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnsPolicy;
