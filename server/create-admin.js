import connectDB from './src/config/database.js';
import { User } from './src/models/index.js';

async function createAdmin() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database');
        
        // Delete existing users
        await User.deleteOne({ email: 'admin@techverse.com' });
        await User.deleteOne({ email: 'john.smith@example.com' });
        console.log('Deleted existing users');
        
        // Create admin user
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@techverse.com',
            password: 'Admin123!',
            role: 'admin',
            isEmailVerified: true,
            accountStatus: 'active',
            profile: {
                bio: 'System Administrator',
                preferences: {
                    notifications: {
                        email: true,
                        push: true,
                        sms: false
                    },
                    privacy: {
                        profileVisibility: 'private',
                        showEmail: false,
                        showPhone: false
                    }
                }
            },
            permissions: [
                'admin:read',
                'admin:write',
                'admin:delete',
                'users:manage',
                'products:manage',
                'orders:manage',
                'analytics:view'
            ]
        });
        
        await adminUser.save();
        
        // Update accountStatus after save (to override the pre-save hook)
        await User.findByIdAndUpdate(adminUser._id, { 
            accountStatus: 'active',
            isEmailVerified: true 
        });
        
        // Create regular user
        const regularUser = new User({
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            password: 'User123!',
            role: 'user',
            isEmailVerified: true,
            accountStatus: 'active',
            profile: {
                bio: 'Regular user for testing',
                preferences: {
                    notifications: {
                        email: true,
                        push: false,
                        sms: false
                    },
                    privacy: {
                        profileVisibility: 'public',
                        showEmail: false,
                        showPhone: false
                    }
                }
            }
        });
        
        await regularUser.save();
        
        // Update accountStatus after save (to override the pre-save hook)
        await User.findByIdAndUpdate(regularUser._id, { 
            accountStatus: 'active',
            isEmailVerified: true 
        });
        
        console.log('\n🎉 Users created successfully!');
        console.log('Admin: admin@techverse.com / Admin123!');
        console.log('User: john.smith@example.com / User123!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();