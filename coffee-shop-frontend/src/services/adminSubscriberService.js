import axios from "@/services/axiosClient";

const adminSubscriberService = {
  getAll() {
    return axios.get("/subscriber");
  },

  delete(id) {
    return axios.delete(`/subscriber/${id}`);
  },
};

export default adminSubscriberService;
