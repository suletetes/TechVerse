import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import { DataTable } from '../../components/tables';

const mockData = [
  { id: 1, name: 'Product 1', price: 100, category: 'Electronics', stock: 10 },
  { id: 2, name: 'Product 2', price: 200, category: 'Books', stock: 5 },
  { id: 3, name: 'Product 3', price: 300, category: 'Electronics', stock: 0 },
  { id: 4, name: 'Product 4', price: 150, category: 'Clothing', stock: 20 },
  { id: 5, name: 'Product 5', price: 250, category: 'Books', stock: 15 }
];

const mockColumns = [
  {
    accessorKey: 'name',
    header: 'Product Name',
    size: 200,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => `$${getValue()}`,
    size: 100,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 120,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ getValue }) => {
      const stock = getValue();
      return (
        <span className={stock === 0 ? 'text-danger' : stock < 10 ? 'text-warning' : 'text-success'}>
          {stock}
        </span>
      );
    },
    size: 80,
  }
];

describe('DataTable Component', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Basic Rendering', () => {
    it('should render table with data', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Check headers
      expect(screen.getByText('Product Name')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();

      // Check data rows
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          emptyMessage="No products found"
        />
      );

      expect(screen.getByText('No products found')).toBeInTheDocument();
    });

    it('should render custom empty message', () => {
      const customMessage = 'Custom empty state message';
      
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          emptyMessage={customMessage}
        />
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort data when column header is clicked', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableSorting={true}
        />
      );

      // Click on Price header to sort
      await user.click(screen.getByText('Price'));

      // Check if data is sorted (first row should be Product 1 with $100)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Product 1');
      expect(rows[1]).toHaveTextContent('$100');
    });

    it('should toggle sort direction on multiple clicks', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableSorting={true}
        />
      );

      const priceHeader = screen.getByText('Price');

      // First click - ascending
      await user.click(priceHeader);
      let rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('$100'); // Lowest price first

      // Second click - descending
      await user.click(priceHeader);
      rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('$300'); // Highest price first
    });

    it('should disable sorting when enableSorting is false', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableSorting={false}
        />
      );

      const priceHeader = screen.getByText('Price');
      
      // Click should not change order
      await user.click(priceHeader);
      
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Product 1'); // Original order maintained
    });
  });

  describe('Filtering', () => {
    it('should filter data based on search input', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableFiltering={true}
          searchPlaceholder="Search products..."
        />
      );

      const searchInput = screen.getByPlaceholderText('Search products...');
      
      // Search for "Product 2"
      await user.type(searchInput, 'Product 2');

      await waitFor(() => {
        expect(screen.getByText('Product 2')).toBeInTheDocument();
        expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Product 3')).not.toBeInTheDocument();
      });
    });

    it('should show no results when search matches nothing', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableFiltering={true}
          emptyMessage="No matching products"
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await user.type(searchInput, 'NonexistentProduct');

      await waitFor(() => {
        expect(screen.getByText('No matching products')).toBeInTheDocument();
      });
    });

    it('should clear filter when search is cleared', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableFiltering={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      // Filter data
      await user.type(searchInput, 'Product 2');
      await waitFor(() => {
        expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
      });

      // Clear filter
      await user.clear(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 2')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should paginate data when enablePagination is true', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enablePagination={true}
          pageSize={2}
        />
      );

      // Should show pagination controls
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Last')).toBeInTheDocument();

      // Should show page info
      expect(screen.getByText(/Showing 1 to 2 of 5 entries/)).toBeInTheDocument();
    });

    it('should navigate between pages', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enablePagination={true}
          pageSize={2}
        />
      );

      // Should show first 2 items initially
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.queryByText('Product 3')).not.toBeInTheDocument();

      // Click Next
      await user.click(screen.getByText('Next'));

      // Should show next 2 items
      expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
      expect(screen.getByText('Product 4')).toBeInTheDocument();
    });

    it('should change page size', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enablePagination={true}
          pageSize={2}
        />
      );

      // Change page size to 10
      const pageSizeSelect = screen.getByDisplayValue('2');
      await user.selectOptions(pageSizeSelect, '10');

      // Should show all items now
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
      expect(screen.getByText('Product 4')).toBeInTheDocument();
      expect(screen.getByText('Product 5')).toBeInTheDocument();
    });
  });

  describe('Row Selection', () => {
    it('should enable row selection when enableSelection is true', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableSelection={true}
        />
      );

      // Should have checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(6); // 1 header + 5 rows
    });

    it('should select all rows when header checkbox is clicked', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableSelection={true}
        />
      );

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(headerCheckbox);

      // All checkboxes should be checked
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should show selected count', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableSelection={true}
        />
      );

      // Select first row
      const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(firstRowCheckbox);

      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  describe('Row Expansion', () => {
    const renderSubComponent = ({ row }) => (
      <div>Expanded content for {row.original.name}</div>
    );

    it('should enable row expansion when enableExpanding is true', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableExpanding={true}
          renderSubComponent={renderSubComponent}
        />
      );

      // Should have expand buttons
      const expandButtons = screen.getAllByRole('button');
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    it('should expand row when expand button is clicked', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableExpanding={true}
          renderSubComponent={renderSubComponent}
        />
      );

      const firstExpandButton = screen.getAllByRole('button')[0];
      await user.click(firstExpandButton);

      expect(screen.getByText('Expanded content for Product 1')).toBeInTheDocument();
    });

    it('should collapse expanded row when clicked again', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableExpanding={true}
          renderSubComponent={renderSubComponent}
        />
      );

      const firstExpandButton = screen.getAllByRole('button')[0];
      
      // Expand
      await user.click(firstExpandButton);
      expect(screen.getByText('Expanded content for Product 1')).toBeInTheDocument();

      // Collapse
      await user.click(firstExpandButton);
      expect(screen.queryByText('Expanded content for Product 1')).not.toBeInTheDocument();
    });
  });

  describe('Custom Cell Rendering', () => {
    it('should render custom cell content', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Price column should show formatted currency
      expect(screen.getByText('$100')).toBeInTheDocument();
      expect(screen.getByText('$200')).toBeInTheDocument();
    });

    it('should apply custom CSS classes from cell renderers', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Stock column should have color classes based on stock level
      const stockCells = screen.getAllByText(/^\d+$/);
      const zeroStockCell = stockCells.find(cell => cell.textContent === '0');
      const lowStockCell = stockCells.find(cell => cell.textContent === '5');
      const normalStockCell = stockCells.find(cell => cell.textContent === '10');

      expect(zeroStockCell).toHaveClass('text-danger');
      expect(lowStockCell).toHaveClass('text-warning');
      expect(normalStockCell).toHaveClass('text-success');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Table should have proper role
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Headers should have proper role
      expect(screen.getAllByRole('columnheader')).toHaveLength(4);
      
      // Rows should have proper role
      expect(screen.getAllByRole('row')).toHaveLength(6); // 1 header + 5 data rows
    });

    it('should support keyboard navigation for sortable columns', async () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          enableSorting={true}
        />
      );

      const priceHeader = screen.getByText('Price');
      
      // Should be focusable
      priceHeader.focus();
      expect(priceHeader).toHaveFocus();

      // Should sort on Enter key
      await user.keyboard('{Enter}');
      
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('$100');
    });
  });
});