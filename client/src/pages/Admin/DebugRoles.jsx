/**
 * Frontend Roles Debug Page
 * Access at: /admin/debug-roles (add route) or import into AdminProfile
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tokenManager } from '../../utils/tokenManager';

// API base URL - without /api suffix since endpoints already include it
const API_HOST = 'http://localhost:5000';

const DebugRoles = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiTests, setApiTests] = useState([]);

  const runDebug = async () => {
    setLoading(true);
    setError(null);
    setApiTests([]);
    
    const tests = [];
    const token = tokenManager.getToken();

    // Test 1: Check authentication
    tests.push({
      name: 'Authentication Check',
      status: isAuthenticated ? 'PASS' : 'FAIL',
      details: {
        isAuthenticated,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'None'
      }
    });

    // Test 2: Check user data
    tests.push({
      name: 'User Data',
      status: user ? 'PASS' : 'FAIL',
      details: {
        email: user?.email || 'N/A',
        role: user?.role || 'N/A',
        permissions: user?.permissions?.length || 0,
        isAdmin: isAdmin?.() || false
      }
    });

    // Test 3: API - Get roles list
    try {
      const rolesResponse = await fetch(`${API_HOST}/api/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const rolesData = await rolesResponse.json();
      
      tests.push({
        name: 'GET /api/admin/roles',
        status: rolesResponse.ok ? 'PASS' : 'FAIL',
        details: {
          statusCode: rolesResponse.status,
          success: rolesData.success,
          rolesCount: rolesData.data?.length || 0,
          error: rolesData.message || null,
          roles: rolesData.data?.map(r => r.name) || []
        }
      });
    } catch (err) {
      tests.push({
        name: 'GET /api/admin/roles',
        status: 'ERROR',
        details: { error: err.message }
      });
    }

    // Test 4: API - Get users (requires users.view permission)
    try {
      const usersResponse = await fetch(`${API_HOST}/api/admin/users?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const usersData = await usersResponse.json();
      
      tests.push({
        name: 'GET /api/admin/users (needs users.view)',
        status: usersResponse.ok ? 'PASS' : 'FAIL',
        details: {
          statusCode: usersResponse.status,
          success: usersData.success,
          usersCount: usersData.data?.users?.length || usersData.users?.length || 0,
          error: usersData.message || null,
          code: usersData.code || null
        }
      });
    } catch (err) {
      tests.push({
        name: 'GET /api/admin/users',
        status: 'ERROR',
        details: { error: err.message }
      });
    }

    // Test 5: API - Get current user permissions
    try {
      const profileResponse = await fetch(`${API_HOST}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const profileData = await profileResponse.json();
      
      tests.push({
        name: 'GET /api/auth/me (user profile)',
        status: profileResponse.ok ? 'PASS' : 'FAIL',
        details: {
          statusCode: profileResponse.status,
          role: profileData.data?.role || profileData.user?.role || 'N/A',
          permissions: profileData.data?.permissions || profileData.user?.permissions || [],
          permissionsCount: (profileData.data?.permissions || profileData.user?.permissions || []).length
        }
      });
    } catch (err) {
      tests.push({
        name: 'GET /api/auth/me',
        status: 'ERROR',
        details: { error: err.message }
      });
    }

    // Test 6: Check specific role
    try {
      const adminRoleResponse = await fetch(`${API_HOST}/api/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const rolesData = await adminRoleResponse.json();
      const adminRole = rolesData.data?.find(r => r.name === 'admin');
      
      tests.push({
        name: 'Admin Role Check',
        status: adminRole ? 'PASS' : 'FAIL',
        details: {
          exists: !!adminRole,
          permissions: adminRole?.permissions?.length || 0,
          hasUsersView: adminRole?.permissions?.includes('users.view') || false,
          samplePermissions: adminRole?.permissions?.slice(0, 10) || []
        }
      });
    } catch (err) {
      tests.push({
        name: 'Admin Role Check',
        status: 'ERROR',
        details: { error: err.message }
      });
    }

    setApiTests(tests);
    setDebugData({
      timestamp: new Date().toISOString(),
      environment: {
        apiHost: API_HOST,
        nodeEnv: import.meta.env.MODE
      }
    });
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PASS': 'success',
      'FAIL': 'danger',
      'ERROR': 'warning'
    };
    return `badge bg-${colors[status] || 'secondary'}`;
  };

  return (
    <div className="container-fluid py-4">
      <div className="card">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Roles Debug Panel</h4>
        </div>
        <div className="card-body">
          <div className="d-flex gap-2 mb-4">
            <button 
              className="btn btn-primary"
              onClick={runDebug}
              disabled={loading}
            >
              {loading ? 'Running Tests...' : 'Run Debug Tests'}
            </button>
            <button 
              className="btn btn-warning"
              onClick={async () => {
                try {
                  const token = tokenManager.getToken();
                  const response = await fetch(`${API_HOST}/api/auth/refresh-permissions`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  const data = await response.json();
                  if (data.success) {
                    alert(`Permissions refreshed! You now have ${data.data.permissionsCount} permissions. Please refresh the page.`);
                    window.location.reload();
                  } else {
                    alert(`Failed: ${data.message}`);
                  }
                } catch (err) {
                  alert(`Error: ${err.message}`);
                }
              }}
            >
              Refresh My Permissions
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {debugData && (
            <div className="mb-4">
              <h5>Environment</h5>
              <pre className="bg-light p-3 rounded">
                {JSON.stringify(debugData.environment, null, 2)}
              </pre>
            </div>
          )}

          {apiTests.length > 0 && (
            <div>
              <h5>Test Results</h5>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-dark">
                    <tr>
                      <th>Test</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiTests.map((test, index) => (
                      <tr key={index}>
                        <td><strong>{test.name}</strong></td>
                        <td>
                          <span className={getStatusBadge(test.status)}>
                            {test.status}
                          </span>
                        </td>
                        <td>
                          <pre className="mb-0 small" style={{ maxHeight: '200px', overflow: 'auto' }}>
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4">
            <h5>Quick Fixes</h5>
            <div className="alert alert-info">
              <p><strong>If roles are not working:</strong></p>
              <ol className="mb-0">
                <li>Run backend: <code>cd server && node scripts/debugRoles.js</code></li>
                <li>Seed roles: <code>cd server && npm run seed:roles</code></li>
                <li>Restart the server after seeding</li>
                <li>Log out and log back in to refresh permissions</li>
              </ol>
            </div>
          </div>

          <div className="mt-4">
            <h5>Current User Info</h5>
            <pre className="bg-light p-3 rounded">
              {JSON.stringify({
                email: user?.email,
                role: user?.role,
                permissions: user?.permissions,
                isAuthenticated,
                isAdmin: isAdmin?.()
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugRoles;
