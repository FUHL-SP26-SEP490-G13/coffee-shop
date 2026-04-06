const NewsletterService = require('../services/NewsletterService');
const NotificationService = require('../services/NotificationService');
const response = require('../utils/response');

class NewsletterController {
  async subscribe(req, res, next) {
    try {
      const { email } = req.body;
      const result = await NewsletterService.subscribe(email);
      
      const io = req.app.get("io");
      if (io) {
        // Cập nhật bảng thời gian thực
        io.emit("new_newsletter_subscription", { email });
        
        // Ghi DB cho Chuông thông báo
        try {
          const notificationRes = await NotificationService.createForManager({
            type: "system_update",
            title: "Email đăng ký mới",
            message: `${email} vừa đăng ký nhận tin`,
            link: "/admin/newsletter",
            entity_type: "newsletter",
            entity_id: 0,
          });

          if (notificationRes?.notification && notificationRes?.recipient) {
            const { notification, recipient } = notificationRes;
            io.to(`user-${recipient.user_id}`).emit("admin:notification", {
              recipient_id: recipient.id,
              user_id: recipient.user_id,
              is_read: recipient.is_read,
              read_at: recipient.read_at,
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              link: notification.link,
              entity_type: notification.entity_type,
              entity_id: notification.entity_id,
              created_at: notification.created_at,
            });
          }
        } catch (notifErr) {
          console.error("Lỗi khi tạo thông báo ghi chuông:", notifErr);
        }
      }

      return response.success(res, result, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Khách hàng bấm tự lưu khỏi bản tin từ Email
   */
  async unsubscribe(req, res, next) {
    try {
      const { email } = req.query;
      await NewsletterService.unsubscribe(email);
      
      // Trả thẳng HTML thay vì JSON vì khách hàng sẽ bấm link này trên trình duyệt
      return res.status(200).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f9f9f9;">
            <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
              <h2 style="color: #6B4423;">Hủy đăng ký thành công!</h2>
              <p>Email <strong>${email}</strong> đã được loại khỏi danh sách nhận tin.</p>
              <br/>
              <p style="color: gray; font-size: 13px;">Bạn có thể đóng trang này lại. Nếu muốn nhận lại, hãy đăng ký thông qua Website.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      // Báo lỗi bằng giao diện HTML
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f9f9f9;">
            <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
              <h2 style="color: red;">Không thể Hủy Đăng Ký</h2>
              <p>Có thể Email của bạn đã được hủy từ trước, hoặc đường dẫn không hợp lệ.</p>
            </div>
          </body>
        </html>
      `);
    }
  }

  /**
   * Lấy danh sách newsletter (cho Admin)
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, keyword = '', status = '' } = req.query;
      const result = await NewsletterService.getAll(page, limit, keyword, status);
      return response.paginate(res, result.data, result.page, result.limit, result.total, 'Lấy danh sách newsletter thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle (Bật/Tắt) trạng thái gửi thư
   */
  async toggleActive(req, res, next) {
    try {
      const { id } = req.params;
      const result = await NewsletterService.toggleActive(id);
      return response.success(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gọi chức năng Broadcast (Gửi thư hàng loạt)
   */
  async broadcast(req, res, next) {
    try {
      const { subject, content } = req.body;
      const result = await NewsletterService.broadcast(subject, content);
      return response.success(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NewsletterController();
