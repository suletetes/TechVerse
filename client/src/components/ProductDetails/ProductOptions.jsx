import React from 'react';

const ProductOptions = ({
    colorOptions,
    storageOptions,
    selectedColor,
    selectedStorage,
    onColorChange,
    onStorageChange
}) => {
    return (
        <>
            {/* Colour Options */}
            <h5 className="tc-6533 mb-3">Colour</h5>
            <div className="blocs-grid-container mb-4 colour-option-grid">
                {colorOptions.map((color) => (
                    <div
                        key={color.id}
                        className={`text-lg-start model-option ${selectedColor === color.id ? 'primary-outline' : ''}`}
                        onClick={() => onColorChange(color.id)}
                        style={{cursor: 'pointer'}}
                    >
                        <p className="mb-0">
                            <span className={`color-dot ${color.class}`}>•</span> {color.name}
                        </p>
                    </div>
                ))}
            </div>

            <div className="divider-h"></div>

            {/* Storage Options */}
            <h5 className="tc-6533 mb-3">Storage</h5>
            <ul className="list-unstyled list-sp-lg">
                {storageOptions.map((storage) => (
                    <li key={storage.id}>
                        <div
                            className={`text-lg-start model-option ${selectedStorage === storage.id ? 'primary-outline' : ''}`}
                            onClick={() => onStorageChange(storage.id)}
                            style={{cursor: 'pointer'}}
                        >
                            <p className="mb-0 float-lg-none">
                                {storage.name}{" "}
                                <span
                                    className={`price-right token ${selectedStorage === storage.id ? 'primary-gradient-bg' : ''}`}>
                                    £{storage.price}
                                </span>
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
};

export default ProductOptions;