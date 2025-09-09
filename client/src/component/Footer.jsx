
const Footer = () => {
    return (
        <div className="bloc bgc-6533 full-width-bloc d-bloc" id="footer">
            <div className="container bloc-md">
                <div className="row row-offset">
                    {/* About */}
                    <div className="col-12 ps-lg-0 col-lg-3 col-sm-6 mb-3 mb-lg-0">
                        <h6 className="mg-md text-center text-sm-start tc-2175">About</h6>
                        <a href="/stores" className="a-btn a-block footer-link ltc-654 mb-3">
                            Stores
                        </a>
                        <a href="/" className="a-btn a-block footer-link ltc-654 mb-3">
                            Deals
                        </a>
                        <a href="/" className="a-btn a-block footer-link ltc-654 mb-3">
                            Careers
                        </a>
                    </div>

                    {/* Site Information */}
                    <div className="col-12 col-lg-3 col-sm-6 mb-3 mb-lg-0">
                        <h6 className="mg-md text-center text-sm-start tc-2175">
                            Site Information
                        </h6>
                        <a href="/privacy" className="a-btn a-block footer-link ltc-654 mb-3">
                            Privacy Policy
                        </a>
                        <a href="/shipping" className="a-btn a-block footer-link ltc-654 mb-3">
                            Cookie Policy
                        </a>
                        <a href="/faq" className="a-btn a-block footer-link ltc-654">
                            Terms & Conditions
                        </a>
                    </div>

                    {/* Customer Service */}
                    <div className="col-12 col-lg-3 col-sm-6 mb-3 mb-sm-0">
                        <h6 className="mg-md text-center text-sm-start tc-2175">
                            Customer Service
                        </h6>
                        <a href="/contact" className="a-btn a-block footer-link ltc-654 mb-3">
                            Contact
                        </a>
                        <a href="/delivery" className="a-btn a-block footer-link ltc-654 mb-3">
                            Delivery
                        </a>
                        <a href="/returns" className="a-btn a-block footer-link ltc-654">
                            Returns
                        </a>
                    </div>

                    {/* Follow Us */}
                    <div className="col-12 pe-lg-0 col-lg-3 col-sm-6 text-center text-sm-start">
                        <h6 className="mg-md text-center text-sm-start tc-2175">
                            Follow Us
                        </h6>
                        <div className="social-link-bric d-flex">
                            <a href="https://twitter.com/#" target="_blank" rel="noreferrer">
                                <i className="bi bi-twitter"/>
                            </a>
                            <a href="https://www.facebook.com/#" target="_blank" rel="noreferrer">
                                <i className="bi bi-facebook"/>
                            </a>
                            <a href="https://www.instagram.com/#" target="_blank" rel="noreferrer">
                                <i className="bi bi-instagram"/>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;
