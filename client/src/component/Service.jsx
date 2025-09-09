import ServiceCard from "./ServiceCard";

export default function Service() {
    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="service">
            <div className="container bloc-md">
                <div className="row row-offset">
                    <div className="col-lg-12 ps-0">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">Great Service.</span> Why you'll love to shop with us.
                        </h3>
                    </div>

                    {/* Left Card */}
                    <div className="col-md-12 col-lg-3 d-flex ps-0 pe-0 mb-4 mb-lg-0 pe-lg-2">
                        <ServiceCard
                            title="Free Delivery"
                            description="Get your tech the next day."
                            icon={
                                <svg height="100%" viewBox="0 0 200 200" width="100%">
                                    <path
                                        className="primary-icon"
                                        d="m170.027 148.632h-7.15a20.057 20.057 0 0 1 -39.43 0h-45.189a20.09 20.09 0 0 1 -39.484 0h-7.8c-10.511 0-15.972-5.455-15.972-15.9v-76.961c0-10.442 5.461-15.956 15.972-15.956h86.2c10.453 0 15.973 5.514 15.973 15.956v16.429h15.62c5.754 0 9.629 1.349 13.094 5.221l19.965 22.526c3.23 3.637 4.169 6.335 4.169 12.084v20.708c.005 10.438-5.517 15.893-15.968 15.893z"
                                        fillRule="evenodd"
                                    ></path>
                                </svg>
                            }
                        />
                    </div>

                    {/* Middle Grid */}
                    <div className="col-md-12 col-lg-6 d-flex ps-0 pe-0 mb-4 mb-lg-0 ps-lg-2 pe-lg-2">
                        <div className="blocs-grid-container service-grid">
                            <ServiceCard title="Pay Monthly" description="Spread the cost." gradient />
                            <ServiceCard title="Trade-ins" description="It pays to trade in." />
                            <ServiceCard title="Extended Warranty" description="We got you covered." />
                            <ServiceCard title="Free Returns" description="Hassle free returns." gradient />
                        </div>
                    </div>

                    {/* Right Card */}
                    <div className="col-md-12 col-lg-3 d-flex ps-0 pe-0 ps-lg-2">
                        <ServiceCard
                            title="Product Support"
                            description="Get help with your tech."
                            icon={
                                <svg height="100%" viewBox="0 0 200 200" width="100%">
                                    <path
                                        className="primary-icon"
                                        d="m22.165 54.493a2.791 2.791 0 0 1 2.793-2.793h17.32a2.789 2.789 0 1 1 0 5.578h-17.32a2.791 2.791 0 0 1 -2.793-2.785zm24.742 56.289h-21.949a2.789 2.789 0 1 0 0 5.578h21.95a2.789 2.789 0 1 0 0-5.578z"
                                        fillRule="evenodd"
                                    ></path>
                                </svg>
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
