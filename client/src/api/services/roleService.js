/**
 * Role Management Service
 */

import BaseApiService from '../core/BaseApiService.js';

class RoleService extends BaseApiService {
  constructor() {
    super({
      serviceName: 'RoleService',
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      endpoints: {
        BASE: '/admin/roles',
        STATS: '/admin/roles/stats',
        USERS: '/admin/users'
      }
    });
  }

  // Get all roles
  async getAllRoles() {
    return this.read(this.endpoints.BASE);
  }

  // Get role statistics
  async getRoleStats() {
    return this.read(this.endpoints.STATS);
  }

  // Get role details
  async getRoleDetails(role) {
    return this.read(`${this.endpoints.BASE}/${role}`);
  }

  // Get users by role
  async getUsersByRole(role, params = {}) {
    const { page = 1, limit = 20 } = params;
    return this.read(`${this.endpoints.BASE}/${role}/users`, { page, limit });
  }

  // Assign role to user
  async assignRole(userId, role) {
    return this.request({
      url: `${this.endpoints.BASE}/users/${userId}/role`,
      method: 'PATCH',
      body: { role }
    });
  }

  // Bulk assign roles
  async bulkAssignRoles(assignments) {
    return this.request({
      url: `${this.endpoints.BASE}/bulk-assign`,
      method: 'POST',
      body: { assignments }
    });
  }

  // Get all users (for role assignment)
  async getAllUsers(params = {}) {
    const { page = 1, limit = 100, search = '', role = '' } = params;
    return this.read(this.endpoints.USERS, { page, limit, search, role });
  }
}

export default new RoleService();
