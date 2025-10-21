import React from 'react';

const ProductOptions = ({
    product,
    colorOptions,
    storageOptions,
    selectedColor,
    selectedStorage,
    onColorChange,
    onStorageChange
}) => {
    // Handle backend variant structure
    const variants = product?.variants || [];
    
    // Find color and storage variants from backend data
    const colorVariant = variants.find(v => v.name.toLowerCase().includes('color') || v.name.toLowerCase().includes('colour'));
    const storageVariant = variants.find(v => v.name.toLowerCase().includes('storage') || v.name.toLowerCase().includes('memory'));
    
    // Use backend variants if available, otherwise fall back to props
    const colors = colorVariant?.options || colorOptions || [];
    const storages = storageVariant?.options || storageOptions || [];

    // Helper function to get color class for display
    const getColorClass = (colorValue) => {
        const colorMap = {
            'silver': 'color-silver',
            'gold': 'color-gold',
            'black': 'color-black',
            'white': 'color-white',
            'blue': 'color-blue',
            'red': 'color-red',
            'green': 'color-green',
            'pink': 'color-pink',
            'purple': 'color-purple',
            'starlight': 'color-starlight'
        };
        return colorMap[colorValue.toLowerCase()] || 'color-default';
    };

    // Helper function to calculate price with modifier
    const calculatePrice = (basePrice, priceModifier) => {
        return basePrice + (priceModifier || 0);
    };

    if (colors.length === 0 && storages.length === 0) {
        return null; // No variants to display
    }

    return (
        <>
            {/* Color Options */}
            {colors.length > 0 && (
                <>
                    <h5 className="tc-6533 mb-3">
                        {colorVariant?.name || 'Colour'}
                    </h5>
                    <div className="blocs-grid-container mb-4 colour-option-grid">
                        {colors.map((color, index) => {
                            const colorValue = color.value || color.name || color;
                            const colorId = color._id || color.id || colorValue || index;
                            const isSelected = selectedColor === colorId || selectedColor === colorValue;
                            const isOutOfStock = color.stock !== undefined && color.stock <= 0;
                            
                            return (
                                <div
                                    key={colorId}
                                    className={`text-lg-start model-option ${isSelected ? 'primary-outline' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                                    onClick={() => !isOutOfStock && onColorChange(colorId)}
                                    style={{
                                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                        opacity: isOutOfStock ? 0.5 : 1
                                    }}
                                >
                                    <p className="mb-0">
                                        <span className={`color-dot ${getColorClass(colorValue)}`}>•</span> 
                                        {colorValue}
                                        {isOutOfStock && (
                                            <span className="text-muted small ms-1">(Out of Stock)</span>
                                        )}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="divider-h"></div>
                </>
            )}

            {/* Storage Options */}
            {storages.length > 0 && (
                <>
                    <h5 className="tc-6533 mb-3">
                        {storageVariant?.name || 'Storage'}
                    </h5>
                    <ul className="list-unstyled list-sp-lg">
                        {storages.map((storage, index) => {
                            const storageValue = storage.value || storage.name || storage;
                            const storageId = storage._id || storage.id || storageValue || index;
                            const isSelected = selectedStorage === storageId || selectedStorage === storageValue;
                            const isOutOfStock = storage.stock !== undefined && storage.stock <= 0;
                            const priceModifier = storage.priceModifier || 0;
                            const basePrice = product?.price || 0;
                            const totalPrice = calculatePrice(basePrice, priceModifier);
                            
                            return (
                                <li key={storageId}>
                                    <div
                                        className={`text-lg-start model-option ${isSelected ? 'primary-outline' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                                        onClick={() => !isOutOfStock && onStorageChange(storageId)}
                                        style={{
                                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                            opacity: isOutOfStock ? 0.5 : 1
                                        }}
                                    >
                                        <p className="mb-0 float-lg-none d-flex justify-content-between align-items-center">
                                            <span>
                                                {storageValue}
                                                {isOutOfStock && (
                                                    <span className="text-muted small ms-1">(Out of Stock)</span>
                                                )}
                                            </span>
                                            <span className={`price-right token ${isSelected ? 'primary-gradient-bg' : ''}`}>
                                                {priceModifier > 0 ? '+' : ''}£{priceModifier > 0 ? priceModifier.toLocaleString() : totalPrice.toLocaleString()}
                                            </span>
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </>
    );
};

export default ProductOptions;