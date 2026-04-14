const pool = require("../config/database");

class CashSessionRepository {
  async getCurrentSession() {
    const [rows] = await pool.query(
      `SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY id DESC LIMIT 1`
    );
    return rows[0] || null;
  }

  async findOpenSession() {
    return this.getCurrentSession();
  }

  async getCurrentUserShift(userId) {
    const [rows] = await pool.query(
      `SELECT sr.id as shift_registration_id, st.end_time, st.start_time 
       FROM shift_registrations sr 
       JOIN shifts s ON sr.shift_id = s.id 
       JOIN shift_templates st ON s.template_id = st.id 
       WHERE sr.user_id = ? 
         AND s.shift_date = CURDATE() 
         AND sr.status = 'registered'
       ORDER BY ABS(TIMESTAMPDIFF(MINUTE, st.start_time, CURTIME())) ASC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  async getCurrentActiveUserShift(userId) {
    const [rows] = await pool.query(
      `SELECT sr.id as shift_registration_id, st.end_time, st.start_time 
       FROM shift_registrations sr 
       JOIN shifts s ON sr.shift_id = s.id 
       JOIN shift_templates st ON s.template_id = st.id 
       WHERE sr.user_id = ? 
         AND s.shift_date = CURDATE() 
         AND sr.status = 'registered'
         AND (
           CURTIME() BETWEEN SUBTIME(st.start_time, '00:30:00') AND st.end_time
           OR (st.start_time > st.end_time AND (CURTIME() >= SUBTIME(st.start_time, '00:30:00') OR CURTIME() <= st.end_time))
         )
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  async getCurrentActiveShift() {
    const [rows] = await pool.query(
      `SELECT u.first_name, u.last_name, st.start_time, st.end_time 
       FROM shift_registrations sr 
       JOIN shifts s ON sr.shift_id = s.id 
       JOIN shift_templates st ON s.template_id = st.id 
       JOIN users u ON sr.user_id = u.id
       WHERE s.shift_date = CURDATE() 
         AND sr.status = 'registered'
         AND (
           CURTIME() BETWEEN SUBTIME(st.start_time, '00:30:00') AND st.end_time
           OR (st.start_time > st.end_time AND (CURTIME() >= SUBTIME(st.start_time, '00:30:00') OR CURTIME() <= st.end_time))
         )
       LIMIT 1`
    );
    return rows[0] || null;
  }

  async getNextUserShift(userId) {
    const [rows] = await pool.query(
      `SELECT st.start_time, st.end_time, s.shift_date 
       FROM shift_registrations sr 
       JOIN shifts s ON sr.shift_id = s.id 
       JOIN shift_templates st ON s.template_id = st.id 
       WHERE sr.user_id = ? 
         AND sr.status = 'registered'
         AND (
           s.shift_date > CURDATE() 
           OR (s.shift_date = CURDATE() AND st.start_time > CURTIME())
         )
       ORDER BY s.shift_date ASC, st.start_time ASC LIMIT 1`,
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

  async getHandoverStats(openedAt) {
    const [rows] = await pool.query(
      `SELECT 
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
         SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_count,
         SUM(CASE WHEN status = 'preparing_done' THEN 1 ELSE 0 END) as done_count,
         SUM(CASE WHEN is_paid = 0 AND status != 'cancelled' THEN 1 ELSE 0 END) as unpaid_count
       FROM orders
       WHERE created_at >= ?`,
      [openedAt]
    );

    // Filter purely active orders for pending, preparing, done:
    const stats = rows[0] || {};
    return {
      pending_count: Number(stats.pending_count || 0),
      preparing_count: Number(stats.preparing_count || 0),
      done_count: Number(stats.done_count || 0),
      unpaid_count: Number(stats.unpaid_count || 0),
    };
  }
}

module.exports = new CashSessionRepository();
