import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import RelatedProductCard from './RelatedProductCard';
import { productService } from '../../api/services';

const RelatedProducts = ({ productId: propProductId, limit = 4 }) => {
    const { productId: paramProductId } = useParams();
    const productId = propProductId || paramProductId;
    
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!productId) {
                // If no productId, fetch featured products as fallback
                try {
                    setLoading(true);
                    const response = await productService.getFeaturedProducts(limit);
                    const products = response?.data || response || [];
                    
                    const transformedProducts = products.map(product => ({
                        id: product._id,
                        name: product.name,
                        price: `From £${product.price?.toLocaleString()}`,
                        originalPrice: product.compareAtPrice ? `£${product.compareAtPrice?.toLocaleString()}` : null,
                        image: product.images?.[0]?.url || "../img/placeholder-product.jpg",
                        webp: product.images?.[0]?.url || "../img/placeholder-product.webp",
                        rating: product.rating?.average || 0,
                        reviews: product.rating?.count || 0,
                        badge: product.featured ? "Featured" : (product.sections?.includes('weeklyDeal') ? "Sale" : null)
                    }));
                    
                    setRelatedProducts(transformedProducts);
                } catch (err) {
                    console.error('Error fetching featured products:', err);
                    setError('Failed to load products');
                } finally {
                    setLoading(false);
                }
                return;
            }

            try {
                setLoading(true);
                const response = await productService.getRelatedProducts(productId, limit);
                const products = response?.data || response || [];
                
                const transformedProducts = products.map(product => ({
                    id: product._id,
                    name: product.name,
                    price: `From £${product.price?.toLocaleString()}`,
                    originalPrice: product.compareAtPrice ? `£${product.compareAtPrice?.toLocaleString()}` : null,
                    image: product.images?.[0]?.url || "../img/placeholder-product.jpg",
                    webp: product.images?.[0]?.url || "../img/placeholder-product.webp",
                    rating: product.rating?.average || 0,
                    reviews: product.rating?.count || 0,
                    badge: product.sections?.includes('topSeller') ? "Best Seller" : 
                           (product.sections?.includes('latest') ? "New" : 
                           (product.sections?.includes('weeklyDeal') ? "Sale" : null))
                }));
                
                setRelatedProducts(transformedProducts);
            } catch (err) {
                console.error('Error fetching related products:', err);
                setError('Failed to load related products');
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedProducts();
    }, [productId, limit]);

    if (loading) {
        return (
            <div className="store-card outline-card fill-card">
                <div className="p-4">
                    <h3 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" className="me-2 text-primary">
                            <path fill="currentColor"
                                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        You Might Also Like
                    </h3>
                    <div className="row g-4">
                        {Array.from({ length: 4 }, (_, index) => (
                            <div key={index} className="col-lg-3 col-md-6 col-sm-6">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <div className="placeholder-glow">
                                            <div className="placeholder bg-secondary" style={{ height: '200px' }}></div>
                                            <div className="placeholder col-8 mt-2"></div>
                                            <div className="placeholder col-6 mt-1"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="store-card outline-card fill-card">
                <div className="p-4">
                    <h3 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" className="me-2 text-primary">
                            <path fill="currentColor"
                                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        You Might Also Like
                    </h3>
                    <div className="alert alert-warning" role="alert">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="store-card outline-card fill-card">
            <div className="p-4">
                <h3 className="tc-6533 fw-bold mb-4 d-flex align-items-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="me-2 text-primary">
                        <path fill="currentColor"
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    You Might Also Like
                </h3>

                {relatedProducts.length > 0 ? (
                    <>
                        <div className="row g-4">
                            {relatedProducts.map((product) => (
                                <div key={product.id} className="col-lg-3 col-md-6 col-sm-6">
                                    <RelatedProductCard product={product} />
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-4">
                            <Link to="/products" className="btn btn-outline-primary btn-rd px-4">
                                <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                    <path fill="currentColor"
                                          d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"/>
                                </svg>
                                View All Products
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-muted">No related products available at the moment.</p>
                        <Link to="/products" className="btn btn-primary btn-rd px-4">
                            Browse All Products
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelatedProducts;