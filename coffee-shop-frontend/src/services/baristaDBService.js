import axiosClient from "@/services/axiosClient";

const baristaDBService = {
  getOverview: async () => {
    const res = await axiosClient.get("/barista/dashboard");
    return res.data || res;
  },

  getOrders: async (status = null) => {
    const url = status ? `/orders?status=${status}` : "/orders";
    const res = await axiosClient.get(url);
    return res.data || res;
  },

  getOrderTrends: async (hours = 6) => {
    const res = await axiosClient.get(
      `/barista/dashboard/trends?hours=${hours}`
    );
    return res.data || res;
  },

  updateOrderStatus: async (orderId, status) => {
    const res = await axiosClient.put(`/orders/${orderId}/status`, {
      status,
    });
    return res.data || res;
  },
};

export default baristaDBService;
