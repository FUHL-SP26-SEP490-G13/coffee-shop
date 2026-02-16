import axiosClient from "@/services/axiosClient";

const newsService = {
  getFeatured: () => axiosClient.get("/news/featured"),
  getAll: () => axiosClient.get("/news"),
  getDetail: (slug) => axiosClient.get(`/news/${slug}`),
};

export default newsService;


