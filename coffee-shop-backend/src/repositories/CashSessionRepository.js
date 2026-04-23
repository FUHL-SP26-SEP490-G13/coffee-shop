const pool = require('../config/database');

class CashSessionRepository {

  // ================================================
  // CASH SESSIONS — CRUD
  // ================================================

  // Tạo session mới khi mở ca
  async createSession({ code, opened_by, opened_at, opening_cash, opening_note, shift_registration_id }) {
    const [result] = await pool.query(
      `INSERT INTO cash_sessions
                (code, opened_by, opened_at, opening_cash, opening_note, status, shift_registration_id)
             VALUES (?, ?, ?, ?, ?, 'open', ?)`,
      [code, opened_by, opened_at, opening_cash, opening_note || null, shift_registration_id || null],
    );
    return this.findById(result.insertId);
  }

  // Lấy chi tiết 1 session — join tên người mở và người kết
  async findById(sessionId) {
    const [[row]] = await pool.query(
      `SELECT
                cs.*,
                u_open.first_name AS opener_first_name,
                u_open.last_name  AS opener_last_name,
                u_close.first_name AS closer_first_name,
                u_close.last_name  AS closer_last_name
             FROM cash_sessions cs
             JOIN  users u_open  ON cs.opened_by  = u_open.id
             LEFT JOIN users u_close ON cs.closed_by = u_close.id
             WHERE cs.id = ?`,
      [sessionId],
    );
    return row || null;
  }

  // Lấy ca đang open — chỉ có 1 tại 1 thời điểm
  async findOpenSession() {
    const [[row]] = await pool.query(
      `SELECT
                cs.*,
                u_open.first_name AS opener_first_name,
                u_open.last_name  AS opener_last_name
             FROM cash_sessions cs
             JOIN users u_open ON cs.opened_by = u_open.id
             WHERE cs.status = 'open'
             LIMIT 1`,
    );
    return row || null;
  }

  // Kết ca — cập nhật đầy đủ thông tin
  async closeSession(sessionId, {
    closed_by,
    closed_at,
    closing_cash_actual,
    closing_cash_system,
    cash_difference,
    closing_note,
  }) {
    await pool.query(
      `UPDATE cash_sessions
             SET closed_by           = ?,
                 closed_at           = ?,
                 closing_cash_actual = ?,
                 closing_cash_system = ?,
                 cash_difference     = ?,
                 closing_note        = ?,
                 status              = 'closed'
             WHERE id = ?`,
      [
        closed_by,
        closed_at,
        closing_cash_actual,
        closing_cash_system,
        cash_difference,
        closing_note,
        sessionId,
      ],
    );
    return this.findById(sessionId);
  }

  // Lấy code của session mới nhất để sinh code tiếp theo
  async getLastCode() {
    const [[row]] = await pool.query(
      `SELECT code FROM cash_sessions ORDER BY id DESC LIMIT 1`,
    );
    return row?.code || null;
  }

