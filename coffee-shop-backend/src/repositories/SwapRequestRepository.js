const pool = require('../config/database');
class SwapRequestRepository {
    // =============================================
    // SWAP REQUESTS
    // =============================================
    async create({ requester_id, requester_shift_id, receiver_id, receiver_shift_id }) {
        const [result] = await pool.query(
            `INSERT INTO shift_swap_requests
             (requester_id, requester_shift_id, receiver_id, receiver_shift_id, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [requester_id, requester_shift_id, receiver_id, receiver_shift_id || null],
        );
        return this.findById(result.insertId);
    }
    async findById(id) {
        const [[row]] = await pool.query(
            `SELECT
                ssr.*,
                u_req.first_name AS requester_first_name,
                u_req.last_name  AS requester_last_name,
                u_rec.first_name AS receiver_first_name,
                u_rec.last_name  AS receiver_last_name,
                s_req.shift_date   AS requester_shift_date,
                st_req.id          AS requester_template_id,
                st_req.name        AS requester_template_name,
                st_req.start_time  AS requester_start_time,
                st_req.end_time    AS requester_end_time,
                st_req.color       AS requester_color,
                s_rec.shift_date   AS receiver_shift_date,
                st_rec.id          AS receiver_template_id,
                st_rec.name        AS receiver_template_name,
                st_rec.start_time  AS receiver_start_time,
                st_rec.end_time    AS receiver_end_time,
                st_rec.color       AS receiver_color
             FROM shift_swap_requests ssr
             JOIN users u_req ON ssr.requester_id = u_req.id
             JOIN users u_rec ON ssr.receiver_id  = u_rec.id
             JOIN shifts s_req           ON ssr.requester_shift_id = s_req.id
             JOIN shift_templates st_req ON s_req.template_id      = st_req.id
             LEFT JOIN shifts s_rec           ON ssr.receiver_shift_id = s_rec.id
             LEFT JOIN shift_templates st_rec ON s_rec.template_id     = st_rec.id
             WHERE ssr.id = ?`,
            [id],
        );
        return row || null;
    }
    async findByUserId(userId) {
        const [rows] = await pool.query(
            `SELECT
                ssr.*,
                u_req.first_name AS requester_first_name,
                u_req.last_name  AS requester_last_name,
                u_rec.first_name AS receiver_first_name,
                u_rec.last_name  AS receiver_last_name,
                s_req.shift_date   AS requester_shift_date,
                st_req.id          AS requester_template_id,
                st_req.name        AS requester_template_name,
                st_req.start_time  AS requester_start_time,
                st_req.end_time    AS requester_end_time,
                st_req.color       AS requester_color,
                s_rec.shift_date   AS receiver_shift_date,
                st_rec.id          AS receiver_template_id,
                st_rec.name        AS receiver_template_name,
                st_rec.start_time  AS receiver_start_time,
                st_rec.end_time    AS receiver_end_time,
                st_rec.color       AS receiver_color
             FROM shift_swap_requests ssr
             JOIN users u_req ON ssr.requester_id = u_req.id
             JOIN users u_rec ON ssr.receiver_id  = u_rec.id
             JOIN shifts s_req           ON ssr.requester_shift_id = s_req.id
             JOIN shift_templates st_req ON s_req.template_id      = st_req.id
             LEFT JOIN shifts s_rec           ON ssr.receiver_shift_id = s_rec.id
             LEFT JOIN shift_templates st_rec ON s_rec.template_id     = st_rec.id
             WHERE ssr.requester_id = ? OR ssr.receiver_id = ?
             ORDER BY ssr.created_at DESC`,
            [userId, userId],
        );
        return rows;
    }
    async findPendingDuplicate(requesterId, requesterShiftId, receiverId) {
        const [[row]] = await pool.query(
            `SELECT id FROM shift_swap_requests
             WHERE requester_id = ? AND requester_shift_id = ? AND receiver_id = ?
               AND status = 'pending'`,
            [requesterId, requesterShiftId, receiverId],
        );
        return row || null;
    }
    async updateStatus(id, status) {
        const respondedAt = ['accepted', 'rejected'].includes(status) ? 'NOW()' : 'NULL';
        await pool.query(
            `UPDATE shift_swap_requests
             SET status = ?, responded_at = ${respondedAt}
             WHERE id = ?`,
            [status, id],
        );
        return this.findById(id);
    }
    // helpers
    async findActiveRegistration(userId, shiftId) {
        const [[row]] = await pool.query(
            `SELECT id, user_id, shift_id, status
             FROM shift_registrations
             WHERE user_id = ? AND shift_id = ? AND status = 'registered'`,
            [userId, shiftId],
        );
        return row || null;
    }
    async updateRegistrationStatus(registrationId, status) {
        await pool.query(
            `UPDATE shift_registrations SET status = ? WHERE id = ?`,
            [status, registrationId],
        );
    }
    async createSwappedRegistration(userId, shiftId) {
        const [result] = await pool.query(
            `INSERT INTO shift_registrations (user_id, shift_id, status, created_at)
             VALUES (?, ?, 'swapped_in', NOW())`,
            [userId, shiftId],
        );
        return { id: result.insertId, user_id: userId, shift_id: shiftId, status: 'swapped_in' };
    }
    // SHIFT info (check overlap)
    async findShiftWithTemplate(shiftId) {
        const [[row]] = await pool.query(
            `SELECT s.id, s.shift_date, s.template_id,
                    st.name AS template_name, st.start_time, st.end_time, st.color
             FROM shifts s
             JOIN shift_templates st ON s.template_id = st.id
             WHERE s.id = ?`,
            [shiftId],
        );
        return row || null;
    }
    async findUserShiftsOnDate(userId, date) {
        const [rows] = await pool.query(
            `SELECT sr.shift_id, st.start_time, st.end_time, st.name AS template_name
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
}
module.exports = new SwapRequestRepository();