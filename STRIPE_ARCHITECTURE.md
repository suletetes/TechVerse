# Stripe Integration - System Architecture

##  Complete Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STRIPE INTEGRATION                             │
│                         E-Commerce Application                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  PaymentPage.jsx │  ← User Interface
└────────┬─────────┘
         │
         ├─→ StripeProvider.jsx  ← Stripe Context
         │   └─→ Loads Stripe.js
         │   └─→ Configures Elements
         │
         ├─→ StripeCheckout.jsx  ← Payment Form
         │   └─→ PaymentElement (Stripe)
         │   └─→ Handles confirmation
         │
         └─→ stripePaymentService.js  ← API Service
             └─→ createPaymentIntent()
             └─→ processOrder()

┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND LAYER                               │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                           API ROUTES                                  │
├──────────────────────────────────────────────────────────────────────┤
│  POST   /api/payments/create-intent  ← Create payment intent        │
│  GET    /api/payments/intent/:id     ← Get payment intent           │
│  GET    /api/payments/methods        ← Get saved payment methods    │
│  DELETE /api/payments/methods/:id    ← Remove payment method        │
│  POST   /api/payments/refund         ← Create refund (admin)        │
│  POST   /api/payments/webhook        ← Handle Stripe webhooks       │
│  POST   /api/orders                  ← Create order                 │
└──────────────────────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────────────┐
│                         CONTROLLERS                                   │
├──────────────────────────────────────────────────────────────────────┤
│  paymentController.js                                                │
│  ├─→ createPaymentIntent()                                           │
│  ├─→ getPaymentIntent()                                              │
│  ├─→ getPaymentMethods()                                             │
│  ├─→ detachPaymentMethod()                                           │
│  ├─→ createRefund()                                                  │
│  └─→ handleWebhook()                                                 │
│                                                                       │
│  orderController.js                                                  │
│  └─→ createOrder()                                                   │
└──────────────────────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────────────┐
│                          SERVICES                                     │
├──────────────────────────────────────────────────────────────────────┤
│  stripeService.js                                                    │
│  ├─→ getOrCreateCustomer()                                           │
│  ├─→ createPaymentIntent()                                           │
│  ├─→ getPaymentIntent()                                              │
│  ├─→ confirmPaymentIntent()                                          │
│  ├─→ getCustomerPaymentMethods()                                     │
│  ├─→ attachPaymentMethod()                                           │
│  ├─→ detachPaymentMethod()                                           │
│  ├─→ createRefund()                                                  │
│  ├─→ handleWebhookEvent()                                            │
│  └─→ constructWebhookEvent()                                         │
│                                                                       │
│  paymentService.js                                                   │
│  └─→ Additional payment utilities                                    │
└──────────────────────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────────────┐
│                         DATA MODELS                                   │
├──────────────────────────────────────────────────────────────────────┤
│  User Model                                                          │
│  ├─→ stripeCustomerId: String                                        │
│  └─→ (paymentMethods removed)                                        │
│                                                                       │
│  Order Model                                                         │
│  ├─→ payment.paymentIntentId: String                                 │
│  ├─→ payment.status: String                                          │
│  └─→ payment.refunds: Array                                          │
└──────────────────────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                      │
├──────────────────────────────────────────────────────────────────────┤
│  MongoDB                                                             │
│  ├─→ users collection                                                │
│  │   └─→ { stripeCustomerId: "cus_xxx" }                            │
│  └─→ orders collection                                               │
│      └─→ { payment: { paymentIntentId: "pi_xxx" } }                 │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                          STRIPE API                                   │
├──────────────────────────────────────────────────────────────────────┤
│  Customers API                                                       │
│  ├─→ Create customer                                                 │
│  └─→ Retrieve customer                                               │
│                                                                       │
│  Payment Intents API                                                 │
│  ├─→ Create payment intent                                           │
│  ├─→ Retrieve payment intent                                         │
│  ├─→ Confirm payment intent                                          │
│  └─→ Cancel payment intent                                           │
│                                                                       │
│  Payment Methods API                                                 │
│  ├─→ List payment methods                                            │
│  ├─→ Attach payment method                                           │
│  └─→ Detach payment method                                           │
│                                                                       │
│  Refunds API                                                         │
│  └─→ Create refund                                                   │
│                                                                       │
│  Webhooks                                                            │
│  ├─→ payment_intent.succeeded                                        │
│  ├─→ payment_intent.payment_failed                                   │
│  └─→ charge.refunded                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

##  Data Flow Diagrams

### 1. Payment Intent Creation Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Fills shipping info
     ↓
┌──────────────────┐
│  PaymentPage     │
└────┬─────────────┘
     │ 2. Clicks "Proceed to Payment"
     ↓
┌──────────────────────────┐
│ stripePaymentService     │
│ createPaymentIntent()    │
└────┬─────────────────────┘
     │ 3. POST /api/payments/create-intent
     ↓
┌──────────────────────────┐
│ paymentController        │
│ createPaymentIntent()    │
└────┬─────────────────────┘
     │ 4. Calls service
     ↓
┌──────────────────────────┐
│ stripeService            │
│ getOrCreateCustomer()    │
└────┬─────────────────────┘
     │ 5. Check/Create customer
     ↓
┌──────────────────────────┐
│ Stripe API               │
│ customers.create()       │
└────┬─────────────────────┘
     │ 6. Returns customer ID
     ↓
┌──────────────────────────┐
│ User Model               │
│ Save stripeCustomerId    │
└────┬─────────────────────┘
     │ 7. Customer ID saved
     ↓
