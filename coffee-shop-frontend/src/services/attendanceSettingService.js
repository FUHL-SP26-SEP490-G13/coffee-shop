import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "@/constants";

const attendanceSettingService = {
  getSetting() {
    return axiosClient.get(API_ENDPOINTS.ATTENDANCE_SETTINGS.BASE);
  },

  updateSetting(data) {
    return axiosClient.put(API_ENDPOINTS.ATTENDANCE_SETTINGS.BASE, data);
  },
};

export default attendanceSettingService;
