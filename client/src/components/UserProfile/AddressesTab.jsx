import React, { useEffect } from 'react';
import { useUserProfile } from '../../context/UserProfileContext';

const AddressesTab = ({ handleAddressAction }) => {
    const { addresses, loading, error, loadAddresses } = useUserProfile();

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);
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

            {loading && (
                <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading addresses...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {!loading && !error && addresses.length === 0 && (
                <div className="text-center py-5">
                    <svg width="64" height="64" viewBox="0 0 24 24" className="text-muted mb-3">
                        <path fill="currentColor" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
                    </svg>
                    <h5 className="text-muted">No Addresses Found</h5>
                    <p className="text-muted mb-4">You haven't added any addresses yet.</p>
                </div>
            )}

            <div className="row">
                {!loading && addresses.map((address) => (
                    <div key={address._id} className="col-md-6 mb-4">
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
                                                onClick={() => handleAddressAction(address._id, 'edit')}
                                            >
                                                Edit
                                            </button>
                                        </li>
                                        {!address.isDefault && (
                                            <li>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => handleAddressAction(address._id, 'setDefault')}
                                                >
                                                    Set as Default
                                                </button>
                                            </li>
                                        )}
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button
                                                className="dropdown-item text-danger"
                                                onClick={() => handleAddressAction(address._id, 'delete')}
                                            >
                                                Delete
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 bold-text">{address.firstName} {address.lastName}</p>
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