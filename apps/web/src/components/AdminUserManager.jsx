// ============= CASIRA Connect - Admin User Manager =============
import React, { useState, useEffect } from 'react';
import { Users, Crown, Eye, UserCheck, UserX, RefreshCw, Database, HardDrive } from 'lucide-react';
import { hybridDataManager } from '../lib/hybrid-data-manager.js';

const AdminUserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [filter, setFilter] = useState('all'); // all, visitor, volunteer, admin
  const [updating, setUpdating] = useState(null);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('👥 Loading all users...');
      const allUsers = await hybridDataManager.getAllUsers();
      console.log('✅ Users loaded:', allUsers.length);
      setUsers(allUsers);
    } catch (error) {
      console.error('❌ Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncUsers = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      console.log('🔄 Starting user sync...');
      const result = await hybridDataManager.syncUsersToSupabase();
      setSyncResult(result);
      console.log('✅ Sync completed:', result);
      // Reload users after sync
      await loadUsers();
    } catch (error) {
      console.error('❌ Error syncing users:', error);
      setSyncResult({
        synced: 0,
        errors: 1,
        errorDetails: [{ error: error.message }]
      });
    } finally {
      setSyncing(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    setUpdating(userId);
    try {
      console.log(`🔄 Updating user ${userId} to ${newRole}`);
      await hybridDataManager.updateUserRole(userId, newRole);
      console.log('✅ User role updated');
      // Reload users to reflect changes
      await loadUsers();
    } catch (error) {
      console.error('❌ Error updating user role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  const getUserStats = () => {
    const stats = {
      total: users.length,
      visitors: users.filter(u => u.role === 'visitor').length,
      volunteers: users.filter(u => u.role === 'volunteer').length,
      admins: users.filter(u => u.role === 'admin').length,
      google: users.filter(u => u.auth_provider === 'google').length,
      internal: users.filter(u => u.auth_provider === 'internal').length,
      localStorage: users.filter(u => u.source === 'localStorage' || u.source === 'both').length,
      supabase: users.filter(u => u.source === 'supabase' || u.source === 'both').length
    };
    return stats;
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin w-6 h-6 mr-2" />
          <span>Cargando usuarios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
              <div className="text-blue-600 text-sm">Total Usuarios</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-800">{stats.visitors}</div>
              <div className="text-green-600 text-sm">Visitantes</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-800">{stats.volunteers}</div>
              <div className="text-purple-600 text-sm">Voluntarios</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <Crown className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-800">{stats.admins}</div>
              <div className="text-yellow-600 text-sm">Administradores</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg border">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Database className="w-6 h-6 mr-2 text-blue-600" />
          Gestión de Datos
        </h3>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            <div>📦 LocalStorage: {stats.localStorage} usuarios</div>
            <div>🗃️ Supabase: {stats.supabase} usuarios</div>
            <div>🔗 Google Auth: {stats.google} usuarios</div>
          </div>
          
          <button
            onClick={syncUsers}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar a Supabase'}
          </button>
        </div>

        {syncResult && (
          <div className={`p-4 rounded-lg ${syncResult.errors > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <h4 className="font-semibold mb-2">Resultado de Sincronización:</h4>
            <div className="text-sm">
              <div>✅ Sincronizados: {syncResult.synced}</div>
              <div>❌ Errores: {syncResult.errors}</div>
              {syncResult.errorDetails && syncResult.errorDetails.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">Ver errores</summary>
                  <div className="mt-2 space-y-1">
                    {syncResult.errorDetails.map((error, index) => (
                      <div key={index} className="text-xs text-red-600">
                        {error.user}: {error.error}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Gestión de Usuarios</h3>
            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Todos ({stats.total})</option>
                <option value="visitor">Visitantes ({stats.visitors})</option>
                <option value="volunteer">Voluntarios ({stats.volunteers})</option>
                <option value="admin">Administradores ({stats.admins})</option>
              </select>
              <button
                onClick={loadUsers}
                disabled={loading}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full bg-gray-200 object-cover"
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=random`}
                        alt={user.full_name || user.email}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=random`;
                        }}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'Usuario Desconocido'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'volunteer' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? '👑 Admin' :
                       user.role === 'volunteer' ? '🤝 Voluntario' :
                       '👁️ Visitante'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.auth_provider === 'google' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.auth_provider === 'google' ? '🔗 Google' : '🏠 Interno'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.source === 'supabase' ? 'bg-green-100 text-green-800' :
                      user.source === 'both' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.source === 'supabase' && '🗃️ Supabase'}
                      {user.source === 'localStorage' && '📦 Local'}
                      {user.source === 'both' && '🔄 Ambos'}
                      {user.source === 'localStorage_google' && '📦 Google Local'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {user.role === 'visitor' && (
                      <button
                        onClick={() => updateUserRole(user.id, 'volunteer')}
                        disabled={updating === user.id}
                        className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        title="Promover a Voluntario"
                      >
                        {updating === user.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    )}
                    {user.role === 'volunteer' && (
                      <button
                        onClick={() => updateUserRole(user.id, 'visitor')}
                        disabled={updating === user.id}
                        className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        title="Degradar a Visitante"
                      >
                        {updating === user.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron usuarios con el filtro seleccionado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManager;