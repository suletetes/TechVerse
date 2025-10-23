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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-3">
          {enableFiltering && (
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
              <span className="text-muted small">Show:</span>
              <select
                className="form-select form-select-sm"
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                style={{ width: 'auto' }}
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-0 fw-semibold"
                    style={{
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
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
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="text-center py-4 text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    className={`${onRowClick ? 'cursor-pointer' : ''} ${row.getIsSelected() ? 'table-active' : ''}`}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Expanded Row Content */}
                  {enableExpanding && row.getIsExpanded() && renderSubComponent && (
                    <tr>
                      <td colSpan={row.getVisibleCells().length} className="p-0">
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
      {enablePagination && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted small">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getPrePaginationRowModel().rows.length
            )}{' '}
            of {table.getPrePaginationRowModel().rows.length} entries
          </div>
          
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${!table.getCanPreviousPage() ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  First
                </button>
              </li>
              <li className={`page-item ${!table.getCanPreviousPage() ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </button>
              </li>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const pageIndex = Math.max(
                  0,
                  Math.min(
                    table.getState().pagination.pageIndex - 2 + i,
                    table.getPageCount() - 5 + i
                  )
                );
                
                if (pageIndex >= table.getPageCount()) return null;
                
                return (
                  <li
                    key={pageIndex}
                    className={`page-item ${pageIndex === table.getState().pagination.pageIndex ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => table.setPageIndex(pageIndex)}
                    >
                      {pageIndex + 1}
                    </button>
                  </li>
                );
              })}
              
              <li className={`page-item ${!table.getCanNextPage() ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </button>
              </li>
              <li className={`page-item ${!table.getCanNextPage() ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  Last
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default DataTable;