import mongoose from 'mongoose';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { DEFAULT_ROLES } from '../config/defaultRoles.js';
import { validatePermissions } from '../config/permissions.js';
import logger from '../utils/logger.js';

/**
 * Seed default roles into the database
 */
export const seedDefaultRoles = async () => {
  try {
    logger.info('Starting default roles seeding...');
    
    const roleNames = Object.keys(DEFAULT_ROLES);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const roleName of roleNames) {
      const roleData = DEFAULT_ROLES[roleName];
      
      // Validate permissions
      const validation = validatePermissions(roleData.permissions);
      if (!validation.valid) {
        logger.warn(`Invalid permissions for role ${roleName}:`, validation.invalidPermissions);
        continue;
      }
      
      // Check if role already exists
      const existingRole = await Role.findOne({ name: roleName });
      
      if (existingRole) {
        // Update existing role if it's a system role
        if (existingRole.isSystemRole) {
          existingRole.displayName = roleData.displayName;
          existingRole.description = roleData.description;
          existingRole.permissions = roleData.permissions;
          existingRole.priority = roleData.priority;
          existingRole.isActive = roleData.isActive;
          
          await existingRole.save();
          updated++;
          logger.info(`Updated system role: ${roleName}`);
        } else {
          skipped++;
          logger.info(`Skipped non-system role: ${roleName}`);
        }
      } else {
        // Create new role
        await Role.create({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          permissions: roleData.permissions,
          priority: roleData.priority,
          isSystemRole: roleData.isSystemRole,
          isActive: roleData.isActive
        });
        created++;
        logger.info(`Created role: ${roleName}`);
      }
    }
    
    logger.info(`Roles seeding completed: ${created} created, ${updated} updated, ${skipped} skipped`);
    
    return {
      success: true,
      created,
      updated,
      skipped
    };
    
  } catch (error) {
    logger.error('Error seeding default roles:', error);
    throw error;
  }
};

/**
 * Update existing users with permissions based on their roles
 */
export const updateUserPermissions = async () => {
  try {
    logger.info('Starting user permissions update...');
    
    const users = await User.find({});
    let updated = 0;
    
    for (const user of users) {
      const role = await Role.findOne({ name: user.role });
      
      if (role) {
        user.permissions = role.permissions;
        await user.save();
        updated++;
      }
    }
    
    logger.info(`Updated permissions for ${updated} users`);
    
    return {
      success: true,
      updated
    };
    
  } catch (error) {
    logger.error('Error updating user permissions:', error);
    throw error;
  }
};

/**
 * Reset a role to its default configuration
 */
export const resetRoleToDefault = async (roleName) => {
  try {
    const defaultRole = DEFAULT_ROLES[roleName];
    
    if (!defaultRole) {
      throw new Error(`No default configuration found for role: ${roleName}`);
    }
    
    const role = await Role.findOne({ name: roleName });
    
    if (!role) {
      throw new Error(`Role not found: ${roleName}`);
    }
    
    if (!role.isSystemRole) {
      throw new Error(`Cannot reset non-system role: ${roleName}`);
    }
    
    role.displayName = defaultRole.displayName;
    role.description = defaultRole.description;
    role.permissions = defaultRole.permissions;
    role.priority = defaultRole.priority;
    role.isActive = defaultRole.isActive;
    
    await role.save();
    
    logger.info(`Reset role to default: ${roleName}`);
    
    return {
      success: true,
      role
    };
    
  } catch (error) {
    logger.error(`Error resetting role ${roleName}:`, error);
    throw error;
  }
};

/**
 * Main seeder function
 */
export const runRoleSeeder = async () => {
  try {
    logger.info('=== Role Seeder Started ===');
    
    // Seed default roles
    const seedResult = await seedDefaultRoles();
    
    // Update user permissions
    const updateResult = await updateUserPermissions();
    
    logger.info('=== Role Seeder Completed ===');
    
    return {
      success: true,
      roles: seedResult,
      users: updateResult
    };
    
  } catch (error) {
    logger.error('Role seeder failed:', error);
    throw error;
  }
};

// Run seeder if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const connectDB = (await import('../config/database.js')).default;
  
  connectDB()
    .then(async () => {
      await runRoleSeeder();
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeder execution failed:', error);
      process.exit(1);
    });
}

export default {
  seedDefaultRoles,
  updateUserPermissions,
  resetRoleToDefault,
  runRoleSeeder
};
