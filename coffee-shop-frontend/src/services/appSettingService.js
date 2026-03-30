import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../constants";

const appSettingService = {
  getSettings: () => {
    return axiosClient.get(API_ENDPOINTS.RECEIPT_SETTINGS.BASE);
  },
  
  upsertSettings: (data) => {
    const formData = new FormData();
    if (data.reputation_rules !== undefined) {
      formData.append("reputation_rules", data.reputation_rules);
    }
    return axiosClient.put(API_ENDPOINTS.RECEIPT_SETTINGS.ADMIN, formData);
  }
};

export default appSettingService;
