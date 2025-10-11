import { User, Product, Category, Order, Review } from '../models/index.js';
import connectDB from '../config/database.js';

// Sample data for seeding
const seedData = {
    categories: [
        {
            name: 'Laptops',
            description: 'Laptops and computers',
            isActive: true,
            showInMenu: true,
            displayOrder: 1
        },
        {
            name: 'Smartphones',
            description: 'Smartphones and tablets',
            isActive: true,
            showInMenu: true,
            displayOrder: 2
        },
        {
            name: 'Gaming',
            description: 'Gaming products',
            isActive: true,
            showInMenu: true,
            displayOrder: 3
        }
    ],

    users: [
        {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@techverse.com',
            password: 'Admin123!',
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            accountStatus: 'active'
        },
        {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            password: 'User123!',
            role: 'user',
            isActive: true,
            isEmailVerified: true,
            accountStatus: 'active',
            addresses: [{
                type: 'home',
                firstName: 'John',
                lastName: 'Smith',
                address: '123 High Street',
                city: 'London',
                postcode: 'SW1A 1AA',
                country: 'United Kingdom',
                isDefault: true
            }]
        }
    ],

    products: [
        {
            name: 'MacBook Pro 16-inch M3 Pro',
            description: 'The most powerful MacBook Pro ever is here.',
            shortDescription: 'Powerful 16-inch MacBook Pro with M3 Pro chip.',
            price: 2499.00,
            brand: 'Apple',
            category: 'laptops',
            images: [
                { url: '/images/products/macbook-pro-16-1.jpg', alt: 'MacBook Pro 16-inch', isPrimary: true }
            ],
            stock: { quantity: 25, lowStockThreshold: 5 },
            status: 'active',
            visibility: 'public',
            featured: true
        },
        {
            name: 'iPhone 15 Pro',
            description: 'iPhone 15 Pro with titanium design and A17 Pro chip.',
            shortDescription: 'Latest iPhone with titanium design.',
            price: 999.00,
            brand: 'Apple',
            category: 'smartphones',
            images: [
                { url: '/images/products/iphone-15-pro-1.jpg', alt: 'iPhone 15 Pro', isPrimary: true }
            ],
            stock: { quantity: 45, lowStockThreshold: 10 },
            status: 'active',
            visibility: 'public',
            featured: true
        }
    ]
};

// Seed function
export const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        console.log('🔌 Connecting to database...');
        await connectDB();

        // Test the connection
        console.log('🧪 Testing database connection...');
        const testCount = await Category.countDocuments();
        console.log(`   Current categories in DB: ${testCount}`);

        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Product.deleteMany({}),
            Category.deleteMany({}),
            Order.deleteMany({}),
            Review.deleteMany({})
        ]);

        console.log('📁 Creating categories...');
        const categoryMap = new Map();

        for (const categoryData of seedData.categories) {
            try {
                console.log(`   Creating category: ${categoryData.name}...`);
                const category = await Category.create(categoryData);
                // Map both the generated slug and a simple name-based key
                categoryMap.set(category.slug, category._id);
                categoryMap.set(categoryData.name.toLowerCase(), category._id);
                console.log(`   ✅ Created category: ${category.name} (slug: ${category.slug})`);
            } catch (error) {
                console.error(`   ❌ Failed to create category ${categoryData.name}:`, error.message);
                throw error;
            }
        }

        console.log('👥 Creating users...');
        const users = [];
        for (const userData of seedData.users) {
            const user = await User.create(userData);
            users.push(user);
            console.log(`   ✅ Created user: ${user.email} (${user.role})`);
        }

        const adminUser = users.find(u => u.role === 'admin');

        console.log('📦 Creating products...');
        const products = [];
        for (const productData of seedData.products) {
            const categoryId = categoryMap.get(productData.category);

            if (categoryId) {
                const product = await Product.create({
                    ...productData,
                    category: categoryId,
                    createdBy: adminUser._id,
                    updatedBy: adminUser._id
                });
                products.push(product);
                console.log(`   ✅ Created product: ${product.name}`);
            }
        }

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Seeding Summary:');
        console.log(`   Categories: ${await Category.countDocuments()}`);
        console.log(`   Users: ${await User.countDocuments()}`);
        console.log(`   Products: ${await Product.countDocuments()}`);

        console.log('\n👤 Test Accounts Created:');
        console.log('   Admin: admin@techverse.com / Admin123!');
        console.log('   User: john.smith@example.com / User123!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    seedDatabase();
}

export default seedData;