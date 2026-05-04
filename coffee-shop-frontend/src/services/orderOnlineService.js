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
  getReputationByPhone(phoneNumber) {
    return axiosClient.get(`/reputation/by-phone?phone=${encodeURIComponent(phoneNumber)}`);
  },

  validateDiscount(data) {
    return axiosClient.post("/order-online/validate-discount", data);
  },

  checkout(data) {
    return axiosClient.post(API_ENDPOINTS.ORDER_ONLINE.CHECKOUT, data);
  },

  checkoutQr(data) {
    return axiosClient.post("/qr-order/checkout", data);
  },

  // PayOS QR: step 1 - validate cart and get totals (no DB save)
  validateQrCart(data) {
    return axiosClient.post("/qr-order/validate", data);
  },

  // PayOS QR: step 2 - confirm and save order after payment success
  confirmQrAfterPayment(data) {
    return axiosClient.post("/qr-order/confirm", data);
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

  cancel(id, payload) {
    return axiosClient.put(API_ENDPOINTS.ORDER_ONLINE.CANCEL(id), payload);
  },

  cancelByStaff(id, payload) {
    return axiosClient.put(API_ENDPOINTS.ORDER_ONLINE.STAFF_CANCEL(id), payload);
  },

  confirmPreparing(id) {
    return axiosClient.put(API_ENDPOINTS.ORDER_ONLINE.CONFIRM_PREPARING(id));
  },

  markPrintSuccess(id) {
    return axiosClient.put(API_ENDPOINTS.ORDER_ONLINE.MARK_PRINT_SUCCESS(id));
  },

  markDeliveringByStaff(id) {
    return axiosClient.put(API_ENDPOINTS.ORDER_ONLINE.MARK_DELIVERING(id));
  },

  cancelDeliveringByStaff(id) {
    return axiosClient.put(
      API_ENDPOINTS.ORDER_ONLINE.STAFF_CANCEL_DELIVERING(id)
    );
  },

  completeDeliveryByStaff(id, payload = {}) {
    return axiosClient.put(
      API_ENDPOINTS.ORDER_ONLINE.STAFF_COMPLETE_DELIVERY(id),
      payload
    );
  },

  createPaymentLink(data) {
    return _payosAxios.post("/create-payment-link", data);
  },

  savePayosReturn(data) {
    return axiosClient.post(API_ENDPOINTS.ORDER_ONLINE.PAYOS_RETURN, data);
  },
};

export default orderOnlineService;
