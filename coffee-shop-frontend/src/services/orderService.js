import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "@/constants";

const orderService = {
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
};

export default orderService;
