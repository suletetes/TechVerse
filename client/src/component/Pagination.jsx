import React from 'react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    startIndex, 
    itemsPerPage, 
    totalItems 
}) => {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        
        for (let i = 1; i <= totalPages; i++) {
            const isCurrentPage = i === currentPage;
            
            // Show first page, last page, current page, and pages around current
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                pages.push(
                    <li key={i} className={`page-item ${isCurrentPage ? 'active' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(i)}
                        >
                            {i}
                        </button>
                    </li>
                );
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                pages.push(
                    <li key={i} className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
        }
        
        return pages;
    };

    return (
        <div className="col-12 mt-4">
            <nav aria-label="Product pagination">
                <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                        >
                            <i className="fa fa-chevron-left"></i>
                        </button>
                    </li>
                    
                    {renderPageNumbers()}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                        >
                            <i className="fa fa-chevron-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>
            
            {/* Pagination Info */}
            <div className="text-center mt-2">
                <small className="tc-6533">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} products
                </small>
            </div>
        </div>
    );
};

export default Pagination;