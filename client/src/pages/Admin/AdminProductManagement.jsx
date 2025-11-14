import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminProducts, AdminAddProduct } from '../../components/Admin';
import { adminService } from '../../api/services/index.js';
import { adminDataStore } from '../../utils/AdminDataStore';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';

const AdminProductManagement = () => {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const { categories: adminCategories } = useAdmin();
    const [activeTab, setActiveTab] = useState('products');
    const [editingProductId, setEditingProductId] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load products and categories
    useEffect(() => {
        loadProducts();
        
        if (adminCategories && adminCategories.length > 0) {
            setAllCategories(adminCategories);
        } else {
            loadCategories();
        }
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await adminService.getAdminProducts({ limit: 1000 });
            
            let backendProducts = [];
            if (response?.data?.products) {
                backendProducts = response.data.products;
            } else if (response?.products) {
                backendProducts = response.products;
            } else if (response?.data && Array.isArray(response.data)) {
                backendProducts = response.data;
            } else if (Array.isArray(response)) {
                backendProducts = response;
            }
            
            setAllProducts(backendProducts);
            setLoading(false);
        } catch (err) {
            console.error('❌ Error loading products:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await adminService.getCategories();
            const categories = response?.data || response || [];
            setAllCategories(categories);
        } catch (err) {
            console.error('❌ Error loading categories:', err);
        }
    };

    const handleSetActiveTab = (tab, productId = null) => {
        console.log('🔄 Switching tab to:', tab, 'Product ID:', productId);
        setActiveTab(tab);
        if (productId) {
            setEditingProductId(productId);
        }
    };

    const handleUpdateProduct = async (productId, updatedData) => {
        try {
            await adminService.updateProduct(productId, updatedData);
            await loadProducts(); // Reload products
        } catch (err) {
            console.error('Error updating product:', err);
            throw err;
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            await adminService.deleteProduct(productId);
            await loadProducts(); // Reload products
        } catch (err) {
            console.error('Error deleting product:', err);
            throw err;
        }
    };

    const handleDuplicateProduct = async (product) => {
        try {
            const duplicatedProduct = {
                ...product,
                name: `${product.name} (Copy)`,
                slug: `${product.slug}-copy-${Date.now()}`,
                _id: undefined,
                id: undefined
            };
            await adminService.createProduct(duplicatedProduct);
            await loadProducts(); // Reload products
        } catch (err) {
            console.error('Error duplicating product:', err);
            throw err;
        }
    };

    const handleSaveProduct = async (productData) => {
        try {
            if (editingProductId) {
                await adminService.updateProduct(editingProductId, productData);
            } else {
                await adminService.createProduct(productData);
            }
            await loadProducts();
            setActiveTab('products');
            setEditingProductId(null);
        } catch (err) {
            console.error('Error saving product:', err);
            throw err;
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            active: 'success',
            inactive: 'secondary',
            draft: 'warning',
            'out-of-stock': 'danger'
        };
        return statusColors[status] || 'secondary';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const editProduct = editingProductId ? allProducts.find(p => (p.id || p._id) === editingProductId) : null;

    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid p-4">
                {/* Page Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="h3 mb-1">Product Management</h1>
                                <p className="text-muted mb-0">Manage your product catalog and inventory</p>
                            </div>
                            <div className="d-flex gap-2">
                                <Link to="/admin" className="btn btn-outline-secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                                        <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                    Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Component */}
                {activeTab === 'products' && (
                    <AdminProducts
                        products={allProducts}
                        categories={allCategories}
                        setActiveTab={handleSetActiveTab}
                        getStatusColor={getStatusColor}
                        formatCurrency={formatCurrency}
                        onUpdateProduct={handleUpdateProduct}
                        onDeleteProduct={handleDeleteProduct}
                        onDuplicateProduct={handleDuplicateProduct}
                        isLoading={loading}
                        error={error}
                    />
                )}

                {/* Add/Edit Product Form */}
                {(activeTab === 'add-product' || activeTab === 'edit-product') && (
                    <AdminAddProduct
                        editProduct={editProduct}
                        categories={allCategories}
                        onSave={handleSaveProduct}
                        onCancel={() => {
                            setActiveTab('products');
                            setEditingProductId(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminProductManagement;