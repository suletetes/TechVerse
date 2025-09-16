import React from 'react';

const AdminProducts = ({ products, setActiveTab, getStatusColor, formatCurrency }) => (
    <div className="store-card fill-card">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
            <h3 className="tc-6533 bold-text mb-2 mb-sm-0">Product Management</h3>
            <button
                className="btn btn-success btn-rd d-flex align-items-center"
                onClick={() => setActiveTab('add-product')}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" className="me-2" fill="white">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Add New Product
            </button>
        </div>
        <div className="row mb-3">
            <div className="col-md-6">
                <input type="text" className="form-control" placeholder="Search products..." />
            </div>
            <div className="col-md-3">
                <select className="form-select">
                    <option value="">All Categories</option>
                    <option value="phones">Phones</option>
                    <option value="tablets">Tablets</option>
                    <option value="laptops">Laptops</option>
                </select>
            </div>
            <div className="col-md-3">
                <select className="form-select">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                </select>
            </div>
        </div>
        <div className="table-responsive">
            <table className="table table-hover align-middle">
                <thead className="table-light">
                    <tr>
                        <th className="border-0 fw-semibold">Product</th>
                        <th className="border-0 fw-semibold d-none d-md-table-cell">Category</th>
                        <th className="border-0 fw-semibold">Price</th>
                        <th className="border-0 fw-semibold d-none d-lg-table-cell">Stock</th>
                        <th className="border-0 fw-semibold d-none d-xl-table-cell">Sales</th>
                        <th className="border-0 fw-semibold">Status</th>
                        <th className="border-0 fw-semibold text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id} className="border-bottom">
                            <td>
                                <div className="d-flex align-items-center">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="rounded-3 me-3 shadow-sm"
                                        width="60"
                                        height="60"
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <div>
                                        <h6 className="mb-1 fw-semibold">{product.name}</h6>
                                        <small className="text-muted">ID: {product.id}</small>
                                        <div className="d-block d-md-none">
                                            <small className="text-muted">{product.category}</small>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="d-none d-md-table-cell">
                                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                                    {product.category}
                                </span>
                            </td>
                            <td className="fw-bold tc-6533">{formatCurrency(product.price)}</td>
                            <td className="d-none d-lg-table-cell">
                                <span className={`fw-medium ${product.stock < 10 ? 'text-warning' : product.stock === 0 ? 'text-danger' : 'text-success'}`}>{product.stock}</span>
                            </td>
                            <td className="d-none d-xl-table-cell text-muted">{product.sales}</td>
                            <td>
                                <span className={`badge bg-${getStatusColor(product.status)} bg-opacity-15 text-${getStatusColor(product.status)} border border-${getStatusColor(product.status)} border-opacity-25 px-3 py-2 rounded-pill`}>
                                    {product.status}
                                </span>
                            </td>
                            <td className="text-center">
                                <div className="btn-group btn-group-sm">
                                    <button className="btn btn-outline-primary btn-sm rounded-start">
                                        <svg width="14" height="14" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                        </svg>
                                    </button>
                                    <button className="btn btn-outline-danger btn-sm rounded-end">
                                        <svg width="14" height="14" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default AdminProducts;
