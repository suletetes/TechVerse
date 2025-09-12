import React from 'react';
import Accordion from "../component/Accordion";

const Privacy = () => {
    const privacyItems = [
        {
            title: "Personal Data",
            content: (
                <p>
                    We may collect personal details such as your name, email address,
                    and contact information when you create an account, place an order,
                    or contact us. This information is used only to provide our
                    services, improve user experience, and communicate important
                    updates.
                </p>
            )
        },
        {
            title: "Consent",
            content: (
                <p>
                    By using our site, you consent to the collection and use of your
                    personal information in accordance with this policy. You may
                    withdraw your consent at any time by contacting us, though this may
                    affect your ability to use certain features of our services.
                </p>
            )
        },
        {
            title: "Data Protection",
            content: (
                <p>
                    We take appropriate security measures to protect your information
                    against unauthorized access, alteration, or disclosure. However, no
                    method of transmission over the internet is 100% secure, and we
                    cannot guarantee absolute security.
                </p>
            )
        },
        {
            title: "Third-Party Services",
            content: (
                <p>
                    We may use trusted third-party providers (such as payment gateways
                    or analytics tools) that process your information under strict
                    confidentiality agreements. These providers are not authorized to
                    use your data for any other purposes.
                </p>
            )
        },
        {
            title: "Your Rights",
            content: (
                <p>
                    You have the right to request access to the data we hold about you,
                    correct inaccuracies, or request deletion of your personal
                    information. To exercise these rights, please contact our support
                    team.
                </p>
            )
        },
        {
            title: "Updates",
            content: (
                <p>
                    We may update this Privacy Policy from time to time. Any changes
                    will be posted on this page with the "last updated" date. We
                    encourage you to review this policy periodically to stay informed.
                </p>
            )
        }
    ];

    return (
        <div className="bloc l-bloc full-width-bloc" id="bloc-10">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    <div className="text-start offset-sm-1 col-sm-10 offset-lg-1 col-lg-10">
                        <h1 className="mb-4 tc-6533">Privacy Policy</h1>
                        <p className="mb-4">
                            At <strong>TechVerse</strong>, we value your privacy and are committed to
                            protecting your personal information. This policy explains how we
                            collect, use, and safeguard your data when you use our website or
                            services.
                        </p>

                        <Accordion items={privacyItems} allowMultiple={true} />

                        <p className="mt-4">
                            <strong>Last updated: September 2025</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Privacy