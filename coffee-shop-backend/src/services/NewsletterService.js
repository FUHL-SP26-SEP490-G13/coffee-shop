const pool = require('../config/database');
const ErrorResponse = require('../utils/ErrorResponse');
const EmailService = require('./EmailService');
const NotificationService = require('./NotificationService');

class NewsletterService {
  /**
   * Subscribe an email to the newsletter
   */
  async subscribe(email) {
    if (!email) {
      throw new ErrorResponse(400, 'Vui lòng cung cấp địa chỉ email');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ErrorResponse(400, 'Định dạng email không hợp lệ');
    }

    try {
      // Check if email already exists
      const [existing] = await pool.query(
        'SELECT * FROM newsletters WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        throw new ErrorResponse(400, 'Email này đã đăng ký nhận tin rồi');
      }

      // Insert new subscriber
      await pool.query(
        'INSERT INTO newsletters (email, is_active) VALUES (?, 1)',
        [email]
      );

      // Send welcome email asynchronously
      EmailService.sendNewsletterWelcomeEmail(email).catch(err => {
        console.error('Failed to send newsletter welcome email:', err);
      });

      return {
        message: 'Đăng ký nhận tin thành công'
      };
    } catch (error) {
      if (error instanceof ErrorResponse) throw error;
      console.error('Newsletter subscription error:', error);
      throw new ErrorResponse(500, 'Lỗi hệ thống khi đăng ký nhận tin');
    }
  }

  /**
   * Lấy danh sách newsletter (cho Admin)
   */
  async getAll(page = 1, limit = 10, keyword = '', status = '') {
    const offset = (page - 1) * limit;
    let queryParams = [];
    let whereClause = '1=1';

    if (keyword) {
      whereClause += ' AND email LIKE ?';
      queryParams.push(`%${keyword}%`);
    }

    if (status !== '') {
      whereClause += ' AND is_active = ?';
      queryParams.push(parseInt(status));
    }

    try {
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM newsletters WHERE ${whereClause}`,
        queryParams
      );
      const total = countResult[0].total;

      const [rows] = await pool.query(
        `SELECT id, email, is_active, created_at, updated_at 
         FROM newsletters 
         WHERE ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), parseInt(offset)]
      );

      return {
        data: rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      throw new ErrorResponse(500, 'Không thể lấy danh sách đăng ký nhận tin');
    }
  }

  /**
   * Bật/Tắt trạng thái gửi mail cho một địa chỉ
   */
  async toggleActive(id) {
    try {
      // get current
      const [existing] = await pool.query('SELECT * FROM newsletters WHERE id = ?', [id]);
      if (existing.length === 0) {
        throw new ErrorResponse(404, 'Không tìm thấy email này');
      }

      const activeState = existing[0].is_active;
      const newState = activeState === 1 ? 0 : 1;

      await pool.query('UPDATE newsletters SET is_active = ? WHERE id = ?', [newState, id]);

      return {
        id,
        is_active: newState,
        message: newState === 1 ? 'Đã bật lại gửi tin' : 'Đã dừng gửi tin'
      };
    } catch (error) {
      if (error instanceof ErrorResponse) throw error;
      console.error('Error toggling newsletter status:', error);
      throw new ErrorResponse(500, 'Lỗi hệ thống khi cập nhật trạng thái');
    }
  }

  /**
   * Hủy đăng ký từ link gửi qua Email (Customer)
   */
  async unsubscribe(email) {
    if (!email) throw new ErrorResponse(400, 'Email không hợp lệ');

    try {
      const [existing] = await pool.query('SELECT * FROM newsletters WHERE email = ?', [email]);
      if (existing.length === 0) {
        throw new ErrorResponse(404, 'Email này chưa được đăng ký.');
      }

      await pool.query('UPDATE newsletters SET is_active = 0 WHERE email = ?', [email]);
      return true;
    } catch (error) {
      if (error instanceof ErrorResponse) throw error;
      console.error('Error unsubscribing:', error);
      throw new ErrorResponse(500, 'Có lỗi xảy ra khi xử lý yêu cầu hủy đăng ký');
    }
  }

  /**
   * Gửi chiến dịch thư hàng loạt (Broadcast)
   */
  async broadcast(subject, content) {
    if (!subject || !content) {
      throw new ErrorResponse(400, 'Vui lòng nhập Subject và Content');
    }

    try {
      // Lấy toàn bộ email đang active
      const [subscribers] = await pool.query('SELECT email FROM newsletters WHERE is_active = 1');
      
      if (subscribers.length === 0) {
        return { message: 'Không có người đăng ký nào đang kích hoạt để gửi' };
      }

      // Thông báo hệ thống cho Customers trước
      NotificationService.createForCustomers({
        type: "system_update",
        title: subject,
        message: 'Có một thông báo qua Email mới vừa được gửi tới hộp thư của bạn. Hãy kiểm tra nhé!',
        link: "/",
        entity_type: "newsletter",
        entity_id: 0,
      }).catch(err => console.error('Gửi in-app notification lỗi:', err));

      // Thực thi gửi mail bất đồng bộ (tránh block request)
      // Lưu ý: Đối với hệ thống thật sự lớn cần dùng queue (ví dụ agenda, bullmq) và chia lô. Ở đây dùng vòng lặp bất đồng bộ cơ bản.
      const emails = subscribers.map(s => s.email);

      // Async wrapper to do sending in background
      (async () => {
        let successCount = 0;
        let failCount = 0;
        
        // Chia batch gửi để tránh dội server (ví dụ 20 mail / loạt)
        const batchSize = 20;
        for (let i = 0; i < emails.length; i += batchSize) {
          const batch = emails.slice(i, i + batchSize);
          
          const promises = batch.map(email => 
            EmailService.sendBroadcastEmail(email, subject, content)
          );
          
          const results = await Promise.allSettled(promises);
          
          results.forEach(r => {
            if (r.status === 'fulfilled' && r.value.success) successCount++;
            else failCount++;
          });

          // Nghỉ 1 giây giữa các lô để bảo vệ SMTP
          if (i + batchSize < emails.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        console.log(`Tiến trình Broadcast đã xong. Thành công: ${successCount}, Thất bại: ${failCount}`);
      })();

      return {
        message: `Chiến dịch đã bắt đầu. Ước tính gửi cho ${emails.length} người dùng.`,
        estimatedCount: emails.length
      };

    } catch (error) {
      console.error('Error in broadcast method:', error);
      throw new ErrorResponse(500, 'Lỗi hệ thống khi thiết lập chiến dịch gửi thư');
    }
  }
}

module.exports = new NewsletterService();
