import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const StripeProvider = ({ children, clientSecret }) => {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    // Load Stripe dynamically to ensure env vars are loaded
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    setStripePromise(loadStripe(stripeKey));
  }, []);

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
      },
    },
  };

  if (!stripePromise) {
    return <div>Loading payment form...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
