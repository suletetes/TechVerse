import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminReviews } from '../../components/Admin';
import { adminService } from '../../api/services/index.js';
import { useAuth } from '../../context/AuthContext';

const AdminReviewManagement = () => {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await adminService.getAdminReviews({ limit: 1000 });
            
            let backendReviews = [];
            if (response?.data?.reviews) {
                backendReviews = response.data.reviews;
            } else if (response?.reviews) {
                backendReviews = response.reviews;
            } else if (response?.data && Array.isArray(response.data)) {
                backendReviews = response.data;
            } else if (Array.isArray(response)) {
                backendReviews = response;
            }
            
            setAllReviews(backendReviews);
            setLoading(false);
        } catch (err) {
            console.error('❌ Error loading reviews:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleApproveReview = async (reviewId) => {
        try {
            await adminService.approveReview(reviewId);
            await loadReviews(); // Reload reviews
        } catch (err) {
            console.error('Error approving review:', err);
            throw err;
        }
    };

    const handleRejectReview = async (reviewId) => {
        try {
            await adminService.rejectReview(reviewId);
            await loadReviews(); // Reload reviews
        } catch (err) {
            console.error('Error rejecting review:', err);
            throw err;
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await adminService.deleteReview(reviewId);
            await loadReviews(); // Reload reviews
        } catch (err) {
            console.error('Error deleting review:', err);
            throw err;
        }
    };

    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid p-4">
                {/* Page Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="h3 mb-1">Review Management</h1>
                                <p className="text-muted mb-0">Moderate and manage customer reviews</p>
                            </div>
                            <div className="d-flex gap-2">
                                <Link to="/admin" className="btn btn-outline-secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                    Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Component */}
                <AdminReviews
                    reviews={allReviews}
                    onApproveReview={handleApproveReview}
                    onRejectReview={handleRejectReview}
                    onDeleteReview={handleDeleteReview}
                    isLoading={loading}
                    error={error}
                />
            </div>
        </div>
    );
};

export default AdminReviewManagement;
