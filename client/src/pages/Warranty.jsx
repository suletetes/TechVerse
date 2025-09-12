import React from "react";
import Accordion from "../component/Accordion";

const Warranty = () => {
    const warrantyItems = [
        {
            title: "What does the warranty cover?",
            content: (
                <p>
                    The warranty covers defects in materials and workmanship under
                    normal use. If a product fails due to a covered defect, we will
                    repair or replace it at no additional cost.
                </p>
            )
        },
        {
            title: "What is not covered?",
            content: (
                <div>
                    <p>The warranty does not cover damage caused by:</p>
                    <ul>
                        <li>Accidents or misuse</li>
                        <li>Unauthorized repairs or modifications</li>
                        <li>Normal wear and tear</li>
                        <li>Exposure to extreme conditions (heat, moisture, etc.)</li>
                    </ul>
                </div>
            )
        },
        {
            title: "How to claim warranty?",
            content: (
                <p>
                    To claim warranty, please contact our support team with proof of
                    purchase and a detailed description of the issue. Once verified,
                    we will guide you through the repair or replacement process.
                </p>
            )
        }
    ];

    return (
        <div className="bloc l-bloc full-width-bloc" id="bloc-8">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    <div className="text-start offset-sm-1 col-sm-10 offset-lg-1 col-lg-10">
                        <h1 className="mb-4 tc-6533">Warranty Policy</h1>
                        <p className="mb-4">
                            Our products come with a standard warranty designed to give you
                            peace of mind. This warranty covers manufacturing defects and
                            ensures that your product will function as intended under normal
                            usage conditions.
                            <br />
                            <br />
                            Please read the following terms carefully to understand what is
                            covered and how you can claim warranty support.
                        </p>

                        <Accordion items={warrantyItems} allowMultiple={true} />

                        <p className="mt-4">
                            For further questions regarding warranty coverage, please reach
                            out to our customer care team.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Warranty;
