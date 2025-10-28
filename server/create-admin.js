import connectDB from './src/config/database.js';
import { User } from './src/models/index.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
    try {
        console.log('⚠️  WARNING: This script is deprecated!');
        console.log('Please use the seeding script instead: npm run seed:dev');
        console.log('or: node scripts/seedDatabase.js');
        console.log('\nThe seeding script provides more comprehensive data setup.');
        console.log('Continuing with basic user creation...\n');
        
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database');
        
        // Delete existing users
        await User.deleteOne({ email: 'admin@techverse.com' });
        await User.deleteOne({ email: 'john.smith@example.com' });
        console.log('Deleted existing users');
        
        // Create admin user with explicit password verification
        const adminPassword = 'Admin123!';
        console.log(`Creating admin with password: ${adminPassword}`);
        
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@techverse.com',
            password: adminPassword,
            role: 'admin',
            isEmailVerified: true,
            accountStatus: 'active'
        });
        
        await adminUser.save();
        
        // Update accountStatus after save (to override the pre-save hook)
        await User.findByIdAndUpdate(adminUser._id, { 
            accountStatus: 'active',
            isEmailVerified: true 
        });
        
        // Verify the password was hashed correctly
        const savedAdmin = await User.findOne({ email: 'admin@techverse.com' }).select('+password');
        const passwordVerification = await savedAdmin.comparePassword(adminPassword);
        
        if (!passwordVerification) {
            throw new Error('❌ Password verification failed! Admin user creation failed.');
        }
        
        console.log('✅ Admin user created and password verified');
        
        // Create regular user
        const userPassword = 'User123!';
        const regularUser = new User({
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            password: userPassword,
            role: 'user',
            isEmailVerified: true,
            accountStatus: 'active'
        });
        
        await regularUser.save();
        
        // Update accountStatus after save (to override the pre-save hook)
        await User.findByIdAndUpdate(regularUser._id, { 
            accountStatus: 'active',
            isEmailVerified: true 
        });
        
        // Verify the regular user password
        const savedUser = await User.findOne({ email: 'john.smith@example.com' }).select('+password');
        const userPasswordVerification = await savedUser.comparePassword(userPassword);
        
        if (!userPasswordVerification) {
            throw new Error('❌ Password verification failed! Regular user creation failed.');
        }
        
        console.log('✅ Regular user created and password verified');
        
        console.log('\n🎉 Users created successfully!');
        console.log('Admin: admin@techverse.com / Admin123!');
        console.log('User: john.smith@example.com / User123!');
        console.log('\n💡 Tip: Use the seeding script for complete data setup:');
        console.log('   node scripts/seedDatabase.js');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();