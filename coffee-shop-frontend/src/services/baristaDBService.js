import axiosClient from "@/services/axiosClient";

const baristaDBService = {
  getOverview: async () => {
    return await axiosClient.get("/barista/dashboard");
  },

  // COMMENT TẠM: Lấy danh sách các Orders (tất cả các phương thức đặt hàng) 
  // đang ở trạng thái "preparing"

  // getOrders: async (status = null) => {
  //   const url = status ? `/orders?status=${status}` : "/orders";
  //   return await axiosClient.get(url);
  // },

  getOrderTrends: async (hours = 6) => {
    return await axiosClient.get(`/barista/dashboard/trends?hours=${hours}`);
  },

  getActiveOrders: async () => {
    return await axiosClient.get("/barista/dashboard/active-orders");
  },

  getDelayedOrders: async (minutes = 15) => {
    return await axiosClient.get(
      `/barista/dashboard/delayed-orders?minutes=${minutes}`
    );
  },

  getTopProductsToday: async (limit = 5) => {
    return await axiosClient.get(
      `/barista/dashboard/top-products?limit=${limit}`
    );
  },

  // COMMENT TẠM: Cập nhật trạng thái Order sau khi làm xong 
  // (ví dụ: từ "preparing" sang "served" hoặc "delivered" (trường hợp đặt hàng 
  // theo giao hàng online))

  // updateOrderStatus: async (orderId, status) => {
  //   return await axiosClient.put(`/orders/${orderId}/status`, { status });
  // },
};

export default baristaDBService;
