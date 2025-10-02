import React from 'react';

const AddressesTab = ({ addresses, handleAddressAction }) => {
    return (
        <div className="store-card fill-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="tc-6533 bold-text mb-0">Saved Addresses</h3>
                <button className="btn btn-c-2101 btn-rd">
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