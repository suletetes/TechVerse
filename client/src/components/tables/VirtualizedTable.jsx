import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';

const VirtualizedTable = ({
  data,
  columns,
  height = 400,
  rowHeight = 50,
  overscan = 5,
  enableSorting = true,
  enableFiltering = true,
  searchPlaceholder = "Search...",
  className = "",
  emptyMessage = "No data available"
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  
  const containerRef = useRef(null);
  const scrollElementRef = useRef(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
  });

  const { rows } = table.getRowModel();
  
  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    rows.length - 1,
    Math.ceil((scrollTop + height) / rowHeight) + overscan
  );
  
  const visibleRows = rows.slice(startIndex, endIndex + 1);
  
  // Total height for scrollbar
  const totalHeight = rows.length * rowHeight;
  
  // Offset for visible rows
  const offsetY = startIndex * rowHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className={`virtualized-table-container ${className}`}>
      {/* Search and Controls */}
      {enableFiltering && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="search-container">
            <input
              type="text"
              className="form-control"
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              style={{ minWidth: '250px' }}
            />
          </div>
          <div className="text-muted small">
            {rows.length} total rows
          </div>
        </div>
      )}

      {/* Table Container */}
      <div 
        ref={containerRef}
        className="table-container border rounded"
        style={{ height: `${height}px`, overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="table-header bg-light border-bottom">
          <table className="table table-sm mb-0">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="border-0 fw-semibold py-2"
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: '#f8f9fa',
                        zIndex: 10,
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        
                        {enableSorting && header.column.getCanSort() && (
                          <span className="sort-indicator">
                            {{
                              asc: (
                                <svg width="14" height="14" viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M7 14l5-5 5 5z" />
                                </svg>
                              ),
                              desc: (
                                <svg width="14" height="14" viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M7 10l5 5 5-5z" />
                                </svg>
                              ),
                            }[header.column.getIsSorted()] ?? (
                              <svg width="14" height="14" viewBox="0 0 24 24" className="text-muted">
                                <path fill="currentColor" d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z" />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          </table>
        </div>

        {/* Scrollable Body */}
        <div
          ref={scrollElementRef}
          className="table-body"
          style={{
            height: `${height - 50}px`, // Subtract header height
            overflow: 'auto',
          }}
        >
          {rows.length === 0 ? (
            <div className="text-center py-4 text-muted">
              {emptyMessage}
            </div>
          ) : (
            <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
              <div
                style={{
                  transform: `translateY(${offsetY}px)`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                }}
              >
                <table className="table table-sm table-hover mb-0">
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr 
                        key={row.id}
                        style={{ height: `${rowHeight}px` }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td 
                            key={cell.id}
                            className="align-middle"
                            style={{
                              width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined,
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with row count */}
      <div className="d-flex justify-content-between align-items-center mt-2">
        <div className="text-muted small">
          Showing {visibleRows.length} of {rows.length} rows
        </div>
        <div className="text-muted small">
          Virtual scrolling enabled for performance
        </div>
      </div>
    </div>
  );
};

export default VirtualizedTable;