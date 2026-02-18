import axiosClient from "./axiosClient";

const dashboardService = {
  getOverview: async () => {
    const res = await axiosClient.get("/dashboard");
    // axiosClient trả về response.data rồi
    return res.data;
  },

  getRevenueSeries: async (days = 7) => {
    const res = await axiosClient.get(`/dashboard/revenue?days=${days}`);
    return res.data;
  },

  getTopProducts: async ({ days = 7, limit = 5 } = {}) => {
    const res = await axiosClient.get(
      `/dashboard/top-products?days=${days}&limit=${limit}`
    );
    return res.data;
  },

  getPaymentMethodBreakdown: async (days = 7) => {
    const res = await axiosClient.get(`/dashboard/payment-method?days=${days}`);
    return res.data;
  },
};

export default dashboardService;
