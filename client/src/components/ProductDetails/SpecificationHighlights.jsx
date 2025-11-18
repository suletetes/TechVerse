import React from 'react';

const SpecificationHighlights = ({ specifications = [], maxHighlights = 6 }) => {
  // Define priority specifications that should be highlighted
  const prioritySpecs = [
    'Screen Size', 'Resolution', 'Processor', 'RAM', 'Storage', 
    'Battery Life', 'Main Camera', 'Display Technology', 'Water Resistance',
    'Battery Capacity', 'Refresh Rate', 'Brightness'
  ];

  // Get specification highlights
  const getSpecificationHighlights = (specs, count = maxHighlights) => {
    const highlights = [];
    
    // First, add priority specifications
    prioritySpecs.forEach(specName => {
      const spec = specs.find(s => s.name === specName);
      if (spec && highlights.length < count) {
        highlights.push(spec);
      }
    });
    
    // Fill remaining slots with other important specs
    if (highlights.length < count) {
      specs.forEach(spec => {
        if (!prioritySpecs.includes(spec.name) && highlights.length < count) {
          highlights.push(spec);
        }
      });
    }
    
    return highlights;
  };

  const formatSpecificationValue = (spec) => {
    if (spec.unit && spec.value !== 'Yes' && spec.value !== 'No') {
      return `${spec.value}${spec.unit}`;
    }
    return spec.value;
  };

  const highlights = getSpecificationHighlights(specifications, maxHighlights);

  if (highlights.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">⭐</span>
        Key Specifications
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {highlights.map((spec, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatSpecificationValue(spec)}
              </div>
              <div className="text-sm font-medium text-gray-700">
                {spec.name}
              </div>
              {spec.category && (
                <div className="text-xs text-gray-500 mt-1">
                  {spec.category}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecificationHighlights;