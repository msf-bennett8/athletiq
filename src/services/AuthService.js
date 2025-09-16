import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, USER_TYPES } from '../utils/constants';

class AuthService {
  static async register(userData) {
    try {
      // Add any additional processing here
      const processedUser = {
        ...userData,
        syncedToServer: false,
        lastSyncDate: null,
      };
      
      return processedUser;
    } catch (error) {
      throw new Error('Registration failed: ' + error.message);
    }
  }
  
  static async syncWithServer() {
    try {
      const userData = await AsyncStorage.getItem('authenticatedUser');
      if (userData) {
        const user = JSON.parse(userData);
        user.syncedToServer = true;
        user.lastSyncDate = new Date().toISOString();
        await AsyncStorage.setItem('authenticatedUser', JSON.stringify(user));
        return user;
      }
    } catch (error) {
      throw new Error('Sync failed: ' + error.message);
    }
  }

  async register(userData) {
    try {
      const storedUsers = await this.getStoredUsers();
      
      const existingUser = storedUsers.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      const newUser = {
        id: Date.now().toString(),
        ...userData,
        createdAt: new Date().toISOString(),
        syncedToServer: false,
      };

      storedUsers.push(newUser);
      await AsyncStorage.setItem('stored_users', JSON.stringify(storedUsers));

      const token = this.generateToken();
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(newUser));

      await this.markForSync('register', newUser);

      return { user: newUser, token };
    } catch (error) {
      throw error;
    }
  }

  async getStoredUsers() {
    try {
      const users = await AsyncStorage.getItem('stored_users');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      return [];
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (token && userData) {
        return {
          user: JSON.parse(userData),
          token,
        };
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // ✅ ADD THESE NEW METHODS:
  async setAddNewAccountMode() {
    try {
      await AsyncStorage.setItem('addNewAccountMode', 'true');
      console.log('Add new account mode set');
    } catch (error) {
      console.error('Error setting add new account mode:', error);
    }
  }

  async isAddNewAccountMode() {
    try {
      const mode = await AsyncStorage.getItem('addNewAccountMode');
      return mode === 'true';
    } catch (error) {
      console.error('Error checking add new account mode:', error);
      return false;
    }
  }

  async clearAddNewAccountMode() {
    try {
      await AsyncStorage.removeItem('addNewAccountMode');
      console.log('Add new account mode cleared');
    } catch (error) {
      console.error('Error clearing add new account mode:', error);
    }
  }

  generateToken() {
    return 'local_token_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  async markForSync(action, data) {
    try {
      const pendingSync = await AsyncStorage.getItem('pending_sync');
      const syncData = pendingSync ? JSON.parse(pendingSync) : [];
      
      syncData.push({
        id: Date.now().toString(),
        action,
        data,
        timestamp: new Date().toISOString(),
        synced: false,
      });

      await AsyncStorage.setItem('pending_sync', JSON.stringify(syncData));
    } catch (error) {
      console.error('Mark for sync error:', error);
    }
  }

  async syncWithServer() {
    try {
      const pendingSync = await AsyncStorage.getItem('pending_sync');
      if (!pendingSync) return;

      const syncData = JSON.parse(pendingSync);
      const unsynced = syncData.filter(item => !item.synced);

      console.log('Sync with server - Ready for implementation');
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
}

export default new AuthService();