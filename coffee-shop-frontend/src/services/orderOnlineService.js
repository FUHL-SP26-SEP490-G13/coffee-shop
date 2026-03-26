import axios from "axios";
import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "@/constants";

const _payosAxios = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
    /\/api\/?$/,
    ""
  ),
  headers: { "Content-Type": "application/json" },
});

const orderOnlineService = {
  validateDiscount(data) {
    return axiosClient.post("/order-online/validate-discount", data);
  },

  checkout(data) {
    return axiosClient.post(API_ENDPOINTS.ORDER_ONLINE.CHECKOUT, data);
  },

  checkoutQr(data) {
    return axiosClient.post("/qr-order/checkout", data);
  },

  getMyOrders() {
    return axiosClient.get(API_ENDPOINTS.ORDER_ONLINE.MY_ORDERS);
  },

  getMyOrderDetail(id) {
    return axiosClient.get(API_ENDPOINTS.ORDER_ONLINE.MY_ORDER_DETAIL(id));
  },

  getStaffOrderDetail(id) {
    return axiosClient.get(API_ENDPOINTS.ORDER_ONLINE.STAFF_ORDER_DETAIL(id));
  },

  cancel(id) {
    return axiosClient.put(API_ENDPOINTS.ORDER_ONLINE.CANCEL(id));
  },

  cancelByStaff(id) {
    return axiosClient.put(API_ENDPOINTS.ORDER_ONLINE.STAFF_CANCEL(id));
  },

  confirmPreparing(id) {
    return axiosClient.put(API_ENDPOINTS.ORDER_ONLINE.CONFIRM_PREPARING(id));
  },

  createPaymentLink(data) {
    return _payosAxios.post("/create-payment-link", data);
  },

  savePayosReturn(data) {
    return axiosClient.post(API_ENDPOINTS.ORDER_ONLINE.PAYOS_RETURN, data);
  },
};

export default orderOnlineService;
