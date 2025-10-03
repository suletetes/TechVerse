import React from 'react';

const AddressesTab = ({ addresses, handleAddressAction }) => {
    return (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Saved Addresses</h3>
                <button 
                    className="btn btn-c-2101 btn-rd"
                    onClick={() => handleAddressAction(null, 'add')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add New Address
                </button>
            </div>

            <div className="row">
                {addresses.map((address) => (
                    <div key={address.id} className="col-md-6 mb-4">
                        <div className="border rounded p-3 h-100">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h6 className="tc-6533 mb-1">{address.type}</h6>
                                    {address.isDefault && (
                                        <span className="badge bg-primary">Default</span>
                                    )}
                                </div>
                                <div className="dropdown">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                    >
                                        ⋮
                                    </button>
                                    <ul className="dropdown-menu">
                                        <li>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleAddressAction(address.id, 'edit')}
                                            >
                                                Edit
                                            </button>
                                        </li>
                                        {!address.isDefault && (
                                            <li>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => handleAddressAction(address.id, 'setDefault')}
                                                >
                                                    Set as Default
                                                </button>
                                            </li>
                                        )}
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button
                                                className="dropdown-item text-danger"
                                                onClick={() => handleAddressAction(address.id, 'delete')}
                                            >
                                                Delete
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 bold-text">{address.name}</p>
                                <p className="mb-1">{address.address}</p>
                                <p className="mb-1">{address.city}</p>
                                <p className="mb-1">{address.postcode}</p>
                                <p className="mb-0">{address.country}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AddressesTab;