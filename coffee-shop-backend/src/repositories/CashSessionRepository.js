const pool = require('../config/database');

class CashSessionRepository {

  // ================================================
  // CASH SESSIONS — CRUD
  // ================================================

  // Tạo session mới khi mở ca
  async createSession({ code, opened_by, opened_at, opening_cash }) {
    const [result] = await pool.query(
      `INSERT INTO cash_sessions
                (code, opened_by, opened_at, opening_cash, status)
             VALUES (?, ?, ?, ?, 'open')`,
      [code, opened_by, opened_at, opening_cash],
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

  // Lấy lịch sử các ca — filter theo date hoặc status
  async findAll({ date, status }) {
    const conditions = [];
    const params = [];

    if (date) {
      conditions.push('DATE(cs.opened_at) = ?');
      params.push(date);
    }
    if (status) {
      conditions.push('cs.status = ?');
      params.push(status);
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