const service = require("../services/CashSessionService");

class CashSessionController {
  async getCurrent(req, res, next) {
    try {
      const userId = req.user.id;
      const userName = req.user.username || 'Nhân viên';
      const data = await service.getCurrentSession(userId);
      res.json({ success: true, data: { ...data, userName } });
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
}

module.exports = new CashSessionController();
