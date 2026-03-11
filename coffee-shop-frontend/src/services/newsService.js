import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const newsService = {
  getFeatured: () => axiosClient.get(API_ENDPOINTS.NEWS.FEATURED),

  getAll: (params) => {
    return axiosClient.get(API_ENDPOINTS.NEWS.BASE, { params });
  },

  getDetail: (slug) => axiosClient.get(`${API_ENDPOINTS.NEWS.BASE}/${slug}`),

  delete: (id) => axiosClient.delete(`${API_ENDPOINTS.NEWS.BASE}/${id}`),

  getAllAdmin(page = 1, keyword = "") {
    return axiosClient.get(API_ENDPOINTS.NEWS.ADMIN, {
      params: { page, limit: 10, keyword },
    });
  },

  update: (id, data) =>
    axiosClient.put(`${API_ENDPOINTS.NEWS.BASE}/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getById: (id) => axiosClient.get(`${API_ENDPOINTS.NEWS.ADMIN}/${id}`),

  create: (data) =>
    axiosClient.post(API_ENDPOINTS.NEWS.BASE, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getRelated(params) {
    return axiosClient.get(API_ENDPOINTS.NEWS.RELATED, { params });
  },

  suggestByTitle(data) {
    return axiosClient.post(API_ENDPOINTS.NEWS.AI_SUGGEST_BY_TITLE, data);
  },

  suggestBySummary(data) {
    return axiosClient.post(API_ENDPOINTS.NEWS.AI_SUGGEST_BY_SUMMARY, data);
  },
};

export default newsService;
