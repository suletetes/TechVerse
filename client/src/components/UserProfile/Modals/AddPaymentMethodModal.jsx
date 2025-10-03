import React, { useState } from 'react';

const AddPaymentMethodModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        holderName: '',
        isDefault: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let processedValue = value;

        // Format card number with spaces
        if (name === 'cardNumber') {
            processedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
            if (processedValue.length > 19) return; // Max 16 digits + 3 spaces
        }

        // Limit CVV to 4 digits
        if (name === 'cvv') {
            processedValue = value.replace(/\D/g, '').slice(0, 4);
        }

        // Format holder name (capitalize)
        if (name === 'holderName') {
            processedValue = value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : processedValue
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const detectCardBrand = (cardNumber) => {
        const number = cardNumber.replace(/\s/g, '');
        
        if (/^4/.test(number)) return 'visa';
        if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
        if (/^3[47]/.test(number)) return 'amex';
        if (/^6/.test(number)) return 'discover';
        
        return 'unknown';
    };

    const validateCardNumber = (cardNumber) => {
        const number = cardNumber.replace(/\s/g, '');
        
        // Basic length check
        if (number.length < 13 || number.length > 19) {
            return false;
        }

        // Luhn algorithm
        let sum = 0;
        let isEven = false;
        
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number.charAt(i), 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    };

    const validateForm = () => {
        const newErrors = {};

        // Card number validation
        if (!formData.cardNumber.trim()) {
            newErrors.cardNumber = 'Card number is required';
        } else if (!validateCardNumber(formData.cardNumber)) {
            newErrors.cardNumber = 'Please enter a valid card number';
        }

        // Holder name validation
        if (!formData.holderName.trim()) {
            newErrors.holderName = 'Cardholder name is required';
        } else if (formData.holderName.trim().length < 2) {
            newErrors.holderName = 'Please enter a valid name';
        }

        // Expiry validation
        if (!formData.expiryMonth) {
            newErrors.expiryMonth = 'Expiry month is required';
        }

        if (!formData.expiryYear) {
            newErrors.expiryYear = 'Expiry year is required';
        }

        // Check if card is expired
        if (formData.expiryMonth && formData.expiryYear) {
            const currentDate = new Date();
            const expiryDate = new Date(formData.expiryYear, formData.expiryMonth - 1);
            
            if (expiryDate < currentDate) {
                newErrors.expiryMonth = 'Card has expired';
            }
        }

        // CVV validation
        if (!formData.cvv) {
            newErrors.cvv = 'CVV is required';
        } else if (formData.cvv.length < 3) {
            newErrors.cvv = 'CVV must be at least 3 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const cardNumber = formData.cardNumber.replace(/\s/g, '');
            const paymentMethodData = {
                id: Date.now(), // In real app, this would come from API
                type: 'card',
                brand: detectCardBrand(formData.cardNumber),
                last4: cardNumber.slice(-4),
                expiryMonth: parseInt(formData.expiryMonth),
                expiryYear: parseInt(formData.expiryYear),
                holderName: formData.holderName.trim(),
                isDefault: formData.isDefault
            };

            onSave(paymentMethodData);
            onClose();
        } catch (error) {
            console.error('Error saving payment method:', error);
            alert('Failed to save payment method. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const cardBrand = detectCardBrand(formData.cardNumber);

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-0 pb-0">
                        <div>
                            <h5 className="modal-title fw-bold">Add Payment Method</h5>
                            <p className="text-muted mb-0">Add a new card to your account for faster checkout</p>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {/* Security Notice */}
                            <div className="alert alert-info mb-4">
                                <div className="d-flex align-items-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="me-2" fill="currentColor">
                                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                    </svg>
                                    <div>
                                        <small className="mb-0">
                                            <strong>Secure Payment:</strong> Your card details are encrypted and never stored on our servers.
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                {/* Card Number */}
                                <div className="col-12 mb-3">
                                    <label htmlFor="cardNumber" className="form-label fw-bold">Card Number *</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            id="cardNumber"
                                            name="cardNumber"
                                            className={`form-control ${errors.cardNumber ? 'is-invalid' : ''}`}
                                            value={formData.cardNumber}
                                            onChange={handleInputChange}
                                            placeholder="1234 5678 9012 3456"
                                            maxLength="19"
                                        />
                                        <span className="input-group-text">
                                            {cardBrand === 'visa' && <span className="badge bg-primary">VISA</span>}
                                            {cardBrand === 'mastercard' && <span className="badge bg-warning text-dark">MC</span>}
                                            {cardBrand === 'amex' && <span className="badge bg-success">AMEX</span>}
                                            {cardBrand === 'discover' && <span className="badge bg-info">DISC</span>}
                                            {cardBrand === 'unknown' && formData.cardNumber && <span className="text-muted">💳</span>}
                                        </span>
                                    </div>
                                    {errors.cardNumber && <div className="invalid-feedback d-block">{errors.cardNumber}</div>}
                                </div>

                                {/* Cardholder Name */}
                                <div className="col-12 mb-3">
                                    <label htmlFor="holderName" className="form-label fw-bold">Cardholder Name *</label>
                                    <input
                                        type="text"
                                        id="holderName"
                                        name="holderName"
                                        className={`form-control ${errors.holderName ? 'is-invalid' : ''}`}
                                        value={formData.holderName}
                                        onChange={handleInputChange}
                                        placeholder="JOHN SMITH"
                                        maxLength="50"
                                    />
                                    {errors.holderName && <div className="invalid-feedback">{errors.holderName}</div>}
                                </div>

                                {/* Expiry Date */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold">Expiry Date *</label>
                                    <div className="row">
                                        <div className="col-6">
                                            <select
                                                name="expiryMonth"
                                                className={`form-select ${errors.expiryMonth ? 'is-invalid' : ''}`}
                                                value={formData.expiryMonth}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Month</option>
                                                {months.map(month => (
                                                    <option key={month} value={month}>
                                                        {month.toString().padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <select
                                                name="expiryYear"
                                                className={`form-select ${errors.expiryYear ? 'is-invalid' : ''}`}
                                                value={formData.expiryYear}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Year</option>
                                                {years.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {(errors.expiryMonth || errors.expiryYear) && (
                                        <div className="invalid-feedback d-block">
                                            {errors.expiryMonth || errors.expiryYear}
                                        </div>
                                    )}
                                </div>

                                {/* CVV */}
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="cvv" className="form-label fw-bold">CVV *</label>
                                    <input
                                        type="text"
                                        id="cvv"
                                        name="cvv"
                                        className={`form-control ${errors.cvv ? 'is-invalid' : ''}`}
                                        value={formData.cvv}
                                        onChange={handleInputChange}
                                        placeholder="123"
                                        maxLength="4"
                                    />
                                    {errors.cvv && <div className="invalid-feedback">{errors.cvv}</div>}
                                    <small className="text-muted">3-4 digits on the back of your card</small>
                                </div>

                                {/* Default Payment Method */}
                                <div className="col-12">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            name="isDefault"
                                            className="form-check-input"
                                            checked={formData.isDefault}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="isDefault" className="form-check-label">
                                            Set as default payment method
                                        </label>
                                    </div>
                                    <small className="text-muted">
                                        This card will be used as your default payment method for future purchases
                                    </small>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer border-0 pt-0">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Adding Card...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="me-2" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                            <line x1="1" y1="10" x2="23" y2="10" />
                                        </svg>
                                        Add Payment Method
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPaymentMethodModal;