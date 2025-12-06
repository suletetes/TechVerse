/**
 * Backend Roles Debug Script
 * Run with: node scripts/debugRoles.js
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
console.log('ROLES DEBUG SCRIPT');
console.log('='.repeat(60));
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
console.log('='.repeat(60));

async function debugRoles() {
  try {
    // Connect to MongoDB
    console.log('\n1. Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('   Connected successfully');

    // Import models after connection
    const User = (await import('../src/models/User.js')).default;
    const Role = (await import('../src/models/Role.js')).default;
    const { DEFAULT_ROLES } = await import('../src/config/defaultRoles.js');

    // Check Role collection
    console.log('\n2. Checking Role collection...');
    const roleCount = await Role.countDocuments();
    console.log(`   Total roles in database: ${roleCount}`);

    if (roleCount === 0) {
      console.log('   WARNING: No roles found in database!');
      console.log('   Run: npm run seed:roles to create default roles');
    } else {
      const roles = await Role.find().select('name displayName permissions isActive priority');
      console.log('\n   Roles in database:');
      roles.forEach(role => {
        console.log(`   - ${role.name} (${role.displayName})`);
        console.log(`     Active: ${role.isActive}, Priority: ${role.priority}`);
        console.log(`     Permissions: ${role.permissions.length} total`);
        if (role.permissions.includes('*')) {
          console.log(`     Has wildcard (*) permission - SUPER ADMIN`);
        }
      });
    }

    // Check default roles config
    console.log('\n3. Default roles configuration:');
    Object.keys(DEFAULT_ROLES).forEach(roleName => {
      const role = DEFAULT_ROLES[roleName];
      console.log(`   - ${roleName}: ${role.permissions.length} permissions`);
    });

    // Check admin users
    console.log('\n4. Checking admin users...');
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'super_admin'] } 
    }).select('email role permissions isActive');
    
    console.log(`   Found ${adminUsers.length} admin/super_admin users:`);
    for (const user of adminUsers) {
      console.log(`\n   User: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Permissions cached: ${user.permissions?.length || 0}`);
      
      if (user.permissions && user.permissions.length > 0) {
        console.log(`   Sample permissions: ${user.permissions.slice(0, 5).join(', ')}...`);
      } else {
        console.log(`   WARNING: No permissions cached on user!`);
        
        // Check if role exists
        const userRole = await Role.findOne({ name: user.role });
        if (userRole) {
          console.log(`   Role "${user.role}" exists in DB with ${userRole.permissions.length} permissions`);
        } else {
          console.log(`   WARNING: Role "${user.role}" NOT found in database!`);
          console.log(`   Using default config: ${DEFAULT_ROLES[user.role]?.permissions.length || 0} permissions`);
        }
      }
    }

    // Check specific permissions
    console.log('\n5. Permission check for "users.view":');
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      const hasUsersView = adminRole.permissions.includes('users.view');
      console.log(`   Admin role has users.view: ${hasUsersView}`);
    } else {
      console.log(`   Admin role not in database, checking defaults...`);
      const hasUsersView = DEFAULT_ROLES.admin?.permissions.includes('users.view');
      console.log(`   Default admin config has users.view: ${hasUsersView}`);
    }

    // Test permission service
    console.log('\n6. Testing permission service...');
    const permissionService = (await import('../src/services/permissionService.js')).default;
    
    if (adminUsers.length > 0) {
      const testUser = adminUsers[0];
      console.log(`   Testing with user: ${testUser.email}`);
      
      const permissions = await permissionService.getUserPermissions(testUser._id);
      console.log(`   Retrieved ${permissions.length} permissions`);
      
      const hasUsersView = await permissionService.checkUserPermission(testUser._id, 'users.view');
      console.log(`   Has users.view permission: ${hasUsersView}`);
      
      const hasWildcard = await permissionService.checkUserPermission(testUser._id, '*');
      console.log(`   Has wildcard permission: ${hasWildcard}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('DEBUG COMPLETE');
    console.log('='.repeat(60));

    // Recommendations
    console.log('\nRECOMMENDATIONS:');
    if (roleCount === 0) {
      console.log('1. Run: npm run seed:roles');
    }
    if (adminUsers.some(u => !u.permissions || u.permissions.length === 0)) {
      console.log('2. Admin users need permissions synced. Run seed:roles or restart server.');
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

debugRoles();
