---
inclusion: always
---

# TechVerse Product & Business Rules

## Product Data Structure

### Category System
11 main categories: Phones, Tablets, Computers, TVs, Gaming, Watches, Audio, Cameras, Accessories, Home & Smart Devices, Fitness & Health

### Product Options Pattern
- **First Option**: Always colors (consistent across all categories)
- **Second Option**: Category-specific, price-affecting option:
  - Phones/Tablets/Gaming: Storage (128GB, 256GB, 512GB, 1TB, 2TB)
  - Computers: Configuration (processor/memory/storage combos)
  - TVs: Screen Size (43", 50", 55", 65", 75", 85")
  - Watches: Case Material (Aluminum, Stainless Steel, Titanium, Ceramic)
  - Audio: Model Tier (Standard, Pro, Max, Studio)
  - Cameras: Lens Kit (Body Only, Kit Lens, Pro Lens)
  - Accessories: Type/Material (Silicone, Leather, Clear, MagSafe, Wallet)
  - Home & Smart Devices: Size/Type (Mini, Standard, Pro, Max)
  - Fitness & Health: Size (Small, Medium, Large, XL)

### Product Schema Fields
Reference `canonical-product-schema.json` for complete schema. Key fields:
- **Required**: `_id`, `name`, `price`, `category`, `status`
- **Images**: Support both string URLs and objects with `url`, `webp`, `alt` properties
- **Options**: `colors[]`, `storageOptions[]`, or category-specific option arrays
- **Stock**: Can be number or object with `quantity`, `trackQuantity`, `lowStockThreshold`
- **Status**: `active`, `inactive`, `draft`, `low-stock`, `out-of-stock`
- **Sections**: `latest`, `topSeller`, `quickPick`, `weeklyDeal` for homepage placement
- **Specifications**: Use `technicalSpecs` object with categorized specs (Display & Design, Performance, etc.)

## Order & Payment Patterns

### Order Lifecycle
1. **Pending** → Initial order creation
2. **Processing** → Payment confirmed, preparing shipment
3. **Shipped** → Order dispatched
4. **Delivered** → Order completed
5. **Cancelled** → Order cancelled (before shipping)
6. **Refunded** → Payment refunded

### Payment Integration (Stripe)
- Store only `stripeCustomerId` in User model
- Store `paymentIntentId` in Order model under `payment` object
- Never store card details - Stripe handles all sensitive data
- Payment status: `pending`, `succeeded`, `failed`, `refunded`
- Refunds stored in `payment.refunds[]` array

### Order Data Structure
```javascript
{
  orderNumber: String,  // Auto-generated unique identifier
  user: ObjectId,
  items: [{
    product: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    selectedOptions: {
      color: String,
      storage: String  // or other category-specific option
    }
  }],
  payment: {
    method: String,  // 'stripe', 'paypal', etc.
    status: String,
    paymentIntentId: String,
    amount: Number,
    refunds: []
  },
  shippingAddress: Object,
  status: String,
  total: Number
}
```

## Code Conventions

### Component Naming
- Product components: `ProductCard`, `ProductDetails`, `ProductGrid`
- Admin components: `AdminProducts`, `AdminCategoryManager`, `AdminOrderManagement`
- User profile: `OrdersTab`, `ActivityTab`, `ReorderModal`

### API Patterns
- Products: `/api/products`, `/api/products/:id`, `/api/products/category/:category`
- Orders: `/api/orders`, `/api/orders/:id`
- Payments: `/api/payments/create-intent`, `/api/payments/webhook`
- Admin: `/api/admin/products`, `/api/admin/orders`, `/api/admin/categories`

### State Management
- Use Zustand for global state (cart, user, etc.)
- Use React Query for server state (products, orders)
- Context for Stripe provider and product options

### Product Option Handling
When working with product options:
1. Always validate selected options exist in product data
2. Calculate price based on selected second option (storage, size, etc.)
3. Check stock availability for specific option combinations
4. Display color swatches using CSS classes (e.g., `midnight-dot`, `silver-dot`)

### Image Handling
- Support both simple string URLs and structured image objects
- Always provide `alt` text for accessibility
- Use `webp` format when available for performance
- Primary image: `primaryImage.url` or `images[0]`

## Business Rules

### Inventory Management
- Track stock at product level, not per option combination
- Low stock threshold triggers admin alerts
- Out of stock products show "Notify Me" instead of "Add to Cart"
- Admin can manually adjust stock levels

### Pricing Rules
- Base price is for default/lowest option
- Second option (storage, size, etc.) modifies price
- Display original price when discount is active
- Calculate discount percentage: `((originalPrice - price) / originalPrice) * 100`

### Review System
- Users can only review purchased products
- One review per user per product
- Rating scale: 1-5 stars
- Reviews affect product `averageRating` and `reviewCount`

### Homepage Sections
Products can appear in multiple sections:
- `latest`: Recently added products
- `topSeller`: High sales volume
- `quickPick`: Curated selections
- `weeklyDeal`: Discounted products

### Search & Filtering
- Full-text search on name, description, brand, tags
- Filter by category, price range, rating, availability
- Sort by price, rating, newest, popularity
- Autocomplete suggestions based on product names and categories