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
      const result = await CashSessionService.getCurrentSession();
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

  // GET /cash-sessions
  // Lịch sử các ca — manager xem, filter theo date hoặc status
  async getSessionHistory(req, res, next) {
    try {
      const result = await CashSessionService.getSessionHistory(req.query);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CashSessionController();