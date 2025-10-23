import { User } from './src/models/index.js';
import connectDB from './src/config/database.js';

async function checkAdmin() {
    try {
        await connectDB();
        const admin = await User.findOne({ email: 'admin@techverse.com' });

        if (admin) {
            console.log('Admin user found:');
            console.log('Email:', admin.email);
            console.log('Role:', admin.role);
            console.log('Account Status:', admin.accountStatus);
            console.log('Is Email Verified:', admin.isEmailVerified);
            console.log('Is Active:', admin.isActive);
        } else {
            console.log('Admin user not found!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdmin();