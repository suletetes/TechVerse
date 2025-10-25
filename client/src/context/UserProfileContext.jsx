import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { userProfileService } from '../api/services/userProfileService';

// Action types
const PROFILE_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_ADDRESSES: 'SET_ADDRESSES',
    ADD_ADDRESS: 'ADD_ADDRESS',
    UPDATE_ADDRESS: 'UPDATE_ADDRESS',
    DELETE_ADDRESS: 'DELETE_ADDRESS',
    SET_PAYMENT_METHODS: 'SET_PAYMENT_METHODS',
    ADD_PAYMENT_METHOD: 'ADD_PAYMENT_METHOD',
    DELETE_PAYMENT_METHOD: 'DELETE_PAYMENT_METHOD',
    CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
    addresses: [],
    paymentMethods: [],
    loading: false,
    error: null
};

// Reducer
const userProfileReducer = (state, action) => {
    switch (action.type) {
        case PROFILE_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };
        case PROFILE_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false
            };
        case PROFILE_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };
        case PROFILE_ACTIONS.SET_ADDRESSES:
            return {
                ...state,
                addresses: action.payload,
                loading: false,
                error: null
            };
        case PROFILE_ACTIONS.ADD_ADDRESS:
            return {
                ...state,
                addresses: action.payload,
                loading: false,
                error: null
            };
        case PROFILE_ACTIONS.UPDATE_ADDRESS:
            return {
                ...state,
                addresses: action.payload,
                loading: false,
                error: null
            };
        case PROFILE_ACTIONS.DELETE_ADDRESS:
            return {
                ...state,
                addresses: action.payload,
                loading: false,
                error: null
            };
        case PROFILE_ACTIONS.SET_PAYMENT_METHODS:
            return {
                ...state,
                paymentMethods: action.payload,
                loading: false,
                error: null
            };
        case PROFILE_ACTIONS.ADD_PAYMENT_METHOD:
            return {
                ...state,
                loading: false,
                error: null
            };
        case PROFILE_ACTIONS.DELETE_PAYMENT_METHOD:
            return {
                ...state,
                loading: false,
                error: null
            };
        default:
            return state;
    }
};

// Create context
const UserProfileContext = createContext();

// Provider component
export const UserProfileProvider = ({ children }) => {
    const [state, dispatch] = useReducer(userProfileReducer, initialState);

    // Load addresses
    const loadAddresses = useCallback(async () => {
        try {
            dispatch({ type: PROFILE_ACTIONS.SET_LOADING, payload: true });
            const response = await userProfileService.getAddresses();
            const addresses = response.data?.addresses || [];
            dispatch({ 
                type: PROFILE_ACTIONS.SET_ADDRESSES, 
                payload: addresses 
            });
        } catch (error) {
            console.error('Error loading addresses:', error);
            dispatch({ 
                type: PROFILE_ACTIONS.SET_ERROR, 
                payload: error.message || 'Failed to load addresses' 
            });
        }
    }, []);

    // Add address
    const addAddress = useCallback(async (addressData) => {
        try {
            dispatch({ type: PROFILE_ACTIONS.SET_LOADING, payload: true });
            const response = await userProfileService.addAddress(addressData);
            dispatch({ 
                type: PROFILE_ACTIONS.ADD_ADDRESS, 
                payload: response.data?.addresses || [] 
            });
            return response;
        } catch (error) {
            dispatch({ 
                type: PROFILE_ACTIONS.SET_ERROR, 
                payload: error.message || 'Failed to add address' 
            });
            throw error;
        }
    }, []);

    // Update address
    const updateAddress = useCallback(async (addressId, addressData) => {
        try {
            dispatch({ type: PROFILE_ACTIONS.SET_LOADING, payload: true });
            const response = await userProfileService.updateAddress(addressId, addressData);
            dispatch({ 
                type: PROFILE_ACTIONS.UPDATE_ADDRESS, 
                payload: response.data?.addresses || [] 
            });
            return response;
        } catch (error) {
            dispatch({ 
                type: PROFILE_ACTIONS.SET_ERROR, 
                payload: error.message || 'Failed to update address' 
            });
            throw error;
        }
    }, []);

    // Delete address
    const deleteAddress = useCallback(async (addressId) => {
        try {
            dispatch({ type: PROFILE_ACTIONS.SET_LOADING, payload: true });
            const response = await userProfileService.deleteAddress(addressId);
            dispatch({ 
                type: PROFILE_ACTIONS.DELETE_ADDRESS, 
                payload: response.data?.addresses || [] 
            });
            return response;
        } catch (error) {
            dispatch({ 
                type: PROFILE_ACTIONS.SET_ERROR, 
                payload: error.message || 'Failed to delete address' 
            });
            throw error;
        }
    }, []);

    // Load payment methods
    const loadPaymentMethods = useCallback(async () => {
        try {
            dispatch({ type: PROFILE_ACTIONS.SET_LOADING, payload: true });
            const response = await userProfileService.getPaymentMethods();
            dispatch({ 
                type: PROFILE_ACTIONS.SET_PAYMENT_METHODS, 
                payload: response.data?.paymentMethods || [] 
            });
        } catch (error) {
            dispatch({ 
                type: PROFILE_ACTIONS.SET_ERROR, 
                payload: error.message || 'Failed to load payment methods' 
            });
        }
    }, []);

    // Add payment method
    const addPaymentMethod = useCallback(async (paymentMethodData) => {
        try {
            dispatch({ type: PROFILE_ACTIONS.SET_LOADING, payload: true });
            const response = await userProfileService.addPaymentMethod(paymentMethodData);
            dispatch({ type: PROFILE_ACTIONS.ADD_PAYMENT_METHOD });
            // Reload payment methods to get updated list
            await loadPaymentMethods();
            return response;
        } catch (error) {
            dispatch({ 
                type: PROFILE_ACTIONS.SET_ERROR, 
                payload: error.message || 'Failed to add payment method' 
            });
            throw error;
        }
    }, [loadPaymentMethods]);

    // Delete payment method
    const deletePaymentMethod = useCallback(async (methodId) => {
        try {
            dispatch({ type: PROFILE_ACTIONS.SET_LOADING, payload: true });
            const response = await userProfileService.deletePaymentMethod(methodId);
            dispatch({ type: PROFILE_ACTIONS.DELETE_PAYMENT_METHOD });
            // Reload payment methods to get updated list
            await loadPaymentMethods();
            return response;
        } catch (error) {
            dispatch({ 
                type: PROFILE_ACTIONS.SET_ERROR, 
                payload: error.message || 'Failed to delete payment method' 
            });
            throw error;
        }
    }, [loadPaymentMethods]);

    // Clear error
    const clearError = useCallback(() => {
        dispatch({ type: PROFILE_ACTIONS.CLEAR_ERROR });
    }, []);

    const value = {
        // State
        addresses: state.addresses,
        paymentMethods: state.paymentMethods,
        loading: state.loading,
        error: state.error,
        
        // Actions
        loadAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        loadPaymentMethods,
        addPaymentMethod,
        deletePaymentMethod,
        clearError
    };

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
};

// Hook to use the context
export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (!context) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};

export default UserProfileContext;