  // Lấy lịch sử các ca — filter theo date hoặc status hoặc userId
  async findAll({ date, startDate, endDate, status, userId }) {
    const conditions = [];
    const params = [];

    if (date) {
      conditions.push('DATE(cs.opened_at) = ?');
      params.push(date);
    }
    if (startDate) {
      conditions.push('DATE(cs.opened_at) >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('DATE(cs.opened_at) <= ?');
      params.push(endDate);
    }
    if (status) {
      conditions.push('cs.status = ?');
      params.push(status);
    }
    if (userId) {
      conditions.push('(cs.opened_by = ? OR cs.closed_by = ?)');
      params.push(userId, userId);
    }

    const where = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const [rows] = await pool.query(
      `SELECT
                cs.*,
                u_open.first_name  AS opener_first_name,
                u_open.last_name   AS opener_last_name,
                u_close.first_name AS closer_first_name,
                u_close.last_name  AS closer_last_name
             FROM cash_sessions cs
             JOIN  users u_open  ON cs.opened_by  = u_open.id
             LEFT JOIN users u_close ON cs.closed_by = u_close.id
             ${where}
             ORDER BY cs.opened_at DESC`,
      params,
    );
    return rows;
  }

  // ================================================
  // SHIFT VALIDATION
  // ================================================

  // Tìm ca active của user trong khung giờ hiện tại [start_time, end_time)
  async getCurrentActiveUserShift(userId) {
    const [[row]] = await pool.query(
      `SELECT sr.id AS shift_registration_id, st.end_time, st.start_time,
              s.shift_date, sr.shift_id, st.name AS shift_name
       FROM shift_registrations sr
       JOIN shifts s ON sr.shift_id = s.id
       JOIN shift_templates st ON s.template_id = st.id
       WHERE sr.user_id = ?
         AND s.shift_date = CURDATE()
         AND sr.status = 'registered'
         AND (
           (st.start_time < st.end_time AND CURTIME() >= st.start_time AND CURTIME() < st.end_time)
           OR
           (st.start_time > st.end_time AND (CURTIME() >= st.start_time OR CURTIME() < st.end_time))
         )
       LIMIT 1`,
      [userId],
    );
    return row || null;
  }

  // Tìm ai đang có ca active hiện tại (thông báo cho user khác)
  async getCurrentActiveShift() {
    const [[row]] = await pool.query(
      `SELECT u.first_name, u.last_name, st.start_time, st.end_time
       FROM shift_registrations sr
       JOIN shifts s ON sr.shift_id = s.id
       JOIN shift_templates st ON s.template_id = st.id
       JOIN users u ON sr.user_id = u.id
       WHERE s.shift_date = CURDATE()
         AND sr.status = 'registered'
         AND (
           (st.start_time < st.end_time AND CURTIME() >= st.start_time AND CURTIME() < st.end_time)
           OR
           (st.start_time > st.end_time AND (CURTIME() >= st.start_time OR CURTIME() < st.end_time))
         )
       LIMIT 1`,
    );
    return row || null;
  }

  // Lấy ca tiếp theo của user (hiển thị khi user không thuộc ca hiện tại)
  async getNextUserShift(userId) {
    const [[row]] = await pool.query(
      `SELECT st.start_time, st.end_time, s.shift_date
       FROM shift_registrations sr
       JOIN shifts s ON sr.shift_id = s.id
       JOIN shift_templates st ON s.template_id = st.id
       WHERE sr.user_id = ?
         AND sr.status = 'registered'
         AND (s.shift_date > CURDATE() OR (s.shift_date = CURDATE() AND st.start_time > CURTIME()))
       ORDER BY s.shift_date ASC, st.start_time ASC LIMIT 1`,
      [userId],
    );
    return row || null;
  }

  // Kiểm tra user có thuộc cùng shift với session không (dùng validate quyền đóng ca)
  async isUserInSessionShift(userId, sessionId) {
    const [[row]] = await pool.query(
      `SELECT 1
       FROM cash_sessions cs
       JOIN shift_registrations sr_session ON cs.shift_registration_id = sr_session.id
       JOIN shifts s_session ON sr_session.shift_id = s_session.id
       JOIN shift_registrations sr_user ON sr_user.shift_id = s_session.id
       WHERE cs.id = ?
         AND sr_user.user_id = ?
         AND sr_user.status = 'registered'
       LIMIT 1`,
      [sessionId, userId],
    );
    return !!row;
  }

  // ================================================
  // TỔNG HỢP ORDERS TRONG CA
  // Query này dùng cho cả summary realtime lẫn phiếu bàn giao
  // ================================================
  async getOrderSummary(sessionId) {
    const [[row]] = await pool.query(
      `SELECT
                -- Số đơn theo trạng thái
                COUNT(o.id)                                          AS total_orders,
                SUM(o.status = 'completed')                          AS completed_orders,
                SUM(o.status = 'cancelled')                          AS cancelled_orders,
                SUM(o.status NOT IN ('completed', 'cancelled'))      AS pending_orders,

                -- Doanh thu tiền mặt (chỉ đơn đã paid)
                COALESCE(SUM(
                    CASE
                        WHEN op.payment_method = 'cash'
                         AND op.payment_status = 'paid'
                        THEN op.paid_amount
                        ELSE 0
                    END
                ), 0) AS cash_revenue,

                -- Doanh thu chuyển khoản payos (chỉ đơn đã paid)
                COALESCE(SUM(
                    CASE
                        WHEN op.payment_method = 'payos'
                         AND op.payment_status = 'paid'
                        THEN o.total_amount
                        ELSE 0
                    END
                ), 0) AS payos_revenue

             FROM orders o
             LEFT JOIN order_payments op ON o.id = op.order_id
             WHERE o.cash_session_id = ?`,
      [sessionId],
    );
    return row;
  }
}

module.exports = new CashSessionRepository();