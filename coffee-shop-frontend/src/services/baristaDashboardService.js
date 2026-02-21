import axiosClient from "./axiosClient";

const baristaDashboardService = {
  // Get barista dashboard overview (orders by status, metrics)
  getOverview: async () => {
    try {
      const res = await axiosClient.get("/dashboard/barista");
      return res.data || res;
    } catch (error) {
      console.error("Error fetching barista overview:", error);
      return {
        totalOrders: 0,
        pendingOrders: 0,
        completedToday: 0,
        readyOrders: 0,
        preparingOrders: 0,
        avgPrepTime: 0,
      };
    }
  },

  // Get all orders for barista
  getOrders: async (status = null) => {
    try {
      const url = status ? `/orders?status=${status}` : "/orders";
      const res = await axiosClient.get(url);
      return res.data || res;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  },

  // Get order trends (last 6 hours)
  getOrderTrends: async (hours = 6) => {
    try {
      const res = await axiosClient.get(
        `/dashboard/barista/trends?hours=${hours}`
      );
      return res.data || res;
    } catch (error) {
      console.error("Error fetching trends:", error);
      return [
        { hour: 10, orders: 5 },
        { hour: 11, orders: 8 },
        { hour: 12, orders: 6 },
        { hour: 13, orders: 10 },
        { hour: 14, orders: 7 },
        { hour: 15, orders: 9 },
      ];
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const res = await axiosClient.put(`/orders/${orderId}/status`, {
        status,
      });
      return res.data || res;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },
};

export default baristaDashboardService;
