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

const orderService = {
  validateDiscount(data) {
    return axiosClient.post("/orders/validate-discount", data);
  },

  checkout(data) {
    return axiosClient.post(API_ENDPOINTS.ORDERSLIST.CHECKOUT, data);
  },

  getMyOrders() {
    return axiosClient.get(API_ENDPOINTS.ORDERSLIST.MY_ORDERS);
  },

  getMyOrderDetail(id) {
    return axiosClient.get(API_ENDPOINTS.ORDERSLIST.MY_ORDER_DETAIL(id));
  },

  cancel(id) {
    return axiosClient.put(API_ENDPOINTS.ORDERSLIST.CANCEL(id));
  },

  createPaymentLink(data) {
    return _payosAxios.post("/create-payment-link", data);
  },

  savePayosReturn(data) {
    return axiosClient.post(API_ENDPOINTS.ORDERSLIST.PAYOS_RETURN, data);
  },

  getAllOrders(params) {
    return axiosClient.get(API_ENDPOINTS.ORDERSLIST.ADMIN_LIST, { params });
  },
};

export default orderService;
