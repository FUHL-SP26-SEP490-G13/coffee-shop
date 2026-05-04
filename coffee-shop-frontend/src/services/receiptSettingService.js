import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const receiptSettingService = {
  getActive() {
    return axiosClient.get(API_ENDPOINTS.RECEIPT_SETTINGS.BASE);
  },

  upsert(data) {
    return axiosClient.put(API_ENDPOINTS.RECEIPT_SETTINGS.ADMIN, data);
  },

  getSettings() {
    return axiosClient.get(API_ENDPOINTS.RECEIPT_SETTINGS.BASE);
  },
  
  upsertSettings(data) {
    const formData = new FormData();
    if (data.reputation_rules !== undefined) {
      formData.append("reputation_rules", data.reputation_rules);
    }
    return axiosClient.put(API_ENDPOINTS.RECEIPT_SETTINGS.ADMIN, formData);
  }
};

export default receiptSettingService;
