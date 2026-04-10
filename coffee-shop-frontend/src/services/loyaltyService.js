import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const loyaltyService = {
  getMyLoyalty() {
    return axiosClient.get(API_ENDPOINTS.LOYALTY.ME);
  },

  getMyTransactions(params = {}) {
    return axiosClient.get(API_ENDPOINTS.LOYALTY.MY_TRANSACTIONS, { params });
  },

  getAdminCustomerList({ page = 1, limit = 20, keyword = "" } = {}) {
    return axiosClient.get(API_ENDPOINTS.LOYALTY.ADMIN_CUSTOMERS, {
      params: {
        page,
        limit,
        keyword,
      },
    });
  },

  getAdminCustomerDetail(userId) {
    return axiosClient.get(API_ENDPOINTS.LOYALTY.ADMIN_USER_DETAIL(userId));
  },

  getAdminCustomerTransactions(userId, params = {}) {
    return axiosClient.get(API_ENDPOINTS.LOYALTY.ADMIN_USER_TRANSACTIONS(userId), {
      params,
    });
  },

  adjustCustomerPoints(userId, payload) {
    return axiosClient.post(API_ENDPOINTS.LOYALTY.ADMIN_USER_ADJUST(userId), payload);
  },
};

export default loyaltyService;
