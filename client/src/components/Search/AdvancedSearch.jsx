import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  ChevronDownIcon,
  StarIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import searchService from '../../api/services/searchService.js';
import productService from '../../api/services/productService.js';
import SpecificationFilters from './SpecificationFilters.jsx';

const AdvancedSearch = ({ 
  onSearchResults, 
  initialQuery = '', 
  initialFilters = {},
  showFilters = true,
  placeholder = "Search for products...",
  className = ""
}) => {
  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState(initialFilters);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Filter options state
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  
  // Search history and popular searches
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  
  // Products for specification filtering
  const [allProducts, setAllProducts] = useState([]);
  const [specificationFilters, setSpecificationFilters] = useState({});
  
  // Refs
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debouncedSearchRef = useRef(null);

  // Initialize debounced search
  useEffect(() => {
    debouncedSearchRef.current = searchService.createDebouncedSearch(300);
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle initial query
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery, initialFilters);
    }
  }, [initialQuery]);

  const loadInitialData = async () => {
    try {
      const [filtersResult, historyResult, popularResult, productsResult] = await Promise.all([
        searchService.getSearchFilters(),
        searchService.getSearchHistory(10),
        searchService.getPopularSearches(5),
        productService.getProducts({ limit: 100 }) // Get products for spec filtering
      ]);

      if (filtersResult.success) {
        const { categories: cats, brands: brds, priceRange: range } = filtersResult.data;
        setCategories(cats || []);
        setBrands(brds || []);
        setPriceRange(range || { min: 0, max: 1000 });
      }

      if (historyResult.success) {
        setSearchHistory(historyResult.data.history || []);
      }

      if (popularResult.success) {
        setPopularSearches(popularResult.data.searches || []);
      }

      if (productsResult.success) {
        setAllProducts(productsResult.data.products || []);
      }
    } catch (error) {
      console.warn('Failed to load search data:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedSuggestionIndex(-1);

    if (value.trim().length >= 2) {
      // Get autocomplete suggestions
      debouncedSearchRef.current?.(value, (result) => {
        if (result.success) {
          setSuggestions(result.data.suggestions || []);
          setShowSuggestions(true);
        }
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = async (searchQuery = query, searchFilters = filters) => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery && Object.keys(searchFilters).length === 0) {
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const searchParams = {
        q: trimmedQuery,
        ...searchFilters,
        specifications: JSON.stringify(specificationFilters)
      };

      const result = await searchService.searchProducts(searchParams);
      
      if (result.success) {
        onSearchResults?.(result.data);
        
        // Save to search history if there's a query
        if (trimmedQuery) {
          searchService.saveSearchToHistory(trimmedQuery, searchFilters);
        }
        
        // Track search analytics
        searchService.trackSearch(
          trimmedQuery, 
          result.data.pagination?.totalProducts || 0, 
          searchFilters
        );
      }
    } catch (error) {
      console.error('Search failed:', error);
      onSearchResults?.({
        products: [],
        pagination: { currentPage: 1, totalPages: 0, totalProducts: 0 }
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const suggestion = suggestions[selectedSuggestionIndex];
          setQuery(suggestion.text);
          setShowSuggestions(false);
          handleSearch(suggestion.text);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    handleSearch(suggestion.text);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === null || value === undefined) {
      delete newFilters[filterType];
    } else {
      newFilters[filterType] = value;
    }
    
    setFilters(newFilters);
    
    // Auto-search when filters change
    if (query.trim() || Object.keys(newFilters).length > 0) {
      handleSearch(query, newFilters);
    }
  };

  const handleSpecificationFiltersChange = (specFilters) => {
    setSpecificationFilters(specFilters);
    
    // Auto-search when specification filters change
    if (query.trim() || Object.keys(filters).length > 0 || Object.keys(specFilters).length > 0) {
      handleSearch(query, filters);
    }
  };

  const clearAllFilters = () => {
    setFilters({});
    setSpecificationFilters({});
    if (query.trim()) {
      handleSearch(query, {});
    }
  };

  const clearSearch = () => {
    setQuery('');
    setFilters({});
    setSpecificationFilters({});
    setSuggestions([]);
    setShowSuggestions(false);
    onSearchResults?.({
      products: [],
      pagination: { currentPage: 1, totalPages: 0, totalProducts: 0 }
    });
  };

  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem.query);
    setFilters(historyItem.filters || {});
    handleSearch(historyItem.query, historyItem.filters || {});
  };

  const handlePopularSearchClick = (searchTerm) => {
    setQuery(searchTerm);
    handleSearch(searchTerm);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFiltersCount = Object.keys(filters).length + Object.keys(specificationFilters).length;

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder={placeholder}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {showFilters && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`ml-3 px-4 py-3 border rounded-lg flex items-center space-x-2 transition-colors ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="ml-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5" />
            )}
            <span>Search</span>
          </button>
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.text}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                  index === selectedSuggestionIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {suggestion.type === 'product' && <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
                  {suggestion.type === 'brand' && <FireIcon className="h-4 w-4 text-orange-400" />}
                  {suggestion.type === 'category' && <FunnelIcon className="h-4 w-4 text-blue-400" />}
                </div>
                <div className="flex-1">
                  <div className="text-gray-900">{suggestion.text}</div>
                  <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Search History and Popular Searches (when input is focused and empty) */}
        {showSuggestions && !query && (searchHistory.length > 0 || popularSearches.length > 0) && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          >
            {searchHistory.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Recent Searches
                </h4>
                {searchHistory.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(item)}
                    className="block w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            )}
            
            {popularSearches.length > 0 && (
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FireIcon className="h-4 w-4 mr-1" />
                  Popular Searches
                </h4>
                {popularSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handlePopularSearchClick(term)}
                    className="block w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                value={filters.brand || ''}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="1000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Rating
              </label>
              <select
                value={filters.rating || ''}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability
              </label>
              <select
                value={filters.inStock || ''}
                onChange={(e) => handleFilterChange('inStock', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Products</option>
                <option value="true">In Stock Only</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy || 'relevance'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
          </div>

          {/* Specification Filters */}
          {allProducts.length > 0 && (
            <div className="mt-4">
              <SpecificationFilters
                products={allProducts}
                onFiltersChange={handleSpecificationFiltersChange}
                selectedFilters={specificationFilters}
                category={filters.category}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;