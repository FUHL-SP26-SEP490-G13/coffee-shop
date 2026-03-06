import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const tableService = {
  getAll: async () => {
    const response = await axios.get(`${API_URL}/tables`);
    return response.data;
  },

  getByArea: async (areaId) => {
    const response = await axios.get(`${API_URL}/tables/area/${areaId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post(`${API_URL}/tables`, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`${API_URL}/tables/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/tables/${id}`);
    return response.data;
  }
};

export default tableService;
