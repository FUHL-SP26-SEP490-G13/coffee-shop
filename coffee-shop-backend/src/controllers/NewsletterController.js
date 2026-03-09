const newsletterService = require("../services/NewsletterService");
const NotificationService = require("../services/NotificationService");
const { ROLES } = require("../config/constants");

class NewsletterController {
  async subscribe(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const subscriber = await newsletterService.subscribe(email);
      const io = req.app.get("io");

      const result = await NotificationService.createForRole(ROLES.MANAGER, {
        type: "newsletter",
        title: "Email đăng ký mới",
        message: `${subscriber.email} vừa đăng ký nhận tin`,
        link: "/admin/news-letter",
        entity_type: "newsletter_subscriber",
        entity_id: subscriber.id,
      });

      if (io && result?.users?.length) {
        result.users.forEach((user) => {
          const recipient = result.recipients.find(
            (r) => r.user_id === user.id
          );
          if (!recipient) return;

          io.to(`user-${user.id}`).emit("admin:notification", {
            recipient_id: recipient.id,
            user_id: user.id,
            id: result.notification.id,
            type: result.notification.type,
            title: result.notification.title,
            message: result.notification.message,
            link: result.notification.link,
            entity_type: result.notification.entity_type,
            entity_id: result.notification.entity_id,
            created_at: result.notification.created_at,
            is_read: recipient.is_read,
            read_at: recipient.read_at,
          });
        });
      }

      return res.json({
        success: true,
        message: "Đăng ký nhận tin thành công",
        data: subscriber,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }

  async getAll(req, res) {
    try {
      const data = await newsletterService.getAll();

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("GET ALL ERROR:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }

  async delete(req, res) {
    try {
      await newsletterService.delete(req.params.id);

      return res.json({
        success: true,
        message: "Xóa thành công",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }
}

module.exports = new NewsletterController();
