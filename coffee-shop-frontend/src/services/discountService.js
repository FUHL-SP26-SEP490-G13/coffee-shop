import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const discountService = {
  getAll: async (params = {}, signal) => {
    const res = await axiosClient.get(API_ENDPOINTS.DISCOUNTS, {
      params,
      signal,
    });
    return res.data;
  },

  getById: async (id) => {
    const res = await axiosClient.get(`${API_ENDPOINTS.DISCOUNTS}/${id}`);
    return res.data;
  },

  create: (data) => axiosClient.post(API_ENDPOINTS.DISCOUNTS, data),

  update: (id, data) =>
    axiosClient.put(`${API_ENDPOINTS.DISCOUNTS}/${id}`, data),

  delete: (id) => axiosClient.delete(`${API_ENDPOINTS.DISCOUNTS}/${id}`),
};

export default discountService;
