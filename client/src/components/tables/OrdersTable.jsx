import React, { useMemo } from 'react';
import DataTable from './DataTable';

const OrdersTable = ({ 
  orders, 
  onView, 
  onEdit, 
  onPrintInvoice,
  onSendEmail,
  onMarkAsShipped,
  onPrintLabel,
  enableSelection = false 
}) => {
  const formatCurrency = (amount) => `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: ({ getValue }) => (
        <span className="fw-semibold text-primary">{getValue()}</span>
      ),
      size: 150,
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div>
            <div className="fw-semibold">{order.customer}</div>
            <small className="text-muted">{order.email}</small>
          </div>
        );
      },
      size: 200,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-GB'),
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const badgeClass = {
          'Processing': 'bg-warning',
          'Shipped': 'bg-info',
          'Delivered': 'bg-success',
          'Cancelled': 'bg-danger',
          'Pending': 'bg-secondary'
        }[status] || 'bg-secondary';
        
        return (
          <span className={`badge ${badgeClass}`}>
            {status}
          </span>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ getValue }) => (
        <span className="fw-semibold">{getValue()}</span>
      ),
      size: 80,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => (
        <span className="fw-semibold">{formatCurrency(getValue())}</span>
      ),
      size: 120,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="btn-group btn-group-sm" role="group">
            <button 
              className="btn btn-outline-primary" 
              title="View Details"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(order);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
              </svg>
            </button>
            <button 
              className="btn btn-outline-secondary" 
              title="Edit Order"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(order);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
              </svg>
            </button>
            <button 
              className="btn btn-outline-info" 
              title="Print Invoice"
              onClick={(e) => {
                e.stopPropagation();
                onPrintInvoice?.(order);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </button>
          </div>
        );
      },
      size: 150,
    },
  ], [onView, onEdit, onPrintInvoice, formatCurrency]);

  // Render expanded row content
  const renderSubComponent = ({ row }) => {
    const order = row.original;
    return (
      <div className="row">
        <div className="col-md-6">
          <h6 className="fw-bold mb-3">Order Details</h6>
          <div className="mb-2">
            <strong>Payment Method:</strong> {order.paymentMethod}
          </div>
          <div className="mb-2">
            <strong>Shipping Address:</strong><br />
            {order.shippingAddress}
          </div>
        </div>
        <div className="col-md-6">
          <h6 className="fw-bold mb-3">Quick Actions</h6>
          <div className="d-flex gap-2 flex-wrap">
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => onSendEmail?.(order)}
            >
              Send Email
            </button>
            {order.status === 'Processing' && (
              <button 
                className="btn btn-sm btn-outline-success"
                onClick={() => onMarkAsShipped?.(order)}
              >
                Mark as Shipped
              </button>
            )}
            <button 
              className="btn btn-sm btn-outline-info"
              onClick={() => onPrintLabel?.(order)}
            >
              Print Label
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      data={orders}
      columns={columns}
      enableSorting={true}
      enableFiltering={true}
      enablePagination={true}
      enableExpanding={true}
      enableSelection={enableSelection}
      pageSize={10}
      searchPlaceholder="Search orders by ID, customer, or email..."
      emptyMessage="No orders found"
      renderSubComponent={renderSubComponent}
      onRowClick={(order) => onView?.(order)}
      className="orders-table"
    />
  );
};

export default OrdersTable;