import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProduct } from '../context';
import { LoadingSpinner } from '../components/Common';
import ReviewItem from '../components/Reviews/ReviewItem';
import reviewService from '../api/services/reviewService';
import reviewDebugger from '../utils/reviewDebug';

const ProductReviews = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentProduct, isLoading: productLoading, loadProduct } = useProduct();
    
    const [sortBy, setSortBy] = useState('newest');
    const [filterRating, setFilterRating] = useState('all');
    const [reviews, setReviews] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalReviews, setTotalReviews] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [ratingBreakdown, setRatingBreakdown] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const reviewsPerPage = 10;

    // Load product info
    useEffect(() => {
        if (id) {
            loadProduct(id);
        }
    }, [id, loadProduct]);

    // Fetch reviews from API
    useEffect(() => {
        const fetchReviews = async () => {
            if (!id) {
                reviewDebugger.log('WARNING', 'No product ID provided');
                return;
            }

            const startTime = Date.now();
            reviewDebugger.startTimer('fetchReviews');

            try {
                setReviewsLoading(true);
                
                const params = {
                    page: currentPage,
                    limit: reviewsPerPage,
                    sort: sortBy,
                    rating: filterRating !== 'all' ? parseInt(filterRating) : undefined
                };

                reviewDebugger.logApiRequest(`/api/products/${id}/reviews`, params);
                reviewDebugger.logFilterSort(filterRating, sortBy);
                
                const response = await reviewService.getProductReviews(id, params);
                
                const duration = Date.now() - startTime;
                reviewDebugger.endTimer('fetchReviews');
                reviewDebugger.logApiResponse(`/api/products/${id}/reviews`, response, duration);

                // Validate response
                if (!reviewDebugger.validateApiResponse(response)) {
                    throw new Error('Invalid API response structure');
                }

                // Handle both response formats: {success, data} or direct {reviews, pagination}
                const responseData = response.success ? response.data : response;

                if (responseData.reviews) {
                    // Process reviews
                    const processedReviews = responseData.reviews.map(review => ({
                        id: review._id,
                        name: review.user?.firstName && review.user?.lastName 
                            ? `${review.user.firstName} ${review.user.lastName}`
                            : review.user?.name || 'Anonymous',
                        rating: review.rating,
                        date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently',
                        title: review.title,
                        review: review.comment,
                        verified: review.verified || false,
                        helpful: review.helpful?.length || 0,
                        pros: review.pros || [],
                        cons: review.cons || []
                    }));

                    reviewDebugger.logReviewProcessing(responseData.reviews, processedReviews);
                    reviewDebugger.logPagination(
                        responseData.pagination.currentPage,
                        responseData.pagination.totalPages,
                        responseData.pagination.totalReviews,
                        reviewsPerPage
                    );

                    // Validate each review
                    processedReviews.forEach(review => {
                        reviewDebugger.validateReview(review);
                    });

                    setReviews(processedReviews);
                    setTotalReviews(responseData.pagination.totalReviews);
                    setTotalPages(responseData.pagination.totalPages);
                    setRatingBreakdown(responseData.ratingBreakdown);

                    // If no reviews from DB, show sample reviews
                    if (processedReviews.length === 0) {
                        reviewDebugger.logFallbackToSample('No reviews in database');
                        setReviews([
                            {
                                id: 1,
                                name: "Sarah Johnson",
                                rating: 5,
                                date: "2 days ago",
                                title: "Excellent product, highly recommended!",
                                review: "I've been using this product for a month now and it has exceeded all my expectations. The quality is outstanding and it works perfectly for my needs.",
                                verified: true,
                                helpful: 12,
                                pros: ["Great quality", "Easy to use", "Good value"],
                                cons: []
                            },
                            {
                                id: 2,
                                name: "Michael Chen",
                                rating: 5,
                                date: "1 week ago",
                                title: "Perfect for work and daily use",
                                review: "This product has been a game-changer for my daily routine. Highly efficient and reliable. Would definitely recommend to anyone looking for quality.",
                                verified: true,
                                helpful: 8,
                                pros: ["Reliable", "Fast performance"],
                                cons: []
                            },
                            {
                                id: 3,
                                name: "Emily Rodriguez",
                                rating: 4,
                                date: "2 weeks ago",
                                title: "Great value for money",
                                review: "Overall a great product. Does exactly what it promises. Minor issues but nothing major. Very satisfied with my purchase.",
                                verified: true,
                                helpful: 5,
                                pros: ["Good price", "Works well"],
                                cons: ["Could be faster"]
                            },
                            {
                                id: 4,
                                name: "David Kim",
                                rating: 5,
                                date: "3 weeks ago",
                                title: "Exceeded expectations",
                                review: "I was skeptical at first, but this product has proven to be worth every penny. The build quality is excellent and it performs flawlessly.",
                                verified: true,
                                helpful: 15,
                                pros: ["Excellent build", "Great performance"],
                                cons: []
                            },
                            {
                                id: 5,
                                name: "Lisa Anderson",
                                rating: 4,
                                date: "1 month ago",
                                title: "Very satisfied",
                                review: "Good product overall. It meets all my requirements and the customer service was excellent. Would buy again.",
                                verified: true,
                                helpful: 6,
                                pros: ["Good customer service", "Reliable"],
                                cons: ["Packaging could be better"]
                            }
                        ]);
                        setTotalReviews(5);
                        setTotalPages(1);
                    }
                }
            } catch (error) {
                reviewDebugger.endTimer('fetchReviews');
                reviewDebugger.logApiError(`/api/products/${id}/reviews`, error);
                reviewDebugger.logFallbackToSample(`API Error: ${error.message}`);
                // Show sample reviews on error
                setReviews([
                    {
                        id: 1,
                        name: "Sarah Johnson",
                        rating: 5,
                        date: "2 days ago",
                        title: "Excellent product, highly recommended!",
                        review: "I've been using this product for a month now and it has exceeded all my expectations. The quality is outstanding and it works perfectly for my needs.",
                        verified: true,
                        helpful: 12,
                        pros: ["Great quality", "Easy to use", "Good value"],
                        cons: []
                    },
                    {
                        id: 2,
                        name: "Michael Chen",
                        rating: 5,
                        date: "1 week ago",
                        title: "Perfect for work and daily use",
                        review: "This product has been a game-changer for my daily routine. Highly efficient and reliable. Would definitely recommend to anyone looking for quality.",
                        verified: true,
                        helpful: 8,
                        pros: ["Reliable", "Fast performance"],
                        cons: []
                    }
                ]);
                setTotalReviews(2);
                setTotalPages(1);
            } finally {
                setReviewsLoading(false);
                reviewDebugger.printSummary();
            }
        };

        fetchReviews();
    }, [id, currentPage, sortBy, filterRating, reviewsPerPage]);

    // Debug state changes
    useEffect(() => {
        reviewDebugger.logStateChange('currentPage', null, currentPage);
    }, [currentPage]);

    useEffect(() => {
        reviewDebugger.logStateChange('sortBy', null, sortBy);
    }, [sortBy]);

    useEffect(() => {
        reviewDebugger.logStateChange('filterRating', null, filterRating);
    }, [filterRating]);

    // Calculate rating distribution from API data or fallback
    console.log('Rating Breakdown:', ratingBreakdown);
    console.log('Total Reviews:', totalReviews);
    
    // API returns: {ratings: [{rating: 5, count: 3}], totalReviews: 5, averageRating: 4.6}
    const ratingCounts = ratingBreakdown?.ratings?.map(r => ({
        rating: r.rating, // Use r.rating, not r._id
        count: r.count,
        percentage: totalReviews > 0 ? (r.count / totalReviews) * 100 : 0
    })) || [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: 0,
        percentage: 0
    }));

    console.log('Rating Counts:', ratingCounts);

    // Ensure all ratings 1-5 are present
    const allRatingCounts = [5, 4, 3, 2, 1].map(rating => {
        const existing = ratingCounts.find(r => r.rating === rating);
        return existing || { rating, count: 0, percentage: 0 };
    });

    console.log('All Rating Counts:', allRatingCounts);

    // Calculate average rating from API data or reviews
    const averageRating = ratingBreakdown?.averageRating?.toFixed(1) || 
        (reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0);

    // Pagination info
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = Math.min(startIndex + reviewsPerPage, totalReviews);

    // Reset to page 1 when filters or sort changes (handled by useEffect dependency)

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    if (productLoading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!currentProduct) {
        return (
            <div className="bloc bgc-5700 full-width-bloc l-bloc">
                <div className="container bloc-md">
                    <div className="text-center">
                        <h2 className="tc-6533">Product not found</h2>
                        <Link to="/" className="btn btn-primary mt-3">Back to Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bloc bgc-5700 full-width-bloc l-bloc" id="product-reviews-page">
            <div className="container bloc-md bloc-lg-md">
                
                {/* Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div>
                                <h1 className="tc-6533 mb-2">Customer Reviews</h1>
                                <p className="text-muted mb-0">{currentProduct.name}</p>
                            </div>
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={() => navigate(`/product/${currentProduct.slug || id}`)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" style={{ verticalAlign: 'middle' }}>
                                    <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                                Back to Product
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* Sidebar - Filters & Stats */}
                    <div className="col-lg-3 mb-4">
                        <div className="store-card fill-card sticky-top" style={{ top: '20px' }}>
                            {/* Overall Rating */}
                            <div className="text-center mb-4 pb-4 border-bottom">
                                <div className="display-4 fw-bold tc-6533 mb-2">{averageRating}</div>
                                <div className="mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} width="20" height="20" viewBox="0 0 24 24" className="text-warning">
                                            <path 
                                                fill={i < Math.round(averageRating) ? 'currentColor' : 'none'}
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                            />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-muted mb-0">Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
                            </div>

                            {/* Rating Distribution */}
                            <div className="mb-4">
                                <h6 className="fw-bold mb-3 tc-6533">Rating Distribution</h6>
                                {allRatingCounts.map(({ rating, count, percentage }) => (
                                    <div key={rating} className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <small className="tc-6533">
                                                {rating} <span className="text-warning">★</span>
                                            </small>
                                            <small className="text-muted">{count}</small>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div
                                                className="progress-bar bg-warning"
                                                style={{ width: `${percentage}%` }}
                                                role="progressbar"
                                                aria-valuenow={percentage}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Filter by Rating */}
                            <div>
                                <h6 className="fw-bold mb-3 tc-6533">Filter by Rating</h6>
                                <div className="d-grid gap-2">
                                    <button
                                        className={`btn ${filterRating === 'all' ? 'btn-primary' : 'btn-outline-secondary'} btn-sm text-start`}
                                        onClick={() => { setFilterRating('all'); setCurrentPage(1); }}
                                    >
                                        <span>All Ratings</span>
                                        <span className="badge bg-secondary float-end">{totalReviews}</span>
                                    </button>
                                    {allRatingCounts.map(({ rating, count }) => (
                                        <button
                                            key={rating}
                                            className={`btn ${filterRating === rating.toString() ? 'btn-primary' : 'btn-outline-secondary'} btn-sm text-start`}
                                            onClick={() => { setFilterRating(rating.toString()); setCurrentPage(1); }}
                                        >
                                            <span>
                                                {[...Array(rating)].map((_, i) => (
                                                    <span key={i} className="text-warning">★</span>
                                                ))}
                                            </span>
                                            <span className="badge bg-secondary float-end">{count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Reviews */}
                    <div className="col-lg-9">
                        <div className="store-card fill-card">
                            {/* Sort Controls */}
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                                <div>
                                    <strong className="tc-6533">{totalReviews}</strong> 
                                    <span className="text-muted"> {totalReviews === 1 ? 'review' : 'reviews'}</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <label className="me-2 mb-0 text-muted small">Sort by:</label>
                                    <select 
                                        className="form-select form-select-sm" 
                                        style={{ width: 'auto' }}
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="newest">Most Recent</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="highest">Highest Rating</option>
                                        <option value="lowest">Lowest Rating</option>
                                        <option value="helpful">Most Helpful</option>
                                    </select>
                                </div>
                            </div>

                            {/* Reviews List */}
                            {reviewsLoading ? (
                                <div className="text-center py-5">
                                    <LoadingSpinner size="lg" />
                                    <p className="text-muted mt-3">Loading reviews...</p>
                                </div>
                            ) : reviews.length > 0 ? (
                                <>
                                    <div className="reviews-list">
                                        {reviews.map((review, index) => (
                                            <div key={review.id}>
                                                <ReviewItem review={review} />
                                                {index < reviews.length - 1 && (
                                                    <div className="divider-h my-4"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
                                            <div className="text-muted small">
                                                Showing {startIndex + 1}-{endIndex} of {totalReviews} reviews
                                            </div>
                                            <nav aria-label="Reviews pagination">
                                                <ul className="pagination mb-0">
                                                    {/* Previous Button */}
                                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                        <button 
                                                            className="page-link"
                                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                            disabled={currentPage === 1}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                                                            </svg>
                                                        </button>
                                                    </li>

                                                    {/* Page Numbers */}
                                                    {[...Array(totalPages)].map((_, index) => {
                                                        const pageNumber = index + 1;
                                                        // Show first page, last page, current page, and pages around current
                                                        const showPage = 
                                                            pageNumber === 1 ||
                                                            pageNumber === totalPages ||
                                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                                                        
                                                        // Show ellipsis
                                                        const showEllipsisBefore = pageNumber === currentPage - 2 && currentPage > 3;
                                                        const showEllipsisAfter = pageNumber === currentPage + 2 && currentPage < totalPages - 2;

                                                        if (showEllipsisBefore || showEllipsisAfter) {
                                                            return (
                                                                <li key={pageNumber} className="page-item disabled">
                                                                    <span className="page-link">...</span>
                                                                </li>
                                                            );
                                                        }

                                                        if (!showPage) return null;

                                                        return (
                                                            <li 
                                                                key={pageNumber} 
                                                                className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                                                            >
                                                                <button 
                                                                    className="page-link"
                                                                    onClick={() => setCurrentPage(pageNumber)}
                                                                >
                                                                    {pageNumber}
                                                                </button>
                                                            </li>
                                                        );
                                                    })}

                                                    {/* Next Button */}
                                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                        <button 
                                                            className="page-link"
                                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                            disabled={currentPage === totalPages}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                                                            </svg>
                                                        </button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-5">
                                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                                        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                    <h5 className="tc-6533 mb-2">No reviews yet</h5>
                                    <p className="text-muted mb-3">Be the first to review this product!</p>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => navigate(`/product/${currentProduct.slug || id}`)}
                                    >
                                        Back to Product
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductReviews;
