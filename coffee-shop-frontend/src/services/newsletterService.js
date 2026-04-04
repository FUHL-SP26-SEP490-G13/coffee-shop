import axiosClient from "@/services/axiosClient";

const newsletterService = {
  subscribe: (email) => {
    return axiosClient.post("/newsletters/subscribe", { email });
  },
  
  getAll: (params) => {
    return axiosClient.get("/newsletters", { params });
  },

  toggleActive: (id) => {
    return axiosClient.put(`/newsletters/${id}/toggle`);
  },

  broadcast: (data) => {
    return axiosClient.post("/newsletters/broadcast", data);
  }
};

export default newsletterService;
