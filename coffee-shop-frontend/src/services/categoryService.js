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
  getById(id) {
    return axiosClient.get(`/categories/${id}`);
  },

  // Create new category
  create(data) {
    const formData = new FormData();

    formData.append('name', data.name);

    if (data.image) {
      formData.append('image', data.image);
    }

    return axiosClient.post('/categories', formData);
  },

  // Update category
  update(id, data) {
    return axiosClient.put(`/categories/${id}`, data, {
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
