const CashSessionRepository = require('../repositories/CashSessionRepository');
const ErrorResponse = require('../utils/ErrorResponse');

class CashSessionService {

  async openSession({ opening_cash, opening_note }, currentUser) {

    const cash = Number(opening_cash);
    if (isNaN(cash) || cash < 0) {
      throw new ErrorResponse(400, 'Tiền đầu ca không hợp lệ');
    }

    // Kiểm tra user có shift active trong khung giờ hiện tại không
    const currentShift = await CashSessionRepository.getCurrentActiveUserShift(currentUser.id);
    if (!currentShift) {
      const nextShift = await CashSessionRepository.getNextUserShift(currentUser.id);
      let nextShiftStr = 'Bạn chưa có lịch làm việc tiếp theo.';
      if (nextShift) {
        const d = new Date(nextShift.shift_date);
        const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        nextShiftStr = `Ca tiếp theo của bạn: ${nextShift.start_time.substring(0, 5)} ngày ${dateStr}`;
      }

      throw new ErrorResponse(403, `Hiện tại không phải là ca làm việc của bạn. ${nextShiftStr}`);
    }

    // Kiểm tra đã có ca đang open chưa
    const existingOpen = await CashSessionRepository.findOpenSession();
    if (existingOpen) {
      throw new ErrorResponse(
        400,
        `Đang có ca ${existingOpen.code} chưa kết, vui lòng kết ca trước khi mở ca mới`,
      );
    }

    // 4. Sinh code tự động
    const code = await this._generateCode();

    // 5. Tạo session mới — gắn shift_registration_id
    const session = await CashSessionRepository.createSession({
      code,
      opened_by: currentUser.id,
      opened_at: new Date(),
      opening_cash: cash,
      opening_note: opening_note || null,
      shift_registration_id: currentShift.shift_registration_id,
    });

    return this._formatSession(session);
  }

  // ================================================
  // LẤY CA ĐANG OPEN
  // ================================================
  async getCurrentSession(currentUser) {
    const session = await CashSessionRepository.findOpenSession();

    // Không có ca nào đang open → trả về null, không throw lỗi
    // Frontend tự xử lý hiển thị "Chưa có ca nào đang mở"
    if (!session) return null;

    if (currentUser && currentUser.role !== 'manager') {
      const isInShift = await CashSessionRepository.isUserInSessionShift(currentUser.id, session.id);
      if (!isInShift) {
        return null;
      }
    }

    // Lấy thêm summary nhanh để hiển thị header
    const summary = await CashSessionRepository.getOrderSummary(session.id);

    return {
      ...this._formatSession(session),
      // Tiền két hiện tại = tiền đầu ca + tiền mặt thu được trong ca
      current_cash: Number(session.opening_cash) + Number(summary.cash_revenue || 0),
    };
  }

  // ================================================
  // TỔNG HỢP REALTIME TRONG CA
  // ================================================
  async getSessionSummary(sessionId) {
    const session = await CashSessionRepository.findById(sessionId);
    if (!session) throw new ErrorResponse(404, 'Ca làm việc không tồn tại');

    // Query tổng hợp từ orders + order_payments
    const summary = await CashSessionRepository.getOrderSummary(sessionId);

    // Tiền két lý thuyết hiện tại
    const currentCashSystem = Number(session.opening_cash) + Number(summary.cash_revenue || 0);

    return {
      session: this._formatSession(session),
      summary: {
        // Số đơn
        total_orders: Number(summary.total_orders || 0),
        completed_orders: Number(summary.completed_orders || 0),
        cancelled_orders: Number(summary.cancelled_orders || 0),
        pending_orders: Number(summary.pending_orders || 0),

        // Doanh thu
        cash_revenue: Number(summary.cash_revenue || 0),
        payos_revenue: Number(summary.payos_revenue || 0),
        total_revenue: Number(summary.cash_revenue || 0) + Number(summary.payos_revenue || 0),

        // Tiền két
        opening_cash: Number(session.opening_cash),
        current_cash_system: currentCashSystem,
      },
    };
  }

  // ================================================
  // KẾT CA
  // ================================================
  async closeSession(sessionId, { closing_cash_actual, closing_note }, currentUser) {

    // 1. Lấy session, kiểm tra còn open không
    const session = await CashSessionRepository.findById(sessionId);
    if (!session) throw new ErrorResponse(404, 'Ca làm việc không tồn tại');
    if (session.status !== 'open') {
      throw new ErrorResponse(400, 'Ca này đã được kết trước đó');
    }

    // 2. Kiểm tra quyền: phải thuộc cùng shift
    const isInShift = await CashSessionRepository.isUserInSessionShift(currentUser.id, sessionId);
    if (!isInShift) {
      throw new ErrorResponse(403, 'Bạn không thuộc ca này. Vui lòng liên hệ Manager để đóng ca hộ.');
    }

    // 3. Validate tiền thực tế
    if (closing_cash_actual === undefined || closing_cash_actual === null) {
      throw new ErrorResponse(400, 'Vui lòng nhập số tiền thực tế trong két');
    }
    const actualCash = Number(closing_cash_actual);
    if (isNaN(actualCash) || actualCash < 0) {
      throw new ErrorResponse(400, 'Số tiền thực tế không hợp lệ');
    }

    // 4. Hệ thống tự tính tiền lý thuyết
    const summary = await CashSessionRepository.getOrderSummary(sessionId);
    const cashRevenue = Number(summary.cash_revenue || 0);
    const systemCash = Number(session.opening_cash) + cashRevenue;
    const difference = actualCash - systemCash;

    // 5. Cập nhật và đóng ca
    const closedSession = await CashSessionRepository.closeSession(sessionId, {
      closed_by: currentUser.id,
      closed_at: new Date(),
      closing_cash_actual: actualCash,
      closing_cash_system: systemCash,
      cash_difference: difference,
      closing_note: closing_note?.trim() || null,
    });

    return {
      session: this._formatSession(closedSession),
      closing_summary: {
        opening_cash: Number(session.opening_cash),
        cash_revenue: cashRevenue,
        closing_cash_system: systemCash,
        closing_cash_actual: actualCash,
        cash_difference: difference,
        difference_note: difference > 0
          ? `Két thừa ${difference.toLocaleString('vi-VN')}đ`
          : difference < 0
            ? `Két thiếu ${Math.abs(difference).toLocaleString('vi-VN')}đ`
            : 'Két khớp, không chênh lệch',
        // Cảnh báo đơn chưa thanh toán
        unpaid_orders: Number(summary.pending_orders || 0),
      },
    };
  }

