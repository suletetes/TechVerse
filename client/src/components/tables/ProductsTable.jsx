import React, { useMemo } from 'react';
import DataTable from './DataTable';

const ProductsTable = ({ 
  products, 
  onEdit, 
  onDelete, 
  onToggleFeatured, 
  onView,
  enableSelection = false,
  onSelectionChange 
}) => {
  const formatCurrency = (amount) => `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="d-flex align-items-center">
            <div className="product-image-container me-3">
              <img
                src={product.image}
                alt={product.name}
                className="product-table-image"
                style={{
                  width: '50px',
                  height: '50px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
                onError={(e) => {
                  e.target.src = '/img/placeholder-product.jpg';
                }}
              />
              {product.featured && (
                <span 
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning"
                  style={{ fontSize: '0.6rem' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
              )}
            </div>
            <div>
              <div className="fw-semibold">{product.name}</div>
              <small className="text-muted">SKU: {product.sku}</small>
            </div>
          </div>
        );
      },
      size: 250,
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
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div>
            <span className="fw-semibold">{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <div>
                <small className="text-muted text-decoration-line-through">
                  {formatCurrency(product.originalPrice)}
                </small>
              </div>
            )}
          </div>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ getValue, row }) => {
        const stock = getValue();
        const product = row.original;
        return (
          <div className="d-flex align-items-center">
            <span 
              className={`badge me-2 ${
                stock === 0 ? 'bg-danger' : 
                stock <= 15 ? 'bg-warning' : 
                'bg-success'
              }`}
              style={{ width: '8px', height: '8px', padding: 0 }}
            ></span>
            <span>{stock}</span>
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
        const statusClass = status.toLowerCase().replace(' ', '-');
        const badgeClass = {
          'active': 'bg-success',
          'low-stock': 'bg-warning',
          'out-of-stock': 'bg-danger',
          'inactive': 'bg-secondary'
        }[statusClass] || 'bg-secondary';
        
        return (
          <span className={`badge ${badgeClass}`}>
            {status}
          </span>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'sales',
      header: 'Sales',
      cell: ({ getValue }) => {
        const sales = getValue();
        const salesValue = typeof sales === 'number' 
          ? sales 
          : sales?.totalSold || 0;
        return <span className="fw-semibold">{salesValue}</span>;
      },
      size: 80,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="btn-group btn-group-sm" role="group">
            <button 
              className="btn btn-outline-primary" 
              title="View Product"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(product);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
              </svg>
            </button>
            <button 
              className="btn btn-outline-secondary" 
              title="Edit Product"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(product);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
              </svg>
            </button>
            <button 
              className={`btn ${product.featured ? 'btn-warning' : 'btn-outline-warning'}`}
              title={product.featured ? 'Remove from Featured' : 'Add to Featured'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFeatured?.(product);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
            <button 
              className="btn btn-outline-danger" 
              title="Delete Product"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(product);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
              </svg>
            </button>
          </div>
        );
      },
      size: 160,
    },
  ], [onEdit, onDelete, onToggleFeatured, onView, formatCurrency]);

  return (
    <DataTable
      data={products}
      columns={columns}
      enableSorting={true}
      enableFiltering={true}
      enablePagination={true}
      enableSelection={enableSelection}
      pageSize={10}
      searchPlaceholder="Search products by name, SKU, or category..."
      emptyMessage="No products found"
      onRowClick={(product) => onView?.(product)}
      className="products-table"
    />
  );
};

export default ProductsTable;