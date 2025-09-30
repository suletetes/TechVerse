import React, { useState } from 'react';

const WriteReview = ({ onSubmit, initialValues = {}, context }) => {
    const [formData, setFormData] = useState({
        name: initialValues.name || '',
        email: initialValues.email || '',
        rating: initialValues.rating || 0,
        title: initialValues.title || '',
        review: initialValues.review || '',
        verifiedPurchase: initialValues.verifiedPurchase ?? false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRatingClick = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit({ ...formData, context });
        }
        // Reset form
        setFormData({
            name: initialValues.name || '',
            email: initialValues.email || '',
            rating: initialValues.rating || 0,
            title: '',
            review: '',
            verifiedPurchase: initialValues.verifiedPurchase ?? false
        });
    };

    return (
        <div className="write-review">
            <h5 className="tc-6533 fw-bold mb-4">Write a Review</h5>
            {context && (
                <div className="alert alert-light d-flex align-items-center" role="note">
                    {context.image && (
                        <img src={context.image} alt={context.productName} width="40" height="40" className="rounded me-2" style={{objectFit:'cover'}} />
                    )}
                    <div>
                        <div className="fw-semibold">{context.productName || 'Product'}</div>
                        {context.variant && <small className="text-muted">{context.variant}</small>}
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Your Name</label>
                        <input 
                            type="text" 
                            className="form-control"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your name"
                            required
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Email Address</label>
                        <input 
                            type="email" 
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label fw-semibold">Rating</label>
                    <div className="rating-input d-flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="btn btn-link p-1"
                                style={{fontSize: '24px', color: star <= formData.rating ? '#ffc107' : '#dee2e6'}}
                                onClick={() => handleRatingClick(star)}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label fw-semibold">Review Title</label>
                    <input 
                        type="text" 
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Summarize your review"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-semibold">Your Review</label>
                    <textarea
                        className="form-control"
                        name="review"
                        value={formData.review}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Tell us about your experience with this product..."
                        required
                    ></textarea>
                </div>

                <div className="form-check mb-3">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="verifiedPurchase"
                        name="verifiedPurchase"
                        checked={formData.verifiedPurchase}
                        onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="verifiedPurchase">
                        I confirm this is a verified purchase
                    </label>
                </div>

                <button type="submit" className="btn btn-primary btn-rd px-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                        <path fill="currentColor"
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Submit Review
                </button>
            </form>
        </div>
    );
};

export default WriteReview;