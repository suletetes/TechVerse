import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useProduct } from "../context";
import { LoadingSpinner } from "../components/Common";
import { ProductFilters, ProductCard, ProductCardList, Pagination, ViewToggle } from "../components";

// Debounce utility function
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const Products = () => {
    const { categorySlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // Context hooks
    const {
        products,
        searchResults,
        searchQuery,
        categories,
        pagination,
        isLoading,
        error,
        loadProducts,
        searchProducts,
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

    // Use searchResults when there's a search query, otherwise use products
    const displayProducts = searchQuery && localFilters.search ? searchResults : products;

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((query, filters) => {
            searchProducts(query, filters);
        }, 500),
        [searchProducts]
    );

    // Main effect to handle all filter changes
    useEffect(() => {
        // Priority: localFilters.category (user selection) > categorySlug (URL param) > categoryFromQuery (URL query)
        const effectiveCategory = localFilters.category || categorySlug || searchParams.get('category');

        // Build filters object
        const filters = {
            page: 1,
            limit: 12,
            sort: localFilters.sort,
            order: localFilters.order
        };

        // Add optional filters only if they have values
        if (effectiveCategory) filters.category = effectiveCategory;
        if (localFilters.brand) filters.brand = localFilters.brand;
        if (localFilters.minPrice) filters.minPrice = localFilters.minPrice;
        if (localFilters.maxPrice) filters.maxPrice = localFilters.maxPrice;
        if (localFilters.inStock !== null) filters.inStock = localFilters.inStock;

        // Update URL params
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== '' && value !== undefined && key !== 'page' && key !== 'limit') {
                params.set(key, value.toString());
            }
        });
        if (localFilters.search) params.set('search', localFilters.search);

        setSearchParams(params, { replace: true });

        // Apply filters to context
        setFilters(filters);

        // Use searchProducts for search queries, loadProducts for browsing
        if (localFilters.search && localFilters.search.trim().length >= 2) {
            debouncedSearch(localFilters.search, filters);
        } else if (localFilters.search && localFilters.search.trim().length > 0) {
            // Search term too short, don't search
        } else {
            loadProducts(filters);
        }
    }, [
        localFilters.search,
        localFilters.sort,
        localFilters.order,
        localFilters.brand,
        localFilters.category,
        localFilters.minPrice,
        localFilters.maxPrice,
        localFilters.inStock,
        categorySlug,
        setSearchParams,
        setFilters,
        loadProducts,
        debouncedSearch
    ]);

    // Get current category info
    const categoryFromQuery = searchParams.get('category');
    const effectiveCategory = categorySlug || categoryFromQuery;
    const categoryName = effectiveCategory
        ? effectiveCategory.charAt(0).toUpperCase() + effectiveCategory.slice(1)
        : 'All Products';

    // Get unique brands from current products for filters
    const brands = useMemo(() => {
        if (!Array.isArray(displayProducts)) return [];
        const uniqueBrands = [...new Set(displayProducts.map(product => product.brand).filter(Boolean))];
        return uniqueBrands.sort();
    }, [displayProducts]);

    // Get price range - use filter values or defaults
    const priceRange = useMemo(() => {
        return [
            localFilters.minPrice || 0,
            localFilters.maxPrice || 4000
        ];
    }, [localFilters.minPrice, localFilters.maxPrice]);

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

        // Use searchProducts if there's a search term, otherwise loadProducts
        if (localFilters.search && localFilters.search.trim().length >= 2) {
            searchProducts(localFilters.search, filters);
        } else {
            loadProducts(filters);
        }
    }, [localFilters, categorySlug, searchParams, loadProducts]);

    const clearFilters = useCallback(() => {
        // Reset local filters to defaults
        setLocalFilters({
            search: '',
            sort: 'newest',
            order: 'desc',
            minPrice: null,
            maxPrice: null,
            brand: '',
            category: '', // Clear category filter
            inStock: null
        });
        
        // Clear URL parameters
        setSearchParams(new URLSearchParams(), { replace: true });
        
        // Clear context filters
        clearProductFilters();
    }, [setSearchParams, clearProductFilters]);

    // Show loading state
    if (isLoading && (!Array.isArray(displayProducts) || displayProducts.length === 0)) {
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
                        resultsCount={pagination.total || (Array.isArray(displayProducts) ? displayProducts.length : 0)}
                        isLoading={isLoading}
                    />

                    {/* Remove debug info for production */}

                    {/* Products Grid/List */}
                    {(!Array.isArray(displayProducts) || displayProducts.length === 0) && !isLoading ? (
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
                            {isLoading && Array.isArray(displayProducts) && displayProducts.length > 0 && (
                                <div className="col-12 mb-3">
                                    <div className="d-flex justify-content-center">
                                        <LoadingSpinner size="sm" />
                                        <span className="ms-2">Updating results...</span>
                                    </div>
                                </div>
                            )}

                            {/* Products */}
                            {Array.isArray(displayProducts) && displayProducts.map((product) => (
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

export default Products;