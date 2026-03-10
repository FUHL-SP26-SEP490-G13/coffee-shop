import axiosClient from "./axiosClient";

const orderService = {
  checkout(data) {
    return axiosClient.post("/orders/checkout", data);
  },

  getMyOrders() {
    return axiosClient.get("/orders/my-orders");
  },

  getMyOrderDetail(id) {
    return axiosClient.get(`/orders/my-orders/${id}`);
  },

  cancel(id) {
    return axiosClient.put(`/orders/${id}/cancel`);
  },
};

export default orderService;
