import axiosClient from "./axiosClient";

const adminDBService = {
  getOverview: async () => {
    const res = await axiosClient.get("/dashboard");
    // axiosClient trả về response.data rồi
    return res.data;
  },

  getRevenueSeries: async ({ startDate, endDate }) => {
    const res = await axiosClient.get(`/dashboard/revenue`, {
      params: { startDate, endDate },
    });
    return res.data;
  },

  getTopProducts: async ({ startDate, endDate, limit = 5 } = {}) => {
    const res = await axiosClient.get(`/dashboard/top-products`, {
      params: { startDate, endDate, limit },
    });
    return res.data;
  },

  // Optional: doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
  getOrderTypeRevenue: async ({ startDate, endDate }) => {
    const res = await axiosClient.get(`/dashboard/order-type`, {
      params: { startDate, endDate },
    });
    return res.data;
  },

  // Optional: so sánh doanh thu, số đơn hàng, khách hàng mới,... giữa 2 khoảng thời gian
  getComparison: async ({
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  }) => {
    const res = await axiosClient.get(`/dashboard/comparison`, {
      params: { startDate, endDate, prevStartDate, prevEndDate },
    });
    return res.data;
  },

  getPaymentMethodRevenue: async ({ startDate, endDate }) => {
    const res = await axiosClient.get(`/dashboard/payment-method`, {
      params: { startDate, endDate },
    });
    return res.data;
  },

  getOrdersSummary: async (startDate, endDate) => {
    const response = await axiosClient.get(`/dashboard/orders-summary`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getDetailedReport: async (startDate, endDate) => {
    const response = await axiosClient.get(`/dashboard/detailed-report`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getShiftReport: async (date) => {
    const res = await axiosClient.get(`/dashboard/shift-report`, {
      params: { date },
    });
    return res.data;
  },
  getProductReport: async (startDate, endDate) => {
    const response = await axiosClient.get(`/dashboard/product-report`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
  getTimeReport: async (startDate, endDate) => {
    const response = await axiosClient.get(`/dashboard/time-report`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default adminDBService;