┌──────────────────────────┐
│ stripeService            │
│ createPaymentIntent()    │
└────┬─────────────────────┘
     │ 8. Create payment intent
     ↓
┌──────────────────────────┐
│ Stripe API               │
│ paymentIntents.create()  │
└────┬─────────────────────┘
     │ 9. Returns clientSecret
     ↓
┌──────────────────────────┐
│ Frontend                 │
│ Shows Stripe Elements    │
└──────────────────────────┘
```

### 2. Payment Confirmation Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Enters card details
     ↓
┌──────────────────┐
│ StripeCheckout   │
│ PaymentElement   │
└────┬─────────────┘
     │ 2. Clicks "Pay"
     ↓
┌──────────────────────────┐
│ Stripe.js                │
│ confirmPayment()         │
└────┬─────────────────────┘
     │ 3. Sends to Stripe
     ↓
┌──────────────────────────┐
│ Stripe Servers           │
│ - Validates card         │
│ - Checks fraud           │
│ - 3D Secure if needed    │
└────┬─────────────────────┘
     │ 4. Payment succeeded
     ↓
┌──────────────────────────┐
│ Frontend                 │
│ handlePaymentSuccess()   │
└────┬─────────────────────┘
     │ 5. POST /api/orders
     ↓
┌──────────────────────────┐
│ orderController          │
│ createOrder()            │
└────┬─────────────────────┘
     │ 6. Verify payment
     ↓
┌──────────────────────────┐
│ stripeService            │
│ getPaymentIntent()       │
└────┬─────────────────────┘
     │ 7. Check status
     ↓
┌──────────────────────────┐
│ Order Model              │
│ Create order             │
│ Save paymentIntentId     │
└────┬─────────────────────┘
     │ 8. Order created
     ↓
┌──────────────────────────┐
│ Frontend                 │
│ Redirect to confirmation │
└──────────────────────────┘
```

### 3. Webhook Flow

```
┌──────────────────────────┐
│ Stripe Servers           │
│ Payment event occurs     │
└────┬─────────────────────┘
     │ 1. Sends webhook
     ↓
┌──────────────────────────┐
│ POST /api/payments/      │
│      webhook             │
└────┬─────────────────────┘
     │ 2. Receives event
     ↓
┌──────────────────────────┐
│ paymentController        │
│ handleWebhook()          │
└────┬─────────────────────┘
     │ 3. Verify signature
     ↓
┌──────────────────────────┐
│ stripeService            │
│ constructWebhookEvent()  │
└────┬─────────────────────┘
     │ 4. Signature valid
     ↓
┌──────────────────────────┐
│ stripeService            │
│ handleWebhookEvent()     │
└────┬─────────────────────┘
     │ 5. Process event
     ↓
┌──────────────────────────┐
│ Order Model              │
│ Update order status      │
└────┬─────────────────────┘
     │ 6. Status updated
     ↓
┌──────────────────────────┐
│ Email Service            │
│ Send confirmation        │
└────┬─────────────────────┘
     │ 7. Email sent
     ↓
┌──────────────────────────┐
│ Response to Stripe       │
│ { received: true }       │
└──────────────────────────┘
```

##  Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
└─────────────────────────────────────────────────────────────┘

Layer 1: Frontend Security
├─→ No card data in state
├─→ Stripe.js handles card input
├─→ HTTPS only
└─→ CSP headers

Layer 2: API Security
├─→ JWT authentication
├─→ Rate limiting
├─→ Input validation
├─→ CORS configuration
└─→ Request sanitization

Layer 3: Payment Security
├─→ Stripe tokenization
├─→ PCI compliance (Stripe)
├─→ 3D Secure
├─→ Fraud detection (Radar)
└─→ Webhook signature verification

Layer 4: Data Security
├─→ No card data stored
├─→ Only Stripe IDs stored
├─→ Encrypted connections
└─→ Secure database

Layer 5: Monitoring
├─→ Payment logs
├─→ Error tracking
├─→ Fraud alerts
└─→ Audit trail
```

## [CHART] Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPONENT HIERARCHY                        │
└─────────────────────────────────────────────────────────────┘

App
└─→ PaymentPage
    ├─→ StripeProvider
    │   └─→ StripeCheckout
    │       └─→ PaymentElement (Stripe)
    │
    ├─→ ShippingForm
    │   ├─→ ContactInfo
    │   └─→ AddressForm
    │
    └─→ OrderSummary
        ├─→ CartItems
        └─→ PricingBreakdown
```

##  Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────┘

users
├─→ _id: ObjectId
├─→ email: String
├─→ firstName: String
├─→ lastName: String
├─→ stripeCustomerId: String  ← NEW
└─→ (paymentMethods removed)  ← REMOVED

orders
├─→ _id: ObjectId
├─→ orderNumber: String
├─→ user: ObjectId → users
├─→ items: Array
├─→ payment: {
│   ├─→ method: String
│   ├─→ status: String
│   ├─→ paymentIntentId: String  ← NEW
│   ├─→ amount: Number
│   └─→ refunds: Array
│   }
├─→ shippingAddress: Object
├─→ status: String
└─→ total: Number
```

## [WEB] Network Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       NETWORK FLOW                           │
└─────────────────────────────────────────────────────────────┘

Browser
  ↕ HTTPS
Frontend (React)
  ↕ REST API
Backend (Node.js)
  ↕ Stripe SDK
Stripe API
  ↕ Webhooks
Backend (Node.js)
  ↕ Mongoose
MongoDB
```

---

**Architecture Version**: 1.0
**Last Updated**: November 10, 2025
**Status**: Production Ready
