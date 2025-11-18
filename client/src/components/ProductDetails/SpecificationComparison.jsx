import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SpecificationComparison = ({ 
  product1, 
  product2, 
  onClose,
  onRemoveProduct 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const formatSpecificationValue = (spec) => {
    if (!spec) return 'N/A';
    if (spec.unit && spec.value !== 'Yes' && spec.value !== 'No') {
      return `${spec.value}${spec.unit}`;
    }
    return spec.value;
  };

  const compareSpecifications = (product1Specs, product2Specs) => {
    const comparison = {};
    
    // Create a map of all unique specification names
    const allSpecs = new Set([
      ...product1Specs.map(s => s.name),
      ...product2Specs.map(s => s.name)
    ]);

    allSpecs.forEach(specName => {
      const spec1 = product1Specs.find(s => s.name === specName);
      const spec2 = product2Specs.find(s => s.name === specName);
      
      comparison[specName] = {
        product1: spec1 ? formatSpecificationValue(spec1) : 'N/A',
        product2: spec2 ? formatSpecificationValue(spec2) : 'N/A',
        category: spec1?.category || spec2?.category || 'Other'
      };
    });

    return comparison;
  };

  const comparison = compareSpecifications(
    product1.specifications || [], 
    product2.specifications || []
  );

  // Get unique categories
  const categories = [...new Set(Object.values(comparison).map(c => c.category))];
  const filteredComparison = selectedCategory === 'all' 
    ? comparison 
    : Object.fromEntries(
        Object.entries(comparison).filter(([_, spec]) => spec.category === selectedCategory)
      );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Product Comparison</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Product Headers */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-600">Specification</div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <img 
                src={product1.images?.[0]?.url || '/img/placeholder.jpg'} 
                alt={product1.name}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{product1.name}</h3>
                <p className="text-sm text-gray-600">{product1.brand}</p>
              </div>
              {onRemoveProduct && (
                <button
                  onClick={() => onRemoveProduct(product1.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <img 
                src={product2.images?.[0]?.url || '/img/placeholder.jpg'} 
                alt={product2.name}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{product2.name}</h3>
                <p className="text-sm text-gray-600">{product2.brand}</p>
              </div>
              {onRemoveProduct && (
                <button
                  onClick={() => onRemoveProduct(product2.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-y-auto max-h-96">
          <div className="divide-y divide-gray-200">
            {Object.entries(filteredComparison).map(([specName, spec]) => (
              <div key={specName} className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50">
                <div className="font-medium text-gray-900 text-sm">
                  {specName}
                  <div className="text-xs text-gray-500 mt-1">{spec.category}</div>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-semibold ${
                    spec.product1 === 'N/A' ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {spec.product1}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-semibold ${
                    spec.product2 === 'N/A' ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {spec.product2}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Comparing {Object.keys(filteredComparison).length} specifications
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecificationComparison;