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

  // Search products
  search(params) {
    return axiosClient.get("/products/search", { params });
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

  // Restore product (nếu cần sau này)
  // restore(id) {
  //   return axiosClient.post(`/products/${id}/restore`);
  // },

  getBestSellers(params) {
    return axiosClient.get("/products/best-sellers", { params });
  },
};

export default productService;