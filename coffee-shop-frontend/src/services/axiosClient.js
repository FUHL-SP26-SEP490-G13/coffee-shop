import axios from 'axios';
import { STORAGE_KEYS } from '../constants';

const getStoredToken = () =>
  localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
  sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho Request: Tự động đính token vào mỗi request nếu có
axiosClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho Response: Xử lý dữ liệu trả về và lỗi
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về thẳng data để khi dùng không cần .data nữa
    return response.data;
  },
  (error) => {
    // Ví dụ: Nếu 401 (Unauthorized) thì logout user
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ROLE_ID);
      sessionStorage.removeItem(STORAGE_KEYS.ROLE_ID);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;