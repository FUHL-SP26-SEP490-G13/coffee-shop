import axiosClient from "./axiosClient";

const adminDashboardService = {
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

  // Optional: doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
  getOrderTypeRevenue: async (days = 7) => {
    const res = await axiosClient.get(`/dashboard/order-type?days=${days}`);
    return res.data;
  },

  // Optional: tóm tắt tình trạng bàn (occupied, available) để dashboard có thêm vài số liệu hữu ích, hợp DB vì có status trong bảng tables rồi, khỏi phải đoán dựa vào order hay gì đó
  getTableStatusSummary: async () => {
    const res = await axiosClient.get("/dashboard/table-status");
    return res.data;
  },

  // Optional: so sánh doanh thu, số đơn hàng, khách hàng mới,... giữa 2 khoảng thời gian (ví dụ: tuần này vs tuần trước, tháng này vs tháng trước) để xem xu hướng tăng giảm
  getComparison: async (days = 7) => {
    const res = await axiosClient.get(`/dashboard/comparison?days=${days}`);
    return res.data;
  },

  // Optional: tóm tắt số lượng nhân viên theo vai trò (barista, phục vụ, quản lý) để dashboard có thêm vài số liệu hữu ích
  getStaffSummary: async () => {
    const res = await axiosClient.get("/dashboard/staff-summary");
    console.log("API staff summary response:", res.data);
    return res.data;
  },
};

export default adminDashboardService;
