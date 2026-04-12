import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../constants';

const { ASSIGN, ASSIGN_BULK, REGISTRATION_BY_ID, SCHEDULE, MY_SCHEDULE, COLLEAGUES } = API_ENDPOINTS.SHIFTS;

const shiftService = {
  // Gán ca từng ngày lẻ (manager assign cho 1 nhân viên)
  // data: { date, user_id, template_id }
  assignSingle(data) {
    return axiosClient.post(ASSIGN, data);
  },

  // Gán ca hàng loạt theo tuần
  // data: { start_date, weeks, assignments: [{ user_id, template_id, days_of_week }] }
  assignBulk(data) {
    return axiosClient.post(ASSIGN_BULK, data);
  },

  // Xóa nhân viên khỏi ca (soft delete)
  removeRegistration(registrationId) {
    return axiosClient.delete(REGISTRATION_BY_ID(registrationId));
  },

  // Lấy lịch tổng quan toàn bộ nhân viên
  // params: { start_date, end_date }
  getSchedule(params) {
    return axiosClient.get(SCHEDULE, { params });
  },

  // Lấy lịch của nhân viên đang đăng nhập
  // params: { start_date, end_date }
  getMySchedule(params) {
    return axiosClient.get(MY_SCHEDULE, { params });
  },

  // Lấy danh sách đồng nghiệp cùng role, isActive=1
  getColleagues() {
    return axiosClient.get(COLLEAGUES);
  },
};

export default shiftService;
