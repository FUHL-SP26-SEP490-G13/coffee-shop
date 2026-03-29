import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../constants";

const appSettingService = {
  getSettings: () => {
    return axiosClient.get(API_ENDPOINTS.APP_SETTINGS.BASE);
  },
  
  upsertSettings: (data) => {
    return axiosClient.put(API_ENDPOINTS.APP_SETTINGS.ADMIN, data);
  }
};

export default appSettingService;
