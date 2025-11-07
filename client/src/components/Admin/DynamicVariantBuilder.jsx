import React, { useState } from 'react';

/**
 * Dynamic Variant Builder Component
 * Allows admin to create custom product variants (RAM, Storage, Color, etc.)
 * with custom prices and stock levels
 */
const DynamicVariantBuilder = ({ variants = [], onChange }) => {
    const [expandedVariant, setExpandedVariant] = useState(null);

    // Add new variant type
    const addVariantType = () => {
        const newVariant = {
            id: `variant-${Date.now()}`,
            name: '',
            options: []
        };
        onChange([...variants, newVariant]);
        setExpandedVariant(newVariant.id);
    };

    // Update variant name
    const updateVariantName = (variantId, name) => {
        const updated = variants.map(v =>
            v.id === variantId ? { ...v, name } : v
        );
        onChange(updated);
    };

    // Add option to variant
    const addOption = (variantId) => {
        const updated = variants.map(v => {
            if (v.id === variantId) {
                return {
                    ...v,
                    options: [
                        ...v.options,
                        {
                            id: `option-${Date.now()}`,
                            value: '',
                            priceModifier: 0,
                            stock: 0
                        }
                    ]
                };
            }
            return v;
        });
        onChange(updated);
    };

    // Update option
    const updateOption = (variantId, optionId, field, value) => {
        const updated = variants.map(v => {
            if (v.id === variantId) {
                return {
                    ...v,
                    options: v.options.map(opt =>
                        opt.id === optionId
                            ? { ...opt, [field]: field === 'priceModifier' || field === 'stock' ? parseFloat(value) || 0 : value }
                            : opt
                    )
                };
            }
            return v;
        });
        onChange(updated);
    };

    // Remove option
    const removeOption = (variantId, optionId) => {
        const updated = variants.map(v => {
            if (v.id === variantId) {
                return {
                    ...v,
                    options: v.options.filter(opt => opt.id !== optionId)
                };
            }
            return v;
        });
        onChange(updated);
    };

    // Remove variant type
    const removeVariant = (variantId) => {
        onChange(variants.filter(v => v.id !== variantId));
    };

    return (
        <div className="dynamic-variant-builder">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h5 className="mb-1">Product Variants</h5>
                    <p className="text-muted small mb-0">
                        Add custom variants like RAM, Storage, Color, Size, etc. with individual pricing and stock
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={addVariantType}
                >
                    <i className="fas fa-plus me-1"></i>
                    Add Variant Type
                </button>
            </div>

            {variants.length === 0 && (
                <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    No variants added yet. Click "Add Variant Type" to create variants like RAM, Storage, Color, etc.
                </div>
            )}

            {variants.map((variant, variantIndex) => (
                <div key={variant.id} className="card mb-3">
                    <div className="card-header bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="flex-grow-1 me-3">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Variant Type (e.g., RAM, Storage, Color)"
                                    value={variant.name}
                                    onChange={(e) => updateVariantName(variant.id, e.target.value)}
                                />
                            </div>
                            <div className="btn-group btn-group-sm">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setExpandedVariant(expandedVariant === variant.id ? null : variant.id)}
                                >
                                    <i className={`fas fa-chevron-${expandedVariant === variant.id ? 'up' : 'down'}`}></i>
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() => removeVariant(variant.id)}
                                    title="Remove variant type"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {expandedVariant === variant.id && (
                        <div className="card-body">
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label mb-0">Options</label>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => addOption(variant.id)}
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Add Option
                                    </button>
                                </div>

                                {variant.options.length === 0 && (
                                    <div className="alert alert-warning small mb-0">
                                        No options added. Click "Add Option" to add values for this variant.
                                    </div>
                                )}

                                {variant.options.map((option, optionIndex) => (
                                    <div key={option.id} className="row g-2 mb-2 align-items-center">
                                        <div className="col-md-4">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Value (e.g., 8GB, Blue)"
                                                value={option.value}
                                                onChange={(e) => updateOption(variant.id, option.id, 'value', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text">$</span>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="Price +"
                                                    value={option.priceModifier}
                                                    onChange={(e) => updateOption(variant.id, option.id, 'priceModifier', e.target.value)}
                                                    step="0.01"
                                                />
                                            </div>
                                            <small className="text-muted">Price modifier</small>
                                        </div>
                                        <div className="col-md-3">
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Stock"
                                                value={option.stock}
                                                onChange={(e) => updateOption(variant.id, option.id, 'stock', e.target.value)}
                                                min="0"
                                            />
                                            <small className="text-muted">Stock qty</small>
                                        </div>
                                        <div className="col-md-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger w-100"
                                                onClick={() => removeOption(variant.id, option.id)}
                                                title="Remove option"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {variant.options.length > 0 && (
                                <div className="alert alert-info small mb-0">
                                    <i className="fas fa-info-circle me-1"></i>
                                    <strong>{variant.options.length}</strong> option(s) added. 
                                    Price modifiers will be added to the base product price.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {variants.length > 0 && (
                <div className="alert alert-success">
                    <i className="fas fa-check-circle me-2"></i>
                    <strong>{variants.length}</strong> variant type(s) configured with{' '}
                    <strong>{variants.reduce((sum, v) => sum + v.options.length, 0)}</strong> total options
                </div>
            )}
        </div>
    );
};

export default DynamicVariantBuilder;
