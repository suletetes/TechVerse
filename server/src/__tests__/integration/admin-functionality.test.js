import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../../server.js';
import { User, Product, Category, Order } from '../../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Admin Functionality Integration Tests', () => {
    let mongoServer;
    let testUser;
    let adminUser;
    let authToken;
    let adminToken;
    let testCategory;
    let testProducts;

    beforeAll(async () => {
        // Setup test environment
        process.env.NODE_ENV = 'test';
        process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
        process.env.JWT_EXPIRE = '1h';

        // Setup in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear all collections
        await User.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Order.deleteMany({});

        // Create test users
        testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: await bcrypt.hash('Password123', 12),
            role: 'user',
            isEmailVerified: true,
            accountStatus: 'active',
            isActive: true
        });

        adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: await bcrypt.hash('Password123', 12),
            role: 'admin',
            isEmailVerified: true,
            accountStatus: 'active',
            isActive: true
        });

        // Generate auth tokens
        authToken = jwt.sign(
            {
                id: testUser._id,
                email: testUser.email,
                role: testUser.role,
                isEmailVerified: testUser.isEmailVerified,
                accountStatus: testUser.accountStatus
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        adminToken = jwt.sign(
            {
                id: adminUser._id,
                email: adminUser.email,
                role: adminUser.role,
                isEmailVerified: adminUser.isEmailVerified,
                accountStatus: adminUser.accountStatus
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Create test category
        testCategory = await Category.create({
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic devices and gadgets',
            createdBy: adminUser._id,
            isActive: true
        });

        // Create test products for section management
        testProducts = await Product.create([
            {
                name: 'Product 1',
                slug: 'product-1',
                description: 'Test product 1',
                price: 999,
                category: testCategory._id,
                brand: 'TestBrand',
                sections: ['latest'],
                status: 'active',
                visibility: 'public',
                createdBy: adminUser._id,
                images: [{ url: '/test1.jpg', alt: 'Product 1' }],
                stock: { quantity: 50, trackQuantity: true }
            },
            {
                name: 'Product 2',
                slug: 'product-2',
                description: 'Test product 2',
                price: 799,
                category: testCategory._id,
                brand: 'TestBrand',
                sections: ['topSeller'],
                status: 'active',
                visibility: 'public',
                createdBy: adminUser._id,
                images: [{ url: '/test2.jpg', alt: 'Product 2' }],
                stock: { quantity: 30, trackQuantity: true }
            },
            {
                name: 'Product 3',
                slug: 'product-3',
                description: 'Test product 3',
                price: 599,
                category: testCategory._id,
                brand: 'TestBrand',
                sections: ['quickPick', 'weeklyDeal'],
                status: 'active',
                visibility: 'public',
                createdBy: adminUser._id,
                images: [{ url: '/test3.jpg', alt: 'Product 3' }],
                stock: { quantity: 20, trackQuantity: true }
            }
        ]);
    });

    describe('POST /api/admin/sections/:section - Section Management with Admin Authentication', () => {
        it('should allow admin to set products in section', async () => {
            const productIds = [testProducts[0]._id, testProducts[1]._id];

            const response = await request(app)
                .post('/api/admin/sections/latest')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ productIds })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Products successfully assigned to latest section');
            expect(response.body.data.section).toBe('latest');
            expect(response.body.data.productCount).toBe(2);

            // Verify products were updated in database
            const updatedProducts = await Product.find({ _id: { $in: productIds } });
            updatedProducts.forEach(product => {
                expect(product.sections).toContain('latest');
            });
        });

        it('should deny regular user access to section management', async () => {
            const productIds = [testProducts[0]._id];

            const response = await request(app)
                .post('/api/admin/sections/latest')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ productIds })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Administrator privileges required.');
            expect(response.body.code).toBe('ADMIN_REQUIRED');
        });

        it('should deny unauthenticated access to section management', async () => {
            const productIds = [testProducts[0]._id];

            const response = await request(app)
                .post('/api/admin/sections/latest')
                .send({ productIds })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No valid token provided.');
        });

        it('should validate section name', async () => {
            const productIds = [testProducts[0]._id];

            const response = await request(app)
                .post('/api/admin/sections/invalidSection')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ productIds })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid section');
            expect(response.body.code).toBe('INVALID_SECTION');
        });

        it('should validate product IDs array', async () => {
            const response = await request(app)
                .post('/api/admin/sections/latest')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ productIds: [] })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Product IDs array is required');
            expect(response.body.code).toBe('PRODUCT_IDS_REQUIRED');
        });

        it('should validate that all products exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const productIds = [testProducts[0]._id, fakeId];

            const response = await request(app)
                .post('/api/admin/sections/latest')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ productIds })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('One or more products not found');
            expect(response.body.code).toBe('PRODUCTS_NOT_FOUND');
        });

        it('should replace existing products in section', async () => {
            // First, set initial products in section
            await request(app)
                .post('/api/admin/sections/topSeller')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ productIds: [testProducts[0]._id] })
                .expect(200);

            // Then replace with different products
            const response = await request(app)
                .post('/api/admin/sections/topSeller')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ productIds: [testProducts[1]._id, testProducts[2]._id] })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.productCount).toBe(2);

            // Verify first product was removed and new products were added
            const products = await Product.find({ sections: 'topSeller' });
            expect(products).toHaveLength(2);
            expect(products.map(p => p._id.toString())).toEqual(
                expect.arrayContaining([testProducts[1]._id.toString(), testProducts[2]._id.toString()])
            );
            expect(products.map(p => p._id.toString())).not.toContain(testProducts[0]._id.toString());
        });
    });

    describe('Product CRUD Operations with Proper Authorization', () => {
        it('should allow admin to create product', async () => {
            const productData = {
                name: 'New Admin Product',
                slug: 'new-admin-product',
                description: 'Product created by admin',
                price: 1299,
                category: testCategory._id,
                brand: 'AdminBrand',
                sections: ['featured'],
                status: 'active',
                visibility: 'public'
            };

            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(productData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Product created successfully');
            expect(response.body.data.product.name).toBe('New Admin Product');
            expect(response.body.data.product.createdBy).toBe(adminUser._id.toString());
        });

        it('should deny regular user from creating product', async () => {
            const productData = {
                name: 'Unauthorized Product',
                description: 'Should not be created',
                price: 999,
                category: testCategory._id
            };

            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(productData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Administrator privileges required.');
        });

        it('should allow admin to update product', async () => {
            const updateData = {
                name: 'Updated Product Name',
                price: 1099,
                sections: ['latest', 'featured']
            };

            const response = await request(app)
                .put(`/api/products/${testProducts[0]._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.product.name).toBe('Updated Product Name');
            expect(response.body.data.product.price).toBe(1099);
        });

        it('should deny regular user from updating product', async () => {
            const updateData = { name: 'Unauthorized Update' };

            const response = await request(app)
                .put(`/api/products/${testProducts[0]._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Administrator privileges required.');
        });

        it('should allow admin to delete product', async () => {
            const response = await request(app)
                .delete(`/api/products/${testProducts[0]._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Product deleted successfully');

            // Verify product was deleted
            const deletedProduct = await Product.findById(testProducts[0]._id);
            expect(deletedProduct).toBeNull();
        });

        it('should deny regular user from deleting product', async () => {
            const response = await request(app)
                .delete(`/api/products/${testProducts[0]._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Administrator privileges required.');
        });
    });

    describe('Section Management Endpoints with Product Assignment Verification', () => {
        it('should get products in section for admin', async () => {
            const response = await request(app)
                .get('/api/admin/sections/latest')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.section).toBe('latest');
            expect(response.body.data.products).toHaveLength(1);
            expect(response.body.data.products[0].name).toBe('Product 1');
            expect(response.body.data.count).toBe(1);
        });

        it('should add individual product to section', async () => {
            const response = await request(app)
                .post(`/api/admin/sections/featured/products/${testProducts[1]._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Product added to featured section successfully');

            // Verify product was added to section
            const updatedProduct = await Product.findById(testProducts[1]._id);
            expect(updatedProduct.sections).toContain('featured');
        });

        it('should remove individual product from section', async () => {
            const response = await request(app)
                .delete(`/api/admin/sections/quickPick/products/${testProducts[2]._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Product removed from quickPick section successfully');

            // Verify product was removed from section
            const updatedProduct = await Product.findById(testProducts[2]._id);
            expect(updatedProduct.sections).not.toContain('quickPick');
            expect(updatedProduct.sections).toContain('weeklyDeal'); // Should still have other sections
        });

        it('should get section overview with all sections', async () => {
            const response = await request(app)
                .get('/api/admin/sections')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.sections).toHaveLength(5); // All valid sections
            expect(response.body.data.totalSections).toBe(5);

            // Check that each section has the expected structure
            response.body.data.sections.forEach(section => {
                expect(section).toHaveProperty('section');
                expect(section).toHaveProperty('productCount');
                expect(section).toHaveProperty('products');
                expect(['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured']).toContain(section.section);
            });
        });

        it('should clear all products from section', async () => {
            // First verify there are products in the section
            const beforeResponse = await request(app)
                .get('/api/admin/sections/quickPick')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(beforeResponse.body.data.products.length).toBeGreaterThan(0);

            // Clear the section
            const response = await request(app)
                .delete('/api/admin/sections/quickPick')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('All products removed from quickPick section successfully');
            expect(response.body.data.section).toBe('quickPick');

            // Verify section is now empty
            const afterResponse = await request(app)
                .get('/api/admin/sections/quickPick')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(afterResponse.body.data.products).toHaveLength(0);
        });

        it('should get available products for section assignment', async () => {
            const response = await request(app)
                .get('/api/admin/products/available')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.products).toHaveLength(3); // All test products
            expect(response.body.data.pagination.totalProducts).toBe(3);

            // Check product structure
            response.body.data.products.forEach(product => {
                expect(product).toHaveProperty('_id');
                expect(product).toHaveProperty('name');
                expect(product).toHaveProperty('price');
                expect(product).toHaveProperty('sections');
                expect(product.status).toBe('active');
            });
        });

        it('should filter available products by search term', async () => {
            const response = await request(app)
                .get('/api/admin/products/available?search=Product 1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.products).toHaveLength(1);
            expect(response.body.data.products[0].name).toBe('Product 1');
        });

        it('should exclude products from specific section', async () => {
            const response = await request(app)
                .get('/api/admin/products/available?excludeSection=latest')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.products).toHaveLength(2); // Should exclude Product 1 which is in 'latest'

            const productNames = response.body.data.products.map(p => p.name);
            expect(productNames).not.toContain('Product 1');
            expect(productNames).toContain('Product 2');
            expect(productNames).toContain('Product 3');
        });

        it('should handle bulk section updates', async () => {
            const updates = [
                { productId: testProducts[0]._id, sections: ['featured', 'topSeller'] },
                { productId: testProducts[1]._id, sections: ['latest'] },
                { productId: testProducts[2]._id, sections: [] }
            ];

            const response = await request(app)
                .put('/api/admin/products/sections')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ updates })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBe(3);
            expect(response.body.data.errorCount).toBe(0);

            // Verify updates were applied
            const updatedProducts = await Product.find({ _id: { $in: [testProducts[0]._id, testProducts[1]._id, testProducts[2]._id] } });

            const product1 = updatedProducts.find(p => p._id.toString() === testProducts[0]._id.toString());
            const product2 = updatedProducts.find(p => p._id.toString() === testProducts[1]._id.toString());
            const product3 = updatedProducts.find(p => p._id.toString() === testProducts[2]._id.toString());

            expect(product1.sections).toEqual(['featured', 'topSeller']);
            expect(product2.sections).toEqual(['latest']);
            expect(product3.sections).toEqual([]);
        });

        it('should handle bulk update errors gracefully', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const updates = [
                { productId: testProducts[0]._id, sections: ['featured'] },
                { productId: fakeId, sections: ['latest'] }, // This should fail
                { productId: testProducts[1]._id, sections: ['invalidSection'] } // This should fail
            ];

            const response = await request(app)
                .put('/api/admin/products/sections')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ updates })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.successCount).toBe(1);
            expect(response.body.data.errorCount).toBe(2);
            expect(response.body.data.errors).toHaveLength(2);
        });
    });

    describe('Admin Dashboard and User Management', () => {
        it('should allow admin to access dashboard', async () => {
            const response = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.overview).toBeDefined();
            expect(response.body.data.overview.totalUsers).toBeDefined();
            expect(response.body.data.overview.totalProducts).toBeDefined();
        });

        it('should deny regular user access to dashboard', async () => {
            const response = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('ADMIN_REQUIRED');
        });

        it('should allow admin to get all users', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toHaveLength(2); // testUser and adminUser
            expect(response.body.data.pagination.totalUsers).toBe(2);
        });

        it('should allow admin to update user status', async () => {
            const response = await request(app)
                .put(`/api/admin/users/${testUser._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ accountStatus: 'suspended', suspensionReason: 'Test suspension' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.accountStatus).toBe('suspended');
            expect(response.body.data.user.suspensionReason).toBe('Test suspension');
        });

        it('should prevent admin from modifying their own status', async () => {
            const response = await request(app)
                .put(`/api/admin/users/${adminUser._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ accountStatus: 'suspended' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot modify your own account status');
            expect(response.body.code).toBe('CANNOT_MODIFY_SELF');
        });
    });

    describe('Authorization Verification Across Admin Endpoints', () => {
        const adminEndpoints = [
            { method: 'get', path: '/api/admin/dashboard' },
            { method: 'get', path: '/api/admin/users' },
            { method: 'get', path: '/api/admin/sections' },
            { method: 'get', path: '/api/admin/categories' },
            { method: 'get', path: '/api/admin/orders' },
            { method: 'get', path: '/api/admin/analytics' }
        ];

        adminEndpoints.forEach(endpoint => {
            it(`should deny regular user access to ${endpoint.method.toUpperCase()} ${endpoint.path}`, async () => {
                const response = await request(app)
                [endpoint.method](endpoint.path)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(403);

                expect(response.body.success).toBe(false);
                expect(response.body.code).toBe('ADMIN_REQUIRED');
            });

            it(`should deny unauthenticated access to ${endpoint.method.toUpperCase()} ${endpoint.path}`, async () => {
                const response = await request(app)
                [endpoint.method](endpoint.path)
                    .expect(401);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Access denied. No valid token provided.');
            });
        });
    });
});