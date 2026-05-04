const CashSessionService = require('../services/CashSessionService');

class CashSessionController {

  // POST /cash-sessions/open
  // Body: { opening_cash }
  async openSession(req, res, next) {
    try {
      const result = await CashSessionService.openSession(
        req.body,
        req.user,
      );

      const io = req.app.get("io");
      if (io) {
        io.emit("cash-session:updated");
      }

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Mở ca thành công',
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /cash-sessions/current
  // Lấy ca đang open — dùng để hiển thị header và gắn session_id vào order
  async getCurrentSession(req, res, next) {
    try {
      const result = await CashSessionService.getCurrentSession(req.user);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /cash-sessions/:id/summary
  // Tổng hợp realtime trong ca: doanh thu, số đơn, tiền két
  async getSessionSummary(req, res, next) {
    try {
      const result = await CashSessionService.getSessionSummary(
        Number(req.params.id),
      );
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /cash-sessions/:id/close
  // Body: { closing_cash_actual, closing_note? }
  async closeSession(req, res, next) {
    try {
      const result = await CashSessionService.closeSession(
        Number(req.params.id),
        req.body,
        req.user,
      );

      const io = req.app.get("io");
      if (io) {
        io.emit("cash-session:updated");
      }

      return res.json({
        success: true,
        data: result,
        message: 'Kết ca thành công',
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /cash-sessions/:id/receipt
  // Phiếu bàn giao đầy đủ sau khi kết ca
  async getReceipt(req, res, next) {
    try {
      const result = await CashSessionService.getReceipt(
        Number(req.params.id),
      );
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /cash-sessions/:id/force-close
  // Manager đóng ca hộ — bắt buộc ghi chú
  async forceCloseSession(req, res, next) {
    try {
      const { closing_note } = req.body;
      if (!closing_note || !closing_note.trim()) {
        return res.status(400).json({ success: false, message: 'Ghi chú bắt buộc khi đóng ca hộ' });
      }

      const result = await CashSessionService.forceCloseSession(
        Number(req.params.id),
        req.body,
        req.user,
      );

      const io = req.app.get("io");
      if (io) {
        io.emit("cash-session:updated");
      }

      return res.json({
        success: true,
        data: result,
        message: 'Manager đóng ca hộ thành công',
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /cash-sessions
  // Lịch sử tất cả các ca — manager xem, filter theo date hoặc status, có phân trang
  async getSessionHistory(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const result = await CashSessionService.getSessionHistory({
        ...filters,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      });
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /cash-sessions/my-history
  // Lịch sử các ca của nhân viên đang đăng nhập
  async getMySessionHistory(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const result = await CashSessionService.getMySessionHistory(
        { ...filters, page: Number(page) || 1, limit: Number(limit) || 10 },
        req.user.id,
      );
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /cash-sessions/my-shift
  async getMyCurrentShift(req, res, next) {
    try {
      const CashSessionRepository = require('../repositories/CashSessionRepository');
      const shift = await CashSessionRepository.getCurrentActiveUserShift(req.user.id);
      return res.json({ success: true, data: shift });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CashSessionController();