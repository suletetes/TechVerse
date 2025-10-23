import React from 'react';
import { DataTable } from './index';

// Simple test component to verify table functionality
const TableTest = () => {
  const testData = [
    { id: 1, name: 'Test Product 1', price: 100, category: 'Electronics' },
    { id: 2, name: 'Test Product 2', price: 200, category: 'Books' },
    { id: 3, name: 'Test Product 3', price: 300, category: 'Clothing' },
  ];

  const testColumns = [
    {
      accessorKey: 'name',
      header: 'Product Name',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ getValue }) => `$${getValue()}`,
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
  ];

  return (
    <div className="p-4">
      <h3>Table Test</h3>
      <DataTable
        data={testData}
        columns={testColumns}
        enableSorting={true}
        enableFiltering={true}
        enablePagination={true}
        pageSize={5}
      />
    </div>
  );
};

export default TableTest;