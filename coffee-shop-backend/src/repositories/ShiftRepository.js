const pool = require('../config/database');

class ShiftRepository {
    // =============================================
    // SHIFT TEMPLATES
    // =============================================
    async findAllTemplates() {
        const [rows] = await pool.query(
            `SELECT id, name, start_time, end_time, color FROM shift_templates WHERE is_deleted = 0 ORDER BY start_time`,
        );
        return rows;
    }

    async findTemplateById(id) {
        const [[row]] = await pool.query(
            `SELECT id, name, start_time, end_time, color
         FROM shift_templates
         WHERE id = ? AND is_deleted = 0`,
            [id],
        );
        return row || null;
    }

    async findTemplateByName(name) {
        const [[row]] = await pool.query(
            `SELECT id FROM shift_templates WHERE name = ? AND is_deleted = 0`,
            [name],
        );
        return row || null;
    }

    async findTemplateByColor(color) {
        const [[row]] = await pool.query(
            `SELECT id FROM shift_templates WHERE color = ? AND is_deleted = 0`,
            [color],
        );
        return row || null;
    }

    async findOverlappingTemplate(startTime, endTime, excludeId = null) {
        const excludeClause = excludeId ? `AND id != ?` : '';
        // [ne, ns, ns, ne, ne, ns, ne, ns]
        const baseParams = [endTime, startTime, startTime, endTime, endTime, startTime, endTime, startTime];
        const params = excludeId ? [...baseParams, excludeId] : baseParams;

        const [[row]] = await pool.query(
            `SELECT id, name, start_time, end_time FROM shift_templates
             WHERE is_deleted = 0
               AND IF(
                 ? <= ?,
                 IF(end_time <= start_time,
                   1,
                   end_time > ? OR start_time < ?
                 ),
                 IF(end_time <= start_time,
                   start_time < ? OR end_time > ?,
                   start_time < ? AND end_time > ?
                 )
               ) ${excludeClause}
             LIMIT 1`,
            params,
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
        // Soft delete: ẩn template khỏi danh sách nhưng giữ lịch sử
        await pool.query(`UPDATE shift_templates SET is_deleted = 1 WHERE id = ?`, [id]);
    }

    async countShiftsByTemplate(templateId) {
        // Chỉ đếm các shifts còn registration đang active (không phải cancelled)
        const [[row]] = await pool.query(
            `SELECT COUNT(DISTINCT s.id) AS cnt
             FROM shifts s
             JOIN shift_registrations sr ON sr.shift_id = s.id
             WHERE s.template_id = ?
               AND sr.status != 'cancelled'`,
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

    // Chỉ tìm shift slot đã có, KHÔNG tạo mới (dùng để validate trước khi insert)
    async findShiftSlot(templateId, date) {
        const [[row]] = await pool.query(
            `SELECT id, template_id, shift_date FROM shifts
             WHERE template_id = ? AND shift_date = ?`,
            [templateId, date],
        );
        return row || null;
    }

    // Kiểm tra nhân viên có ca nào trùng giờ trong cùng ngày không
    async findOverlappingRegistration(userId, date, startTime, endTime) {
        const [[row]] = await pool.query(
            `SELECT sr.id FROM shift_registrations sr
             JOIN shifts s ON sr.shift_id = s.id
             JOIN shift_templates st ON s.template_id = st.id
             WHERE sr.user_id = ?
               AND s.shift_date = ?
               AND sr.status != 'cancelled'
               AND (
                 -- Ca bình thường
                 (st.end_time > st.start_time AND st.start_time < ? AND st.end_time > ?)
                 OR
                 -- Ca qua đêm
                 (st.end_time <= st.start_time AND (
                   st.start_time < ? OR st.end_time > ?
                 ))
               )`,
            [userId, date, endTime, startTime, endTime, startTime],
        );
        return row || null;
    }

    // SHIFT REGISTRATIONS

    // Kiểm tra ca đã có nhân viên role=staff chưa (mỗi ca chỉ 1 staff)
    async findStaffInShift(shiftId) {
        const [[row]] = await pool.query(
            `SELECT sr.id, sr.user_id, u.first_name, u.last_name
         FROM shift_registrations sr
         JOIN users u ON sr.user_id = u.id
         JOIN role r ON u.role_id = r.id
         WHERE sr.shift_id = ?
           AND sr.status != 'cancelled'
           AND r.role_name = 'staff'
         LIMIT 1`,
            [shiftId],
        );
        return row || null;
    }

    async findRegistration(userId, shiftId) {
        const [[row]] = await pool.query(
            `SELECT id, user_id, shift_id, status
       FROM shift_registrations
       WHERE user_id = ? AND shift_id = ?`,
            [userId, shiftId],
        );
        return row || null;
    }

    async findRegistrationById(id) {
        const [[row]] = await pool.query(
            `SELECT sr.*, s.shift_date, s.template_id,
              st.name AS template_name, st.start_time, st.end_time,
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
            `SELECT st.id AS template_id, st.start_time, st.end_time, st.name AS template_name
             FROM shift_registrations sr
             JOIN shifts s ON sr.shift_id = s.id
             JOIN shift_templates st ON s.template_id = st.id
             WHERE sr.user_id = ?
               AND s.shift_date = ?
               AND sr.status != 'cancelled'`,
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
       SET status = 'registered'
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

    // Hủy tất cả ca từ ngày fromDate trở đi cho 1 user
    async cancelFutureRegistrations(userId, fromDate) {
        const [result] = await pool.query(
            `UPDATE shift_registrations sr
             JOIN shifts s ON sr.shift_id = s.id
             SET sr.status = 'cancelled'
             WHERE sr.user_id = ?
               AND s.shift_date >= ?
               AND sr.status != 'cancelled'`,
            [userId, fromDate],
        );
        return result.affectedRows;
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
         u.first_name, u.last_name,
         r.role_name,
         s.shift_date,
         s.template_id,
         st.name AS template_name,
         st.start_time,
         st.end_time,
         st.color
       FROM shift_registrations sr
       JOIN users u ON sr.user_id = u.id
       JOIN role r ON u.role_id = r.id
       JOIN shifts s ON sr.shift_id = s.id
       JOIN shift_templates st ON s.template_id = st.id
       WHERE s.shift_date BETWEEN ? AND ?
         AND sr.status = 'registered'
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