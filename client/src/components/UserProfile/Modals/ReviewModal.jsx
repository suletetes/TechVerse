import React from 'react';
import { ReviewsSection } from '../../Reviews';

const ReviewModal = ({ onClose, order }) => {
    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title tc-6533 fw-bold">
                            Write a Review {order ? `for Order #${order.id}` : ''}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <ReviewsSection
                            showHeader={false}
                            showDividers={false}
                            onSubmitReview={(data) => {
                                console.log('Review submitted for order:', order, data);
                                alert('Thank you for your review!');
                                onClose();
                            }}
                            showSummary={false}
                            showReviews={false}
                            showLoadMore={false}
                            showWriteReview={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;