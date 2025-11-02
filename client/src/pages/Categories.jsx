import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useProduct } from "../context";
import { LoadingSpinner } from "../components/Common";
import "../assets/css/categories.css";

// Import category images
import phonesImg from "../assets/images/phones.jpg";
import tabletsImg from "../assets/images/tablets.jpg";
import computerImg from "../assets/images/computer.jpg";
import tvImg from "../assets/images/TV.jpg";
import gameImg from "../assets/images/Game.jpg";
import watchImg from "../assets/images/watch.jpg";
import audioImg from "../assets/images/Audio.jpg";
import cameraImg from "../assets/images/Camera.jpg";
import accessoriesImg from "../assets/images/Accessories.jpg";

const Categories = () => {
    const { categories, isLoading, error, loadCategories } = useProduct();

    // Default categories with images - matching the required format
    const defaultCategories = [
        {
            id: 'phones',
            name: 'Phones',
            slug: 'Phones',
            description: 'Latest smartphones and mobile devices',
            image: phonesImg,
            productCount: 45,
            featured: true
        },
        {
            id: 'tablets',
            name: 'Tablets',
            slug: 'Tablets',
            description: 'iPads and Android tablets',
            image: tabletsImg,
            productCount: 28,
            featured: true
        },
        {
            id: 'computers',
            name: 'Computers',
            slug: 'Computers',
            description: 'Laptops, desktops, and accessories',
            image: computerImg,
            productCount: 67,
            featured: true
        },
        {
            id: 'tvs',
            name: 'TVs',
            slug: 'TVs',
            description: 'Smart TVs and entertainment systems',
            image: tvImg,
            productCount: 32,
            featured: false
        },
        {
            id: 'gaming',
            name: 'Gaming',
            slug: 'Gaming',
            description: 'Gaming consoles and accessories',
            image: gameImg,
            productCount: 89,
            featured: true
        },
        {
            id: 'watches',
            name: 'Watches',
            slug: 'Watches',
            description: 'Smartwatches and fitness trackers',
            image: watchImg,
            productCount: 23,
            featured: false
        },
        {
            id: 'audio',
            name: 'Audio',
            slug: 'Audio',
            description: 'Headphones, speakers, and audio gear',
            image: audioImg,
            productCount: 56,
            featured: true
        },
        {
            id: 'cameras',
            name: 'Cameras',
            slug: 'Cameras',
            description: 'Digital cameras and photography equipment',
            image: cameraImg,
            productCount: 34,
            featured: false
        },
        {
            id: 'accessories',
            name: 'Accessories',
            slug: 'Accessories',
            description: 'Cases, chargers, and tech accessories',
            image: accessoriesImg,
            productCount: 78,
            featured: false
        }
    ];

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Only show categories that we have images for (from defaultCategories)
    const displayCategories = defaultCategories.map(defaultCat => {
        // Find matching backend category
        const backendCat = Array.isArray(categories)
            ? categories.find(cat => cat.slug === defaultCat.slug)
            : null;

        return {
            ...defaultCat, // Start with default (includes image and structure)
            ...(backendCat || {}), // Override with backend data if available
            image: defaultCat.image, // Always use default image
            productCount: backendCat?.productCount || defaultCat.productCount || 0,
            featured: backendCat?.featured !== undefined ? backendCat.featured : defaultCat.featured
        };
    });

    // Separate featured and regular categories
    const featuredCategories = displayCategories.filter(cat => cat.featured);
    const regularCategories = displayCategories.filter(cat => !cat.featured);

    if (isLoading) {
        return (
            <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="categories-page">
                <div className="container bloc-md-sm bloc-md bloc-lg-md">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <LoadingSpinner size="lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="categories-page">
                <div className="container bloc-md-sm bloc-md bloc-lg-md">
                    <div className="text-center py-5">
                        <div className="alert alert-danger">
                            <h4>Error Loading Categories</h4>
                            <p>{error}</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="categories-page">
            <div className="container bloc-md-sm bloc-md bloc-lg-md">
                <div className="row row-offset">
                    {/* Header */}
                    <div className="col-lg-12 ps-0 pe-0 mb-5">
                        <div className="text-center">
                            <h1 className="tc-6533 mb-3">Shop by Category</h1>
                            <p className="tc-6533 opacity-75 mb-0">
                                Discover our wide range of products across different categories
                            </p>
                        </div>
                    </div>

                    {/* Featured Categories */}
                    {featuredCategories.length > 0 && (
                        <>
                            <div className="col-12 mb-4">
                                <h2 className="tc-6533 h4 mb-4">Featured Categories</h2>
                            </div>
                            {featuredCategories.map((category) => (
                                <div key={category.id || category._id} className="col-lg-4 col-md-6 col-sm-12 mb-4">
                                    <Link
                                        to={`/products?category=${category.name || category.slug}`}
                                        className="text-decoration-none"
                                    >
                                        <div className="category-card h-100 border rounded-3 overflow-hidden shadow-sm hover-shadow-lg transition-all">
                                            <div className="category-image-container position-relative">
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    className="category-image w-100"
                                                    style={{
                                                        height: '200px',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.3s ease'
                                                    }}
                                                />
                                                <div className="category-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end">
                                                    <div className="category-info p-3 text-white w-100" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                                                        <h3 className="h5 mb-1 fw-bold">{category.name}</h3>
                                                        <p className="small mb-0 opacity-90">{category.productCount} products</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="category-content p-3">
                                                <p className="text-muted mb-0 small">{category.description}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </>
                    )}

                    {/* All Categories */}
                    <div className="col-12 mb-4 mt-4">
                        <h2 className="tc-6533 h4 mb-4">All Categories</h2>
                    </div>

                    {displayCategories.map((category) => (
                        <div key={category.id || category._id} className="col-lg-4 col-md-6 col-sm-6 mb-4">
                            <Link
                                to={`/products?category=${category.name || category.slug}`}
                                className="text-decoration-none"
                            >
                                <div className="category-card-medium h-100 border rounded-3 overflow-hidden shadow-sm hover-shadow transition-all">
                                    <div className="category-image-container-medium position-relative">
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="category-image-medium w-100"
                                            style={{
                                                height: '200px',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease'
                                            }}
                                        />
                                        <div className="category-overlay-medium position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end opacity-0">
                                            <div className="category-info-medium p-3 text-white w-100" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                                                <h4 className="h6 mb-0 fw-bold">{category.name}</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="category-content-medium p-3 text-center">
                                        <h4 className="h6 mb-1 tc-6533 fw-semibold">{category.name}</h4>
                                        <p className="small text-muted mb-0">{category.productCount} products</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}

                    {/* Browse All Products Link */}
                    <div className="col-12 text-center mt-5">
                        <Link to="/products" className="btn btn-c-2101 btn-rd btn-lg">
                            <i className="fas fa-th-large me-2"></i>
                            Browse All Products
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;