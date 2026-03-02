import axiosClient from './axiosClient';

const productService = {

  // Get all products
  getAll(params) {
    return axiosClient.get("/products", { params });
  },

  // Get product by ID
  getById(id) {
    return axiosClient.get(`/products/${id}`);
  },

  // Get products by category
  getByCategory(categoryId, params) {
    return axiosClient.get(`/products/category/${categoryId}`, { params });
  },

  // Create new product
  create(formData) {
    return axiosClient.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Update product
  update(id, formData) {
    return axiosClient.put(`/products/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Delete product
  delete(id) {
    return axiosClient.delete(`/products/${id}`);
  },

  // (Nếu sau này bật lại restore ở backend)
  // restore(id) {
  //   return axiosClient.post(`/products/${id}/restore`);
  // },

};

export default productService;