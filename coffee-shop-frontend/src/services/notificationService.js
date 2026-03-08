import axios from "@/services/axiosClient";

const notificationService = {
  getMine() {
    return axios.get("/notifications/me");
  },

  markAsRead(recipientId) {
    return axios.patch(`/notifications/me/${recipientId}/read`);
  },

  markAsUnread(recipientId) {
    return axios.patch(`/notifications/me/${recipientId}/unread`);
  },

  markAllAsRead() {
    return axios.patch("/notifications/me/read-all");
  },

  markAllAsUnread() {
    return axios.patch("/notifications/me/unread-all");
  },
};

export default notificationService;
