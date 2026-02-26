import axiosClient from "./axiosClient";

const orderService = {
  // Lấy tất cả đơn của user đang login
  getMyOrders() {
    return axiosClient.get("/orders/my");
  },

  // Lấy chi tiết đơn hàng
  getById(id) {
    return axiosClient.get(`/orders/${id}`);
  },

  // Tạo đơn mới (checkout)
  create(data) {
    return axiosClient.post("/orders", data);
  },

  // Hủy đơn hàng
  cancel(id) {
    return axiosClient.put(`/orders/${id}/cancel`);
  },
};

export default orderService;
