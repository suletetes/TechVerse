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
            // Get the full product first
            const product = allProducts.find(p => (p._id || p.id) === productId);
            
            if (!product) {
                throw new Error('Product not found');
            }
            
            // Merge with existing product data to pass validation
            const fullUpdate = {
                name: product.name,
                description: product.description || product.shortDescription,
                price: product.price,
                brand: product.brand,
                category: product.category?._id || product.category,
                ...updatedData
            };
            
            await adminService.updateProduct(productId, fullUpdate);
            await loadProducts();
        } catch (err) {
            console.error('Error updating product:', err);
            throw err;
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            await adminService.deleteProduct(productId);
            await loadProducts();
        } catch (err) {
            console.error('Error deleting product:', err);
            throw err;
        }
    };

    const handleDuplicateProduct = async (product) => {
        try {
            // Extract category ID properly
            let categoryId;
            if (product.category) {
                if (typeof product.category === 'object' && product.category._id) {
                    categoryId = product.category._id;
                } else if (typeof product.category === 'string') {
                    categoryId = product.category;
                } else {
                    throw new Error('Invalid category format');
                }
            } else {
                throw new Error('Product must have a category');
            }

            // Ensure we have required fields
            if (!product.name || !product.price || !product.brand) {
                throw new Error('Product missing required fields (name, price, brand)');
            }

            // Clean up the product data for duplication - only include required and valid fields
            const cleanProduct = {
                name: `${product.name} (Copy)`,
                description: product.description || product.shortDescription || `Copy of ${product.name}`,
                price: Number(product.price),
                brand: product.brand,
                category: categoryId
            };

            // Add optional fields only if they exist and are valid
            if (product.shortDescription) {
                cleanProduct.shortDescription = product.shortDescription;
            }

            if (product.comparePrice && Number(product.comparePrice) > 0) {
                cleanProduct.comparePrice = Number(product.comparePrice);
            }

            if (product.cost && Number(product.cost) > 0) {
                cleanProduct.cost = Number(product.cost);
            }

            // Don't copy SKU to avoid conflicts - let backend generate new one
            // Don't copy slug - let backend generate new one

            // Stock information
            if (product.stock) {
                cleanProduct.stock = {
                    quantity: Number(product.stock.quantity) || 0,
                    lowStockThreshold: Number(product.stock.lowStockThreshold) || 10,
                    trackQuantity: product.stock.trackQuantity !== false
                };
            }

            // Arrays - only include if they have items
            if (product.images && product.images.length > 0) {
                cleanProduct.images = product.images;
            }

            if (product.variants && product.variants.length > 0) {
                cleanProduct.variants = product.variants;
            }

            if (product.specifications && product.specifications.length > 0) {
                cleanProduct.specifications = product.specifications;
            }

            if (product.features && product.features.length > 0) {
                cleanProduct.features = product.features;
            }

            if (product.tags && product.tags.length > 0) {
                cleanProduct.tags = product.tags;
            }

            // Other optional fields
            if (product.weight) {
                cleanProduct.weight = product.weight;
            }

            if (product.dimensions) {
                cleanProduct.dimensions = product.dimensions;
            }

            if (product.shipping) {
                cleanProduct.shipping = product.shipping;
            }

            if (product.seo) {
                cleanProduct.seo = product.seo;
            }

            // Set as draft and not featured
            cleanProduct.status = 'draft';
            cleanProduct.visibility = product.visibility || 'public';
            cleanProduct.featured = false;
            
            console.log('📋 Duplicating product with data:', cleanProduct);
            await adminService.createProduct(cleanProduct);
            await loadProducts();
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