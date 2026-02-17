import axiosClient from "@/services/axiosClient";

const newsService = {
  getFeatured: () => axiosClient.get("/news/featured"),

  getAll: (params) => {
    return axiosClient.get("/news", { params });
  },

  getDetail: (slug) => axiosClient.get(`/news/${slug}`),
  delete: (id) => axiosClient.delete(`/news/${id}`),
  getAllAdmin: () => axiosClient.get("/news/admin"),
  update: (id, data) => axiosClient.put(`/news/${id}`, data),
  create: (data) =>
    axiosClient.post("/news", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

export default newsService;
