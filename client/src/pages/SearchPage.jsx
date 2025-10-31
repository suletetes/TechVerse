import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdvancedSearch from '../components/Search/AdvancedSearch.jsx';
import SearchResults from '../components/Search/SearchResults.jsx';
import searchService from '../api/services/searchService.js';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [searchResults, setSearchResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Parse URL parameters
  const parseUrlParams = () => {
    const params = new URLSearchParams(location.search);
    const searchParams = {};
    
    for (const [key, value] of params.entries()) {
      if (value) {
        searchParams[key] = value;
      }
    }
    
    return searchParams;
  };

  const [urlParams, setUrlParams] = useState(parseUrlParams());

  // Update URL when search parameters change
  const updateUrl = (params) => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    const newUrl = `/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  };

  // Handle search results from AdvancedSearch component
  const handleSearchResults = (results) => {
    setSearchResults(results);
    setCurrentPage(results.pagination?.currentPage || 1);
  };

  // Handle page changes
  const handlePageChange = async (page) => {
    if (page === currentPage) return;
    
    setIsLoading(true);
    setCurrentPage(page);
    
    const newParams = { ...urlParams, page };
    updateUrl(newParams);
    
    try {
      const result = await searchService.searchProducts(newParams);
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Failed to load page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sort changes
  const handleSortChange = async (sortBy) => {
    setIsLoading(true);
    
    const newParams = { ...urlParams, sortBy, page: 1 };
    setCurrentPage(1);
    updateUrl(newParams);
    
    try {
      const result = await searchService.searchProducts(newParams);
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Failed to sort results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view mode changes
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('searchViewMode', mode);
  };

  // Load initial search results based on URL parameters
  useEffect(() => {
    const params = parseUrlParams();
    setUrlParams(params);
    
    // Load saved view mode
    const savedViewMode = localStorage.getItem('searchViewMode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
    
    // Perform initial search if there are parameters
    if (Object.keys(params).length > 0) {
      setIsLoading(true);
      searchService.searchProducts(params)
        .then(result => {
          if (result.success) {
            setSearchResults(result.data);
            setCurrentPage(result.data.pagination?.currentPage || 1);
          }
        })
        .catch(error => {
          console.error('Initial search failed:', error);
          setSearchResults({});
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [location.search]);

  // Update URL parameters when location changes
  useEffect(() => {
    const params = parseUrlParams();
    setUrlParams(params);
  }, [location.search]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Search Products</h1>
              <p className="text-gray-600 mt-1">
                Find the perfect tech products for your needs
              </p>
            </div>
          </div>
          
          {/* Search Component */}
          <AdvancedSearch
            initialQuery={urlParams.q || ''}
            initialFilters={urlParams}
            onSearchResults={handleSearchResults}
            showFilters={true}
            className="w-full"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchResults
          results={searchResults}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </div>

      {/* Search Tips */}
      {Object.keys(searchResults).length === 0 && !isLoading && Object.keys(urlParams).length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Use Specific Terms</h3>
                <p className="text-sm text-gray-600">
                  Try searching for specific product names, model numbers, or brands like "iPhone 15 Pro" or "MacBook Air M3"
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Filter Your Results</h3>
                <p className="text-sm text-gray-600">
                  Use the advanced filters to narrow down results by price, brand, category, and technical specifications
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Browse Categories</h3>
                <p className="text-sm text-gray-600">
                  Explore our product categories like Phones, Computers, Gaming, and Audio to discover new products
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Popular Categories</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'Phones', 'Tablets', 'Computers', 'TVs', 'Gaming', 
                  'Watches', 'Audio', 'Cameras', 'Accessories', 'Home & Smart Devices'
                ].map((category) => (
                  <button
                    key={category}
                    onClick={() => navigate(`/search?category=${encodeURIComponent(category)}`)}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;