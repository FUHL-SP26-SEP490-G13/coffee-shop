const pool = require('../config/database');

class ShiftRepository {
    // =============================================
    // SHIFT TEMPLATES
    // =============================================
    async findAllTemplates() {
        const [rows] = await pool.query(
            `SELECT id, name, start_time, end_time, color FROM shift_templates ORDER BY start_time`,
        );
        return rows;
    }

    async findTemplateById(id) {
        const [[row]] = await pool.query(
            `SELECT id, name, start_time, end_time, color FROM shift_templates WHERE id = ?`,
            [id],
        );
        return row || null;
    }

    async findTemplateByName(name) {
        const [[row]] = await pool.query(
            `SELECT id FROM shift_templates WHERE name = ?`,
            [name],
        );
        return row || null;
    }

    async findTemplateByColor(color) {
        const [[row]] = await pool.query(
            `SELECT id FROM shift_templates WHERE color = ?`,
            [color],
        );
        return row || null;
    }

    async createTemplate({ name, start_time, end_time, color }) {
        const [result] = await pool.query(
            `INSERT INTO shift_templates (name, start_time, end_time, color) VALUES (?, ?, ?, ?)`,
            [name, start_time, end_time, color],
        );
        return this.findTemplateById(result.insertId);
    }

    async updateTemplate(id, { name, start_time, end_time, color }) {
        await pool.query(
            `UPDATE shift_templates SET name = ?, start_time = ?, end_time = ?, color = ? WHERE id = ?`,
            [name, start_time, end_time, color, id],
        );
        return this.findTemplateById(id);
    }

    async deleteTemplate(id) {
        await pool.query(`DELETE FROM shift_templates WHERE id = ?`, [id]);
    }

    async countShiftsByTemplate(templateId) {
        const [[row]] = await pool.query(
            `SELECT COUNT(*) AS cnt FROM shifts WHERE template_id = ?`,
            [templateId],
        );
        return Number(row.cnt);
    }

    // =============================================
    // SHIFTS (slot ca theo ngày)
    // =============================================

    async findOrCreateShift(templateId, date) {
        const [[existing]] = await pool.query(
            `SELECT id, template_id, shift_date FROM shifts
       WHERE template_id = ? AND shift_date = ?`,
            [templateId, date],
        );
        if (existing) return existing;

        const [result] = await pool.query(
            `INSERT INTO shifts (template_id, shift_date) VALUES (?, ?)`,
            [templateId, date],
        );
        return { id: result.insertId, template_id: templateId, shift_date: date };
    }

    // Kiểm tra nhân viên có ca nào trùng giờ trong cùng ngày không
    async findOverlappingRegistration(userId, date, startTime, endTime) {
        const [[row]] = await pool.query(
            `SELECT sr.id FROM shift_registrations sr
             JOIN shifts s ON sr.shift_id = s.id
             JOIN shift_templates st ON s.template_id = st.id
             WHERE sr.user_id = ?
               AND s.shift_date = ?
               AND sr.status NOT IN ('cancelled')
               AND st.start_time < ? AND st.end_time > ?`,
            [userId, date, endTime, startTime],
        );
        return row || null;
    }

    // SHIFT REGISTRATIONS
    async findRegistration(userId, shiftId) {
        const [[row]] = await pool.query(
            `SELECT id, user_id, shift_id, status, leave_request_id
       FROM shift_registrations
       WHERE user_id = ? AND shift_id = ?`,
            [userId, shiftId],
        );
        return row || null;
    }

    async findRegistrationById(id) {
        const [[row]] = await pool.query(
            `SELECT sr.*, s.shift_date, s.template_id,
              st.name AS template_name,
              u.first_name, u.last_name
       FROM shift_registrations sr
       JOIN shifts s ON sr.shift_id = s.id
       JOIN shift_templates st ON s.template_id = st.id
       JOIN users u ON sr.user_id = u.id
       WHERE sr.id = ?`,
            [id],
        );
        return row || null;
    }

