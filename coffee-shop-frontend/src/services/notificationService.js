import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const notificationService = {
  getMine() {
    return axiosClient.get(API_ENDPOINTS.NOTIFICATIONS.MINE);
  },

  getUnreadCount() {
    return axiosClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  },

  markAsRead(recipientId) {
    return axiosClient.patch(
      API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(recipientId)
    );
  },

  markAllAsRead() {
    return axiosClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ);
  },

  markAsUnread(recipientId) {
    return axiosClient.patch(
      API_ENDPOINTS.NOTIFICATIONS.MARK_AS_UNREAD(recipientId)
    );
  },

  markAllAsUnread() {
    return axiosClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_UNREAD);
  },
};

export default notificationService;