  // ================================================
  // MANAGER ĐÓNG CA HỘ
  // ================================================
  async forceCloseSession(sessionId, { closing_cash_actual, closing_note }, manager) {
    const session = await CashSessionRepository.findById(sessionId);
    if (!session) throw new ErrorResponse(404, 'Ca làm việc không tồn tại');
    if (session.status !== 'open') {
      throw new ErrorResponse(400, 'Ca này đã được kết trước đó');
    }

    const actualCash = Number(closing_cash_actual) || 0;
    const summary = await CashSessionRepository.getOrderSummary(sessionId);
    const cashRevenue = Number(summary.cash_revenue || 0);
    const systemCash = Number(session.opening_cash) + cashRevenue;
    const difference = actualCash - systemCash;

    const closedSession = await CashSessionRepository.closeSession(sessionId, {
      closed_by: manager.id,
      closed_at: new Date(),
      closing_cash_actual: actualCash,
      closing_cash_system: systemCash,
      cash_difference: difference,
      closing_note: `[Manager đóng hộ] ${closing_note?.trim() || ''}`,
    });

    return {
      session: this._formatSession(closedSession),
      closing_summary: {
        opening_cash: session.opening_cash,
        cash_revenue: cashRevenue,
        closing_cash_system: systemCash,
        closing_cash_actual: actualCash,
        cash_difference: difference,
      },
    };
  }

  // ================================================
  // PHIẾU BÀN GIAO
  // ================================================
  async getReceipt(sessionId) {
    const session = await CashSessionRepository.findById(sessionId);
    if (!session) throw new ErrorResponse(404, 'Ca làm việc không tồn tại');

    // Lấy tổng hợp orders trong ca
    const summary = await CashSessionRepository.getOrderSummary(sessionId);

    const cashRevenue = summary.cash_revenue || 0;
    const payosRevenue = summary.payos_revenue || 0;
    const totalRevenue = cashRevenue + payosRevenue;
    const systemCash = session.opening_cash + cashRevenue;

    return {
      // Thông tin ca
      code: session.code,
      opened_by: `${session.opener_first_name} ${session.opener_last_name}`,
      opened_at: session.opened_at,
      closed_by: session.closer_first_name
        ? `${session.closer_first_name} ${session.closer_last_name}`
        : null,
      closed_at: session.closed_at,
      status: session.status,

      // Doanh thu trong ca
      revenue: {
        total_orders: summary.total_orders || 0,
        completed_orders: summary.completed_orders || 0,
        cancelled_orders: summary.cancelled_orders || 0,
        cash_revenue,
        payos_revenue: payosRevenue,
        total_revenue,
      },

      // Đối soát tiền mặt
      cash_reconciliation: {
        opening_cash: session.opening_cash,
        cash_revenue,
        closing_cash_system: session.status === 'closed'
          ? session.closing_cash_system
          : systemCash,
        closing_cash_actual: session.closing_cash_actual,
        cash_difference: session.cash_difference,
      },

      closing_note: session.closing_note,
    };
  }

  // ================================================
  // LỊCH SỬ CÁC CA
  // ================================================
  async getSessionHistory({ date, startDate, endDate, status }) {
    const sessions = await CashSessionRepository.findAll({ date, startDate, endDate, status });
    return sessions.map((s) => this._formatSession(s));
  }

  async getMySessionHistory({ date, startDate, endDate, status }, userId) {
    const sessions = await CashSessionRepository.findAll({ date, startDate, endDate, status, userId });
    return sessions.map((s) => this._formatSession(s));
  }

  // ================================================
  // HELPERS
  // ================================================

  // Sinh code: CA-YYMMDD-XXXX (random 4 chữ số)
  _generateCode() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `CA-${yy}${mm}${dd}-${rand}`;
  }

  // Format session trả về cho client
  _formatSession(session) {
    return {
      id: session.id,
      code: session.code,
      status: session.status,
      opening_cash: session.opening_cash,
      opened_by: {
        id: session.opened_by,
        name: session.opener_first_name
          ? `${session.opener_first_name} ${session.opener_last_name}`
          : null,
      },
      opened_at: session.opened_at,
      closed_by: session.closed_by ? {
        id: session.closed_by,
        name: `${session.closer_first_name} ${session.closer_last_name}`,
      } : null,
      closed_at: session.closed_at,
      closing_cash_actual: session.closing_cash_actual,
      closing_cash_system: session.closing_cash_system,
      cash_difference: session.cash_difference,
      closing_note: session.closing_note,
      created_at: session.created_at,
    };
  }
}

module.exports = new CashSessionService();