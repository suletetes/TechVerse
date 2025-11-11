import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const StripeCheckoutForm = ({ amount, currency = 'usd', onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message);
      setIsProcessing(false);
      if (onError) onError(error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment successful!');
      setIsProcessing(false);
      if (onSuccess) onSuccess(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-checkout-form">
      <div className="mb-4">
        <PaymentElement />
      </div>

      {/* Order Total */}
      <div className="payment-summary mb-4 p-3 bg-light rounded">
        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold">Total Amount:</span>
          <span className="fw-bold text-primary fs-5">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency.toUpperCase(),
            }).format(amount)}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="btn btn-primary btn-lg w-100"
      >
        {isProcessing ? (
          <div className="d-flex align-items-center justify-content-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Processing...</span>
            </div>
            Processing Payment...
          </div>
        ) : (
          `Pay ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
          }).format(amount)}`
        )}
      </button>

      {/* Error/Success Message */}
      {message && (
        <div
          className={`alert mt-3 ${
            message.includes('successful') ? 'alert-success' : 'alert-danger'
          }`}
          role="alert"
        >
          {message}
        </div>
      )}

      {/* Security Badge */}
      <div className="text-center mt-3">
        <small className="text-muted d-flex align-items-center justify-content-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="me-2">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
          </svg>
          Secured by Stripe
        </small>
      </div>
    </form>
  );
};

export default StripeCheckoutForm;
