import { STORAGE_KEYS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const userService = {
  getAllUsers: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    // Add ?limit=1000 to bypass the backend default limit of 20, since AdminUsers does client-side filtering/pagination
    const response = await fetch(`${API_URL}/users?limit=1000`, {
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

  // Lấy thông tin profile hiện tại
  getProfile: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  },

  // Cập nhật thông tin profile
  updateProfile: async (data) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update profile';

      try {
        const error = await response.json();
        if (error?.message) {
          errorMessage = error.message;
        }
      } catch {
        // Keep fallback message when response is not JSON
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  },

  getMyAddresses: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/address`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch addresses');
    }

    return await response.json();
  },

  createAddress: async (payload) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create address';

      try {
        const error = await response.json();
        if (error?.message) {
          errorMessage = error.message;
        }
      } catch {
        // Keep fallback message when response is not JSON
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  },

  updateAddress: async (addressId, payload) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/address/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update address';

      try {
        const error = await response.json();
        if (error?.message) {
          errorMessage = error.message;
        }
      } catch {
        // Keep fallback message when response is not JSON
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  },

  deleteAddress: async (addressId) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/address/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete address';

      try {
        const error = await response.json();
        if (error?.message) {
          errorMessage = error.message;
        }
      } catch {
        // Keep fallback message when response is not JSON
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  },

  setDefaultAddress: async (addressId) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/address/${addressId}/default`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to set default address';

      try {
        const error = await response.json();
        if (error?.message) {
          errorMessage = error.message;
        }
      } catch {
        // Keep fallback message when response is not JSON
      }

      throw new Error(errorMessage);
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