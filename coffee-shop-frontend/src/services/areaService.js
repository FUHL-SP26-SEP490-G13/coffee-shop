import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../constants";

const areaService = {
  /**
   * Get all areas
   */
  getAll: async () => {
    return axiosClient.get(API_ENDPOINTS.AREAS);
  },

  /**
   * Get area by ID
   */
  getById: async (id) => {
    return axiosClient.get(`${API_ENDPOINTS.AREAS}/${id}`);
  },

  /**
   * Create new area
   */
  create: async (data) => {
    const isFormData = data instanceof FormData;
    const headers = {};
    if (isFormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }
    
    return axiosClient.post(API_ENDPOINTS.AREAS, data, { headers });
  },

  /**
   * Update area
   */
  update: async (id, data) => {
    const isFormData = data instanceof FormData;
    const headers = {};
    if (isFormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }
    
    return axiosClient.put(`${API_ENDPOINTS.AREAS}/${id}`, data, { headers });
  },

  /**
   * Delete area
   */
  delete: async (id) => {
    return axiosClient.delete(`${API_ENDPOINTS.AREAS}/${id}`);
  },
};

export default areaService;

