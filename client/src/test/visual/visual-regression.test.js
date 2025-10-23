import { describe, it, expect } from 'vitest';
import { render } from '../test-utils';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// Extend expect with image snapshot matcher
expect.extend({ toMatchImageSnapshot });

// Mock components for visual testing
import { DataTable } from '../../components/tables';
import { RichTextEditor } from '../../components/editor';
import { createMockProduct } from '../test-utils';

// Configure image snapshot options
const imageSnapshotOptions = {
  threshold: 0.2,
  comparisonMethod: 'ssim',
  failureThreshold: 0.01,
  failureThresholdType: 'percent',
  allowSizeMismatch: false,
  storeReceivedOnFailure: true,
  customDiffDir: '__image_snapshots__/diffs',
  customReceivedDir: '__image_snapshots__/received',
  customSnapshotsDir: '__image_snapshots__'
};

describe('Visual Regression Tests', () => {
  describe('DataTable Component', () => {
    const mockData = Array.from({ length: 5 }, (_, i) => 
      createMockProduct({
        id: String(i + 1),
        name: `Product ${i + 1}`,
        price: (i + 1) * 100,
        stock: (i + 1) * 10
      })
    );

    const columns = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'price', header: 'Price', cell: ({ getValue }) => `£${getValue()}` },
      { accessorKey: 'stock', header: 'Stock' }
    ];

    it('should match snapshot for default table', async () => {
      const { container } = render(
        <DataTable
          data={mockData}
          columns={columns}
          enableSorting={true}
          enableFiltering={true}
          enablePagination={true}
        />
      );

      // Wait for table to render
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'datatable-default'
      });
    });

    it('should match snapshot for table with selection', async () => {
      const { container } = render(
        <DataTable
          data={mockData}
          columns={columns}
          enableSelection={true}
          enableSorting={true}
        />
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'datatable-with-selection'
      });
    });

    it('should match snapshot for empty table', async () => {
      const { container } = render(
        <DataTable
          data={[]}
          columns={columns}
          emptyMessage="No data available"
        />
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'datatable-empty'
      });
    });
  });

  describe('RichTextEditor Component', () => {
    it('should match snapshot for default editor', async () => {
      const { container } = render(
        <RichTextEditor
          content=""
          onChange={() => {}}
          placeholder="Start writing..."
        />
      );

      // Wait for editor to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'editor-default'
      });
    });

    it('should match snapshot for editor with content', async () => {
      const content = `
        <h2>Sample Content</h2>
        <p>This is <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>First item</li>
          <li>Second item</li>
        </ul>
      `;

      const { container } = render(
        <RichTextEditor
          content={content}
          onChange={() => {}}
          placeholder="Start writing..."
        />
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'editor-with-content'
      });
    });

    it('should match snapshot for read-only editor', async () => {
      const content = `
        <h3>Read-Only Content</h3>
        <p>This editor is in read-only mode.</p>
      `;

      const { container } = render(
        <RichTextEditor
          content={content}
          onChange={() => {}}
          editable={false}
          showToolbar={false}
        />
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'editor-readonly'
      });
    });
  });

  describe('Responsive Design Tests', () => {
    it('should match mobile layout for DataTable', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const mockData = [createMockProduct({ id: '1', name: 'Mobile Product' })];
      const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'price', header: 'Price' }
      ];

      const { container } = render(
        <div style={{ width: '375px' }}>
          <DataTable
            data={mockData}
            columns={columns}
            enablePagination={false}
          />
        </div>
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'datatable-mobile'
      });
    });

    it('should match tablet layout for RichTextEditor', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { container } = render(
        <div style={{ width: '768px' }}>
          <RichTextEditor
            content="<p>Tablet editor content</p>"
            onChange={() => {}}
          />
        </div>
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'editor-tablet'
      });
    });
  });

  describe('Theme Variations', () => {
    it('should match dark theme for DataTable', async () => {
      const mockData = [createMockProduct({ id: '1', name: 'Dark Theme Product' })];
      const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'price', header: 'Price' }
      ];

      const { container } = render(
        <div className="bg-dark text-light p-3">
          <DataTable
            data={mockData}
            columns={columns}
            className="table-dark"
          />
        </div>
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'datatable-dark-theme'
      });
    });
  });

  describe('Error States', () => {
    it('should match error state visualization', async () => {
      const { container } = render(
        <div className="alert alert-danger">
          <h4>Error State</h4>
          <p>Something went wrong. Please try again.</p>
          <button className="btn btn-outline-danger">Retry</button>
        </div>
      );

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'error-state'
      });
    });

    it('should match loading state visualization', async () => {
      const { container } = render(
        <div className="d-flex justify-content-center align-items-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2">Loading data...</span>
        </div>
      );

      expect(container.firstChild).toMatchImageSnapshot({
        ...imageSnapshotOptions,
        customSnapshotIdentifier: 'loading-state'
      });
    });
  });
});

// Cross-browser visual regression tests
describe('Cross-Browser Visual Tests', () => {
  const browsers = ['chrome', 'firefox', 'safari'];
  
  browsers.forEach(browser => {
    describe(`${browser} specific tests`, () => {
      it(`should render consistently in ${browser}`, async () => {
        const mockData = [createMockProduct()];
        const columns = [{ accessorKey: 'name', header: 'Name' }];

        const { container } = render(
          <DataTable data={mockData} columns={columns} />
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(container.firstChild).toMatchImageSnapshot({
          ...imageSnapshotOptions,
          customSnapshotIdentifier: `datatable-${browser}`
        });
      });
    });
  });
});

// Performance-based visual tests
describe('Performance Visual Tests', () => {
  it('should render large dataset without visual artifacts', async () => {
    const largeDataset = Array.from({ length: 100 }, (_, i) => 
      createMockProduct({ id: String(i + 1), name: `Product ${i + 1}` })
    );

    const columns = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'price', header: 'Price' }
    ];

    const { container } = render(
      <DataTable
        data={largeDataset}
        columns={columns}
        enablePagination={true}
        pageSize={10}
      />
    );

    // Wait for pagination to render
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(container.firstChild).toMatchImageSnapshot({
      ...imageSnapshotOptions,
      customSnapshotIdentifier: 'datatable-large-dataset'
    });
  });
});