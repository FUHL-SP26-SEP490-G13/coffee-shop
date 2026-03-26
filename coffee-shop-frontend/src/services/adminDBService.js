import axiosClient from "./axiosClient";

const adminDBService = {
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

  // Optional: doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
  getOrderTypeRevenue: async (days = 7) => {
    const res = await axiosClient.get(`/dashboard/order-type?days=${days}`);
    return res.data;
  },

  // Optional: so sánh doanh thu, số đơn hàng, khách hàng mới,... giữa 2 khoảng thời gian (ví dụ: tuần này vs tuần trước, tháng này vs tháng trước) để xem xu hướng tăng giảm
  getComparison: async (days = 7) => {
    const res = await axiosClient.get(`/dashboard/comparison?days=${days}`);
    return res.data;
  },


};

export default adminDBService;
