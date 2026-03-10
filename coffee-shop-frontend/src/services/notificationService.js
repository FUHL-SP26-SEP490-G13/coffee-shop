import axiosClient from "@/services/axiosClient";

const notificationService = {
  getMine() {
    return axiosClient.get("/notifications/me");
  },

  getUnreadCount() {
    return axiosClient.get("/notifications/me/unread-count");
  },

  markAsRead(recipientId) {
    return axiosClient.patch(`/notifications/me/${recipientId}/read`);
  },

  markAllAsRead() {
    return axiosClient.patch("/notifications/me/read-all");
  },

  markAsUnread(recipientId) {
    return axiosClient.patch(`/notifications/me/${recipientId}/unread`);
  },

  markAllAsUnread() {
    return axiosClient.patch("/notifications/me/unread-all");
  },
};

export default notificationService;