    // Lấy tất cả ca active của user trong 1 ngày cụ thể (để check overlap)
    async findUserShiftsOnDate(userId, date) {
        const [rows] = await pool.query(
            `SELECT st.start_time, st.end_time, st.name AS template_name
             FROM shift_registrations sr
             JOIN shifts s ON sr.shift_id = s.id
             JOIN shift_templates st ON s.template_id = st.id
             WHERE sr.user_id = ?
               AND s.shift_date = ?
               AND sr.status NOT IN ('cancelled', 'swapped_out')`,
            [userId, date],
        );
        return rows;
    }

    async createRegistration(userId, shiftId) {
        const [result] = await pool.query(
            `INSERT INTO shift_registrations (user_id, shift_id, status, created_at)
       VALUES (?, ?, 'registered', NOW())`,
            [userId, shiftId],
        );
        const [[row]] = await pool.query(
            `SELECT * FROM shift_registrations WHERE id = ?`,
            [result.insertId],
        );
        return row;
    }

    async reactivateRegistration(registrationId) {
        await pool.query(
            `UPDATE shift_registrations
       SET status = 'registered', leave_request_id = NULL
       WHERE id = ?`,
            [registrationId],
        );
        const [[row]] = await pool.query(
            `SELECT * FROM shift_registrations WHERE id = ?`,
            [registrationId],
        );
        return row;
    }

    async cancelRegistration(registrationId) {
        await pool.query(
            `UPDATE shift_registrations SET status = 'cancelled' WHERE id = ?`,
            [registrationId],
        );
    }

    // =============================================
    // SCHEDULE (lịch tổng quan)
    // Query join đầy đủ để render calendar
    // =============================================
    async findSchedule(startDate, endDate, userId = null) {
        const params = [startDate, endDate];
        const userFilter = userId ? `AND sr.user_id = ?` : '';
        if (userId) params.push(userId);

        const [rows] = await pool.query(
            `SELECT
         sr.id AS registration_id,
         sr.user_id,
         sr.shift_id,
         sr.status AS registration_status,
         u.first_name, u.last_name,
         r.role_name,
         s.shift_date,
         s.template_id,
         st.name AS template_name,
         st.start_time,
         st.end_time,
         st.color,
         -- Tính display_status cho calendar
         CASE
           WHEN sr.status = 'cancelled' AND sr.leave_request_id IS NOT NULL
             THEN 'on_leave'
           WHEN sr.status = 'swapped_out'
             THEN 'swapped_out'
           WHEN sr.status = 'swapped_in'
             THEN 'swapped_in'
           WHEN sr.status = 'registered' AND EXISTS (
             SELECT 1 FROM leave_requests lr
             WHERE lr.shift_id = sr.shift_id
               AND lr.user_id = sr.user_id
               AND lr.status = 'pending'
           ) THEN 'pending_leave'
           ELSE 'working'
         END AS display_status
       FROM shift_registrations sr
       JOIN users u ON sr.user_id = u.id
       JOIN role r ON u.role_id = r.id
       JOIN shifts s ON sr.shift_id = s.id
       JOIN shift_templates st ON s.template_id = st.id
       WHERE s.shift_date BETWEEN ? AND ?
         AND sr.status != 'cancelled'
         ${userFilter}
       ORDER BY u.last_name, s.shift_date, st.start_time`,
            params,
        );
        return rows;
    }

    // =============================================
    // USERS (dùng trong validation)
    // =============================================
    async findUserById(id) {
        const [[row]] = await pool.query(
            `SELECT u.id, u.first_name, u.last_name, u.isActive, r.role_name
             FROM users u
             JOIN role r ON u.role_id = r.id
             WHERE u.id = ?`,
            [id],
        );
        return row || null;
    }
}

module.exports = new ShiftRepository();