import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../constants';

const { BASE, BY_ID } = API_ENDPOINTS.CATEGORIES;

const categoryService = {
  // Get all categories
  getAll(params) {
    return axiosClient.get(BASE, { params });
  },

  // Create new category
  create(formData) {
    return axiosClient.post(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Update category
  update(id, formData) {
    return axiosClient.put(BY_ID(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Delete category
  delete(id) {
    return axiosClient.delete(BY_ID(id));
  },
};

export default categoryService;