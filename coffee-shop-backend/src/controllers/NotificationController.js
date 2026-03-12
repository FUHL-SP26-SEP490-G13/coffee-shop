const NotificationService = require("../services/NotificationService");

class NotificationController {
  async getMine(req, res) {
    try {
      const userId = req.user.id;
      const data = await NotificationService.getMyNotifications(userId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const total = await NotificationService.getMyUnreadCount(userId);

      res.json({
        success: true,
        data: { total },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { recipientId } = req.params;

      await NotificationService.markAsRead(recipientId, userId);

      res.json({
        success: true,
        message: "Đã đánh dấu đã đọc",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: "Đã đánh dấu tất cả là đã đọc",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }

  async markAsUnread(req, res) {
    try {
      const userId = req.user.id;
      const { recipientId } = req.params;

      await NotificationService.markAsUnread(recipientId, userId);

      res.json({
        success: true,
        message: "Đã đánh dấu chưa đọc",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }

  async markAllAsUnread(req, res) {
    try {
      const userId = req.user.id;

      await NotificationService.markAllAsUnread(userId);

      res.json({
        success: true,
        message: "Đã đánh dấu tất cả là chưa đọc",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }
}

module.exports = new NotificationController();
