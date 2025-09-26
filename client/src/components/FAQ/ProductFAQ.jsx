import React from 'react';
import { Link } from 'react-router-dom';
import { Accordion } from '../';

const ProductFAQ = () => {
    const faqItems = [
        {
            title: "What's included in the box?",
            content: (
                <p className="text-muted mb-0">
                    Your Tablet Air comes with the device, USB-C charging cable, 20W
                    USB-C power adapter, and documentation. Apple Pencil and keyboard
                    are sold separately.
                </p>
            )
        },
        {
            title: "Is this compatible with Apple Pencil?",
            content: (
                <p className="text-muted mb-0">
                    Yes, Tablet Air is compatible with Apple Pencil (2nd generation)
                    which attaches magnetically to the side of your tablet for wireless
                    charging and pairing.
                </p>
            )
        },
        {
            title: "What's the return policy?",
            content: (
                <p className="text-muted mb-0">
                    We offer a 30-day return policy for unopened items in original
                    packaging. Opened items can be returned within 14 days. All returns
                    must be in like-new condition.
                </p>
            )
        },
        {
            title: "Do you offer international shipping?",
            content: (
                <p className="text-muted mb-0">
                    Yes, we ship to most countries worldwide. Shipping costs and
                    delivery times vary by location. Free shipping is available for
                    orders over £50 within the UK.
                </p>
            )
        },
        {
            title: "What warranty is included?",
            content: (
                <p className="text-muted mb-0">
                    All our products come with a 2-year manufacturer warranty covering
                    defects in materials and workmanship. Extended warranty options are
                    available at checkout.
                </p>
            )
        }
    ];

    return (
        <div className="store-card outline-card fill-card">
            <div className="p-4">
                <h3 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="me-2 text-info">
                        <path fill="currentColor"
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                    </svg>
                    Frequently Asked Questions
                </h3>

                <Accordion
                    items={faqItems}
                    allowMultiple={false}
                />

                <div className="text-center mt-4">
                    <Link to="/faq" className="btn btn-outline-info btn-rd px-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor"
                                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                        </svg>
                        View All FAQs
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductFAQ;