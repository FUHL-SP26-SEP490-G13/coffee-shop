import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const loyaltyService = {
  getMyLoyalty() {
    return axiosClient.get(API_ENDPOINTS.LOYALTY.ME);
  },

  getMyTransactions(params = {}) {
    return axiosClient.get(API_ENDPOINTS.LOYALTY.MY_TRANSACTIONS, { params });
  },
};

export default loyaltyService;
