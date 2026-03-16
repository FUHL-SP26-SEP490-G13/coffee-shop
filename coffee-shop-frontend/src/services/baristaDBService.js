import axiosClient from "@/services/axiosClient";

const baristaDBService = {
  getOverview: async () => {
    return await axiosClient.get("/barista/dashboard");
  },

  getOrders: async (status = null) => {
    const url = status ? `/orders?status=${status}` : "/orders";
    return await axiosClient.get(url);
  },

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

  updateOrderStatus: async (orderId, status) => {
    return await axiosClient.put(`/orders/${orderId}/status`, { status });
  },
};

export default baristaDBService;
