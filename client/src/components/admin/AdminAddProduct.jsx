import React from 'react';

const AdminAddProduct = ({ newProduct, setNewProduct, handleProductInputChange, handleProductImageChange, handleAddProduct, setActiveTab }) => (
    <div className="container-fluid px-0">
        {/* Hero Header */}
        <div className="row g-0 mb-4">
            <div className="col-12">
                <div className="position-relative overflow-hidden rounded-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className="position-absolute top-0 end-0 opacity-10">
                        <svg width="200" height="200" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </div>
                    <div className="p-5 text-white position-relative">
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                                <div className="bg-white bg-opacity-20 rounded-4 p-4 me-4 backdrop-blur">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="mb-2 fw-bold display-6">Create New Product</h1>
                                    <p className="mb-0 opacity-90 fs-5">Build your inventory with amazing products</p>
                                </div>
                            </div>
                            <button
                                className="btn btn-light btn-lg rounded-3 shadow-sm"
                                onClick={() => setActiveTab('products')}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                    <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                </svg>
                                Back to Products
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <form onSubmit={handleAddProduct}>
            <div className="row g-4">
                {/* Product Image Section */}
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                        <div className="card-header bg-gradient text-white border-0 p-4" style={{ background: 'linear-gradient(45deg, #28a745, #20c997)' }}>
                            <div className="d-flex align-items-center">
                                <div className="bg-white bg-opacity-20 rounded-3 p-2 me-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                    </svg>
                                </div>
                                <h4 className="mb-0 fw-bold">Product Gallery</h4>
                            </div>
                        </div>
                        <div className="card-body p-4 text-center">
                            {newProduct.image ? (
                                <div className="position-relative mb-4">
                                    <img
                                        src={newProduct.image}
                                        alt="Product preview"
                                        className="img-fluid rounded-4 shadow-lg border"
                                        style={{ maxHeight: '350px', width: '100%', objectFit: 'cover' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-danger position-absolute top-0 end-0 m-3 rounded-circle shadow-lg"
                                        onClick={() => setNewProduct(prev => ({ ...prev, image: null }))}
                                        style={{ width: '44px', height: '44px' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                            <path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                        </svg>
                                    </button>
                                    <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-3 rounded-bottom-4">
                                        <small className="fw-medium">✓ Image uploaded successfully</small>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-3 border-dashed rounded-4 p-5 mb-4 bg-light position-relative" style={{ borderColor: '#dee2e6', minHeight: '350px' }}>
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                        <div className="bg-primary bg-opacity-10 rounded-circle p-4 mb-4">
                                            <svg width="48" height="48" viewBox="0 0 24 24" className="text-primary">
                                                <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                            </svg>
                                        </div>
                                        <h5 className="text-muted mb-3 fw-bold">Upload Product Image</h5>
                                        <p className="text-muted mb-4">Drag and drop your image here or click to browse</p>
                                        <div className="d-flex gap-2 text-muted small">
                                            <span className="badge bg-light text-dark">JPG</span>
                                            <span className="badge bg-light text-dark">PNG</span>
                                            <span className="badge bg-light text-dark">GIF</span>
                                            <span className="badge bg-light text-dark">Max 5MB</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <label className="btn btn-primary btn-lg w-100 rounded-3 shadow-sm">
                                <svg width="20" height="20" viewBox="0 0 24 24" className="me-2">
                                    <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                                </svg>
                                {newProduct.image ? 'Change Image' : 'Choose Image'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProductImageChange}
                                    className="d-none"
                                />
                            </label>
                        </div>
                    </div>
                </div>
                {/* Product Details Section */}
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                        <div className="card-header bg-gradient text-white border-0 p-4" style={{ background: 'linear-gradient(45deg, #007bff, #6610f2)' }}>
                            <div className="d-flex align-items-center">
                                <div className="bg-white bg-opacity-20 rounded-3 p-2 me-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                                    </svg>
                                </div>
                                <h4 className="mb-0 fw-bold">Product Information</h4>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-dark mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-primary">
                                            <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control form-control-lg rounded-3 border-2"
                                        value={newProduct.name}
                                        onChange={handleProductInputChange}
                                        placeholder="Enter product name"
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-dark mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-primary">
                                            <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        Category *
                                    </label>
                                    <select
                                        name="category"
                                        className="form-select form-select-lg rounded-3 border-2"
                                        value={newProduct.category}
                                        onChange={handleProductInputChange}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        <option value="phones">📱 Phones</option>
                                        <option value="tablets">📱 Tablets</option>
                                        <option value="laptops">💻 Laptops</option>
                                        <option value="accessories">🎧 Accessories</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-dark mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-success">
                                            <path fill="currentColor" d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                                        </svg>
                                        Price (£) *
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-success text-white border-2 border-success fw-bold">£</span>
                                        <input
                                            type="number"
                                            name="price"
                                            className="form-control border-2 border-start-0"
                                            value={newProduct.price}
                                            onChange={handleProductInputChange}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-dark mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-warning">
                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                        Stock Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        name="stock"
                                        className="form-control form-control-lg rounded-3 border-2"
                                        value={newProduct.stock}
                                        onChange={handleProductInputChange}
                                        placeholder="0"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold text-dark mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2 text-info">
                                            <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                                        </svg>
                                        Product Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        className="form-control rounded-3 border-2"
                                        rows="5"
                                        value={newProduct.description}
                                        onChange={handleProductInputChange}
                                        placeholder="Enter detailed product description, features, specifications..."
                                        required
                                        style={{ resize: 'vertical' }}
                                    ></textarea>
                                    <div className="d-flex justify-content-between mt-2">
                                        <small className="text-muted">💡 Provide detailed information about the product</small>
                                        <small className={`fw-medium ${newProduct.description.length > 450 ? 'text-warning' : newProduct.description.length > 0 ? 'text-success' : 'text-muted'}`}>{newProduct.description.length}/500 characters</small>
                                    </div>
                                </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="d-flex gap-3 pt-4 mt-4 border-top">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-lg px-4 rounded-3"
                                    onClick={() => {
                                        setNewProduct({
                                            name: '',
                                            category: '',
                                            price: '',
                                            stock: '',
                                            description: '',
                                            image: null
                                        });
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                    Clear Form
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-success btn-lg px-5 flex-grow-1 rounded-3 shadow-sm"
                                    disabled={
                                        !newProduct.name ||
                                        !newProduct.category ||
                                        !newProduct.price ||
                                        !newProduct.stock ||
                                        !newProduct.description
                                    }
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="white">
                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                    </svg>
                                    Create Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
);

export default AdminAddProduct;
