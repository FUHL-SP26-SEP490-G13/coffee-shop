const pool = require("../config/database");

class CashSessionRepository {
  async getCurrentSession() {
    const [rows] = await pool.query(
      `SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY id DESC LIMIT 1`
    );
    return rows[0] || null;
  }

  async getCurrentUserShift(userId) {
    const [rows] = await pool.query(
      `SELECT sr.id as shift_registration_id, st.end_time, st.start_time 
       FROM shift_registrations sr 
       JOIN shifts s ON sr.shift_id = s.id 
       JOIN shift_templates st ON s.template_id = st.id 
       WHERE sr.user_id = ? 
         AND s.shift_date = CURDATE() 
         AND sr.status IN ('registered', 'swapped_in', 'approved') 
       ORDER BY ABS(TIMESTAMPDIFF(MINUTE, st.start_time, CURTIME())) ASC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  async getShiftEndTimeById(shiftRegistrationId) {
    const [rows] = await pool.query(
      `SELECT st.end_time 
       FROM shift_registrations sr 
       JOIN shifts s ON sr.shift_id = s.id 
       JOIN shift_templates st ON s.template_id = st.id 
       WHERE sr.id = ? LIMIT 1`,
      [shiftRegistrationId]
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

  async openSession({ code, opened_by, opening_cash, shift_registration_id }) {
    const [result] = await pool.query(
      `INSERT INTO cash_sessions (code, opened_by, opened_at, opening_cash, status, shift_registration_id) 
       VALUES (?, ?, NOW(), ?, 'open', ?)`,
      [code, opened_by, opening_cash, shift_registration_id || null]
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
  async getSessionsHistory({ startDate, endDate, userId }) {
    let query = `
      SELECT cs.*, u.first_name, u.last_name 
      FROM cash_sessions cs
      JOIN users u ON cs.opened_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND DATE(cs.opened_at) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(cs.opened_at) <= ?`;
      params.push(endDate);
    }
    if (userId) {
      query += ` AND cs.opened_by = ?`;
      params.push(userId);
    }
    
    query += ` ORDER BY cs.opened_at DESC`;
    
    const [rows] = await pool.query(query, params);
    return rows;
  }
}

module.exports = new CashSessionRepository();
