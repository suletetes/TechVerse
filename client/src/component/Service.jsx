import React from 'react';
import ServiceCard from './ServiceCard';

const Service = () => {
    const services = [
        {
            title: 'Pay Monthly',
            description: 'Spread the cost.',
            gradient: true
        },
        {
            title: 'Trade-ins',
            description: 'It pays to trade in.',
            gradient: false
        },
        {
            title: 'Extended Warranty',
            description: 'We got you covered.',
            gradient: false
        },
        {
            title: 'Free Returns',
            description: 'Hassle free returns.',
            gradient: true
        }
    ];

    return (
        <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="service">
            <div className="container bloc-md">
                <div className="row row-offset">
                    <div className="offset-lg-0 col-lg-12 ps-0">
                        <h3 className="mb-4 bold-text">
                            <span className="primary-text">Great Service.</span>&nbsp;Why you'll love to shop with us.
                        </h3>
                    </div>
                    <div className="text-start ps-0 mb-4 pe-0 col-md-12 mb-lg-0 pe-lg-2 d-flex col-lg-3">
                        <div className="store-card fill-card">
                            <h4 className="sm-product-title tc-2101">Free Delivery</h4>
                            <p className="tc-6533 lg-sub-title">Get your tech the next day.</p>
                            <div className="large-icon">
                                <svg height="100%" viewBox="0 0 200 200" width="100%" xmlns="http://www.w3.org/2000/svg">
                                    <path className="primary-icon"
                                          d="m170.027 148.632h-7.15a20.057 20.057 0 0 1 -39.43 0h-45.189a20.09 20.09 0 0 1 -39.484 0h-7.8c-10.511 0-15.972-5.455-15.972-15.9v-76.961c0-10.442 5.461-15.956 15.972-15.956h86.2c10.453 0 15.973 5.514 15.973 15.956v16.429h15.62c5.754 0 9.629 1.349 13.094 5.221l19.965 22.526c3.23 3.637 4.169 6.335 4.169 12.084v20.708c.005 10.438-5.517 15.893-15.968 15.893zm-111.453 8.389a12.085 12.085 0 1 0 -12.155-12.084 12.061 12.061 0 0 0 12.155 12.084zm65.126-101.074c0-4.4-2.349-6.687-6.694-6.687h-85.914c-4.4 0-6.635 2.288-6.635 6.687v76.612c0 4.4 2.231 6.628 6.635 6.628h8.189a20.108 20.108 0 0 1 38.474 0h45.945zm7.4 88.99a12.068 12.068 0 1 0 12.1-12.085 12.111 12.111 0 0 0 -12.106 12.085zm45.45-33.086a9.819 9.819 0 0 0 -2.408-6.335l-18.442-20.708c-2.409-2.64-4.522-3.168-7.517-3.168h-15.033v45.971a20.071 20.071 0 0 1 29.226 11.576h7.474c4.4 0 6.694-2.228 6.694-6.628v-20.708zm-37.463-4.282v-20.062h7.28a6.324 6.324 0 0 1 4.463 2.229l17.5 19.651a4.307 4.307 0 0 1 1.41 3.168h-25.6c-3.122 0-5.059-1.877-5.059-4.986z"
                                          fillRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="text-start d-flex mb-4 pe-0 ps-0 col-md-12 mb-lg-0 ps-lg-2 pe-lg-2 col-lg-6">
                        <div className="blocs-grid-container service-grid">
                            {services.map((service, index) => (
                                <ServiceCard
                                    key={index}
                                    title={service.title}
                                    description={service.description}
                                    gradient={service.gradient}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="text-start ps-0 pe-0 col-md-12 ps-lg-2 d-flex col-lg-3">
                        <div className="store-card fill-card">
                            <h4 className="sm-product-title tc-2101">Product Support</h4>
                            <p className="tc-6533 lg-sub-title">Get help with your tech.</p>
                            <div className="large-icon">
                                <svg height="100%" viewBox="0 0 200 200" width="100%" xmlns="http://www.w3.org/2000/svg">
                                    <path className="primary-icon"
                                          d="m22.165 54.493a2.791 2.791 0 0 1 2.793-2.793h17.32a2.789 2.789 0 1 1 0 5.578h-17.32a2.791 2.791 0 0 1 -2.793-2.785zm24.742 56.289h-21.949a2.789 2.789 0 1 0 0 5.578h21.95a2.789 2.789 0 1 0 0-5.578zm151.193-45.652v65.452a22 22 0 0 1 -21.989 21.969h-7.429l2.438 26.786a2.8 2.8 0 0 1 -4.613 2.349l-33.265-29.135h-55.394a21.979 21.979 0 0 1 -17.648-8.869l-27.6 24.17a2.793 2.793 0 0 1 -4.613-2.35l2.428-26.785h-7.426a22 22 0 0 1 -21.989-21.959v-65.452a22 22 0 0 1 21.989-21.959h98.263a22.131 22.131 0 0 1 20.412 13.82h34.447a22 22 0 0 1 21.989 21.963zm-140.681 73.562a21.789 21.789 0 0 1 -1.562-8.11v-33.921h-30.9a2.789 2.789 0 1 1 0-5.578h30.9v-14.114h-30.9a2.789 2.789 0 1 1 0-5.578h30.9v-6.261a21.78 21.78 0 0 1 1.468-7.848h-3.6a2.789 2.789 0 1 1 0-5.578h6.745a21.968 21.968 0 0 1 17.383-8.533h57.625a16.515 16.515 0 0 0 -14.221-8.246h-98.268a16.409 16.409 0 0 0 -16.4 16.381v65.452a16.41 16.41 0 0 0 16.4 16.381h10.484a2.79 2.79 0 0 1 2.792 2.79q0 .126-.011.252l-2.082 22.872zm135.1-73.562a16.41 16.41 0 0 0 -16.4-16.383h-98.271a16.413 16.413 0 0 0 -16.405 16.383v65.452a16.411 16.411 0 0 0 16.406 16.381h56.444a2.8 2.8 0 0 1 1.843.693l28.789 25.221-2.082-22.872a2.791 2.791 0 0 1 2.528-3.031c.084-.007.168-.011.253-.011h10.484a16.409 16.409 0 0 0 16.4-16.381zm-43.439 12.09a25.1 25.1 0 0 1 -3.846 14.354 23.187 23.187 0 0 1 -4.4 4.9c-.839.716-1.707 1.351-2.539 1.966-.388.285-.776.57-1.16.865-1.677 1.281-1.845 1.642-1.807 2.617l.188 4.959a8.723 8.723 0 0 1 -8.407 9.03h-.324a8.737 8.737 0 0 1 -8.714-8.376l-.189-4.958a18.074 18.074 0 0 1 5.932-14.855c1.065-.976 2.174-1.811 3.246-2.619.356-.268.713-.536 1.067-.808a11.077 11.077 0 0 0 2.39-2.282 8.5 8.5 0 0 0 1.1-4.78 4.632 4.632 0 0 0 -9.263 0 8.732 8.732 0 0 1 -17.463.008v-.012a22.1 22.1 0 0 1 44.191 0v-.008zm-5.586 0a16.511 16.511 0 0 0 -33.019-.371q0 .186 0 .371a3.146 3.146 0 0 0 6.291 0 10.234 10.234 0 0 1 10.118-10.22 10.456 10.456 0 0 1 3.984.806 10.049 10.049 0 0 1 6.313 9.41 13.735 13.735 0 0 1 -2.052 7.892 15.837 15.837 0 0 1 -3.594 3.574c-.373.289-.747.57-1.12.85-1.011.762-1.965 1.48-2.831 2.274a12.48 12.48 0 0 0 -4.13 10.543l.188 4.958a3.134 3.134 0 0 0 5.433 2.017 3.1 3.1 0 0 0 .839-2.241l-.187-4.958a8.121 8.121 0 0 1 4-7.262c.409-.312.82-.616 1.231-.919.795-.586 1.543-1.139 2.248-1.734a17.781 17.781 0 0 0 3.371-3.738 19.754 19.754 0 0 0 2.912-11.251zm-7.014 52.007a9.549 9.549 0 1 1 -9.551-9.533 9.552 9.552 0 0 1 9.546 9.533zm-5.586 0a3.963 3.963 0 1 0 -3.963 3.958 3.965 3.965 0 0 0 3.958-3.958z"
                                          fillRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Service;