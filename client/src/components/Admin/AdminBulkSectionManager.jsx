import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import adminService from '../../api/services/adminService.js';
import '../../assets/css/admin-bulk-section-manager.css';

const AdminBulkSectionManager = () => {
  const [sectionData, setSectionData] = useState({ sections: [], unassignedProducts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('add');
  const [targetSections, setTargetSections] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [saving, setSaving] = useState(false);

  // Section configuration
  const sectionConfig = {
    latest: { title: 'Latest Products', color: 'primary', maxProducts: 8 },
    topSeller: { title: 'Top Sellers', color: 'success', maxProducts: 9 },
    quickPick: { title: 'Quick Picks', color: 'warning', maxProducts: 9 },
    weeklyDeal: { title: 'Weekly Deals', color: 'danger', maxProducts: 3 },
    featured: { title: 'Featured', color: 'info', maxProducts: 6 }
  };

  // Load section data
  const loadSectionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDragDropSectionData();
      setSectionData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading section data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await adminService.getSectionAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }, []);

  useEffect(() => {
    loadSectionData();
    loadAnalytics();
  }, [loadSectionData, loadAnalytics]);

  // Handle drag and drop
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const sourceSection = sectionData.sections.find(s => s.id === source.droppableId);
    const destSection = sectionData.sections.find(s => s.id === destination.droppableId);

    // Moving within the same section (reordering)
    if (source.droppableId === destination.droppableId) {
      const section = sourceSection;
      const newProducts = Array.from(section.products);
      const [removed] = newProducts.splice(source.index, 1);
      newProducts.splice(destination.index, 0, removed);

      const updatedSections = sectionData.sections.map(s => 
        s.id === section.id ? { ...s, products: newProducts } : s
      );

      setSectionData(prev => ({ ...prev, sections: updatedSections }));

      // Update backend
      try {
        await adminService.updateSectionProductOrder(section.id, newProducts.map(p => p.id));
      } catch (err) {
        console.error('Error updating product order:', err);
        // Revert on error
        loadSectionData();
      }
      return;
    }

    // Moving between sections or from unassigned
    const productId = draggableId;
    let product;

    if (source.droppableId === 'unassigned') {
      product = sectionData.unassignedProducts.find(p => p.id === productId);
    } else {
      product = sourceSection.products.find(p => p.id === productId);
    }

    if (!product) return;

    // Check destination section capacity
    if (destSection && destSection.products.length >= destSection.maxProducts) {
      alert(`${destSection.title} section is at maximum capacity (${destSection.maxProducts} products)`);
      return;
    }

    // Perform bulk assignment
    const assignments = [{
      productIds: [productId],
      sections: destination.droppableId === 'unassigned' ? [] : [destination.droppableId],
      action: destination.droppableId === 'unassigned' ? 'remove' : 'add'
    }];

    // If moving from a section (not unassigned), also remove from source
    if (source.droppableId !== 'unassigned') {
      assignments.push({
        productIds: [productId],
        sections: [source.droppableId],
        action: 'remove'
      });
    }

    try {
      await adminService.bulkAssignProductsToSections(assignments);
      await loadSectionData(); // Reload to get updated state
    } catch (err) {
      console.error('Error moving product:', err);
      alert('Failed to move product: ' + err.message);
    }
  };

  // Handle product selection
  const handleProductSelect = (productId, isSelected) => {
    const newSelected = new Set(selectedProducts);
    if (isSelected) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Handle bulk action
  const handleBulkAction = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select products first');
      return;
    }

    if (targetSections.length === 0) {
      alert('Please select target sections');
      return;
    }

    try {
      setSaving(true);
      const assignments = [{
        productIds: Array.from(selectedProducts),
        sections: targetSections,
        action: bulkAction
      }];

      await adminService.bulkAssignProductsToSections(assignments);
      await loadSectionData();
      
      // Clear selections
      setSelectedProducts(new Set());
      setTargetSections([]);
      
      alert('Bulk action completed successfully');
    } catch (err) {
      console.error('Error performing bulk action:', err);
      alert('Failed to perform bulk action: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Render product card
  const renderProductCard = (product, index, isDragging = false) => (
    <div className={`product-card ${isDragging ? 'dragging' : ''}`}>
      <div className="product-image">
        <img 
          src={product.images?.[0]?.url || '/img/placeholder.jpg'} 
          alt={product.name}
          onError={(e) => { e.target.src = '/img/placeholder.jpg'; }}
        />
        <div className="product-overlay">
          <input
            type="checkbox"
            checked={selectedProducts.has(product.id)}
            onChange={(e) => handleProductSelect(product.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <div className="product-info">
        <h6 className="product-name">{product.name}</h6>
        <div className="product-details">
          <span className="product-price">£{product.price}</span>
          <span className="product-rating">★ {product.rating?.average || 'N/A'}</span>
        </div>
        <div className="product-meta">
          <span className="product-category">{product.category?.name}</span>
          <span className="product-stock">Stock: {product.stock?.quantity || 0}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bulk-section-manager loading">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading section data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bulk-section-manager error">
        <div className="alert alert-danger">
          <h5>Error Loading Data</h5>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={loadSectionData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-section-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">Bulk Section Manager</h3>
            <p className="text-muted mb-0">Drag and drop products between sections or use bulk actions</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-info"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </button>
            <button className="btn btn-outline-primary" onClick={loadSectionData}>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && analytics && (
          <div className="analytics-panel mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Section Performance Analytics</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {analytics.sections.map(section => (
                    <div key={section.section} className="col-md-4 col-lg-2 mb-3">
                      <div className="analytics-card">
                        <h6 className="section-title">{sectionConfig[section.section]?.title}</h6>
                        <div className="metrics">
                          <div className="metric">
                            <span className="label">Products:</span>
                            <span className="value">{section.productCount}</span>
                          </div>
                          <div className="metric">
                            <span className="label">Views:</span>
                            <span className="value">{section.performance.views.totalViews.toLocaleString()}</span>
                          </div>
                          <div className="metric">
                            <span className="label">Orders:</span>
                            <span className="value">{section.performance.orders.totalOrders}</span>
                          </div>
                          <div className="metric">
                            <span className="label">Revenue:</span>
                            <span className="value">£{section.performance.orders.totalRevenue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Panel */}
        <div className="bulk-actions-panel mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Bulk Actions ({selectedProducts.size} products selected)</h5>
            </div>
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Action</label>
                  <select 
                    className="form-select"
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                  >
                    <option value="add">Add to sections</option>
                    <option value="remove">Remove from sections</option>
                    <option value="replace">Replace sections</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Target Sections</label>
                  <div className="section-checkboxes">
                    {Object.entries(sectionConfig).map(([key, config]) => (
                      <div key={key} className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`section-${key}`}
                          checked={targetSections.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTargetSections([...targetSections, key]);
                            } else {
                              setTargetSections(targetSections.filter(s => s !== key));
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor={`section-${key}`}>
                          {config.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={handleBulkAction}
                    disabled={saving || selectedProducts.size === 0 || targetSections.length === 0}
                  >
                    {saving ? 'Processing...' : 'Apply Action'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag and Drop Interface */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="sections-grid">
          {/* Homepage Sections */}
          {sectionData.sections.map(section => (
            <div key={section.id} className="section-column">
              <div className="section-header">
                <h5 className={`text-${sectionConfig[section.id]?.color || 'primary'}`}>
                  {section.title}
                </h5>
                <span className="product-count">
                  {section.products.length}/{section.maxProducts}
                </span>
              </div>
              
              <Droppable droppableId={section.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`section-drop-zone ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  >
                    {section.products.map((product, index) => (
                      <Draggable key={product.id} draggableId={product.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {renderProductCard(product, index, snapshot.isDragging)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {section.products.length === 0 && (
                      <div className="empty-section">
                        <p>Drop products here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}

          {/* Unassigned Products */}
          <div className="section-column unassigned-column">
            <div className="section-header">
              <h5 className="text-secondary">Unassigned Products</h5>
              <span className="product-count">{sectionData.unassignedProducts.length}</span>
            </div>
            
            <Droppable droppableId="unassigned">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`section-drop-zone unassigned-zone ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                >
                  {sectionData.unassignedProducts.map((product, index) => (
                    <Draggable key={product.id} draggableId={product.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          {renderProductCard(product, index, snapshot.isDragging)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {sectionData.unassignedProducts.length === 0 && (
                    <div className="empty-section">
                      <p>No unassigned products</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default AdminBulkSectionManager;