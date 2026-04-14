import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "@/constants";

const attendanceService = {

  clock(pinCode) {
    return axiosClient.post(API_ENDPOINTS.ATTENDANCE.CLOCK, { pin_code: pinCode });
  },

  // params: page, limit, startDate, endDate, userId, status
  getAll(params) {
    return axiosClient.get(API_ENDPOINTS.ATTENDANCE.BASE, { params });
  },

  updateAttendance(id, note) {
    return axiosClient.put(API_ENDPOINTS.ATTENDANCE.BY_ID(id), { note });
  },
};

export default attendanceService;
