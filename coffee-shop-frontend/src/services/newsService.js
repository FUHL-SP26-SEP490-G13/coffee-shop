import axiosClient from "@/services/axiosClient";

const newsService = {
  getFeatured: () => axiosClient.get("/news/featured"),

  getAll: (params) => {
    return axiosClient.get("/news", { params });
  },

  getDetail: (slug) => axiosClient.get(`/news/${slug}`),
  delete: (id) => axiosClient.delete(`/news/${id}`),
  getAllAdmin(page = 1, keyword = "") {
    return axiosClient.get("/news/admin", {
      params: { page, limit: 10, keyword },
    });
  },
  update: (id, data) =>
    axiosClient.put(`/news/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  getById: (id) => axiosClient.get(`/news/admin/${id}`),
  create: (data) =>
    axiosClient.post("/news", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  getRelated(params) {
    return axiosClient.get("/news/related", { params });
  },
  suggestByTitle(data) {
    return axiosClient.post("/news/ai/suggest-by-title", data);
  },

  suggestBySummary(data) {
    return axiosClient.post("/news/ai/suggest-by-summary", data);
  },
};

export default newsService;
