import React from "react";
import Accordion from "../components/Accordion";

const ShippingPolicy = () => {
    const shippingItems = [
        {
            title: "Processing Time",
            content: (
                <p>
                    Orders are typically processed within <strong>1–2 business days</strong>.
                    During peak seasons or sales events, processing times may be slightly
                    longer. You will receive a confirmation email once your order has been
                    dispatched.
                </p>
            )
        },
        {
            title: "Domestic Shipping",
            content: (
                <p>
                    Standard shipping within the country usually takes{" "}
                    <strong>3–5 business days</strong>. Express options are available at an
                    additional cost, reducing delivery time to <strong>1–2 business days</strong>.
                </p>
            )
        },
        {
            title: "International Shipping",
            content: (
                <p>
                    We ship to most countries worldwide. International delivery times vary
                    between <strong>7–14 business days</strong>, depending on the
                    destination and customs clearance processes. Customers are responsible
                    for any import duties or taxes.
                </p>
            )
        },
        {
            title: "Tracking Your Order",
            content: (
                <p>
                    Once your order has shipped, you will receive a tracking number by email
                    so you can monitor your delivery in real time.
                </p>
            )
        },
        {
            title: "Lost or Delayed Packages",
            content: (
                <p>
                    If your package is delayed or lost, please contact our customer service
                    team at{" "}
                    <a href="mailto:support@yourstore.com">support@yourstore.com</a>. We will
                    work with the courier to resolve the issue as quickly as possible.
                </p>
            )
        }
    ];

    return (
        <div className="bloc l-bloc full-width-bloc" id="bloc-8">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    <div className="text-start offset-sm-1 col-sm-10 offset-lg-1 col-lg-10">
                        <h1 className="mb-4 tc-6533">Shipping Policy</h1>
                        <p className="mb-4">
                            At <strong>YourStore</strong>, we strive to deliver your orders quickly
                            and safely. We offer domestic and international shipping with reliable
                            courier partners. Delivery times and costs vary depending on your
                            location and the shipping method you choose at checkout.
                        </p>

                        <Accordion items={shippingItems} allowMultiple={true} />

                        <p className="mt-4">
                            For further questions about shipping, please reach out to our support
                            team. We are happy to help.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingPolicy;
