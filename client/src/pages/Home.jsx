import React, { useEffect, useState } from "react";
import { useProduct, useAuth, useNotification } from "../context";
import {
    Header,
    LatestProducts,
    TopSellerProducts,
    Service,
    QuickPicks,
    WeeklyDeals,
} from "../components";

const Home = () => {
    const { loadCategories } = useProduct();
    const { isAuthenticated, user } = useAuth();
    const { showNotification } = useNotification();
    const [showVerificationBanner, setShowVerificationBanner] = useState(false);

    // Load categories on mount (still needed for other parts of the app)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                await loadCategories();
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        loadInitialData();
    }, [loadCategories]);

    // Check if user needs to verify email
    useEffect(() => {
        if (isAuthenticated && user && !user.isEmailVerified && user.accountStatus === 'pending') {
            setShowVerificationBanner(true);
        } else {
            setShowVerificationBanner(false);
        }
    }, [isAuthenticated, user]);

    const handleResendVerification = async () => {
        // This will be handled by clicking the banner
        showNotification('Please check your email for the verification link', 'info');
    };

    return (
        <>
            {/* Email Verification Banner */}
            {showVerificationBanner && (
                <div className="alert alert-warning mb-0 rounded-0 border-0 text-center" role="alert">
                    <div className="container">
                        <div className="d-flex align-items-center justify-content-center flex-wrap gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                            <span>
                                <strong>Verify your email to unlock all features!</strong> Check your inbox for the verification link.
                            </span>
                            <a href="/auth/verify-email" className="btn btn-sm btn-warning ms-2">
                                Resend Email
                            </a>
                        </div>
                    </div>
                </div>
            )}
            
            {/* header */}
            <Header />
            {/* header END */}

            {/* latest-products */}
            <LatestProducts
                limit={8}
                autoLoad={true}
            />
            {/* latest-products END */}

            {/* top-seller-products */}
            <TopSellerProducts
                limit={8}
                autoLoad={true}
            />
            {/* top-seller-products END */}

            {/* service */}
            <Service />
            {/* service END */}

            {/* quick-picks */}
            <QuickPicks
                limit={8}
                autoLoad={true}
            />
            {/* quick-picks END */}

            {/* weekly-deals */}
            <WeeklyDeals
                limit={10}
                autoLoad={true}
            />
            {/* weekly-deals END */}

        </>
    );
};

export default Home;
