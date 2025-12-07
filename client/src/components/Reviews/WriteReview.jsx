import React, { useState, useEffect } from 'react';

const WriteReview = ({ productId, onSubmit, initialValues = {}, context, productInfo, submitButtonText = 'Submit Review' }) => {
    const [formData, setFormData] = useState({
        rating: initialValues.rating || 0,
        title: initialValues.title || '',
        comment: initialValues.comment || initialValues.review || '',
        pros: initialValues.pros || [],
        cons: initialValues.cons || [],
        productId: productId || productInfo?.id || context?.productId || null,
        productName: productInfo?.name || context?.productName || 'Product'
    });

    // Update form data when initialValues change (for edit mode)
    useEffect(() => {
        if (initialValues && Object.keys(initialValues).length > 0) {
            setFormData({
                rating: initialValues.rating || 0,
                title: initialValues.title || '',
                comment: initialValues.comment || initialValues.review || '',
                pros: initialValues.pros || [],
                cons: initialValues.cons || [],
                productId: productId || productInfo?.id || context?.productId || null,
                productName: productInfo?.name || context?.productName || 'Product'
            });
        }
    }, [initialValues, productId, productInfo, context]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (submitError) {
            setSubmitError(null);
        }
    };

    const handleRatingClick = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.rating === 0) {
            setSubmitError('Please select a rating');
            return;
        }
        
        if (!formData.title.trim()) {
            setSubmitError('Please enter a review title');
            return;
        }
        
        if (!formData.comment.trim()) {
            setSubmitError('Please write your review');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            if (onSubmit) {
                // Prepare data in backend format
                const reviewData = {
                    rating: formData.rating,
                    title: formData.title.trim(),
                    comment: formData.comment.trim(),
                    pros: formData.pros.filter(pro => pro.trim()),
                    cons: formData.cons.filter(con => con.trim())
                };

                await onSubmit(reviewData);
                
                // Reset form on successful submission
                setFormData({
                    rating: 0,
                    title: '',
                    comment: '',
                    pros: [],
                    cons: [],
                    productId: productId || productInfo?.id || context?.productId || null,
                    productName: productInfo?.name || context?.productName || 'Product'
                });
            }
        } catch (error) {
            setSubmitError(error.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
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
                {submitError && (
                    <div className="alert alert-danger mb-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        {submitError}
                    </div>
                )}

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
                        name="comment"
                        value={formData.comment}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Tell us about your experience with this product..."
                        required
                    ></textarea>
                    <div className="form-text">
                        Minimum 10 characters. {formData.comment.length}/1000
                    </div>
                </div>

                {/* Optional: Pros and Cons */}
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label className="form-label fw-semibold">What did you like? (Optional)</label>
                        <textarea
                            className="form-control"
                            name="pros"
                            value={formData.pros.join('\n')}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                pros: e.target.value.split('\n').filter(item => item.trim())
                            }))}
                            rows="3"
                            placeholder="List the positive aspects (one per line)"
                        ></textarea>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-semibold">What could be improved? (Optional)</label>
                        <textarea
                            className="form-control"
                            name="cons"
                            value={formData.cons.join('\n')}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                cons: e.target.value.split('\n').filter(item => item.trim())
                            }))}
                            rows="3"
                            placeholder="List areas for improvement (one per line)"
                        ></textarea>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-rd px-4"
                        disabled={formData.rating === 0 || isSubmitting || !formData.title.trim() || !formData.comment.trim()}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Submitting...</span>
                                </div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                    <path fill="currentColor"
                                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                {submitButtonText}
                            </>
                        )}
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-outline-secondary btn-rd px-3"
                        disabled={isSubmitting}
                        onClick={() => {
                            setFormData({
                                rating: 0,
                                title: '',
                                comment: '',
                                pros: [],
                                cons: [],
                                productId: productId || productInfo?.id || context?.productId || null,
                                productName: productInfo?.name || context?.productName || 'Product'
                            });
                            setSubmitError(null);
                        }}
                    >
                        Clear
                    </button>
                </div>
            </form>
        </div>
    );
};

export default WriteReview;