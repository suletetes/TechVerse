import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const ProductSpecifications = ({ specifications = [] }) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['Display & Interface', 'Performance']));
  const [showAll, setShowAll] = useState(false);

  // Group specifications by category
  const groupedSpecs = specifications.reduce((acc, spec) => {
    const category = spec.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(spec);
    return acc;
  }, {});

  // Define category order and icons
  const categoryOrder = [
    'Display & Interface',
    'Performance', 
    'Camera & Imaging',
    'Audio & Sound',
    'Connectivity',
    'Battery & Power',
    'Durability & Design',
    'Health & Fitness Features',
    'Smart Features',
    'Gaming Features'
  ];

  const categoryIcons = {
    'Display & Interface': '📱',
    'Performance': '⚡',
    'Camera & Imaging': '📸',
    'Audio & Sound': '🔊',
    'Connectivity': '📡',
    'Battery & Power': '🔋',
    'Durability & Design': '🛡️',
    'Health & Fitness Features': '❤️',
    'Smart Features': '🤖',
    'Gaming Features': '🎮'
  };

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const formatSpecificationValue = (spec) => {
    if (spec.unit && spec.value !== 'Yes' && spec.value !== 'No') {
      return `${spec.value}${spec.unit}`;
    }
    return spec.value;
  };

  // Get categories to display
  const categoriesToShow = categoryOrder.filter(category => groupedSpecs[category]);
  const displayCategories = showAll ? categoriesToShow : categoriesToShow.slice(0, 4);

  if (specifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
        <p className="text-gray-500">No specifications available for this product.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
        <p className="text-sm text-gray-600 mt-1">Detailed technical information and features</p>
      </div>

      <div className="divide-y divide-gray-200">
        {displayCategories.map((category) => {
          const specs = groupedSpecs[category];
          const isExpanded = expandedCategories.has(category);
          
          return (
            <div key={category} className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{categoryIcons[category] || '📋'}</span>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">{category}</h4>
                    <p className="text-sm text-gray-500">{specs.length} specifications</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {specs.map((spec, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{spec.name}</span>
                        <span className="text-sm text-gray-900 font-semibold">
                          {formatSpecificationValue(spec)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {categoriesToShow.length > 4 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showAll ? 'Show Less' : `Show ${categoriesToShow.length - 4} More Categories`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductSpecifications;