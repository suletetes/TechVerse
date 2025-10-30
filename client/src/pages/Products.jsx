import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useProduct } from "../context";
import { LoadingSpinner } from "../components/Common";
import { ProductFilters, ProductCard, ProductCardList, Pagination, ViewToggle } from "../components";

const Products = () => {
    const { categorySlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // Context hooks
    const {
        products,
        categories,
        pagination,
        isLoading,
        error,
        loadProducts,
        loadCategories,
        setFilters,
        clearFilters: clearProductFilters
    } = useProduct();

    // Local state
    const [viewMode, setViewMode] = useState("grid");
    const [localFilters, setLocalFilters] = useState({
        search: searchParams.get('search') || '',
        sort: searchParams.get('sort') || 'newest',
        order: searchParams.get('order') || 'desc',
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
        brand: searchParams.get('brand') || '',
        category: searchParams.get('category') || '',
        inStock: searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : null
    });

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Load initial products on mount
    useEffect(() => {
        const initialFilters = {
            page: 1,
            limit: 12,
            sort: 'newest',
            order: 'desc'
        };
        loadProducts(initialFilters);
    }, []); // Only run once on mount

    // Debounced search function
    const debouncedLoadProducts = useCallback(
        debounce((filters) => {
            loadProducts(filters);
        }, 300),
        [loadProducts]
    );

    // Main effect to handle all filter changes
    useEffect(() => {
        const categoryFromQuery = searchParams.get('category');
        const effectiveCategory = categorySlug || categoryFromQuery;

        // Build filters object
        const filters = {
            ...localFilters,
            page: 1,
            limit: 12
        };

        // Add category filter if specified
        if (effectiveCategory) {
            filters.category = effectiveCategory;
        }

        // Update URL params without causing re-render
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== '' && value !== undefined && key !== 'page' && key !== 'limit') {
                params.set(key, value.toString());
            }
        });

        // Only update URL if it's different
        const currentParams = searchParams.toString();
        const newParams = params.toString();
        if (currentParams !== newParams) {
            setSearchParams(params, { replace: true });
        }

        // Apply filters to context
        setFilters(filters);

        // Use debounced loading for search, immediate for other filters
        if (localFilters.search && localFilters.search.length > 0) {
            debouncedLoadProducts(filters);
        } else {
            loadProducts(filters);
        }
    }, [localFilters, categorySlug]);

    // Get current category info
    const categoryFromQuery = searchParams.get('category');
    const effectiveCategory = categorySlug || categoryFromQuery;
    const categoryName = effectiveCategory
        ? effectiveCategory.charAt(0).toUpperCase() + effectiveCategory.slice(1)
        : 'All Products';

    // Get unique brands from current products for filters
    const brands = useMemo(() => {
        if (!Array.isArray(products)) return [];
        const uniqueBrands = [...new Set(products.map(product => product.brand).filter(Boolean))];
        return uniqueBrands.sort();
    }, [products]);

    // Get price range from current products
    const priceRange = useMemo(() => {
        if (!Array.isArray(products) || products.length === 0) return [0, 1000];
        const prices = products.map(product => product.price || 0);
        return [Math.min(...prices), Math.max(...prices)];
    }, [products]);

    const handleFilterChange = useCallback((filterName, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    }, []);

    const handlePageChange = useCallback((page) => {
        const categoryFromQuery = searchParams.get('category');
        const effectiveCategory = categorySlug || categoryFromQuery;

        // Build filters object with new page
        const filters = {
            ...localFilters,
            page,
            limit: 12
        };

        // Add category filter if specified
        if (effectiveCategory) {
            filters.category = effectiveCategory;
        }

        loadProducts(filters);
    }, [localFilters, categorySlug, searchParams, loadProducts]);

    const clearFilters = useCallback(() => {
        // Clear URL parameters
        const newParams = new URLSearchParams();
        setSearchParams(newParams);

        // Reset local filters to defaults
        setLocalFilters({
            search: '',
            sort: 'newest',
            order: 'desc',
            minPrice: null,
            maxPrice: null,
            brand: '',
            category: categorySlug || '', // Keep category if from URL
            inStock: null
        });
        clearProductFilters();
    }, [categorySlug, setSearchParams, clearProductFilters]);

    // Show loading state
    if (isLoading && (!Array.isArray(products) || products.length === 0)) {
        return (
            <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="bloc-8">
                <div className="container bloc-md-sm bloc-md bloc-lg-md">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <LoadingSpinner size="lg" />
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="bloc-8">
                <div className="container bloc-md-sm bloc-md bloc-lg-md">
                    <div className="text-center py-5">
                        <div className="alert alert-danger">
                            <h4>Error Loading Products</h4>
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
        <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="products-page">
            <div className="container bloc-md-sm bloc-md bloc-lg-md">
                <div className="row row-offset">
                    {/* Header */}
                    <div className="col-lg-12 ps-0 pe-0 mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="tc-6533 mb-0">{categoryName}</h1>
                                {effectiveCategory ? (
                                    <p className="tc-6533 opacity-75 mb-0">Browse {categoryName} products</p>
                                ) : (
                                    <p className="tc-6533 opacity-75 mb-0">Discover our complete range of products</p>
                                )}
                            </div>
                            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <ProductFilters
                        searchTerm={localFilters.search}
                        setSearchTerm={(value) => handleFilterChange('search', value)}
                        sortBy={localFilters.sort}
                        setSortBy={(value) => handleFilterChange('sort', value)}
                        sortOrder={localFilters.order}
                        setSortOrder={(value) => handleFilterChange('order', value)}
                        filterBrand={localFilters.brand}
                        setFilterBrand={(value) => handleFilterChange('brand', value)}
                        filterCategory={localFilters.category}
                        setFilterCategory={(value) => handleFilterChange('category', value)}
                        minPrice={localFilters.minPrice}
                        maxPrice={localFilters.maxPrice}
                        setPriceRange={(range) => {
                            handleFilterChange('minPrice', range[0]);
                            handleFilterChange('maxPrice', range[1]);
                        }}
                        inStock={localFilters.inStock}
                        setInStock={(value) => handleFilterChange('inStock', value)}
                        brands={brands}
                        categories={categories || []}
                        priceRange={priceRange}
                        onClearFilters={clearFilters}
                        resultsCount={pagination.total || (Array.isArray(products) ? products.length : 0)}
                        isLoading={isLoading}
                    />

                    {/* Products Grid/List */}
                    {(!Array.isArray(products) || products.length === 0) && !isLoading ? (
                        <div className="col-12 text-center py-5">
                            <div className="tc-6533">
                                <i className="fa fa-search fa-3x mb-3 opacity-50"></i>
                                <h4>No products found</h4>
                                <p>Try adjusting your search or filter criteria</p>
                                <button className="btn btn-c-2101 btn-rd" onClick={clearFilters}>
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    ) : (
                        <React.Fragment key="products-container">
                            {/* Loading overlay for filter changes */}
                            {isLoading && Array.isArray(products) && products.length > 0 && (
                                <div className="col-12 mb-3">
                                    <div className="d-flex justify-content-center">
                                        <LoadingSpinner size="sm" />
                                        <span className="ms-2">Updating results...</span>
                                    </div>
                                </div>
                            )}

                            {/* Products */}
                            {Array.isArray(products) && products.map((product) => (
                                viewMode === 'grid' ? (
                                    <ProductCard
                                        key={product._id}
                                        product={product}
                                        showWishlist={true}
                                    />
                                ) : (
                                    <ProductCardList
                                        key={product._id}
                                        product={product}
                                        showWishlist={true}
                                    />
                                )
                            ))}
                        </React.Fragment>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                            startIndex={(pagination.page - 1) * pagination.limit + 1}
                            itemsPerPage={pagination.limit}
                            totalItems={pagination.total}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// Debounce utility function (moved outside component to prevent recreation)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export default Products;