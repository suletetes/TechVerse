import React, { useState } from 'react';

const WriteReview = ({ onSubmit, initialValues = {}, context, productInfo }) => {
    const [formData, setFormData] = useState({
        name: initialValues.name || '',
        email: initialValues.email || '',
        rating: initialValues.rating || 0,
        title: initialValues.title || '',
        review: initialValues.review || '',
        verifiedPurchase: initialValues.verifiedPurchase ?? false,
        productId: productInfo?.id || context?.productId || null,
        productName: productInfo?.name || context?.productName || 'Tablet Air'
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
            onSubmit({ 
                ...formData, 
                context,
                timestamp: new Date().toISOString(),
                id: Date.now() // Simple ID generation for demo
            });
        }
        // Reset form
        setFormData({
            name: initialValues.name || '',
            email: initialValues.email || '',
            rating: initialValues.rating || 0,
            title: '',
            review: '',
            verifiedPurchase: initialValues.verifiedPurchase ?? false,
            productId: productInfo?.id || context?.productId || null,
            productName: productInfo?.name || context?.productName || 'Tablet Air'
        });
    };

    return (
        <div className="write-review">
            <h5 className="tc-6533 fw-bold mb-4">Write a Review</h5>
            
            {/* Product Context Display */}
            <div className="alert alert-light d-flex align-items-center mb-4" role="note">
                <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded me-3" style={{width: '48px', height: '48px', minWidth: '48px'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary">
                        <path fill="currentColor" d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                    </svg>
                </div>
                <div>
                    <div className="fw-semibold">{formData.productName}</div>
                    <small className="text-muted">Share your experience with this product</small>
                </div>
            </div>
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
                    <label className="form-label fw-semibold">Rating *</label>
                    <div className="rating-input d-flex align-items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="btn btn-link p-1"
                                style={{fontSize: '24px', color: star <= formData.rating ? '#ffc107' : '#dee2e6'}}
                                onClick={() => handleRatingClick(star)}
                                title={`${star} star${star > 1 ? 's' : ''}`}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </button>
                        ))}
                        {formData.rating > 0 && (
                            <span className="ms-2 text-muted small">
                                {formData.rating} out of 5 stars
                            </span>
                        )}
                    </div>
                    {formData.rating === 0 && (
                        <small className="text-danger">Please select a rating</small>
                    )}
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

                <div className="d-flex gap-2">
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-rd px-4"
                        disabled={formData.rating === 0}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor"
                                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Submit Review
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-outline-secondary btn-rd px-3"
                        onClick={() => setFormData({
                            name: initialValues.name || '',
                            email: initialValues.email || '',
                            rating: initialValues.rating || 0,
                            title: '',
                            review: '',
                            verifiedPurchase: initialValues.verifiedPurchase ?? false,
                            productId: productInfo?.id || context?.productId || null,
                            productName: productInfo?.name || context?.productName || 'Tablet Air'
                        })}
                    >
                        Clear
                    </button>
                </div>
            </form>
        </div>
    );
};

export default WriteReview;