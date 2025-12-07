import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z_]+$/, 'Role name must contain only lowercase letters and underscores']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  permissions: [{
    type: String,
    trim: true
  }],
  isSystemRole: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    required: [true, 'Priority is required'],
    min: [1, 'Priority must be at least 1'],
    max: [100, 'Priority cannot exceed 100']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    userCount: {
      type: Number,
      default: 0
    },
    lastAssigned: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
roleSchema.index({ name: 1 }, { unique: true });
roleSchema.index({ isActive: 1 });
roleSchema.index({ priority: -1 });
roleSchema.index({ isSystemRole: 1 });

// Virtual for permission count
roleSchema.virtual('permissionCount').get(function() {
  return this.permissions ? this.permissions.length : 0;
});

// Static method to find active roles
roleSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ priority: -1 });
};

// Static method to find by name
roleSchema.statics.findByName = function(name) {
  return this.findOne({ name: name.toLowerCase() });
};

// Static method to get role with user count
roleSchema.statics.getRoleWithUserCount = async function(roleId) {
  const User = mongoose.model('User');
  const role = await this.findById(roleId);
  
  if (!role) {
    return null;
  }
  
  const userCount = await User.countDocuments({ role: role.name });
  role.metadata.userCount = userCount;
  
  return role;
};

// Method to add permission
roleSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this;
};

// Method to remove permission
roleSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this;
};

// Method to has permission
roleSchema.methods.hasPermission = function(permission) {
  // Super admin has all permissions
  if (this.permissions.includes('*')) {
    return true;
  }
  return this.permissions.includes(permission);
};

// Pre-save middleware to prevent renaming system roles
roleSchema.pre('save', function(next) {
  if (this.isSystemRole && !this.isNew && this.isModified('name')) {
    return next(new Error('System roles cannot be renamed'));
  }
  next();
});

// Pre-remove middleware to prevent deletion of system roles
roleSchema.pre('remove', function(next) {
  if (this.isSystemRole) {
    return next(new Error('System roles cannot be deleted'));
  }
  next();
});

const Role = mongoose.model('Role', roleSchema);

export default Role;
