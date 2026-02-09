import axios from 'axios';
import { STORAGE_KEYS } from '../constants';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho Request: Tự động đính token vào mỗi request nếu có
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;