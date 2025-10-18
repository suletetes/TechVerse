import React from 'react';

const SkeletonCard = ({ variant = 'product' }) => {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  if (variant === 'latest') {
    return (
      <div className="store-card">
        <div className={`${baseClasses} h-64 w-full mb-3`}></div>
        <div className="row g-0">
          <div className="col-lg-9">
            <div className={`${baseClasses} h-5 w-3/4 mb-2`}></div>
            <div className={`${baseClasses} h-4 w-1/2`}></div>
          </div>
          <div className="col-lg-3 align-self-end">
            <div className={`${baseClasses} h-8 w-full`}></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'product') {
    return (
      <div className="text-start d-flex col-md-6 col-lg-4 mb-4">
        <div className="store-card fill-card">
          <div className={`${baseClasses} h-64 w-full mb-3`}></div>
          <div className="row g-0 p-3">
            <div className="col-12 mb-2">
              <div className={`${baseClasses} h-5 w-3/4 mb-1`}></div>
              <div className={`${baseClasses} h-3 w-1/2`}></div>
            </div>
            <div className="col-lg-8">
              <div className={`${baseClasses} h-4 w-2/3 mb-2`}></div>
            </div>
            <div className="col-lg-4 align-self-end">
              <div className={`${baseClasses} h-8 w-full`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'quickpick') {
    return (
      <div className="store-card">
        <div className={`${baseClasses} h-48 w-full mb-3`}></div>
        <div className="text-center">
          <div className={`${baseClasses} h-4 w-3/4 mx-auto mb-2`}></div>
          <div className={`${baseClasses} h-4 w-1/2 mx-auto`}></div>
        </div>
      </div>
    );
  }

  if (variant === 'deal') {
    return (
      <div className="col-lg-4 col-md-6 mb-4">
        <div className="store-card fill-card">
          <div className={`${baseClasses} h-64 w-full mb-3`}></div>
          <div className="p-3">
            <div className={`${baseClasses} h-5 w-3/4 mb-2`}></div>
            <div className={`${baseClasses} h-4 w-1/2 mb-2`}></div>
            <div className={`${baseClasses} h-3 w-2/3`}></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonCard;