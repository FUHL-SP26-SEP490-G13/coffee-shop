import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "@/constants";

const productService = {
  // Get all products
  getAll(params) {
    return axiosClient.get(API_ENDPOINTS.PRODUCTSLIST.BASE, { params });
  },

  // Get product by ID
  getById(id) {
    return axiosClient.get(API_ENDPOINTS.PRODUCTSLIST.BY_ID(id));
  },

  // Get products by category
  getByCategory(categoryId, params) {
    return axiosClient.get(API_ENDPOINTS.PRODUCTSLIST.BY_CATEGORY(categoryId), {
      params,
    });
  },

  // Search products
  search(params) {
    return axiosClient.get(API_ENDPOINTS.PRODUCTSLIST.SEARCH, { params });
  },

  // Create new product
  create(formData) {
    return axiosClient.post(API_ENDPOINTS.PRODUCTSLIST.BASE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Update product
  update(id, formData) {
    return axiosClient.put(API_ENDPOINTS.PRODUCTSLIST.BY_ID(id), formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Delete product
  delete(id) {
    return axiosClient.delete(API_ENDPOINTS.PRODUCTSLIST.BY_ID(id));
  },

  // Best sellers
  getBestSellers(params) {
    return axiosClient.get(API_ENDPOINTS.PRODUCTSLIST.BEST_SELLERS, { params });
  },
};

export default productService;
