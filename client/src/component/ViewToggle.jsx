import React from 'react';

const ViewToggle = ({ viewMode, onViewModeChange }) => {
    return (
        <div className="d-flex align-items-center gap-2">
            <span className="small tc-6533 me-2">View:</span>
            <div className="btn-group" role="group" aria-label="View toggle">
                <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => onViewModeChange('grid')}
                    aria-label="Grid view"
                >
                    <i className="fa fa-th"></i>
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => onViewModeChange('list')}
                    aria-label="List view"
                >
                    <i className="fa fa-list"></i>
                </button>
            </div>
        </div>
    );
};

export default ViewToggle;