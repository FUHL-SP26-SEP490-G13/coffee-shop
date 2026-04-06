const CashSessionRepository = require('../repositories/CashSessionRepository');
const ErrorResponse = require('../utils/ErrorResponse');

class CashSessionService {

  // ================================================
  // MỞ CA
  // ================================================
  async openSession({ opening_cash }, currentUser) {

    // 1. Validate tiền đầu ca
    const cash = Number(opening_cash);
    if (isNaN(cash) || cash < 0) {
      throw new ErrorResponse(400, 'Tiền đầu ca không hợp lệ');
    }

    // 2. Kiểm tra đã có ca đang open chưa
    // Mô hình 1 két tiền: chỉ 1 ca được open tại 1 thời điểm
    // Mục đích: quy trách nhiệm tiền mặt rõ ràng, ai mở ca thì người đó chịu trách nhiệm két
    const existingOpen = await CashSessionRepository.findOpenSession();
    if (existingOpen) {
      const openerName = existingOpen.opener_first_name
        ? `${existingOpen.opener_first_name} ${existingOpen.opener_last_name}`
        : `#${existingOpen.opened_by}`;
      const openedAt = new Date(existingOpen.opened_at).toLocaleString('vi-VN');
      throw new ErrorResponse(
        400,
        `Két tiền đang được giữ bởi ${openerName} (mở lúc ${openedAt}). Vui lòng yêu cầu ${openerName} kết ca trước khi mở ca mới.`,
      );
    }

    // 3. Không có ca nào đang mở → tạo ca mới
    const code = await this._generateCode();

    const session = await CashSessionRepository.createSession({
      code,
      opened_by: currentUser.id,
      opened_at: new Date(),
      opening_cash: cash,
    });

    return this._formatSession(session);
  }

  // ================================================
  // LẤY CA ĐANG OPEN
  // ================================================
  async getCurrentSession() {
    const session = await CashSessionRepository.findOpenSession();

    // Không có ca nào đang open → trả về null, không throw lỗi
    // Frontend tự xử lý hiển thị "Chưa có ca nào đang mở"
    if (!session) return null;

    // Lấy thêm summary nhanh để hiển thị header
    const summary = await CashSessionRepository.getOrderSummary(session.id);

    return {
      ...this._formatSession(session),
      // Tiền két hiện tại = tiền đầu ca + tiền mặt thu được trong ca
      current_cash: session.opening_cash + (summary.cash_revenue || 0),
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

    // Ép về Number trước (MySQL trả SUM/COUNT dưới dạng string)
    const cashRevenue   = Number(summary.cash_revenue   || 0);
    const payosRevenue  = Number(summary.payos_revenue  || 0);
    const openingCash   = Number(session.opening_cash   || 0);

    // Tiền két lý thuyết hiện tại
    const currentCashSystem = openingCash + cashRevenue;

    return {
      session: this._formatSession(session),
      summary: {
        // Số đơn
        total_orders:      Number(summary.total_orders      || 0),
        completed_orders:  Number(summary.completed_orders  || 0),
        cancelled_orders:  Number(summary.cancelled_orders  || 0),
        pending_orders:    Number(summary.pending_orders    || 0),

        // Doanh thu
        cash_revenue:   cashRevenue,
        payos_revenue:  payosRevenue,
        total_revenue:  cashRevenue + payosRevenue,

        // Tiền két
        opening_cash:        openingCash,
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

    // 2. Validate tiền thực tế
    if (closing_cash_actual === undefined || closing_cash_actual === null) {
      throw new ErrorResponse(400, 'Vui lòng nhập số tiền thực tế trong két');
    }
    const actualCash = Number(closing_cash_actual);
    if (isNaN(actualCash) || actualCash < 0) {
      throw new ErrorResponse(400, 'Số tiền thực tế không hợp lệ');
    }

    // 3. Hệ thống tự tính tiền lý thuyết từ orders trong ca
    const summary = await CashSessionRepository.getOrderSummary(sessionId);
    const cashRevenue = summary.cash_revenue || 0;
    const systemCash = session.opening_cash + cashRevenue;

    // 4. Tính chênh lệch
    // Dương = két thừa tiền, âm = két thiếu tiền
    const difference = actualCash - systemCash;

    // 5. BẮT BUỘC ghi chú nếu tiền lệch — dù thừa hay thiếu đều phải giải thích
    if (difference !== 0) {
      const note = closing_note?.trim();
      if (!note) {
        const direction = difference > 0 ? 'thừa' : 'thiếu';
        const amount = Math.abs(difference).toLocaleString('vi-VN');
        throw new ErrorResponse(
          400,
          `Két ${direction} ${amount}đ so với hệ thống. Bắt buộc phải nhập ghi chú lý do.`,
        );
      }
    }

    // 6. Cập nhật và đóng ca
    // closed_by có thể khác opened_by (VD: quản lý ép đóng khi nhân viên quên)
    const closedSession = await CashSessionRepository.closeSession(sessionId, {
      closed_by: currentUser.id,
      closed_at: new Date(),
      closing_cash_actual: actualCash,
      closing_cash_system: systemCash,
      cash_difference: difference,
      closing_note: closing_note?.trim() || null,
    });

    const isForceClose = closedSession.opened_by !== currentUser.id;

    return {
      session: this._formatSession(closedSession),
      is_force_close: isForceClose, // FE dùng để hiển thị cảnh báo nếu cần
      closing_summary: {
        opening_cash: session.opening_cash,
        cash_revenue: cashRevenue,
        closing_cash_system: systemCash,
        closing_cash_actual: actualCash,
        cash_difference: difference,
        difference_note: difference > 0
          ? `Két thừa ${difference.toLocaleString('vi-VN')}đ`
          : difference < 0
            ? `Két thiếu ${Math.abs(difference).toLocaleString('vi-VN')}đ`
            : 'Két khớp, không chênh lệch',
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
  async getSessionHistory({ date, status }) {
    const sessions = await CashSessionRepository.findAll({ date, status });
    return sessions.map((s) => this._formatSession(s));
  }

  // ================================================
  // HELPERS
  // ================================================

  // Sinh code tự động: CA000001, CA000002...
  async _generateCode() {
    const lastCode = await CashSessionRepository.getLastCode();
    if (!lastCode) return 'CA000001';

    // Lấy số từ code cuối cùng rồi tăng lên 1
    const lastNumber = parseInt(lastCode.replace('CA', ''), 10);
    const nextNumber = lastNumber + 1;
    return `CA${String(nextNumber).padStart(6, '0')}`;
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