import axiosClient from "./axiosClient";

const cashSessionService = {
  getCurrent: async () => {
    return await axiosClient.get("/cash-sessions/current");
  },
  openSession: async (data) => {
    return await axiosClient.post("/cash-sessions/open", data);
  },
  closeSession: async (data) => {
    return await axiosClient.post("/cash-sessions/close", data);
  },
};

export default cashSessionService;
