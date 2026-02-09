import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../constants';

const categoryService = {
  // Lấy tất cả danh mục
  getAll(params) {
    return axiosClient.get(API_ENDPOINTS.CATEGORIES, { params });
  },

  // Lấy chi tiết 1 danh mục theo ID
  getById(id) {
    const url = `${API_ENDPOINTS.CATEGORIES}/${id}`;
    return axiosClient.get(url);
  },

  // Tạo mới danh mục
  create(data) {
    return axiosClient.post(API_ENDPOINTS.CATEGORIES, data);
  },

  // Cập nhật danh mục
  update(id, data) {
    const url = `${API_ENDPOINTS.CATEGORIES}/${id}`;
    return axiosClient.put(url, data);
  },

  // Xóa danh mục
  remove(id) {
    const url = `${API_ENDPOINTS.CATEGORIES}/${id}`;
    return axiosClient.delete(url);
  }
};

export default categoryService;