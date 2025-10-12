import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useProduct } from "../context";
import { LoadingSpinner } from "../components/Common";
import { ProductFilters, ProductCard, ProductCardList, Pagination, ViewToggle } from "../components";

const Category = () => {
    const { categorySlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Context hooks
    const { 
        products, 
        categories,
        pagination,
        filters,
        isLoading, 
        error,
        loadProducts,
        loadProductsByCategory,
        loadCategories,
        setFilters,
        clearFilters: clearProductFilters
    } = useProduct();

    // Local state
    const [viewMode, setViewMode] = useState("grid");
    const [localFilters, setLocalFilters] = useState({
        search: searchParams.get('search') || '',
        sort: searchParams.get('sort') || 'createdAt',
        order: searchParams.get('order') || 'desc',
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
        brand: searchParams.get('brand') || '',
        inStock: searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : null
    });

    // Load data on mount and when category changes
    useEffect(() => {
        loadCategories();
        
        if (categorySlug) {
            // Load products by category
            const categoryFilters = {
                ...localFilters,
                page: 1,
                limit: 12
            };
            loadProductsByCategory(categorySlug, categoryFilters);
        } else {
            // Load all products
            const allFilters = {
                ...localFilters,
                page: 1,
                limit: 12
            };
            loadProducts(allFilters);
        }
    }, [categorySlug, loadProducts, loadProductsByCategory, loadCategories]);

    // Update URL params when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        
        Object.entries(localFilters).forEach(([key, value]) => {
            if (value !== null && value !== '' && value !== undefined) {
                params.set(key, value.toString());
            }
        });
        
        setSearchParams(params);
    }, [localFilters, setSearchParams]);

    // Apply filters to context when local filters change
    useEffect(() => {
        setFilters(localFilters);
        
        // Reload products with new filters
        if (categorySlug) {
            loadProductsByCategory(categorySlug, { ...localFilters, page: 1, limit: 12 });
        } else {
            loadProducts({ ...localFilters, page: 1, limit: 12 });
        }
    }, [localFilters, categorySlug, setFilters, loadProducts, loadProductsByCategory]);

    // Get current category info
    const currentCategory = categories.find(cat => cat.slug === categorySlug);
    const categoryName = currentCategory?.name || 'All Products';

    // Get unique brands from current products for filters
    const brands = useMemo(() => {
        const uniqueBrands = [...new Set(products.map(product => product.brand).filter(Boolean))];
        return uniqueBrands.sort();
    }, [products]);

    // Get price range from current products
    const priceRange = useMemo(() => {
        if (products.length === 0) return [0, 1000];
        const prices = products.map(product => product.price || 0);
        return [Math.min(...prices), Math.max(...prices)];
    }, [products]);

    const handleFilterChange = (filterName, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    const handlePageChange = (page) => {
        const newFilters = { ...localFilters, page };
        
        if (categorySlug) {
            loadProductsByCategory(categorySlug, { ...newFilters, limit: 12 });
        } else {
            loadProducts({ ...newFilters, limit: 12 });
        }
    };

    const clearFilters = () => {
        setLocalFilters({
            search: '',
            sort: 'createdAt',
            order: 'desc',
            minPrice: null,
            maxPrice: null,
            brand: '',
            inStock: null
        });
        clearProductFilters();
    };

    const clearFilters = () => {
        setSearchTerm("");
        setFilterBrand("");
        setFilterCategory("");
        setPriceRange([0, 4000]);
        setSortBy("name");
        setCurrentPage(1);
    };

    // Show loading state
    if (isLoading && products.length === 0) {
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
        <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="bloc-8">
            <div className="container bloc-md-sm bloc-md bloc-lg-md">
                <div className="row row-offset">
                    {/* Header */}
                    <div className="col-lg-12 ps-0 pe-0 mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="tc-6533 mb-0">{categoryName}</h1>
                                {currentCategory?.description && (
                                    <p className="tc-6533 opacity-75 mb-0">{currentCategory.description}</p>
                                )}
                            </div>
                            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode}/>
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
                        minPrice={localFilters.minPrice}
                        maxPrice={localFilters.maxPrice}
                        setPriceRange={(range) => {
                            handleFilterChange('minPrice', range[0]);
                            handleFilterChange('maxPrice', range[1]);
                        }}
                        inStock={localFilters.inStock}
                        setInStock={(value) => handleFilterChange('inStock', value)}
                        brands={brands}
                        priceRange={priceRange}
                        onClearFilters={clearFilters}
                        resultsCount={pagination.total || products.length}
                        isLoading={isLoading}
                    />

                    {/* Products Grid/List */}
                    {products.length === 0 && !isLoading ? (
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
                        <>
                            {/* Loading overlay for filter changes */}
                            {isLoading && products.length > 0 && (
                                <div className="col-12 mb-3">
                                    <div className="d-flex justify-content-center">
                                        <LoadingSpinner size="sm" />
                                        <span className="ms-2">Updating results...</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Products */}
                            {viewMode === 'grid' ? (
                                products.map((product) => (
                                    <ProductCard 
                                        key={product._id} 
                                        product={product}
                                        showWishlist={true}
                                    />
                                ))
                            ) : (
                                products.map((product) => (
                                    <ProductCardList 
                                        key={product._id} 
                                        product={product}
                                        showWishlist={true}
                                    />
                                ))
                            )}
                        </>
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

export default Category;