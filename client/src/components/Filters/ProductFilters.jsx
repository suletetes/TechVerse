import React from 'react';

const ProductFilters = ({
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filterBrand,
    setFilterBrand,
    filterCategory,
    setFilterCategory,
    priceRange,
    setPriceRange,
    brands,
    categories,
    onClearFilters,
    resultsCount
}) => {
    return (
        <div className="col-lg-12 mb-4">
            {/* Results Count */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="tc-6533 small">
                    {resultsCount} products found
                </span>
            </div>

            <div className="row g-3">
                {/* Search Bar */}
                <div className="col-md-4">
                    <div className="position-relative">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                paddingLeft: '2.5rem',
                                borderRadius: '25px',
                                border: '2px solid #e0e0e0'
                            }}
                        />
                        <i className="fa fa-search position-absolute" 
                           style={{left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999'}}></i>
                    </div>
                </div>

                {/* Sort Dropdown */}
                <div className="col-md-2">
                    <select
                        className="form-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{borderRadius: '25px', border: '2px solid #e0e0e0'}}
                    >
                        <option value="newest">Newest First</option>
                        <option value="name">Sort by Name</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                    </select>
                </div>

                {/* Brand Filter */}
                <div className="col-md-2">
                    <select
                        className="form-select"
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        style={{borderRadius: '25px', border: '2px solid #e0e0e0'}}
                    >
                        <option value="">All Brands</option>
                        {brands && brands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>
                </div>

                {/* Category Filter */}
                <div className="col-md-2">
                    <select
                        className="form-select"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        style={{borderRadius: '25px', border: '2px solid #e0e0e0'}}
                    >
                        <option value="">All Categories</option>
                        {Array.isArray(categories) && categories.map(category => (
                            <option key={category._id || category.slug || category} value={category.slug || category}>
                                {category.name || (typeof category === 'string' ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown Category')}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Clear Filters */}
                <div className="col-md-2">
                    <button
                        className="btn btn-outline-secondary w-100"
                        onClick={onClearFilters}
                        style={{borderRadius: '25px'}}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Price Range Filter */}
            <div className="row mt-3">
                <div className="col-md-6">
                    <label className="form-label tc-6533 small">
                        Price Range: £{priceRange[0]} - £{priceRange[1]}
                    </label>
                    <div className="d-flex gap-2 align-items-center">
                        <input
                            type="range"
                            className="form-range flex-grow-1"
                            min="0"
                            max="4000"
                            step="100"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        />
                        <input
                            type="range"
                            className="form-range flex-grow-1"
                            min="0"
                            max="4000"
                            step="100"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        />
                    </div>
                </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || filterBrand || filterCategory || priceRange[0] > 0 || priceRange[1] < 4000) && (
                <div className="row mt-3">
                    <div className="col-12">
                        <div className="d-flex flex-wrap align-items-center">
                            <span className="me-2 small tc-6533">Active filters:</span>
                            {searchTerm && (
                                <span className="filter-tag">
                                    Search: "{searchTerm}"
                                    <span className="remove" onClick={() => setSearchTerm('')}>×</span>
                                </span>
                            )}
                            {filterBrand && (
                                <span className="filter-tag">
                                    Brand: {filterBrand}
                                    <span className="remove" onClick={() => setFilterBrand('')}>×</span>
                                </span>
                            )}
                            {filterCategory && (
                                <span className="filter-tag">
                                    Category: {filterCategory}
                                    <span className="remove" onClick={() => setFilterCategory('')}>×</span>
                                </span>
                            )}
                            {(priceRange[0] > 0 || priceRange[1] < 4000) && (
                                <span className="filter-tag">
                                    Price: £{priceRange[0]} - £{priceRange[1]}
                                    <span className="remove" onClick={() => setPriceRange([0, 4000])}>×</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Default props to prevent undefined errors
ProductFilters.defaultProps = {
    searchTerm: '',
    sortBy: 'newest',
    filterBrand: '',
    filterCategory: '',
    priceRange: [0, 4000],
    brands: [],
    categories: [],
    resultsCount: 0,
    setSearchTerm: () => {},
    setSortBy: () => {},
    setFilterBrand: () => {},
    setFilterCategory: () => {},
    setPriceRange: () => {},
    onClearFilters: () => {}
};

export default ProductFilters;