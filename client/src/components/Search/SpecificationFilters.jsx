import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SpecificationFilters = ({ 
  products = [], 
  onFiltersChange,
  selectedFilters = {},
  category = null 
}) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['Performance', 'Display & Interface']));
  const [localFilters, setLocalFilters] = useState(selectedFilters);

  // Extract unique specifications from products
  const extractSpecificationOptions = (products) => {
    const specOptions = {};
    
    products.forEach(product => {
      if (product.specifications) {
        product.specifications.forEach(spec => {
          const category = spec.category || 'Other';
          if (!specOptions[category]) {
            specOptions[category] = {};
          }
          if (!specOptions[category][spec.name]) {
            specOptions[category][spec.name] = new Set();
          }
          specOptions[category][spec.name].add(spec.value);
        });
      }
    });

    // Convert Sets to Arrays and sort
    Object.keys(specOptions).forEach(category => {
      Object.keys(specOptions[category]).forEach(specName => {
        specOptions[category][specName] = Array.from(specOptions[category][specName]).sort();
      });
    });

    return specOptions;
  };

  const specificationOptions = extractSpecificationOptions(products);

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleFilterChange = (category, specName, value, checked) => {
    const newFilters = { ...localFilters };
    
    if (!newFilters[category]) {
      newFilters[category] = {};
    }
    if (!newFilters[category][specName]) {
      newFilters[category][specName] = [];
    }

    if (checked) {
      if (!newFilters[category][specName].includes(value)) {
        newFilters[category][specName].push(value);
      }
    } else {
      newFilters[category][specName] = newFilters[category][specName].filter(v => v !== value);
      if (newFilters[category][specName].length === 0) {
        delete newFilters[category][specName];
      }
      if (Object.keys(newFilters[category]).length === 0) {
        delete newFilters[category];
      }
    }

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  const clearCategoryFilters = (category) => {
    const newFilters = { ...localFilters };
    delete newFilters[category];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.values(localFilters).forEach(category => {
      Object.values(category).forEach(specValues => {
        count += specValues.length;
      });
    });
    return count;
  };

  // Define important specifications for each category
  const importantSpecs = {
    'Performance': ['Processor', 'RAM', 'Storage', 'GPU'],
    'Display & Interface': ['Screen Size', 'Resolution', 'Display Technology', 'Refresh Rate'],
    'Camera & Imaging': ['Main Camera', 'Video Recording', 'Optical Zoom'],
    'Battery & Power': ['Battery Capacity', 'Battery Life', 'Wired Charging'],
    'Connectivity': ['Wi-Fi', 'Bluetooth', 'Cellular']
  };

  const activeFilterCount = getActiveFilterCount();

  if (Object.keys(specificationOptions).length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filter by Specifications</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {Object.entries(specificationOptions).map(([categoryName, specs]) => {
          const isExpanded = expandedCategories.has(categoryName);
          const categoryFilterCount = localFilters[categoryName] 
            ? Object.values(localFilters[categoryName]).reduce((sum, arr) => sum + arr.length, 0)
            : 0;

          // Show only important specs or limit to prevent overwhelming UI
          const specsToShow = importantSpecs[categoryName] 
            ? Object.entries(specs).filter(([specName]) => importantSpecs[categoryName].includes(specName))
            : Object.entries(specs).slice(0, 5);

          if (specsToShow.length === 0) return null;

          return (
            <div key={categoryName} className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => toggleCategory(categoryName)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{categoryName}</span>
                  {categoryFilterCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {categoryFilterCount}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3">
                  {categoryFilterCount > 0 && (
                    <button
                      onClick={() => clearCategoryFilters(categoryName)}
                      className="text-xs text-blue-600 hover:text-blue-700 mb-2"
                    >
                      Clear {categoryName} filters
                    </button>
                  )}
                  
                  {specsToShow.map(([specName, values]) => (
                    <div key={specName} className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{specName}</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {values.slice(0, 8).map(value => {
                          const isChecked = localFilters[categoryName]?.[specName]?.includes(value) || false;
                          return (
                            <label key={value} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleFilterChange(categoryName, specName, value, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-600 truncate">{value}</span>
                            </label>
                          );
                        })}
                        {values.length > 8 && (
                          <p className="text-xs text-gray-500 mt-1">
                            +{values.length - 8} more options
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeFilterCount > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {Object.entries(localFilters).map(([category, specs]) =>
              Object.entries(specs).map(([specName, values]) =>
                values.map(value => (
                  <span
                    key={`${category}-${specName}-${value}`}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                  >
                    {specName}: {value}
                    <button
                      onClick={() => handleFilterChange(category, specName, value, false)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationFilters;