import axios from "@/services/axiosClient";

const newsletterService = {
  getAll() {
    return axios.get("/news-letter");
  },

  delete(id) {
    return axios.delete(`/news-letter/${id}`);
  },
};

export default newsletterService;
