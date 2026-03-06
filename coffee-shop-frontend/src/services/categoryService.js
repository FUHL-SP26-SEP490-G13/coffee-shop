import axiosClient from './axiosClient';

const categoryService = {
  // Get all categories
  getAll(params) {
    return axiosClient.get('/categories', { params });
  },

  // Search categories
  search(params) {
    return axiosClient.get('/categories/search', { params });
  },

  // Get category by ID
  getById(id, params) {
    return axiosClient.get(`/categories/${id}`, { params });
  },

  // Create new category
  create(formData) {
    return axiosClient.post('/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Update category
  update(id, formData) {
    return axiosClient.put(`/categories/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete category
  delete(id) {
    return axiosClient.delete(`/categories/${id}`);
  },

  // Restore deleted category
  restore(id) {
    return axiosClient.post(`/categories/${id}/restore`);
  },
};

export default categoryService;