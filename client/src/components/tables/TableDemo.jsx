import React, { useState, useMemo } from 'react';
import { DataTable, VirtualizedTable } from './index';

// Generate large dataset for virtualization demo
const generateLargeDataset = (count = 10000) => {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
  const statuses = ['Active', 'Inactive', 'Pending'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    price: Math.floor(Math.random() * 1000) + 10,
    stock: Math.floor(Math.random() * 100),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    sales: Math.floor(Math.random() * 500),
    featured: Math.random() > 0.8,
  }));
};

const TableDemo = () => {
  const [activeDemo, setActiveDemo] = useState('basic');
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Sample data for basic demo
  const basicData = useMemo(() => [
    { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 1299, stock: 15, status: 'Active', sales: 45 },
    { id: 2, name: 'Wireless Mouse', category: 'Electronics', price: 29, stock: 150, status: 'Active', sales: 234 },
    { id: 3, name: 'Office Chair', category: 'Furniture', price: 199, stock: 8, status: 'Low Stock', sales: 67 },
    { id: 4, name: 'Desk Lamp', category: 'Furniture', price: 49, stock: 0, status: 'Out of Stock', sales: 12 },
    { id: 5, name: 'Notebook Set', category: 'Stationery', price: 15, stock: 200, status: 'Active', sales: 89 },
  ], []);

  // Large dataset for virtualization
  const largeData = useMemo(() => generateLargeDataset(10000), []);

  // Column definitions
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Product Name',
      size: 200,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ getValue }) => (
        <span className="badge bg-light text-dark border">{getValue()}</span>
      ),
      size: 120,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ getValue }) => `£${getValue()}`,
      size: 100,
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ getValue }) => {
        const stock = getValue();
        const badgeClass = stock === 0 ? 'bg-danger' : stock < 20 ? 'bg-warning' : 'bg-success';
        return (
          <div className="d-flex align-items-center">
            <span className={`badge ${badgeClass} me-2`} style={{ width: '8px', height: '8px', padding: 0 }}></span>
            {stock}
          </div>
        );
      },
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const badgeClass = {
          'Active': 'bg-success',
          'Inactive': 'bg-secondary',
          'Low Stock': 'bg-warning',
          'Out of Stock': 'bg-danger',
          'Pending': 'bg-info'
        }[status] || 'bg-secondary';
        
        return <span className={`badge ${badgeClass}`}>{status}</span>;
      },
      size: 120,
    },
    {
      accessorKey: 'sales',
      header: 'Sales',
      cell: ({ getValue }) => getValue().toLocaleString(),
      size: 100,
    },
  ], []);

  const handleRowClick = (row) => {
    console.log('Row clicked:', row);
  };

  const renderSubComponent = ({ row }) => (
    <div className="p-3">
      <h6>Additional Details for {row.original.name}</h6>
      <div className="row">
        <div className="col-md-6">
          <p><strong>ID:</strong> {row.original.id}</p>
          <p><strong>Category:</strong> {row.original.category}</p>
        </div>
        <div className="col-md-6">
          <p><strong>Price:</strong> £{row.original.price}</p>
          <p><strong>Stock Level:</strong> {row.original.stock} units</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2>Advanced Data Tables Demo</h2>
          <p className="text-muted">
            Showcasing TanStack Table features including sorting, filtering, pagination, 
            row selection, expansion, and virtual scrolling for large datasets.
          </p>
        </div>
      </div>

      {/* Demo Navigation */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="btn-group" role="group">
            <button
              className={`btn ${activeDemo === 'basic' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveDemo('basic')}
            >
              Basic Table
            </button>
            <button
              className={`btn ${activeDemo === 'selection' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveDemo('selection')}
            >
              Row Selection
            </button>
            <button
              className={`btn ${activeDemo === 'expansion' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveDemo('expansion')}
            >
              Row Expansion
            </button>
            <button
              className={`btn ${activeDemo === 'virtual' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveDemo('virtual')}
            >
              Virtual Scrolling (10k rows)
            </button>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                {activeDemo === 'basic' && 'Basic Data Table'}
                {activeDemo === 'selection' && 'Table with Row Selection'}
                {activeDemo === 'expansion' && 'Table with Row Expansion'}
                {activeDemo === 'virtual' && 'Virtualized Table (10,000 rows)'}
              </h5>
            </div>
            <div className="card-body">
              {activeDemo === 'basic' && (
                <DataTable
                  data={basicData}
                  columns={columns}
                  enableSorting={true}
                  enableFiltering={true}
                  enablePagination={true}
                  pageSize={5}
                  searchPlaceholder="Search products..."
                  onRowClick={handleRowClick}
                />
              )}

              {activeDemo === 'selection' && (
                <div>
                  {selectedRows.length > 0 && (
                    <div className="alert alert-info mb-3">
                      <strong>{selectedRows.length}</strong> rows selected
                      <button 
                        className="btn btn-sm btn-outline-primary ms-2"
                        onClick={() => console.log('Selected rows:', selectedRows)}
                      >
                        Process Selected
                      </button>
                    </div>
                  )}
                  <DataTable
                    data={basicData}
                    columns={columns}
                    enableSorting={true}
                    enableFiltering={true}
                    enablePagination={true}
                    enableSelection={true}
                    pageSize={5}
                    searchPlaceholder="Search products..."
                    onSelectionChange={setSelectedRows}
                  />
                </div>
              )}

              {activeDemo === 'expansion' && (
                <DataTable
                  data={basicData}
                  columns={columns}
                  enableSorting={true}
                  enableFiltering={true}
                  enablePagination={true}
                  enableExpanding={true}
                  pageSize={5}
                  searchPlaceholder="Search products..."
                  renderSubComponent={renderSubComponent}
                />
              )}

              {activeDemo === 'virtual' && (
                <div>
                  <div className="alert alert-warning mb-3">
                    <strong>Performance Note:</strong> This table is rendering 10,000 rows using virtual scrolling 
                    for optimal performance. Only visible rows are rendered in the DOM.
                  </div>
                  <VirtualizedTable
                    data={largeData}
                    columns={columns}
                    height={500}
                    rowHeight={50}
                    enableSorting={true}
                    enableFiltering={true}
                    searchPlaceholder="Search 10,000 products..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Features Implemented</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Core Features</h6>
                  <ul className="list-unstyled">
                    <li>✅ Column sorting (ascending/descending)</li>
                    <li>✅ Global search and filtering</li>
                    <li>✅ Pagination with customizable page sizes</li>
                    <li>✅ Row selection (single/multiple)</li>
                    <li>✅ Row expansion for detailed views</li>
                    <li>✅ Responsive design</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Advanced Features</h6>
                  <ul className="list-unstyled">
                    <li>✅ Virtual scrolling for large datasets</li>
                    <li>✅ Custom cell renderers</li>
                    <li>✅ Column width management</li>
                    <li>✅ Empty state handling</li>
                    <li>✅ Keyboard navigation support</li>
                    <li>✅ TypeScript support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableDemo;