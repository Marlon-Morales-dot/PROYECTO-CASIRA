// ============= CASIRA Users Service =============
import apiClient from '../axios-config.js';

class UsersService {
  
  // ============= USER CRUD OPERATIONS =============
  
  async getAllUsers() {
    try {
      // For local storage implementation
      const users = this.getStoredUsers();
      console.log('📋 UsersService: Retrieved all users:', users.length);
      return users;
    } catch (error) {
      console.error('❌ UsersService: Error getting users:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const users = this.getStoredUsers();
      const user = users.find(u => u.id == id);
      console.log('👤 UsersService: Retrieved user by ID:', user?.email || 'Not found');
      return user || null;
    } catch (error) {
      console.error('❌ UsersService: Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const users = this.getStoredUsers();
      const user = users.find(u => u.email === email);
      console.log('📧 UsersService: Retrieved user by email:', user?.email || 'Not found');
      return user || null;
    } catch (error) {
      console.error('❌ UsersService: Error getting user by email:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.id == userId);
      
      if (userIndex === -1) {
        throw new Error('Usuario no encontrado');
      }

      users[userIndex] = { 
        ...users[userIndex], 
        ...updateData, 
        updated_at: new Date().toISOString() 
      };

      this.saveUsers(users);
      console.log('✅ UsersService: User updated:', users[userIndex].email);
      return users[userIndex];
    } catch (error) {
      console.error('❌ UsersService: Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.id == userId);
      
      if (userIndex === -1) {
        throw new Error('Usuario no encontrado');
      }

      const deletedUser = users[userIndex];
      users.splice(userIndex, 1);
      
      this.saveUsers(users);
      console.log('🗑️ UsersService: User deleted:', deletedUser.email);
      return deletedUser;
    } catch (error) {
      console.error('❌ UsersService: Error deleting user:', error);
      throw error;
    }
  }

  // ============= ROLE MANAGEMENT =============

  async updateUserRole(userId, newRole) {
    try {
      const validRoles = ['admin', 'volunteer', 'donor', 'visitor'];
      
      if (!validRoles.includes(newRole)) {
        throw new Error(`Rol inválido: ${newRole}`);
      }

      const updatedUser = await this.updateUser(userId, { role: newRole });
      console.log('🎭 UsersService: User role updated:', updatedUser.email, 'to', newRole);
      return updatedUser;
    } catch (error) {
      console.error('❌ UsersService: Error updating user role:', error);
      throw error;
    }
  }

  async getUsersByRole(role) {
    try {
      const users = this.getStoredUsers();
      const filteredUsers = users.filter(u => u.role === role);
      console.log(`👥 UsersService: Retrieved ${role} users:`, filteredUsers.length);
      return filteredUsers;
    } catch (error) {
      console.error('❌ UsersService: Error getting users by role:', error);
      throw error;
    }
  }

  // ============= USER STATUS MANAGEMENT =============

  async blockUser(userId) {
    try {
      const updatedUser = await this.updateUser(userId, { 
        status: 'blocked',
        blocked_at: new Date().toISOString()
      });
      console.log('🚫 UsersService: User blocked:', updatedUser.email);
      return updatedUser;
    } catch (error) {
      console.error('❌ UsersService: Error blocking user:', error);
      throw error;
    }
  }

  async unblockUser(userId) {
    try {
      const updatedUser = await this.updateUser(userId, { 
        status: 'active',
        unblocked_at: new Date().toISOString()
      });
      console.log('✅ UsersService: User unblocked:', updatedUser.email);
      return updatedUser;
    } catch (error) {
      console.error('❌ UsersService: Error unblocking user:', error);
      throw error;
    }
  }

  // ============= STATISTICS =============

  async getUserStats() {
    try {
      const users = this.getStoredUsers();
      
      const stats = {
        total: users.length,
        byRole: {
          admin: users.filter(u => u.role === 'admin').length,
          volunteer: users.filter(u => u.role === 'volunteer').length, 
          donor: users.filter(u => u.role === 'donor').length,
          visitor: users.filter(u => u.role === 'visitor').length
        },
        byProvider: {
          local: users.filter(u => u.provider === 'local').length,
          google: users.filter(u => u.provider === 'google').length
        },
        byStatus: {
          active: users.filter(u => u.status === 'active').length,
          blocked: users.filter(u => u.status === 'blocked').length
        }
      };

      console.log('📊 UsersService: User stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ UsersService: Error getting user stats:', error);
      throw error;
    }
  }

  // ============= STORAGE HELPERS =============

  getStoredUsers() {
    try {
      const casiraData = localStorage.getItem('casira-data');
      if (casiraData) {
        const data = JSON.parse(casiraData);
        return data.users || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting stored users:', error);
      return [];
    }
  }

  saveUsers(users) {
    try {
      let casiraData = {};
      const existingData = localStorage.getItem('casira-data');
      if (existingData) {
        casiraData = JSON.parse(existingData);
      }
      casiraData.users = users;
      localStorage.setItem('casira-data', JSON.stringify(casiraData));
      console.log('💾 UsersService: Users saved to storage');
    } catch (error) {
      console.error('❌ UsersService: Error saving users:', error);
    }
  }

  // ============= UTILITY METHODS =============

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generateAvatar(firstName, lastName) {
    const seed = `${firstName} ${lastName}`;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
  }

  sanitizeUserData(userData) {
    return {
      ...userData,
      email: userData.email?.toLowerCase()?.trim(),
      first_name: userData.first_name?.trim(),
      last_name: userData.last_name?.trim()
    };
  }
}

// Create singleton instance
const usersService = new UsersService();

export default usersService;
export { UsersService };