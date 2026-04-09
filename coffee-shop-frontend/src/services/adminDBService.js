import axiosClient from "./axiosClient";

const adminDBService = {
  getOverview: async () => {
    const res = await axiosClient.get("/dashboard");
    // axiosClient trả về response.data rồi
    return res.data;
  },

  getRevenueSeries: async ({ startDate, endDate }) => {
    const res = await axiosClient.get(
      `/dashboard/revenue?startDate=${startDate}&endDate=${endDate}`
    );
    return res.data;
  },

  getTopProducts: async ({ startDate, endDate, limit = 5 } = {}) => {
    const res = await axiosClient.get(
      `/dashboard/top-products?startDate=${startDate}&endDate=${endDate}&limit=${limit}`
    );
    return res.data;
  },

  // Optional: doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
  getOrderTypeRevenue: async ({ startDate, endDate }) => {
    const res = await axiosClient.get(
      `/dashboard/order-type?startDate=${startDate}&endDate=${endDate}`
    );
    return res.data;
  },

  // Optional: so sánh doanh thu, số đơn hàng, khách hàng mới,... giữa 2 khoảng thời gian
  getComparison: async ({
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  }) => {
    const res = await axiosClient.get(
      `/dashboard/comparison?startDate=${startDate}&endDate=${endDate}&prevStartDate=${prevStartDate}&prevEndDate=${prevEndDate}`
    );
    return res.data;
  },


};

export default adminDBService;
