const BaseRepository = require('./BaseRepository');
const db = require('../config/database');
const formatDateStr = require('../helpers/formatDateStr');

class AttendanceRepository extends BaseRepository {
  constructor() {
    super('attendances');
  }

  async findByRegistrationId(registrationId) {
    const query = `SELECT * FROM ${this.tableName} WHERE registration_id = ?`;
    const [rows] = await db.query(query, [registrationId]);
    return rows[0] || null;
  }

  /**
   * Get attendance with shift and user info
   */
  async getAttendanceDetails(id) {
    const query = `
      SELECT 
        a.*,
        s.shift_date AS shift_date,
        st.name AS shift_name,
        st.start_time,
        st.end_time,
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.role_id,
        r.role_name
      FROM ${this.tableName} a
      JOIN shift_registrations sr ON a.registration_id = sr.id
      JOIN shifts s ON sr.shift_id = s.id
      JOIN shift_templates st ON s.template_id = st.id
      JOIN users u ON sr.user_id = u.id
      JOIN role r ON u.role_id = r.id
      WHERE a.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Lấy các ca xung quanh ngày hiện tại để phục vụ clock-in/out,
   * bao gồm cả ca hôm qua kéo qua hôm nay và ca hôm nay kéo qua ngày mai.
   */
  async findTodayShiftsForUser(userId) {
    const today = formatDateStr(new Date());

    const query = `
      SELECT
        sr.*,
        sr.id AS registration_id,
        s.shift_date AS shift_date,
        st.name AS shift_name,
        st.start_time,
        st.end_time,
        a.id AS attendance_id,
        a.check_in,
        a.check_out,
        a.status AS attendance_status
      FROM shift_registrations sr
      JOIN shifts s ON sr.shift_id = s.id
      JOIN shift_templates st ON s.template_id = st.id
      LEFT JOIN attendances a ON sr.id = a.registration_id
      WHERE sr.user_id = ?
        AND sr.status = 'registered'
        AND s.shift_date BETWEEN DATE_SUB(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY s.shift_date ASC, st.start_time ASC
    `;

    const [rows] = await db.query(query, [userId, today, today]);
    return rows;
  }

  /**
   * Search attendances for manager
   */
  async searchAttendances(filters = {}) {
    const { startDate, endDate, userId, status, limit, offset } = filters;

    let query = `
      SELECT
        a.*,
        s.shift_date AS shift_date,
        st.name AS shift_name,
        st.start_time,
        st.end_time,
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.username
      FROM ${this.tableName} a
      JOIN shift_registrations sr ON a.registration_id = sr.id
      JOIN shifts s ON sr.shift_id = s.id
      JOIN shift_templates st ON s.template_id = st.id
      JOIN users u ON sr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate && endDate) {
      query += ` AND s.shift_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ` AND s.shift_date = ?`;
      params.push(startDate);
    }

    if (userId) {
      query += ` AND u.id = ?`;
      params.push(userId);
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY s.shift_date DESC, st.start_time DESC`;

    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(Number(limit), Number(offset || 0));
    }

    const [rows] = await db.query(query, params);

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM ${this.tableName} a
      JOIN shift_registrations sr ON a.registration_id = sr.id
      JOIN shifts s ON sr.shift_id = s.id
      JOIN users u ON sr.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];

    if (startDate && endDate) {
      countQuery += ` AND s.shift_date BETWEEN ? AND ?`;
      countParams.push(startDate, endDate);
    } else if (startDate) {
      countQuery += ` AND s.shift_date = ?`;
      countParams.push(startDate);
    }

    if (userId) {
      countQuery += ` AND u.id = ?`;
      countParams.push(userId);
    }

    if (status) {
      countQuery += ` AND a.status = ?`;
      countParams.push(status);
    }

    const [countRows] = await db.query(countQuery, countParams);

    return {
      data: rows,
      total: countRows[0].total,
    };
  }

  /**
   * Tìm các shift registration cần auto đánh absent.
   *
   * Rule:
   * - registration đang active
   * - chưa có attendance
   * - thời điểm hiện tại đã qua giờ kết thúc thực tế của ca
   *
   * Xác định ca qua đêm:
   * - end_time > start_time  => ca kết thúc cùng ngày
   * - end_time <= start_time => ca kết thúc ngày hôm sau
   */

  async findAbsentRegistrations() {
    const query = `
    SELECT
      sr.id AS registration_id,
      sr.shift_id,
      s.shift_date,
      st.start_time,
      st.end_time
    FROM shift_registrations sr
    JOIN shifts s ON sr.shift_id = s.id
    JOIN shift_templates st ON s.template_id = st.id
    LEFT JOIN attendances a ON sr.id = a.registration_id
    WHERE sr.status = 'registered'
      AND a.id IS NULL
      AND NOW() >= DATE_ADD(
        CASE
          WHEN st.end_time > st.start_time
            THEN CONCAT(s.shift_date, ' ', st.end_time)
          ELSE
            DATE_ADD(CONCAT(s.shift_date, ' ', st.end_time), INTERVAL 1 DAY)
        END,
        INTERVAL 30 MINUTE
      )
  `;

    const [rows] = await db.query(query);
    return rows;
  }

  // async findAbsentRegistrations() {
  //   const query = `
  //     SELECT
  //       sr.id AS registration_id,
  //       sr.shift_id,
  //       s.shift_date,
  //       st.start_time,
  //       st.end_time
  //     FROM shift_registrations sr
  //     JOIN shifts s ON sr.shift_id = s.id
  //     JOIN shift_templates st ON s.template_id = st.id
  //     LEFT JOIN attendances a ON sr.id = a.registration_id
  //     WHERE sr.status = 'registered'
  //       AND a.id IS NULL
  //       AND NOW() >= (
  //         CASE
  //           WHEN st.end_time > st.start_time
  //             THEN CONCAT(s.shift_date, ' ', st.end_time)
  //           ELSE
  //             DATE_ADD(CONCAT(s.shift_date, ' ', st.end_time), INTERVAL 1 DAY)
  //         END
  //       )
  //   `;

  //   const [rows] = await db.query(query);
  //   return rows;
  // }
}

module.exports = new AttendanceRepository();
