import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const receiptSettingService = {
  getActive() {
    return axiosClient.get(API_ENDPOINTS.RECEIPT_SETTINGS.BASE);
  },

  upsert(data) {
    return axiosClient.put(API_ENDPOINTS.RECEIPT_SETTINGS.ADMIN, data);
  },
};

export default receiptSettingService;
