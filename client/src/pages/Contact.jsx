import React, { useState } from "react";

const Contact = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
        optin: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form submitted:", formData);

        // In real-world apps, send this to backend API
        alert("Your message has been sent!");
        setFormData({ name: "", email: "", message: "", optin: false });
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="bloc-7">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    <div className="text-start mb-4 mb-lg-0 d-flex col-lg-5 offset-lg-1 col-sm-10 offset-sm-1">
                        <div className="store-card fill-card primary-gradient-bg">
                            <h1 className="mb-4 tc-2175">Contact</h1>
                            <p className="mb-5 tc-654">
                                Got questions or feedback? Fill out the form and we’ll get back
                                to you as soon as possible. Our support team is available
                                <strong> Monday–Friday, 9 AM – 6 PM</strong>.
                            </p>
                        </div>
                    </div>
                    <div className="text-start offset-lg-0 col-lg-5 offset-sm-1 col-sm-10">
                        <div className="store-card fill-card">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group mb-3">
                                    <label className="form-label">Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="form-control"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group mb-3">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        className="form-control"
                                        rows="4"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="optin"
                                        name="optin"
                                        checked={formData.optin}
                                        onChange={handleChange}
                                    />
                                    <label className="form-check-label" htmlFor="optin">
                                        Send me product updates and offers via email. (Optional)
                                    </label>
                                </div>

                                <button
                                    className="bloc-button btn btn-lg w-100 btn-c-2101 btn-rd"
                                    type="submit"
                                >
                                    Submit
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
