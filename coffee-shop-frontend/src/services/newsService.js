import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const newsService = {
  getFeatured: (params) => axiosClient.get(API_ENDPOINTS.NEWS.FEATURED, { params }),

  getAll: (params) => {
    return axiosClient.get(API_ENDPOINTS.NEWS.BASE, { params });
  },

  getDetail: (slug) => axiosClient.get(`${API_ENDPOINTS.NEWS.BASE}/${slug}`),

  delete: (id) => axiosClient.delete(`${API_ENDPOINTS.NEWS.BASE}/${id}`),

  getAllAdmin(page = 1, keyword = "", sort = "") {
    return axiosClient.get(API_ENDPOINTS.NEWS.ADMIN, {
      params: { page, limit: 7, keyword, sort },
    });
  },

  update: (id, data, config = {}) =>
    axiosClient.put(`${API_ENDPOINTS.NEWS.BASE}/${id}`, data, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
        ...(config.headers || {}),
      },
    }),

  getById: (id) => axiosClient.get(`${API_ENDPOINTS.NEWS.ADMIN}/${id}`),

  create: (data, config = {}) =>
    axiosClient.post(API_ENDPOINTS.NEWS.BASE, data, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
        ...(config.headers || {}),
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
