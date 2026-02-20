import axios from "@/services/axiosClient";

const bannerService = {
  getActive() {
    return axios.get("/banners/active");
  },

  getAll() {
    return axios.get("/banners/admin");
  },

  create(data) {
    return axios.post("/banners/admin", data);
  },

  update(id, data) {
    return axios.put(`/banners/admin/${id}`, data);
  },
};

export default bannerService;
