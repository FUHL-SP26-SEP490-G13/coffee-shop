import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../constants';

const { BASE, BY_ID, ACCEPT, REJECT, CANCEL } = API_ENDPOINTS.SWAP_REQUESTS;

const swapRequestService = {
  // Lấy danh sách yêu cầu đổi ca (cả gửi lẫn nhận)
  getMySwapRequests() {
    return axiosClient.get(BASE);
  },
  // Chi tiết 1 yêu cầu
  getSwapRequestById(id) {
    return axiosClient.get(BY_ID(id));
  },
  // Tạo yêu cầu đổi/nhường ca
  // data: { requester_shift_id, receiver_id, receiver_shift_id? }
  createSwapRequest(data) {
    return axiosClient.post(BASE, data);
  },
  // Chấp nhận yêu cầu
  acceptSwapRequest(id) {
    return axiosClient.post(ACCEPT(id));
  },
  // Từ chối yêu cầu
  rejectSwapRequest(id) {
    return axiosClient.post(REJECT(id));
  },
  // Hủy yêu cầu (chỉ người gửi, khi còn pending)
  cancelSwapRequest(id) {
    return axiosClient.post(CANCEL(id));
  },
};

export default swapRequestService;
