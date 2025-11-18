/**
 * Database Query Script
 * Check existing data in the TechVerse database
 */

import mongoose from 'mongoose';
import { User, Product, Category, Order } from '../src/models/index.js';
import connectDB from '../src/config/database.js';

async function checkDatabase() {
    try {
        console.log('🔍 Checking TechVerse Database...\n');
        
        // Connect to database
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        // Check Categories
        console.log('📁 CATEGORIES:');
        console.log('==============');
        const categories = await Category.find({}).lean();
        console.log(`Total Categories: ${categories.length}`);
        
        if (categories.length > 0) {
            categories.forEach((cat, index) => {
                console.log(`${index + 1}. ${cat.name} (${cat.slug}) - Active: ${cat.isActive}`);
            });
        } else {
            console.log('❌ No categories found in database');
        }
        console.log('');

        // Check Products
        console.log('📦 PRODUCTS:');
        console.log('============');
        const products = await Product.find({})
            .populate('category', 'name slug')
            .lean();
        console.log(`Total Products: ${products.length}`);
        
        if (products.length > 0) {
            products.forEach((product, index) => {
                const categoryName = product.category?.name || 'No Category';
                const stock = typeof product.stock === 'object' 
                    ? product.stock.quantity || 0 
                    : product.stock || 0;
                console.log(`${index + 1}. ${product.name} - £${product.price} - Stock: ${stock} - Category: ${categoryName}`);
            });
        } else {
            console.log('❌ No products found in database');
        }
        console.log('');

        // Check Users
        console.log('👥 USERS:');
        console.log('=========');
        const users = await User.find({}).lean();
        console.log(`Total Users: ${users.length}`);
        
        if (users.length > 0) {
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - Status: ${user.accountStatus || 'N/A'}`);
            });
        } else {
            console.log('❌ No users found in database');
        }
        console.log('');

        // Check Orders
        console.log('🛒 ORDERS:');
        console.log('==========');
        const orders = await Order.find({}).lean();
        console.log(`Total Orders: ${orders.length}`);
        
        if (orders.length > 0) {
            orders.slice(0, 5).forEach((order, index) => {
                console.log(`${index + 1}. Order #${order.orderNumber || order._id} - £${order.total} - Status: ${order.status}`);
            });
            if (orders.length > 5) {
                console.log(`... and ${orders.length - 5} more orders`);
            }
        } else {
            console.log('❌ No orders found in database');
        }
        console.log('');

        // Database Summary
        console.log('📊 DATABASE SUMMARY:');
        console.log('====================');
        console.log(`Categories: ${categories.length}`);
        console.log(`Products: ${products.length}`);
        console.log(`Users: ${users.length}`);
        console.log(`Orders: ${orders.length}`);
        
        // Check if we need to create products
        if (categories.length > 0 && products.length === 0) {
            console.log('\n💡 RECOMMENDATION:');
            console.log('===================');
            console.log('✅ Categories exist in database');
            console.log('❌ No products found');
            console.log('🔧 You need to create products using existing categories');
            console.log('');
            console.log('Available categories for product creation:');
            categories.forEach(cat => {
                console.log(`   - ${cat.name} (ID: ${cat._id})`);
            });
        }

        // Check admin user
        const adminUser = users.find(user => user.role === 'admin');
        if (!adminUser) {
            console.log('\n⚠️  WARNING: No admin user found!');
            console.log('   You may need to create an admin user for product management.');
        } else {
            console.log(`\n✅ Admin user found: ${adminUser.email}`);
        }

    } catch (error) {
        console.error('❌ Database check failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the check
checkDatabase();