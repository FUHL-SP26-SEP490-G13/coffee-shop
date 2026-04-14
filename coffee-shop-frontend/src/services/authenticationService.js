import axiosClient from './axiosClient';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import { useCartStore } from '@/store/useCartStore';

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
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
    useCartStore.getState().clearCartMemory();
    return Promise.resolve();
  },

// Lấy thông tin profile hiện tại
  getProfile() {
    return axiosClient.get(API_ENDPOINTS.AUTH.PROFILE);
  },

  // Cập nhật thông tin profile
  updateProfile(data) {
    return axiosClient.put(API_ENDPOINTS.AUTH.PROFILE, data);
  },

  // Lấy danh sách địa chỉ của user hiện tại
  getMyAddresses() {
    return axiosClient.get('/auth/address');
  },

  // Thêm địa chỉ mới
  createAddress(payload) {
    return axiosClient.post('/auth/address', payload);
  },

  // Cập nhật địa chỉ
  updateAddress(addressId, payload) {
    return axiosClient.put(`/auth/address/${addressId}`, payload);
  },

  // Xóa địa chỉ
  deleteAddress(addressId) {
    return axiosClient.delete(`/auth/address/${addressId}`);
  },

  // Đặt địa chỉ mặc định
  setDefaultAddress(addressId) {
    return axiosClient.patch(`/auth/address/${addressId}/default`);
  },

  // Đổi mật khẩu
  changePassword(payload) {
    return axiosClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
  },

  // Reset password (forgot password)
  resetPassword(email) {
    return axiosClient.post('/auth/reset-password', { email });
  },

  // Verify OTP for forgot password
  verifyForgotPasswordOtp(email, otp) {
    return axiosClient.post('/auth/forgot-password/verify-otp', { email, otp });
  },

  // Reset password with OTP
  resetPasswordWithOtp(payload) {
    return axiosClient.post('/auth/forgot-password/reset', payload);
  },
};

export default authenticationService;