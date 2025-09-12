import React from 'react';

const SubFooter = () => {
    return (
        <div className="bloc none l-bloc primary-gradient-bg" id="sub-footer">
            <div className="container bloc-sm-lg bloc-md bloc-sm-md bloc-md-sm">
                <div className="row">
                    <div className="text-start col-lg-6 offset-lg-3 ps-0 pe-0">
                        <div className="blocs-horizontal-scroll-container compact-blocs-controls show-controls">
                            <div className="blocs-horizontal-scroll-control blocs-scroll-control-prev">
                                <span className="blocs-round-btn">
                                    <svg width="26" height="26" viewBox="0 0 32 32">
                                        <path className="horizontal-scroll-icon" d="M22,2L9,16,22,30" />
                                    </svg>
                                </span>
                            </div>
                            <div className="blocs-horizontal-scroll-area pe-sm-0">
                                <div className="fill-width-container ps-5 pe-5">
                                    <p className="text-center mb-0 tc-2175 sub-footer-text">
                                        Trade in your old devices and get&nbsp;credit towards your next purchase.
                                    </p>
                                </div>
                                <div className="fill-width-container ps-5 pe-5">
                                    <p className="text-center mb-0 tc-2175 sub-footer-text">
                                        Trade in your old devices and get&nbsp;credit towards your next purchase.
                                    </p>
                                </div>
                                <div className="fill-width-container ps-5 pe-5 ps-sm-5 pe-sm-5">
                                    <p className="text-center mb-0 tc-2175 sub-footer-text">
                                        Trade in your old devices and get&nbsp;credit towards your next purchase.
                                    </p>
                                </div>
                            </div>
                            <div className="blocs-horizontal-scroll-control blocs-scroll-control-next">
                                <span className="blocs-round-btn">
                                    <svg width="26" height="26" viewBox="0 0 32 32">
                                        <path className="horizontal-scroll-icon" d="M10.344,2l13,14-13,14" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubFooter;