import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../constants';

const authenticationService = {

// Đăng nhập người dùng
  login(credentials) {
    return axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  // Gửi OTP đến email
  sendOTP(userId) {
    return axiosClient.post(API_ENDPOINTS.AUTH.SEND_OTP, { userId });
  },

  // Xác thực email bằng OTP
  verifyEmail(userId, otp) {
    return axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { userId, otp });
  },

  // Đăng nhập bằng Google
  googleLogin(accessToken, idToken) {
    const payload = { accessToken };
    if (idToken) {
      payload.idToken = idToken;
    }
    return axiosClient.post(API_ENDPOINTS.AUTH.GOOGLE, payload);
  },

// Đăng ký người dùng mới
  register(userInfo) {
    return axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, userInfo);
  },

// Đăng xuất người dùng
  logout() {
    // Xoá token, refresh token và role_id khỏi local storage hoặc session storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    return Promise.resolve();
  },

// Lấy thông tin profile hiện tại
  getProfile() {
    return axiosClient.get(API_ENDPOINTS.AUTH.PROFILE);
  }
};

export default authenticationService;