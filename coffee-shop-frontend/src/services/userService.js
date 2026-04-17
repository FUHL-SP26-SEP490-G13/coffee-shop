import { STORAGE_KEYS } from '../constants';

const API_URL = 'http://localhost:5000/api';

const userService = {
  getAllUsers: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    const response = await fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return await response.json();
  },

  // Lấy danh sách nhân viên (staff + barista) - dùng cho gán ca
  getStaff: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/staff`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch staff');
    return await response.json();
  },

  createStaff: async (payload) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create staff';

      try {
        const error = await response.json();
        if (Array.isArray(error?.errors) && error.errors.length > 0) {
          errorMessage = error.errors.map((item) => item.message).join(', ');
        } else if (error?.message) {
          errorMessage = error.message;
        }
      } catch {
        // Keep fallback message when response is not JSON
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  },

  toggleUserStatus: async (userId, currentStatus, password) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const endpoint = currentStatus === 1 ? 'deactivate' : 'activate';

    const response = await fetch(`${API_URL}/users/${userId}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle user status');
    }

    return await response.json();
  },

  generatePin: async (userId) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/${userId}/generate-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate PIN');
    }

    return await response.json();
  },

  getUsersByRole: async (roleId) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/role/${roleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users by role');
    }

    return await response.json();
  },

  updateUser: async (userId, data) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }

    return await response.json();
  }
};

export default userService;