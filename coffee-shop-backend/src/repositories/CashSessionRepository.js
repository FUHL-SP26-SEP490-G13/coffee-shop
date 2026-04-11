const pool = require("../config/database");

class CashSessionRepository {
  async getCurrentSession() {
    const [rows] = await pool.query(
      `SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY id DESC LIMIT 1`
    );
    return rows[0] || null;
  }

  async getTodayShiftEndTime(userId) {
    const [rows] = await pool.query(
      `SELECT st.end_time 
       FROM shift_registrations sr 
       JOIN shifts s ON sr.shift_id = s.id 
       JOIN shift_templates st ON s.template_id = st.id 
       WHERE sr.user_id = ? 
         AND s.shift_date = CURDATE() 
         AND sr.status = 'approved' 
       ORDER BY st.end_time DESC LIMIT 1`,
      [userId]
    );
    return rows[0]?.end_time || null;
  }

  async getSystemCash(openedAt) {
    const [rows] = await pool.query(
      `SELECT IFNULL(SUM(op.paid_amount), 0) AS total_cash
       FROM order_payments op
       JOIN orders o ON o.id = op.order_id
       WHERE op.payment_method = 'cash' 
         AND (op.payment_status = 'paid' OR o.is_paid = 1)
         AND o.created_at >= ?`,
      [openedAt]
    );
    return Number(rows[0]?.total_cash || 0);
  }

  async openSession({ code, opened_by, opening_cash }) {
    const [result] = await pool.query(
      `INSERT INTO cash_sessions (code, opened_by, opened_at, opening_cash, status) 
       VALUES (?, ?, NOW(), ?, 'open')`,
      [code, opened_by, opening_cash]
    );
    return result.insertId;
  }

  async closeSession({ id, closed_by, closing_cash_actual, closing_cash_system, cash_difference, closing_note }) {
    await pool.query(
      `UPDATE cash_sessions 
       SET closed_by = ?, 
           closed_at = NOW(), 
           closing_cash_actual = ?, 
           closing_cash_system = ?, 
           cash_difference = ?, 
           closing_note = ?, 
           status = 'closed' 
       WHERE id = ?`,
      [closed_by, closing_cash_actual, closing_cash_system, cash_difference, closing_note, id]
    );
  }
}

module.exports = new CashSessionRepository();
