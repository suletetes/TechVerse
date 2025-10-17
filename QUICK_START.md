# TechVerse Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 16+ installed
- MongoDB installed and running
- Git (for cloning)

### 1. Setup Environment
```bash
# Install all dependencies
npm run install:all

# Create environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Seed the database with test data
npm run seed
```

### 2. Start Development Environment
```bash
# Option 1: Use the automated startup script (Recommended)
npm run start:dev

# Option 2: Start manually in separate terminals
# Terminal 1: Start server
cd server && npm run dev

# Terminal 2: Start client  
cd client && npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

### 4. Test Accounts
- **Admin**: admin@techverse.com / Admin123!
- **User**: john.smith@example.com / User123!

## 🧪 Validate Integration

### Quick Test
```bash
# Run automated integration tests
npm run test:integration
```

### Manual Verification
1. Visit http://localhost:5173
2. Verify all homepage sections load with products:
   - Latest Products
   - Top Sellers  
   - Quick Picks
   - Weekly Deals
3. Click on products to view details
4. Login as admin to access admin panel

## 📋 What's Working

### ✅ Frontend Features
- Homepage with dynamic product sections
- Product detail pages
- Category navigation
- Search functionality
- Responsive design
- Admin panel

### ✅ Backend Features
- RESTful API with all CRUD operations
- Product section management
- Authentication & authorization
- Database integration with MongoDB
- Error handling & validation
- Admin dashboard with analytics

### ✅ Integration Features
- Frontend ↔ Backend API communication
- Real-time data from database
- Admin section management
- Fallback data handling
- Token-based authentication

## 🛠️ Admin Section Management

### How It Works
1. **Login as Admin**: Use admin@techverse.com / Admin123!
2. **Access Admin Panel**: Navigate to admin dashboard
3. **Manage Sections**: Control which products appear in:
   - Latest Products
   - Top Sellers
   - Quick Picks  
   - Weekly Deals
4. **See Changes**: Updates reflect immediately on homepage

### API Endpoints for Section Management
```bash
# Get all sections
GET /api/admin/sections

# Get products in a section
GET /api/admin/sections/latest

# Set products for a section
POST /api/admin/sections/latest
{
  "productIds": ["product1_id", "product2_id"]
}
```

## 🔧 Troubleshooting

### Common Issues

**Server won't start**
- Check MongoDB is running: `mongod`
- Verify .env file exists: `ls server/.env`
- Check port 5000 is free: `lsof -i :5000`

**Client won't start**  
- Check .env file exists: `ls client/.env`
- Verify API URL: `cat client/.env | grep VITE_API_URL`
- Check port 5173 is free: `lsof -i :5173`

**No products showing**
- Re-run database seed: `npm run seed`
- Check API health: `curl http://localhost:5000/api/health`
- Check browser console for errors

**Admin panel not accessible**
- Verify admin login credentials
- Check JWT token in browser storage
- Ensure admin routes are protected

### Debug Commands
```bash
# Check server logs
cd server && node server.js

# Test API endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/products

# Check database
mongo techverse
> db.products.count()
> db.categories.count()
```

## 📚 Additional Resources

- **Full Integration Status**: See `FINAL_INTEGRATION_STATUS.md`
- **Validation Checklist**: See `VALIDATION_CHECKLIST.md`  
- **API Collection**: Import `TechVerse-API.postman_collection.json`
- **Migration Scripts**: Use `npm run migrate:sections`

## 🎯 Next Steps

1. **Customize Content**: Update products, categories, and images
2. **Enhance UI**: Modify styling and components as needed
3. **Add Features**: Implement cart, checkout, user profiles
4. **Deploy**: Set up production environment
5. **Monitor**: Add analytics and error tracking

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the validation checklist
3. Run the integration tests
4. Check server and client logs
5. Verify database connection and data

---

**Status**: ✅ **Ready for Development**  
**Last Updated**: December 2024  
**Integration**: Complete and Tested