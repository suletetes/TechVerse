import React from "react";
import Accordion from "../component/Accordion";

const Delivery = () => {
    const deliveryItems = [
        {
            title: "Standard Delivery",
            content: (
                <p>
                    Orders are processed within <strong>1–2 business days</strong> and
                    delivered within <strong>3–5 business days</strong>. Standard
                    delivery is free for orders above ₦50,000 within Nigeria.
                </p>
            )
        },
        {
            title: "Express Delivery",
            content: (
                <p>
                    Need your order faster? Choose our express option. Express orders
                    are delivered within <strong>24–48 hours</strong> in major cities.
                    Extra charges apply depending on your location.
                </p>
            )
        },
        {
            title: "Delivery Details",
            content: (
                <p>
                    Once your order is shipped, you will receive a{" "}
                    <strong>tracking number</strong> via email and SMS. Our logistics
                    partners will keep you updated about your delivery status. Please
                    ensure someone is available to receive your package at the
                    delivery address.
                </p>
            )
        },
        {
            title: "International Delivery",
            content: (
                <p>
                    We ship worldwide through trusted courier services like DHL and
                    FedEx. International delivery usually takes{" "}
                    <strong>7–14 business days</strong>, depending on your location.
                    Customs duties or import taxes may apply and are the
                    responsibility of the customer.
                </p>
            )
        },
        {
            title: "Need Help?",
            content: (
                <p>
                    If you have questions about your delivery, contact our support
                    team at <a href="mailto:support@techverse.com">support@techverse.com</a> or call{" "}
                    <strong>+234 800 123 4567</strong>.
                </p>
            )
        }
    ];

    return (
        <div className="bloc l-bloc full-width-bloc" id="bloc-9">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    <div className="text-start offset-sm-1 col-sm-10 offset-lg-1 col-lg-10">
                        <h1 className="mb-4 tc-6533">Delivery Information</h1>
                        <p className="mb-4">
                            At TechVerse, we aim to provide fast, reliable, and affordable
                            delivery options to all our customers. Whether you're ordering
                            locally or internationally, we make sure your items arrive safely
                            and on time.
                        </p>

                        <Accordion items={deliveryItems} allowMultiple={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Delivery;