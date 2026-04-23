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
   * Lấy hóa đơn chi tiết của đơn hàng
   * @param {number} orderId
   */
  getReceipt(orderId) {
    return axiosClient.get(API_ENDPOINTS.TAKEAWAY.RECEIPT(orderId));
  },
};

export default takeawayService;
