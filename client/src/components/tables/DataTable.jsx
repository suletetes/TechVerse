import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
} from '@tanstack/react-table';
import './DataTable.css';

const DataTable = ({
  data,
  columns,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableExpanding = false,
  enableSelection = false,
  pageSize = 10,
  searchPlaceholder = "Search...",
  renderSubComponent,
  onRowClick,
  className = "",
  emptyMessage = "No data available"
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [expanded, setExpanded] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  // Add selection column if enabled
  const tableColumns = useMemo(() => {
    const cols = [...columns];
    
    if (enableSelection) {
      cols.unshift({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="form-check-input"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="form-check-input"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 50,
      });
    }

    if (enableExpanding && renderSubComponent) {
      cols.unshift({
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={row.getToggleExpandedHandler()}
            disabled={!row.getCanExpand()}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              className={`transition-transform ${row.getIsExpanded() ? 'rotate-90' : ''}`}
            >
              <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
            </svg>
          </button>
        ),
        size: 50,
      });
    }

    return cols;
  }, [columns, enableSelection, enableExpanding, renderSubComponent]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      expanded,
      pagination,
    },
    enableRowSelection: enableSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
    getRowCanExpand: enableExpanding ? () => true : undefined,
  });

  const selectedRows = table.getSelectedRowModel().rows;

  return (
    <div className={`data-table-container ${className}`}>
      {/* Table Header with Search and Actions */}
      <div className="d-flex justify-content-between align-items-center mb-3 px-3 pt-3">
        <div className="d-flex align-items-center gap-3">
          {enableFiltering && (
            <div className="search-container">
              <div className="input-group" style={{ minWidth: '250px' }}>
                <span className="input-group-text bg-light border-end-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" className="text-muted">
                    <path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder={searchPlaceholder}
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>
          )}
          
          {enableSelection && selectedRows.length > 0 && (
            <div className="selected-info">
              <span className="badge bg-primary">
                {selectedRows.length} selected
              </span>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          {enablePagination && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Show</span>
              <select
                className="form-select form-select-sm"
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                style={{ width: '70px' }}
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <span className="text-muted small">entries</span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-0 fw-semibold py-3 px-3"
                    style={{
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      userSelect: 'none',
                      minWidth: header.column.id === 'actions' ? '150px' : 'auto'
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      
                      {enableSorting && header.column.getCanSort() && (
                        <span className="sort-indicator ms-2">
                          {{
                            asc: (
                              <svg width="14" height="14" viewBox="0 0 24 24" className="text-primary">
                                <path fill="currentColor" d="M7 14l5-5 5 5z" />
                              </svg>
                            ),
                            desc: (
                              <svg width="14" height="14" viewBox="0 0 24 24" className="text-primary">
                                <path fill="currentColor" d="M7 10l5 5 5-5z" />
                              </svg>
                            ),
                          }[header.column.getIsSorted()] ?? (
                            <svg width="14" height="14" viewBox="0 0 24 24" className="text-muted opacity-50">
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
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="text-center py-5 text-muted">
                  <div className="d-flex flex-column align-items-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" className="text-muted mb-3 opacity-50">
                      <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                    </svg>
                    <p className="mb-0">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    className={`
                      ${onRowClick ? 'cursor-pointer' : ''} 
                      ${row.getIsSelected() ? 'table-active' : ''} 
                      border-bottom
                    `}
                    onClick={() => onRowClick?.(row.original)}
                    style={{ 
                      transition: 'background-color 0.15s ease-in-out',
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Expanded Row Content */}
                  {enableExpanding && row.getIsExpanded() && renderSubComponent && (
                    <tr>
                      <td colSpan={row.getVisibleCells().length} className="p-0 border-bottom">
                        <div className="bg-light border-top p-4">
                          {renderSubComponent({ row })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && table.getPrePaginationRowModel().rows.length > 0 && (
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 px-3 pb-3 gap-3">
          <div className="text-muted small">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getPrePaginationRowModel().rows.length
            )}{' '}
            of {table.getPrePaginationRowModel().rows.length} entries
          </div>
          
          {table.getPageCount() > 1 && (
            <nav aria-label="Table pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${!table.getCanPreviousPage() ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    title="First page"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M18.41,16.59L13.82,12L18.41,7.41L17,6L11,12L17,18L18.41,16.59M6,6H8V18H6V6Z" />
                    </svg>
                  </button>
                </li>
                <li className={`page-item ${!table.getCanPreviousPage() ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    title="Previous page"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M15.41,16.59L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.59Z" />
                    </svg>
                  </button>
                </li>
                
                {/* Page Numbers */}
                {(() => {
                  const currentPage = table.getState().pagination.pageIndex;
                  const totalPages = table.getPageCount();
                  const maxVisiblePages = 5;
                  
                  let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
                  
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(0, endPage - maxVisiblePages + 1);
                  }
                  
                  const pages = [];
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <li
                        key={i}
                        className={`page-item ${i === currentPage ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => table.setPageIndex(i)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    );
                  }
                  return pages;
                })()}
                
                <li className={`page-item ${!table.getCanNextPage() ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    title="Next page"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z" />
                    </svg>
                  </button>
                </li>
                <li className={`page-item ${!table.getCanNextPage() ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    title="Last page"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M5.59,7.41L10.18,12L5.59,16.59L7,18L13,12L7,6L5.59,7.41M16,6H18V18H16V6Z" />
                    </svg>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;