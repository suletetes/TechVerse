import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useOrder, useCart } from '../context';
import { LoadingSpinner, Toast } from '../components/Common';
import { ReviewsSection } from '../components';
import { ReorderModal } from '../components/UserProfile/Modals';

const OrderReview = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { loadOrder, currentOrder, isLoading, error } = useOrder();
    const { addToCart } = useCart();
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [existingReview, setExistingReview] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        console.log('🔍 DEBUG: OrderReview mounted, orderId:', orderId);
        if (orderId) {
            loadOrder(orderId);
        }
    }, [orderId, loadOrder]);

    // Load existing review after order is loaded
    useEffect(() => {
        console.log('🔍 DEBUG: Order changed:', {
            hasOrder: !!currentOrder,
            reviewedAt: currentOrder?.reviewedAt,
            orderNumber: currentOrder?.orderNumber
        });
        
        if (currentOrder) {
            // Always try to load existing review, regardless of reviewedAt
            loadExistingReview();
        }
    }, [currentOrder]);

    const loadExistingReview = async () => {
        console.log('🔍 DEBUG: Loading existing review for order:', orderId);
        try {
            const { default: reviewService } = await import('../api/services/reviewService.js');
            const response = await reviewService.getOrderReviews(orderId);
            
            console.log('🔍 DEBUG: Review service response:', response);
            
            if (response.data && response.data.reviews && response.data.reviews.length > 0) {
                // Use the first review as the template (all products get same review)
                const review = response.data.reviews[0];
                console.log('✅ DEBUG: Found existing review:', review);
                setExistingReview(review);
                setIsEditMode(true);
            } else {
                console.log('ℹ️ DEBUG: No existing reviews found');
                setIsEditMode(false);
                setExistingReview(null);
            }
        } catch (error) {
            console.error('❌ DEBUG: Error loading existing review:', error);
            setIsEditMode(false);
            setExistingReview(null);
        }
    };

    if (isLoading) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc" style={{ minHeight: '60vh' }}>
                <div className="container bloc-md">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error || !currentOrder) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc">
                <div className="container bloc-md">
                    <div className="alert alert-danger">
                        <h4>Order Not Found</h4>
                        <p>{error || 'Unable to load order details'}</p>
                        <Link to="/profile?tab=orders" className="btn btn-primary">
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const order = currentOrder;

    const handleReviewSubmit = async (reviewData) => {
        try {
            const { default: productService } = await import('../api/services/productService.js');
            const { default: reviewService } = await import('../api/services/reviewService.js');
            
            if (isEditMode && existingReview) {
                // Update existing review
                await reviewService.updateReview(existingReview._id, {
                    rating: reviewData.rating,
                    title: reviewData.title,
                    comment: reviewData.comment,
                    pros: reviewData.pros || [],
                    cons: reviewData.cons || []
                });
                
                setToast({
                    message: 'Your review has been updated successfully!',
                    type: 'success',
                    action: {
                        label: 'View Order',
                        path: `/user/order/${order._id}`
                    }
                });
            } else {
                // Create new reviews for each product in the order
                const reviewPromises = order.items.map(async (item) => {
                    // Extract product ID - handle both populated and non-populated cases
                    let productId;
                    if (typeof item.product === 'string') {
                        productId = item.product;
                    } else if (item.product && item.product._id) {
                        productId = item.product._id;
                    } else if (item._id) {
                        productId = item._id;
                    }
                    
                    if (!productId) {
                        console.error('Could not find product ID for item:', item);
                        return null;
                    }
                    
                    const productReviewData = {
                        rating: reviewData.rating,
                        title: reviewData.title,
                        comment: reviewData.comment,
                        pros: reviewData.pros || [],
                        cons: reviewData.cons || [],
                        orderId: order._id
                    };
                    
                    return productService.addProductReview(productId, productReviewData);
                });
                
                // Filter out null results and wait for all reviews
                await Promise.all(reviewPromises.filter(p => p !== null));
                
                setToast({
                    message: 'Thank you for your review! Your feedback helps other customers make informed decisions.',
                    type: 'success',
                    action: {
                        label: 'View Order',
                        path: `/user/order/${order._id}`
                    }
                });
            }
            
            console.log('Review submitted for order:', order.orderNumber, reviewData);
            
            // Redirect to order details after 3 seconds
            setTimeout(() => {
                navigate(`/user/order/${order._id}`);
            }, 3000);
        } catch (error) {
            console.error('❌ DEBUG: Error submitting review:', error);
            console.error('❌ DEBUG: Error details:', {
                message: error.message,
                response: error.response,
                status: error.status
            });
            
            // Show more detailed error message
            let errorMessage = 'Failed to submit review. Please try again.';
            if (error.message && error.message !== 'Bad request') {
                errorMessage = error.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            setToast({
                message: errorMessage,
                type: 'error'
            });
        }
    };

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="order-review-bloc">
            <div className="container bloc-md bloc-lg-md">
                <div className="row">
                    {/* Page Header */}
                    <div className="col-12 mb-4">
                        <h1 className="tc-6533 bold-text">
                            {isEditMode ? 'Edit' : 'Write'} Review for Order #{order.orderNumber}
                        </h1>
                        <p className="tc-6533">
                            {isEditMode 
                                ? 'Update your review for the products from this order' 
                                : 'Share your experience with the products from this order'}
                        </p>
                    </div>

                    <div className="row">
                        {/* Review Form */}
                        <div className="col-lg-8 mb-4">
                            <div className="store-card fill-card">
                                <h3 className="tc-6533 bold-text mb-4">Product Reviews</h3>
                                
                                {/* Order Items to Review */}
                                <div className="mb-4">
                                    <h5 className="tc-6533 mb-3">Items in this order:</h5>
                                    {order.items.map((item, index) => (
                                        <div key={item._id || index} className="d-flex align-items-center p-3 border rounded mb-3">
                                            <img
                                                src={item.image || '/img/placeholder.jpg'}
                                                alt={item.name}
                                                className="rounded me-3"
                                                width="60"
                                                height="60"
                                                style={{ objectFit: 'cover' }}
                                            />
                                            <div className="flex-grow-1">
                                                <h6 className="tc-6533 mb-1">{item.name}</h6>
                                                {item.variants && item.variants.length > 0 && (
                                                    <p className="tc-6533 mb-0 small">
                                                        {item.variants.map(v => `${v.name}: ${v.value}`).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-end">
                                                <p className="tc-6533 bold-text mb-0">${item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Review Form */}
                                {console.log('🔍 DEBUG: Rendering ReviewsSection with:', {
                                    isEditMode,
                                    hasExistingReview: !!existingReview,
                                    existingReview
                                })}
                                <ReviewsSection
                                    showHeader={false}
                                    showDividers={false}
                                    onSubmitReview={handleReviewSubmit}
                                    showSummary={false}
                                    showReviews={false}
                                    showLoadMore={false}
                                    showWriteReview={true}
                                    title={isEditMode ? "Edit Your Review" : "Rate Your Purchase"}
                                    submitButtonText={isEditMode ? "Update Review" : "Submit Review"}
                                    writeReviewInitialValues={existingReview ? {
                                        rating: existingReview.rating,
                                        title: existingReview.title,
                                        comment: existingReview.comment,
                                        pros: existingReview.pros || [],
                                        cons: existingReview.cons || []
                                    } : {}}
                                />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="col-lg-4">
                            {/* Order Summary */}
                            <div className="store-card fill-card mb-4">
                                <h5 className="tc-6533 bold-text mb-3">Order Summary</h5>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Order Number:</small>
                                    <span className="tc-6533">{order.orderNumber}</span>
                                </div>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Order Date:</small>
                                    <span className="tc-6533">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Total Amount:</small>
                                    <span className="tc-6533 bold-text">${order.total.toFixed(2)}</span>
                                </div>
                                <div className="mb-3">
                                    <small className="text-muted d-block">Status:</small>
                                    <span className="badge bg-success">{order.status}</span>
                                </div>
                            </div>

                            {/* Review Guidelines */}
                            <div className="store-card fill-card mb-4">
                                <h5 className="tc-6533 bold-text mb-3">Review Guidelines</h5>
                                <ul className="small tc-6533 mb-0">
                                    <li className="mb-2">Be honest and helpful in your review</li>
                                    <li className="mb-2">Focus on the product's features and performance</li>
                                    <li className="mb-2">Mention both pros and cons if applicable</li>
                                    <li className="mb-2">Keep your review relevant to the product</li>
                                    <li className="mb-0">Avoid personal information in your review</li>
                                </ul>
                            </div>

                            {/* Quick Actions */}
                            <div className="store-card fill-card">
                                <h5 className="tc-6533 bold-text mb-3">Quick Actions</h5>
                                <div className="d-grid gap-2">
                                    <Link
                                        to={`/user/order/${order._id}`}
                                        className="btn btn-outline-primary btn-rd"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        View Order Details
                                    </Link>
                                    <Link
                                        to={`/user/order/${order._id}/tracking`}
                                        className="btn btn-outline-info btn-rd"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 3h5v5" />
                                            <path d="M8 3H3v5" />
                                            <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
                                            <path d="M21 3l-7.828 7.828A4 4 0 0 0 12 13.657V22" />
                                        </svg>
                                        Track Order
                                    </Link>
                                    <button 
                                        className="btn btn-outline-secondary btn-rd"
                                        onClick={() => setShowReorderModal(true)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="23 4 23 10 17 10" />
                                            <polyline points="1 20 1 14 7 14" />
                                            <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        Reorder Items
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reorder Modal */}
            {showReorderModal && (
                <ReorderModal 
                    onClose={() => setShowReorderModal(false)}
                    order={order}
                    onReorder={async (selectedItems, itemQuantities) => {
                        try {
                            for (const item of selectedItems) {
                                const quantity = itemQuantities[item.id]?.quantity || 1;
                                const productId = item.id;
                                
                                const options = {};
                                if (item.variants && Array.isArray(item.variants)) {
                                    item.variants.forEach(variant => {
                                        if (variant.name && variant.value) {
                                            options[variant.name] = variant.value;
                                        }
                                    });
                                }
                                
                                await addToCart(productId, quantity, options);
                            }
                            
                            setToast({
                                message: 'Items added to cart successfully!',
                                type: 'success',
                                action: {
                                    label: 'View Cart',
                                    path: '/cart'
                                }
                            });
                            setShowReorderModal(false);
                        } catch (error) {
                            setToast({
                                message: 'Failed to add items to cart. Please try again.',
                                type: 'error'
                            });
                        }
                    }}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    action={toast.action}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default OrderReview;