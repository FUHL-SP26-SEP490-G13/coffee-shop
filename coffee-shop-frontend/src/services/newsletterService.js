import axios from "@/services/axiosClient";

const newsletterService = {
  getAll() {
    return axios.get("/newsletter/admin");
  },

  delete(id) {
    return axios.delete(`/newsletter/admin/${id}`);
  },
};

export default newsletterService;
