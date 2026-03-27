import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../constants';

const { BASE, BY_ID } = API_ENDPOINTS.SHIFT_TEMPLATES;

const shiftTemplateService = {
  // Lấy tất cả ca làm việc mẫu
  getAll() {
    return axiosClient.get(BASE);
  },

  // Tạo ca làm việc mới
  // data: { name, start_time, end_time, color }
  create(data) {
    return axiosClient.post(BASE, data);
  },

  // Cập nhật ca làm việc
  // data: { name?, start_time?, end_time?, color? }
  update(id, data) {
    return axiosClient.put(BY_ID(id), data);
  },

  // Xóa ca làm việc
  delete(id) {
    return axiosClient.delete(BY_ID(id));
  },
};

export default shiftTemplateService;
