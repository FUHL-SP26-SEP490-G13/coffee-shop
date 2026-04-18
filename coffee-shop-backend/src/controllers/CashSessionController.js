const service = require("../services/CashSessionService");

class CashSessionController {
  async getCurrent(req, res, next) {
    try {
      const userId = req.user.id;
      const fullName = [req.user.last_name, req.user.first_name].filter(Boolean).join(' ');
      const userName = fullName || req.user.username || 'Nhân viên';
      const data = await service.getCurrentSession(userId);
      res.json({ success: true, data: { ...data, userName, currentUserId: userId } });
    } catch (error) {
      next(error);
    }
  }

  async openSession(req, res, next) {
    try {
      const userId = req.user.id;
      const { opening_cash } = req.body;

      if (opening_cash === undefined || opening_cash === null || isNaN(opening_cash)) {
        return res.status(400).json({ success: false, message: "Số tiền đầu ca không hợp lệ" });
      }

      const result = await service.openSession(userId, opening_cash);
      res.json({ success: true, data: result, message: "Mở ca thành công" });
    } catch (error) {
      next(error);
    }
  }

  async closeSession(req, res, next) {
    try {
      const userId = req.user.id;
      const { id, closing_cash_actual, closing_note } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin ca làm việc" });
      }
      if (closing_cash_actual === undefined || closing_cash_actual === null || isNaN(closing_cash_actual)) {
        return res.status(400).json({ success: false, message: "Số tiền thực tế không hợp lệ" });
      }

      const result = await service.closeSession(userId, id, closing_cash_actual, closing_note);
      res.json({ success: true, data: result, message: "Đóng ca thành công" });
    } catch (error) {
      next(error);
    }
  }
  async getHistory(req, res, next) {
    try {
      const user = req.user;
      let { startDate, endDate, userId, page = 1, limit = 10 } = req.query;
      
      if (user.role_id !== 1) { // Không phải admin/manager thì chỉ lấy được của bản thân
         userId = user.id; 
      }

      const offset = (Number(page) - 1) * Number(limit);

      const result = await service.getSessionsHistory({ 
        startDate, 
        endDate, 
        userId,
        limit: Number(limit),
        offset 
      });

      const totalPages = Math.ceil(result.total / Number(limit));

      res.json({ 
        success: true, 
        data: result.data,
        pagination: {
          total: result.total,
          totalPages,
          currentPage: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CashSessionController();
