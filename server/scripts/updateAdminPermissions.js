/**
 * Update Admin User Permissions Script
 * Run with: node scripts/updateAdminPermissions.js
 * 
 * This script updates all admin users with the latest permissions from defaultRoles.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/techverse';

console.log('='.repeat(60));
console.log('UPDATE ADMIN PERMISSIONS SCRIPT');
console.log('='.repeat(60));

async function updateAdminPermissions() {
  try {
    // Connect to MongoDB
    console.log('\n1. Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('   Connected successfully');

    // Import models and config
    const User = (await import('../src/models/User.js')).default;
    const { DEFAULT_ROLES } = await import('../src/config/defaultRoles.js');

    // Get admin permissions from default config
    const adminPermissions = DEFAULT_ROLES.admin?.permissions || [];
    const superAdminPermissions = DEFAULT_ROLES.super_admin?.permissions || ['*'];

    console.log(`\n2. Admin role has ${adminPermissions.length} permissions`);
    console.log(`   Super admin role has ${superAdminPermissions.length === 1 && superAdminPermissions[0] === '*' ? 'ALL (*)' : superAdminPermissions.length} permissions`);

    // Find all admin users
    console.log('\n3. Finding admin users...');
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'super_admin'] } 
    });

    console.log(`   Found ${adminUsers.length} admin/super_admin users`);

    // Update each admin user
    let updated = 0;
    for (const user of adminUsers) {
      const newPermissions = user.role === 'super_admin' ? superAdminPermissions : adminPermissions;
      
      console.log(`\n   Updating ${user.email} (${user.role})...`);
      console.log(`   Old permissions: ${user.permissions?.length || 0}`);
      
      user.permissions = newPermissions;
      await user.save();
      
      console.log(`   New permissions: ${newPermissions.length}`);
      updated++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`SUCCESS: Updated ${updated} admin users`);
    console.log('='.repeat(60));

    // Show sample permissions
    console.log('\nAdmin permissions now include:');
    adminPermissions.slice(0, 10).forEach(p => console.log(`  - ${p}`));
    if (adminPermissions.length > 10) {
      console.log(`  ... and ${adminPermissions.length - 10} more`);
    }

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

updateAdminPermissions();
