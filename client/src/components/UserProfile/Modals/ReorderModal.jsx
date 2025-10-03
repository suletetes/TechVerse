import React, { useState, useEffect } from 'react';

const ReorderModal = ({ onClose, order, onReorder }) => {
    const [orderItems, setOrderItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Mock fetching order items (in real app, this would be an API call)
        const fetchOrderItems = async () => {
            setLoading(true);
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const mockItems = [
                { 
                    id: 1, 
                    name: 'Tablet Air', 
                    price: 1999, 
                    quantity: 1, 
                    image: 'img/tablet-product.jpg', 
                    available: true,
                    currentPrice: 1999,
                    priceChanged: false
                },
                { 
                    id: 2, 
                    name: 'Tablet Case', 
                    price: 49.99, 
                    quantity: 1, 
                    image: 'img/case-product.jpg', 
                    available: true,
                    currentPrice: 39.99,
                    priceChanged: true
                },
                { 
                    id: 3, 
                    name: 'Screen Protector', 
                    price: 19.99, 
                    quantity: 2, 
                    image: 'img/protector-product.jpg', 
                    available: false,
                    currentPrice: 19.99,
                    priceChanged: false
                }
            ];

            setOrderItems(mockItems);
            
            // Pre-select available items
            const initialSelection = {};
            mockItems.forEach(item => {
                if (item.available) {
                    initialSelection[item.id] = {
                        selected: true,
                        quantity: item.quantity
                    };
                }
            });
            setSelectedItems(initialSelection);
            setLoading(false);
        };

        fetchOrderItems();
    }, [order]);

    const handleItemToggle = (itemId) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                selected: !prev[itemId]?.selected
            }
        }));
    };

    const handleQuantityChange = (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                quantity: newQuantity
            }
        }));
    };

    const getSelectedItems = () => {
        return orderItems.filter(item => selectedItems[item.id]?.selected);
    };

    const getTotalAmount = () => {
        return getSelectedItems().reduce((sum, item) => {
            const quantity = selectedItems[item.id]?.quantity || 0;
            return sum + (item.currentPrice * quantity);
        }, 0);
    };

    const handleReorder = async () => {
        const selected = getSelectedItems();
        if (selected.length === 0) {
            alert('Please select at least one item to reorder.');
            return;
        }

        setProcessing(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const totalItems = selected.reduce((sum, item) => sum + (selectedItems[item.id]?.quantity || 0), 0);
            onReorder(selected, selectedItems);
            
            alert(`✅ Successfully added ${totalItems} item${totalItems > 1 ? 's' : ''} to your cart!`);
            onClose();
        } catch (error) {
            alert('Sorry, there was an error processing your reorder. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-0 pb-0">
                        <div>
                            <h5 className="modal-title fw-bold">Reorder Items</h5>
                            <p className="text-muted mb-0">From Order #{order.id}</p>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-3 text-muted">Loading order items...</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <h6 className="fw-bold mb-3">Select items to reorder:</h6>
                                    <div className="reorder-items">
                                        {orderItems.map(item => (
                                            <div key={item.id} className={`reorder-item border rounded p-3 mb-3 ${!item.available ? 'opacity-50' : ''}`}>
                                                <div className="row align-items-center">
                                                    <div className="col-auto">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`item-${item.id}`}
                                                                checked={selectedItems[item.id]?.selected || false}
                                                                onChange={() => handleItemToggle(item.id)}
                                                                disabled={!item.available}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-auto">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="rounded"
                                                            width="60"
                                                            height="60"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div className="col">
                                                        <h6 className="mb-1">{item.name}</h6>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fw-bold text-success">£{item.currentPrice.toFixed(2)}</span>
                                                            {item.priceChanged && (
                                                                <>
                                                                    <span className="text-decoration-line-through text-muted small">£{item.price.toFixed(2)}</span>
                                                                    <span className="badge bg-success small">Price Drop!</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {!item.available && (
                                                            <span className="badge bg-danger small mt-1">Out of Stock</span>
                                                        )}
                                                    </div>
                                                    <div className="col-auto">
                                                        {item.available && selectedItems[item.id]?.selected && (
                                                            <div className="quantity-controls d-flex align-items-center">
                                                                <button
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    onClick={() => handleQuantityChange(item.id, (selectedItems[item.id]?.quantity || 1) - 1)}
                                                                    disabled={selectedItems[item.id]?.quantity <= 1}
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="mx-2 fw-bold">{selectedItems[item.id]?.quantity || 1}</span>
                                                                <button
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    onClick={() => handleQuantityChange(item.id, (selectedItems[item.id]?.quantity || 1) + 1)}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {getSelectedItems().length > 0 && (
                                    <div className="reorder-summary bg-light rounded p-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 className="mb-1">Order Summary</h6>
                                                <p className="text-muted small mb-0">
                                                    {getSelectedItems().reduce((sum, item) => sum + (selectedItems[item.id]?.quantity || 0), 0)} items selected
                                                </p>
                                            </div>
                                            <div className="text-end">
                                                <h5 className="mb-0 fw-bold text-success">£{getTotalAmount().toFixed(2)}</h5>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="modal-footer border-0 pt-0">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleReorder}
                            disabled={loading || processing || getSelectedItems().length === 0}
                        >
                            {processing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Adding to Cart...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    Add to Cart (£{getTotalAmount().toFixed(2)})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReorderModal;