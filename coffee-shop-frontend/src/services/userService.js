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
  }
};

export default userService;