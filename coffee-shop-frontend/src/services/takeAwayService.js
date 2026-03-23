import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '@/constants';

const takeawayService = {
  /**
   * Tạo đơn takeaway mới (gộp thanh toán luôn)
   * @param {{ items: Array, discount_code?: string, payment_method: 'cash'|'payos' }} payload
   */
  createOrder(payload) {
    return axiosClient.post(API_ENDPOINTS.TAKEAWAY.ORDERS, payload);
  },

  /**
   * Sửa đơn takeaway (chỉ khi status = 'pending', kể cả đã paid)
   * @param {number} orderId
   * @param {{ items: Array, discount_code?: string }} payload
   */
  updateOrder(orderId, payload) {
    return axiosClient.put(
      API_ENDPOINTS.TAKEAWAY.ORDER_BY_ID(orderId),
      payload,
    );
  },

  /**
   * Hủy đơn takeaway (chỉ khi status = 'pending', kể cả đã paid)
   * Response bao gồm refund nếu đơn đã paid
   * @param {number} orderId
   */
  cancelOrder(orderId) {
    return axiosClient.delete(API_ENDPOINTS.TAKEAWAY.CANCEL(orderId));
  },

  /**
   * Lấy hóa đơn chi tiết của đơn hàng
   * @param {number} orderId
   */
  getReceipt(orderId) {
    return axiosClient.get(API_ENDPOINTS.TAKEAWAY.RECEIPT(orderId));
  },

  /**
   * Barista nhận đơn (chuyển status pending → preparing)
   * Chỉ nhận được khi đơn đã paid
   * @param {number} orderId
   */
  assignOrder(orderId) {
    return axiosClient.post(API_ENDPOINTS.TAKEAWAY.ASSIGN(orderId));
  },

  /**
   * Barista đánh dấu đã làm xong (chuyển status preparing → served)
   * @param {number} orderId
   */
  markServed(orderId) {
    return axiosClient.post(API_ENDPOINTS.TAKEAWAY.SERVED(orderId));
  },

  /**
   * Staff xác nhận đã giao cho khách (chuyển status served → completed)
   * @param {number} orderId
   */
  markCompleted(orderId) {
    return axiosClient.post(API_ENDPOINTS.TAKEAWAY.COMPLETE(orderId));
  },
};

export default takeawayService;
