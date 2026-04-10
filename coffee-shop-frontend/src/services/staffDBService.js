import axiosClient from "./axiosClient";

const staffDBService = {
  getOverview() {
    return axiosClient.get("/staff-db/overview");
  },
};

export default staffDBService;
