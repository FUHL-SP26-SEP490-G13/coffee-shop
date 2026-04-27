import axiosClient from "./axiosClient";

const cashSessionService = {
  getCurrent: async () => {
    return await axiosClient.get("/cash-sessions/current");
  },
  getMyCurrentShift: async () => {
    return await axiosClient.get("/cash-sessions/my-shift");
  },
  openSession: async (data) => {
    return await axiosClient.post("/cash-sessions/open", data);
  },
  closeSession: async (id, data) => {
    return await axiosClient.post(`/cash-sessions/${id}/close`, data);
  },
  getSummary: async (id) => {
    return await axiosClient.get(`/cash-sessions/${id}/summary`);
  },
  getReceipt: async (id) => {
    return await axiosClient.get(`/cash-sessions/${id}/receipt`);
  },
  getHistory: async (params) => {
    return await axiosClient.get("/cash-sessions", { params });
  },
  getMyHistory: async (params) => {
    return await axiosClient.get("/cash-sessions/my-history", { params });
  },
};

export default cashSessionService;
