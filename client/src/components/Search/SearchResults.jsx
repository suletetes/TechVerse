import React, { useState } from 'react';
import { 
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import ProductCard from '../Cards/ProductCard.jsx';

const SearchResults = ({ 
  results = {}, 
  isLoading = false, 
  onPageChange,
  onSortChange,
  viewMode = 'grid',
  onViewModeChange 
}) => {
  console.log('📊 SearchResults - Received props:', {
    results,
    resultsKeys: Object.keys(results),
    productsInResults: results?.products?.length || 0,
    isLoading
  });
  
  const { 
    products = [], 
    pagination = {}, 
    facets = {}, 
    suggestions = [],
    searchQuery = {} 
  } = results;
  
  console.log('📊 SearchResults - Extracted:', {
    productsCount: products.length,
    pagination,
    firstProduct: products[0]?.name
  });

  const [sortBy, setSortBy] = useState(searchQuery.sortBy || 'relevance');

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    onSortChange?.(newSortBy);
  };

  const handlePageChange = (page) => {
    onPageChange?.(page);
    // Scroll to top of results
    document.getElementById('search-results')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  const renderPagination = () => {
    const { currentPage = 1, totalPages = 0, hasNext = false, hasPrev = false } = pagination;
    
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrev}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {((currentPage - 1) * (pagination.limit || 20)) + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * (pagination.limit || 20), pagination.totalProducts || 0)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{pagination.totalProducts || 0}</span>{' '}
              results
            </p>
          </div>
          
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrev}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                      ...
                    </span>
                  )}
                </>
              )}
              
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    page === currentPage
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNext}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          No results found. Try these suggestions:
        </h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => window.location.href = `/search?q=${encodeURIComponent(suggestion)}`}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderFacets = () => {
    if (!facets || (!facets.brands?.length && !facets.priceRanges?.length)) return null;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
          <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
          Refine Results
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facets.brands && facets.brands.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Popular Brands</h4>
              <div className="flex flex-wrap gap-1">
                {facets.brands.slice(0, 5).map((brand) => (
                  <button
                    key={brand._id}
                    onClick={() => window.location.href = `/search?${new URLSearchParams({...searchQuery, brand: brand._id}).toString()}`}
                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors"
                  >
                    {brand._id} ({brand.count})
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {facets.priceRanges && facets.priceRanges.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Price Ranges</h4>
              <div className="flex flex-wrap gap-1">
                {facets.priceRanges.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const params = new URLSearchParams(searchQuery);
                      params.set('minPrice', range._id);
                      params.set('maxPrice', range._id + 100);
                      window.location.href = `/search?${params.toString()}`;
                    }}
                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors"
                  >
                    ${range._id}+ ({range.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div id="search-results" className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Searching...</span>
        </div>
      </div>
    );
  }

  return (
    <div id="search-results" className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Search Results
            {pagination.totalProducts !== undefined && (
              <span className="text-gray-500 font-normal ml-2">
                ({pagination.totalProducts.toLocaleString()} {pagination.totalProducts === 1 ? 'result' : 'results'})
              </span>
            )}
          </h2>
          {searchQuery.q && (
            <p className="text-sm text-gray-600 mt-1">
              Results for "<span className="font-medium">{searchQuery.q}</span>"
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="price">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
              <option value="popularity">Most Popular</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => onViewModeChange?.('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange?.('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="List View"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions for no results */}
      {products.length === 0 && !isLoading && renderSuggestions()}

      {/* Facets for refining results */}
      {products.length > 0 && renderFacets()}

      {/* Products Grid/List */}
      {products.length > 0 ? (
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
        }`}>
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              layout={viewMode}
              showQuickActions={true}
              showCompare={true}
            />
          ))}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• Check your spelling</p>
            <p>• Try more general keywords</p>
            <p>• Remove some filters</p>
          </div>
        </div>
      ) : null}

      {/* Pagination */}
      {products.length > 0 && renderPagination()}
    </div>
  );
};

export default SearchResults;