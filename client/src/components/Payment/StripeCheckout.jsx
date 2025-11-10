import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const StripeCheckout = ({ 
  clientSecret, 
  onSuccess, 
  onError, 
  amount, 
  currency = 'gbp',
  returnUrl 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Payment succeeded!');
          if (onSuccess) onSuccess(paymentIntent);
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          break;
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, [stripe, clientSecret, onSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: returnUrl || `${window.location.origin}/order-confirmation`,
      },
      redirect: 'if_required'
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message);
      } else {
        setMessage('An unexpected error occurred.');
      }
      
      if (onError) onError(error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment succeeded!');
      if (onSuccess) onSuccess(paymentIntent);
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: 'tabs'
  };

  return (
    <div className="stripe-checkout">
      <form id="payment-form" onSubmit={handleSubmit}>
        <div className="mb-4">
          <PaymentElement id="payment-element" options={paymentElementOptions} />
        </div>
        
        {/* Order Summary */}
        <div className="payment-summary mb-4 p-3 bg-light rounded">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold">Total:</span>
            <span className="fw-bold text-primary">
              {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: currency.toUpperCase()
              }).format(amount)}
            </span>
          </div>
        </div>

        <button 
          disabled={isLoading || !stripe || !elements} 
          id="submit"
          className="btn btn-primary btn-lg w-100"
        >
          <span id="button-text">
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Processing...
              </div>
            ) : (
              `Pay ${new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: currency.toUpperCase()
              }).format(amount)}`
            )}
          </span>
        </button>
        
        {/* Show any error or success messages */}
        {message && (
          <div className={`alert mt-3 ${
            message.includes('succeeded') ? 'alert-success' : 'alert-danger'
          }`} role="alert">
            {message}
          </div>
        )}
      </form>
      
      {/* Security Notice */}
      <div className="text-center mt-3">
        <small className="text-muted d-flex align-items-center justify-content-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="me-2">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
          </svg>
          Secured by Stripe
        </small>
      </div>
    </div>
  );
};

export default StripeCheckout;
