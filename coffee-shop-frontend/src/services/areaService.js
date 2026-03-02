import axios from "axios";
import { API_ENDPOINTS, STORAGE_KEYS } from "../constants";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const areaService = {
  /**
   * Get all areas
   */
  getAll: async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await axios.get(`${API_URL}${API_ENDPOINTS.AREAS}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get area by ID
   */
  getById: async (id) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await axios.get(`${API_URL}${API_ENDPOINTS.AREAS}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create new area
   */
  create: async (data) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await axios.post(`${API_URL}${API_ENDPOINTS.AREAS}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update area
   */
  update: async (id, data) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await axios.put(`${API_URL}${API_ENDPOINTS.AREAS}/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete area
   */
  delete: async (id) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await axios.delete(`${API_URL}${API_ENDPOINTS.AREAS}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default areaService;
